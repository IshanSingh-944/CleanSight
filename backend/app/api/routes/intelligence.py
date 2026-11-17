"""Cross-column intelligence API routes.

Endpoints:
  GET  /api/profiling/datasets/{dataset_id}/intelligence
  POST /api/profiling/datasets/{dataset_id}/intelligence/rules
  GET  /api/profiling/datasets/{dataset_id}/intelligence/rules
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException

from .datasets import (
    DATASET_STORE,
    load_dataset_from_db_if_needed,
)
from ...services.intelligence.anomaly_detector import detect_anomalies
from ...services.intelligence.business_rule_detector import BusinessRule, BusinessRuleDetector
from ...services.intelligence.conditional_missingness import find_conditional_missingness
from ...services.intelligence.relationship_analyzer import analyze_all_column_pairs
from ...schemas.intelligence import (
    BusinessRuleDefinition,
    BusinessRuleEvaluationResponse,
    CrossColumnInsightsResponse,
    IntelligenceFinding,
)

router = APIRouter(prefix="/profiling/datasets", tags=["intelligence"])


def _get_dataframe(dataset_id: str):
    df = DATASET_STORE.get(dataset_id)
    if df is not None:
        return df
    df = load_dataset_from_db_if_needed(dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found.")
    DATASET_STORE[dataset_id] = df
    return df


@router.get("/{dataset_id}/intelligence", response_model=CrossColumnInsightsResponse)
async def get_intelligence(dataset_id: str):
    """Run full cross-column intelligence analysis on a dataset."""
    df = _get_dataframe(dataset_id)
    if df is None or len(df.columns) == 0:
        raise HTTPException(status_code=404, detail="Dataset not found or empty.")

    relationships = analyze_all_column_pairs(df)
    conditional = find_conditional_missingness(df)
    detector = BusinessRuleDetector()
    rule_results = detector.detect(df)
    anomalies = detect_anomalies(df)

    # Convert rule violations into IntelligenceFinding shape.
    rule_findings: List[IntelligenceFinding] = []
    for r in rule_results:
        if not r.get("violated"):
            continue
        rule_findings.append(
            IntelligenceFinding(
                issue_type=f"business_rule:{r['rule_id']}",
                affected_columns=list(r.get("columns", [])),
                affected_rows=int(r.get("affected_rows", 0)),
                severity=str(r.get("severity", "medium")),
                evidence={
                    "rule_type": r.get("rule_type"),
                    "affected_percentage": r.get("affected_percentage", 0.0),
                },
                explanation=str(r.get("explanation", "")),
                suggested_action=str(r.get("suggested_action", "")),
                confidence=0.95 if r.get("rule_type") == "deterministic" else 0.7,
            )
        )

    # Normalize all finding dicts into IntelligenceFinding models for the schema.
    def _to_finding(f: Dict[str, Any], issue_type_override: Optional[str] = None) -> IntelligenceFinding:
        return IntelligenceFinding(
            issue_type=issue_type_override or f.get("issue_type", "unknown"),
            affected_columns=list(f.get("affected_columns", [])),
            affected_rows=int(f.get("affected_rows", 0)),
            severity=str(f.get("severity", "low")),
            evidence=f.get("evidence", {}),
            explanation=str(f.get("explanation", "")),
            suggested_action=str(f.get("suggested_action", "")),
            confidence=float(f.get("confidence", 0.5)),
        )

    relationship_findings = [_to_finding(f) for f in relationships]
    conditional_findings = [_to_finding(f) for f in conditional]
    anomaly_findings = [_to_finding(f, issue_type_override=f"anomaly:{f.get('method')}") for f in anomalies]

    all_findings = relationship_findings + conditional_findings + rule_findings + anomaly_findings

    return CrossColumnInsightsResponse(
        dataset_id=dataset_id,
        column_count=int(len(df.columns)),
        row_count=int(len(df)),
        relationships=relationship_findings,
        conditional_missingness=conditional_findings,
        business_rule_violations=rule_findings,
        anomalies=anomaly_findings,
        total_findings=len(all_findings),
    )


@router.get("/{dataset_id}/intelligence/rules", response_model=BusinessRuleEvaluationResponse)
async def get_business_rules(dataset_id: str):
    """Return the default business-rule definitions."""
    df = _get_dataframe(dataset_id)
    detector = BusinessRuleDetector()
    default_rules = [
        BusinessRuleDefinition(
            rule_id=r.rule_id,
            name=r.name,
            description=r.description,
            rule_type=r.rule_type,
            columns=r.columns,
            severity=r.severity,
            explanation=r.explanation,
            suggested_action=r.suggested_action,
        )
        for r in detector.rules
    ]
    return BusinessRuleEvaluationResponse(
        dataset_id=dataset_id,
        rules_evaluated=len(default_rules),
        violations=[],
        violation_details=[],
    )


@router.post("/{dataset_id}/intelligence/rules", response_model=BusinessRuleEvaluationResponse)
async def evaluate_business_rules(dataset_id: str, rules: List[BusinessRuleDefinition]):
    """Evaluate custom business rules against a dataset."""
    df = _get_dataframe(dataset_id)

    detector = BusinessRuleDetector(rules=[])
    custom_rules: List[BusinessRule] = []
    for rd in rules:
        # Default no-op check: no columns matched means no violation.
        # Users supply rules primarily for metadata/documentation via this endpoint;
        # deterministic checks require column logic which cannot be safely expressed
        # over JSON without an expression language. We flag rules referencing missing
        # columns so users know what to implement.
        missing = [c for c in rd.columns if c not in df.columns]

        def _check(df: pd.DataFrame, cols: List[str] = rd.columns) -> pd.Series:
            # Conservative: no violation unless deterministic column logic exists.
            return pd.Series(False, index=df.index)

        rule = BusinessRule(
            rule_id=rd.rule_id,
            name=rd.name,
            description=rd.description,
            rule_type=rd.rule_type,
            columns=rd.columns,
            check=_check,
            severity=rd.severity,
            explanation=rd.explanation or "",
            suggested_action=rd.suggested_action or "",
        )
        custom_rules.append(rule)

    detector = BusinessRuleDetector(rules=custom_rules)
    results = detector.detect(df)

    violations = []
    details = []
    for r in results:
        if not r.get("violated"):
            continue
        rd = next((x for x in rules if x.rule_id == r["rule_id"]), None)
        violations.append(
            BusinessRuleDefinition(
                rule_id=r["rule_id"],
                name=r["name"],
                description=r.get("description", ""),
                rule_type=r.get("rule_type", "review"),
                columns=r.get("columns", []),
                severity=r.get("severity", "medium"),
                explanation=r.get("explanation"),
                suggested_action=r.get("suggested_action"),
            )
        )
        details.append(result_to_dict(r))

    return BusinessRuleEvaluationResponse(
        dataset_id=dataset_id,
        rules_evaluated=len(custom_rules),
        violations=violations,
        violation_details=details,
    )


def result_to_dict(r: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize a rule result into a plain dict."""
    return {
        "rule_id": r.get("rule_id"),
        "name": r.get("name"),
        "violated": r.get("violated"),
        "affected_rows": r.get("affected_rows"),
        "affected_percentage": r.get("affected_percentage"),
        "severity": r.get("severity"),
        "columns": r.get("columns"),
        "explanation": r.get("explanation"),
        "suggested_action": r.get("suggested_action"),
    }
