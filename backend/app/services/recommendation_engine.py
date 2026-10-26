from .risk_policy import RiskPolicy

class RecommendationEngine:
    @staticmethod
    def generate_recommendations(issues: list) -> list:
        recommendations = []
        for idx, issue in enumerate(issues):
            issue_type = issue["issue_type"]
            column = issue.get("column")
            affected_rows = issue["affected_rows"]
            affected_percentage = issue["affected_percentage"]
            evidence = issue["evidence"]
            
            risk_level = RiskPolicy.evaluate_risk(issue_type, affected_percentage, column if column else "")
            
            if issue_type == "duplicate_rows":
                title = "Remove Duplicate Rows"
                description = "Eliminate exact duplicate rows to prevent skewing analytical models and summary statistics."
                proposed_action = "Drop duplicate rows keeping the first occurrence."
                rationale = "Duplicate rows artificially inflate sample size and bias frequency distributions."
                alternatives = ["Keep duplicates for audit trail analysis", "Review subset of key columns"]
            elif issue_type == "missing_values":
                title = f"Impute Missing Values in '{column}'"
                description = f"Address missing data in column '{column}' to maintain statistical power."
                proposed_action = f"Impute missing values using median (if numeric) or mode (if categorical), or flag missingness."
                rationale = f"Missing data ({affected_percentage:.2f}%) can lead to dropped records or biased estimation in downstream models."
                alternatives = ["Drop rows with missing values", "Leave missing as explicit category", "Advanced model-based imputation"]
            elif issue_type == "constant_column":
                title = f"Drop Constant Column '{column}'"
                description = f"Remove column '{column}' which contains no variance across records."
                proposed_action = f"Drop column '{column}' from the active feature set."
                rationale = "Constant columns provide zero informational entropy for exploratory data analysis or machine learning."
                alternatives = ["Retain for reference documentation"]
            elif issue_type == "whitespace":
                title = f"Trim Whitespace in '{column}'"
                description = f"Standardize string formatting by removing leading and trailing whitespace in '{column}'."
                proposed_action = f"Apply string strip operation across all non-null entries in '{column}'."
                rationale = "Untrimmed whitespace creates duplicate categories (e.g., 'A' vs 'A ') and distorts groupings."
                alternatives = ["Manual correction", "Leave raw formatting unchanged"]
            elif issue_type == "outlier":
                title = f"Review Statistical Outliers in '{column}'"
                description = f"Investigate potential extreme numerical outliers detected in '{column}'."
                proposed_action = f"Winsorize or flag extreme values outside 1.5x IQR bounds."
                rationale = f"Outliers ({affected_percentage:.2f}%) may represent measurement errors or legitimate extreme phenomena."
                alternatives = ["Drop outlier rows", "Cap values at threshold", "Retain raw values for robust statistics"]
            else:
                title = f"Review Issue in {column if column else 'Dataset'}"
                description = evidence
                proposed_action = "Investigate and resolve data anomaly."
                rationale = "Data hygiene standard."
                alternatives = ["Ignore"]
                
            requires_approval = risk_level in ["Medium", "High"]
            
            recommendations.append({
                "action_id": f"rec_{idx + 1}",
                "issue_type": issue_type,
                "column": column,
                "risk_level": risk_level,
                "title": title,
                "description": description,
                "evidence": evidence,
                "affected_rows": affected_rows,
                "affected_percentage": affected_percentage,
                "proposed_action": proposed_action,
                "rationale": rationale,
                "alternatives": alternatives,
                "requires_approval": requires_approval,
                "execution_status": "pending"
            })
            
        return recommendations
