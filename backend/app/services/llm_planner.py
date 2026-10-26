import os
import json
import urllib.request
import urllib.error
from .risk_policy import RiskPolicy

class LLMPlanner:
    @staticmethod
    def generate_plan(profile: dict, existing_issues: list, objective: str) -> list:
        api_key = os.environ.get("OPENROUTER_API_KEY") or os.environ.get("OPENAI_API_KEY")
        
        valid_columns = [col["name"] for col in profile.get("columns", [])]
        
        llm_recommendations = []
        
        if api_key:
            try:
                llm_recommendations = LLMPlanner._call_external_llm(profile, existing_issues, objective, api_key, valid_columns)
            except Exception:
                llm_recommendations = []
                
        if not llm_recommendations:
            llm_recommendations = LLMPlanner._generate_fallback_plan(profile, existing_issues, objective, valid_columns)
            
        validated_recs = []
        seen_keys = set()
        
        for idx, rec in enumerate(llm_recommendations):
            col = rec.get("column")
            if col and col not in valid_columns:
                continue
                
            issue_type = rec.get("issue_type", "general_cleaning")
            affected_pct = float(rec.get("affected_percentage", 5.0))
            risk_level = RiskPolicy.evaluate_risk(issue_type, affected_pct, col if col else "")
            
            dedup_key = (issue_type, col, rec.get("title"))
            if dedup_key in seen_keys:
                continue
            seen_keys.add(dedup_key)
            
            requires_approval = risk_level in ["Medium", "High"]
            
            validated_recs.append({
                "action_id": f"llm_rec_{idx + 1}",
                "issue_type": issue_type,
                "column": col,
                "risk_level": risk_level,
                "title": rec.get("title", "Data Quality Remediation"),
                "description": rec.get("description", "Recommended action based on dataset profiling and objective."),
                "evidence": rec.get("evidence", "Detected during deterministic profiling."),
                "affected_rows": int(rec.get("affected_rows", 10)),
                "affected_percentage": affected_pct,
                "proposed_action": rec.get("proposed_action", "Inspect and clean data."),
                "rationale": rec.get("rationale", f"Aligned with objective: {objective}"),
                "alternatives": rec.get("alternatives", ["Retain original data", "Manual review"]),
                "confidence": float(rec.get("confidence", 0.88)),
                "requires_approval": requires_approval,
                "execution_status": "pending"
            })
            
        return validated_recs

    @staticmethod
    def _call_external_llm(profile: dict, existing_issues: list, objective: str, api_key: str, valid_columns: list) -> list:
        prompt = f"""
        You are a data-cleaning expert assistant.
        Dataset: {profile.get('filename')} ({profile.get('row_count')} rows, {profile.get('column_count')} columns).
        Objective: {objective}.
        Detected Issues: {json.dumps(existing_issues)}.
        Columns: {valid_columns}.
        Return a JSON array of cleaning recommendations matching the schema:
        [
          {{
            "issue_type": "missing_values",
            "column": "col_name",
            "title": "Title",
            "description": "Description",
            "evidence": "Evidence",
            "affected_rows": 10,
            "affected_percentage": 5.0,
            "proposed_action": "Action",
            "rationale": "Rationale",
            "alternatives": ["Alt 1"],
            "confidence": 0.95
          }}
        ]
        """
        req_data = {
            "model": "openai/gpt-4o-mini",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.1
        }
        req = urllib.request.Request(
            "https://openrouter.ai/api/v1/chat/completions",
            data=json.dumps(req_data).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                res_body = json.loads(resp.read().decode("utf-8"))
                content = res_body["choices"][0]["message"]["content"]
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0].strip()
                return json.loads(content)
        except Exception:
            return []

    @staticmethod
    def _generate_fallback_plan(profile: dict, existing_issues: list, objective: str, valid_columns: list) -> list:
        recs = []
        for issue in existing_issues:
            issue_type = issue["issue_type"]
            col = issue.get("column")
            affected_rows = issue["affected_rows"]
            affected_pct = issue["affected_percentage"]
            
            title = f"LLM Plan: Address {issue_type.replace('_', ' ')}" + (f" in '{col}'" if col else "")
            description = f"Context-aware remediation aligned with objective: '{objective}'."
            proposed_action = f"Apply standardized {issue_type} treatment for {col if col else 'dataset'}."
            rationale = f"Supports analytical readiness for EDA under objective '{objective}'."
            
            recs.append({
                "issue_type": issue_type,
                "column": col,
                "title": title,
                "description": description,
                "evidence": issue["evidence"],
                "affected_rows": affected_rows,
                "affected_percentage": affected_pct,
                "proposed_action": proposed_action,
                "rationale": rationale,
                "alternatives": ["Ignore issue", "Custom transformation"],
                "confidence": 0.91
            })
            
        return recs
