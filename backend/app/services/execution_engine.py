import pandas as pd
import numpy as np
from typing import List, Dict, Any, Tuple
from .risk_policy import RiskPolicy
from .profiler import Profiler

class CleaningExecutionEngine:
    @staticmethod
    def execute_cleaning(
        original_df: pd.DataFrame,
        recommendations: List[Dict[str, Any]],
        approved_action_ids: List[str],
        dataset_id: str
    ) -> Tuple[pd.DataFrame, Dict[str, Any], str]:
        
        working_df = original_df.copy(deep=True)
        
        row_count_before = len(original_df)
        col_count_before = len(original_df.columns)
        missing_before = int(original_df.isnull().sum().sum())
        try:
            dup_before = int(original_df.duplicated().sum())
        except Exception:
            dup_before = 0
            
        audit_log = []
        executed_count = 0
        blocked_count = 0
        failed_count = 0
        
        approved_set = set(approved_action_ids)
        
        # Build mapping of action_id to recommendation
        rec_map = {rec["action_id"]: rec for rec in recommendations}
        
        for action_id in approved_action_ids:
            if action_id not in rec_map:
                audit_log.append({
                    "action_id": action_id,
                    "issue_type": "unknown",
                    "column": None,
                    "title": "Unknown Action",
                    "status": "failed",
                    "risk_level": "High",
                    "message": f"Action ID {action_id} not found in dataset recommendations.",
                    "rows_affected": 0
                })
                failed_count += 1
                continue
                
            rec = rec_map[action_id]
            issue_type = rec["issue_type"]
            column = rec.get("column")
            title = rec["title"]
            risk_level = rec["risk_level"]
            
            # Risk Policy Enforcement Server-Side
            if risk_level == "High":
                audit_log.append({
                    "action_id": action_id,
                    "issue_type": issue_type,
                    "column": column,
                    "title": title,
                    "status": "blocked",
                    "risk_level": risk_level,
                    "message": f"Execution blocked: Action '{title}' is classified as High Risk and requires explicit safeguards or manual review.",
                    "rows_affected": 0
                })
                blocked_count += 1
                continue
                
            # Execute supported deterministic operations
            try:
                rows_affected = 0
                if issue_type == "whitespace":
                    if column and column in working_df.columns:
                        if pd.api.types.is_object_dtype(working_df[column]) or pd.api.types.is_string_dtype(working_df[column]):
                            original_col = working_df[column].copy()
                            working_df[column] = working_df[column].apply(
                                lambda x: x.strip() if isinstance(x, str) else x
                            )
                            rows_affected = int((working_df[column] != original_col).sum())
                            audit_log.append({
                                "action_id": action_id,
                                "issue_type": issue_type,
                                "column": column,
                                "title": title,
                                "status": "success",
                                "risk_level": risk_level,
                                "message": f"Successfully trimmed leading/trailing whitespace in '{column}'.",
                                "rows_affected": rows_affected
                            })
                            executed_count += 1
                        else:
                            audit_log.append({
                                "action_id": action_id,
                                "issue_type": issue_type,
                                "column": column,
                                "title": title,
                                "status": "skipped",
                                "risk_level": risk_level,
                                "message": f"Column '{column}' is not string type; whitespace trimming skipped.",
                                "rows_affected": 0
                            })
                    else:
                        audit_log.append({
                            "action_id": action_id,
                            "issue_type": issue_type,
                            "column": column,
                            "title": title,
                            "status": "failed",
                            "risk_level": risk_level,
                            "message": f"Column '{column}' not found in dataset.",
                            "rows_affected": 0
                        })
                        failed_count += 1
                        
                elif issue_type == "duplicate_rows":
                    before_rows = len(working_df)
                    working_df = working_df.drop_duplicates().reset_index(drop=True)
                    rows_affected = before_rows - len(working_df)
                    audit_log.append({
                        "action_id": action_id,
                        "issue_type": issue_type,
                        "column": None,
                        "title": title,
                        "status": "success",
                        "risk_level": risk_level,
                        "message": f"Successfully removed {rows_affected} exact duplicate rows.",
                        "rows_affected": rows_affected
                    })
                    executed_count += 1
                    
                elif issue_type == "missing_values":
                    if column and column in working_df.columns:
                        missing_cnt = int(working_df[column].isnull().sum())
                        if missing_cnt > 0:
                            if pd.api.types.is_numeric_dtype(working_df[column]):
                                fill_val = working_df[column].median()
                                if pd.isna(fill_val):
                                    fill_val = 0
                                working_df[column] = working_df[column].fillna(fill_val)
                            else:
                                mode_vals = working_df[column].mode()
                                fill_val = mode_vals.iloc[0] if not mode_vals.empty else "Unknown"
                                working_df[column] = working_df[column].fillna(fill_val)
                                
                            rows_affected = missing_cnt
                            audit_log.append({
                                "action_id": action_id,
                                "issue_type": issue_type,
                                "column": column,
                                "title": title,
                                "status": "success",
                                "risk_level": risk_level,
                                "message": f"Successfully imputed {rows_affected} missing values in '{column}' using strategy (median/mode).",
                                "rows_affected": rows_affected
                            })
                            executed_count += 1
                        else:
                            audit_log.append({
                                "action_id": action_id,
                                "issue_type": issue_type,
                                "column": column,
                                "title": title,
                                "status": "skipped",
                                "risk_level": risk_level,
                                "message": f"Column '{column}' has no missing values to impute.",
                                "rows_affected": 0
                            })
                    else:
                        audit_log.append({
                            "action_id": action_id,
                            "issue_type": issue_type,
                            "column": column,
                            "title": title,
                            "status": "failed",
                            "risk_level": risk_level,
                            "message": f"Column '{column}' not found in dataset.",
                            "rows_affected": 0
                        })
                        failed_count += 1
                        
                elif issue_type == "constant_column":
                    if column and column in working_df.columns:
                        working_df = working_df.drop(columns=[column])
                        rows_affected = len(working_df)
                        audit_log.append({
                            "action_id": action_id,
                            "issue_type": issue_type,
                            "column": column,
                            "title": title,
                            "status": "success",
                            "risk_level": risk_level,
                            "message": f"Successfully dropped constant column '{column}'.",
                            "rows_affected": rows_affected
                        })
                        executed_count += 1
                    else:
                        audit_log.append({
                            "action_id": action_id,
                            "issue_type": issue_type,
                            "column": column,
                            "title": title,
                            "status": "failed",
                            "risk_level": risk_level,
                            "message": f"Column '{column}' not found in dataset.",
                            "rows_affected": 0
                        })
                        failed_count += 1
                        
                elif issue_type == "outlier":
                    if risk_level == "Medium" and column and column in working_df.columns:
                        # Winsorize / clamp outliers using IQR
                        s = working_df[column]
                        if pd.api.types.is_numeric_dtype(s):
                            q1 = s.quantile(0.25)
                            q3 = s.quantile(0.75)
                            iqr = q3 - q1
                            if iqr > 0:
                                lower = q1 - 1.5 * iqr
                                upper = q3 + 1.5 * iqr
                                before_clipped = s.copy()
                                working_df[column] = s.clip(lower=lower, upper=upper)
                                rows_affected = int((working_df[column] != before_clipped).sum())
                                audit_log.append({
                                    "action_id": action_id,
                                    "issue_type": issue_type,
                                    "column": column,
                                    "title": title,
                                    "status": "success",
                                    "risk_level": risk_level,
                                    "message": f"Successfully clipped {rows_affected} statistical outlier values in '{column}' to IQR bounds.",
                                    "rows_affected": rows_affected
                                })
                                executed_count += 1
                            else:
                                audit_log.append({
                                    "action_id": action_id,
                                    "issue_type": issue_type,
                                    "column": column,
                                    "title": title,
                                    "status": "skipped",
                                    "risk_level": risk_level,
                                    "message": f"Column '{column}' has zero IQR; outlier treatment skipped.",
                                    "rows_affected": 0
                                })
                        else:
                            audit_log.append({
                                "action_id": action_id,
                                "issue_type": issue_type,
                                "column": column,
                                "title": title,
                                "status": "skipped",
                                "risk_level": risk_level,
                                "message": f"Column '{column}' is not numeric; outlier treatment skipped.",
                                "rows_affected": 0
                            })
                    else:
                        audit_log.append({
                            "action_id": action_id,
                            "issue_type": issue_type,
                            "column": column,
                            "title": title,
                            "status": "blocked",
                            "risk_level": risk_level,
                            "message": f"Outlier treatment for '{column}' blocked or requires elevated review.",
                            "rows_affected": 0
                        })
                        blocked_count += 1
                else:
                    # General or unknown remediation
                    audit_log.append({
                        "action_id": action_id,
                        "issue_type": issue_type,
                        "column": column,
                        "title": title,
                        "status": "skipped",
                        "risk_level": risk_level,
                        "message": f"Operation type '{issue_type}' has no automated deterministic executor.",
                        "rows_affected": 0
                    })
            except Exception as ex:
                audit_log.append({
                    "action_id": action_id,
                    "issue_type": issue_type,
                    "column": column,
                    "title": title,
                    "status": "failed",
                    "risk_level": risk_level,
                    "message": f"Execution error: {str(ex)}",
                    "rows_affected": 0
                })
                failed_count += 1

        missing_after = int(working_df.isnull().sum().sum())
        try:
            dup_after = int(working_df.duplicated().sum())
        except Exception:
            dup_after = 0
            
        overall_status = "success"
        if failed_count > 0 and executed_count > 0:
            overall_status = "partial"
        elif failed_count > 0 and executed_count == 0:
            overall_status = "failed"
        elif blocked_count > 0 and executed_count == 0:
            overall_status = "partial"

        return working_df, audit_log, overall_status
