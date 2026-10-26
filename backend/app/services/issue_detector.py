import pandas as pd
import numpy as np

class IssueDetector:
    @staticmethod
    def detect_issues(df: pd.DataFrame) -> list:
        issues = []
        row_count = len(df)
        
        if row_count == 0:
            return issues
            
        dup_count = int(df.duplicated().sum())
        if dup_count > 0:
            dup_pct = float(dup_count / row_count * 100)
            issues.append({
                "issue_type": "duplicate_rows",
                "column": None,
                "evidence": f"Found {dup_count} exact duplicate rows ({dup_pct:.2f}% of dataset).",
                "affected_rows": dup_count,
                "affected_percentage": dup_pct
            })
            
        for col in df.columns:
            series = df[col]
            missing_count = int(series.isnull().sum())
            if missing_count > 0:
                missing_pct = float(missing_count / row_count * 100)
                issues.append({
                    "issue_type": "missing_values",
                    "column": str(col),
                    "evidence": f"Column '{col}' has {missing_count} missing values ({missing_pct:.2f}%).",
                    "affected_rows": missing_count,
                    "affected_percentage": missing_pct
                })
                
            if series.nunique(dropna=True) <= 1:
                issues.append({
                    "issue_type": "constant_column",
                    "column": str(col),
                    "evidence": f"Column '{col}' contains constant or single-value data across all rows.",
                    "affected_rows": row_count,
                    "affected_percentage": 100.0
                })
                
            if pd.api.types.is_object_dtype(series):
                non_null_str = series.dropna().astype(str)
                whitespace_count = int(non_null_str.str.startswith(' ').sum() + non_null_str.str.endswith(' ').sum())
                if whitespace_count > 0:
                    ws_pct = float(whitespace_count / row_count * 100)
                    issues.append({
                        "issue_type": "whitespace",
                        "column": str(col),
                        "evidence": f"Column '{col}' has {whitespace_count} values with leading/trailing whitespace.",
                        "affected_rows": whitespace_count,
                        "affected_percentage": ws_pct
                    })
                    
            if pd.api.types.is_numeric_dtype(series):
                numeric_series = series.dropna()
                if len(numeric_series) > 10:
                    q1 = numeric_series.quantile(0.25)
                    q3 = numeric_series.quantile(0.75)
                    iqr = q3 - q1
                    if iqr > 0:
                        lower_bound = q1 - 1.5 * iqr
                        upper_bound = q3 + 1.5 * iqr
                        outliers = numeric_series[(numeric_series < lower_bound) | (numeric_series > upper_bound)]
                        outlier_count = len(outliers)
                        if outlier_count > 0:
                            outlier_pct = float(outlier_count / row_count * 100)
                            if outlier_pct < 15.0:
                                issues.append({
                                    "issue_type": "outlier",
                                    "column": str(col),
                                    "evidence": f"Column '{col}' has {outlier_count} statistical outlier values based on IQR method ({outlier_pct:.2f}%).",
                                    "affected_rows": outlier_count,
                                    "affected_percentage": outlier_pct
                                })
                                
        return issues
