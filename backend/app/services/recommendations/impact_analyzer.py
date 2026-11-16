"""Impact analyzer for cleaning recommendations.

Estimates the before/after effect of executing approved recommendations
without mutating the original dataset.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

import pandas as pd


def estimate_impact(
    df: pd.DataFrame,
    recommendations: List[Dict[str, Any]],
    approved_action_ids: List[str],
) -> Dict[str, Any]:
    """Estimate the impact of executing a set of approved recommendations.

    Does NOT mutate the input dataframe. Returns estimated before/after
    metrics and per-action impact estimates.
    """
    original_row_count = int(len(df))
    original_column_count = int(len(df.columns))
    original_missing = int(df.isnull().sum().sum())
    original_duplicates = int(df.duplicated().sum())

    rec_map = {str(r.get("action_id")): r for r in recommendations}
    approved_ids = set(approved_action_ids)

    per_action: List[Dict[str, Any]] = []
    est_missing_change = 0
    est_row_change = 0
    est_column_change = 0

    for action_id in approved_ids:
        rec = rec_map.get(action_id)
        if not rec:
            per_action.append({
                "action_id": action_id,
                "status": "not_found",
                "estimated_rows_affected": 0,
                "message": "Action ID not found in recommendations.",
            })
            continue

        issue_type = str(rec.get("issue_type", "")).lower()
        column = rec.get("column")
        affected_rows = int(rec.get("affected_rows", 0))

        entry: Dict[str, Any] = {
            "action_id": action_id,
            "issue_type": issue_type,
            "column": column,
            "estimated_rows_affected": affected_rows,
            "estimated_missing_change": 0,
            "estimated_row_change": 0,
            "estimated_column_change": 0,
            "status": "estimated",
        }

        if issue_type == "missing_values" and column and column in df.columns:
            missing_before = int(df[column].isnull().sum())
            entry["estimated_missing_change"] = -affected_rows  # missing goes down
            est_missing_change -= affected_rows
            entry["message"] = f"Impute ~{affected_rows} missing values in '{column}'."
        elif issue_type == "duplicate_rows":
            entry["estimated_row_change"] = -affected_rows
            est_row_change -= affected_rows
            entry["message"] = f"Drop ~{affected_rows} duplicate rows."
        elif issue_type == "constant_column" and column:
            entry["estimated_column_change"] = -1
            est_column_change -= 1
            entry["message"] = f"Drop constant column '{column}'."
        elif issue_type == "outlier" and column:
            entry["message"] = f"Winsorize ~{affected_rows} outlier values in '{column}'."
        elif issue_type == "whitespace" and column:
            entry["message"] = f"Trim whitespace in '{column}' (no row/column count change)."
        else:
            entry["message"] = "No quantitative impact estimate available."

        per_action.append(entry)

    final_row_count = original_row_count + est_row_change
    final_column_count = original_column_count + est_column_change
    final_missing = max(0, original_missing + est_missing_change)

    return {
        "original_row_count": original_row_count,
        "final_row_count": max(0, final_row_count),
        "original_column_count": original_column_count,
        "final_column_count": max(0, final_column_count),
        "original_missing_cells": original_missing,
        "final_missing_cells": final_missing,
        "original_duplicate_rows": original_duplicates,
        "estimated_row_change": est_row_change,
        "estimated_column_change": est_column_change,
        "estimated_missing_change": est_missing_change,
        "estimated_duplicate_reduction": -est_row_change if est_row_change < 0 else 0,
        "per_action": per_action,
        "note": (
            "These are estimates computed before execution. Actual measured "
            "impact may differ and is available in the execution audit log."
        ),
    }


def estimate_single_recommendation_impact(
    df: pd.DataFrame,
    recommendation: Dict[str, Any],
) -> Dict[str, Any]:
    """Estimate impact of a single recommendation."""
    return estimate_impact(df, [recommendation], [str(recommendation.get("action_id"))])
