"""Conditional missing-value analysis.

Identifies whether missingness in one column is associated with values in
another column (e.g., missing amounts concentrated in one payment method).
Deterministic and evidence-based; does not claim randomness without support.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

import pandas as pd

from ..profiling.type_inference import infer_semantic_type


def _semantic(series: pd.Series) -> str:
    return infer_semantic_type(series).get("semantic_type", "unknown")


def _is_categorical_like(series: pd.Series) -> bool:
    semantic = _semantic(series)
    return semantic in (
        "categorical",
        "identifier",
        "phone",
        "postal_code",
        "email",
        "boolean",
    )


def analyze_conditional_missingness(
    df: pd.DataFrame,
    target_col: str,
    group_col: str,
) -> Optional[Dict[str, Any]]:
    """Analyze whether missingness in target_col is associated with group_col.

    Returns None if target_col has no missing values or grouping is not possible.
    """
    if target_col not in df.columns or group_col not in df.columns:
        return None
    if target_col == group_col:
        return None

    target = df[target_col]
    group = df[group_col].astype(str)

    total_missing = int(target.isnull().sum())
    row_count = len(df)
    if total_missing == 0 or row_count == 0:
        return None

    overall_missing_pct = float(total_missing / row_count * 100)

    # Build a frame with target missingness flag and group
    work = pd.DataFrame({"_group": group, "_missing": target.isnull()}).dropna(
        subset=["_group"]
    )
    if work["_group"].nunique() < 2:
        return None

    grouped = work.groupby("_group")["_missing"].agg(["count", "sum", "mean"]).reset_index()
    grouped.columns = ["group", "count", "missing_count", "missing_rate"]
    grouped["missing_rate"] = (grouped["missing_rate"] * 100).round(2)
    grouped = grouped.sort_values("missing_rate", ascending=False)

    # Determine if pattern is significant: max group missing rate vs overall
    top = grouped.iloc[0]
    bottom = grouped.iloc[-1]
    spread = float(top["missing_rate"] - bottom["missing_rate"])

    significant = spread >= 10.0 and top["missing_rate"] >= overall_missing_pct * 1.5

    affected_rows = int(top["missing_count"]) if significant else 0

    groups_detail: List[Dict[str, Any]] = []
    for _, row in grouped.iterrows():
        groups_detail.append(
            {
                "group": str(row["group"]),
                "row_count": int(row["count"]),
                "missing_count": int(row["missing_count"]),
                "missing_percentage": float(row["missing_rate"]),
            }
        )

    return {
        "issue_type": "conditional_missingness",
        "affected_columns": [target_col, group_col],
        "affected_rows": affected_rows,
        "severity": "high" if significant else ("medium" if spread >= 5.0 else "low"),
        "evidence": {
            "target_column": target_col,
            "group_column": group_col,
            "overall_missing_percentage": round(overall_missing_pct, 2),
            "max_group_missing_percentage": float(top["missing_rate"]),
            "min_group_missing_percentage": float(bottom["missing_rate"]),
            "spread_percentage": round(spread, 2),
            "significant": bool(significant),
            "groups": groups_detail,
        },
        "explanation": (
            f"Missingness in '{target_col}' ({overall_missing_pct:.1f}% overall) "
            f"varies across '{group_col}' groups "
            f"({bottom['missing_rate']:.1f}% to {top['missing_rate']:.1f}%)."
        ),
        "suggested_action": (
            f"Investigate data ingestion for '{group_col}'='{top['group']}' "
            f"records where '{target_col}' is frequently missing."
            if significant
            else "Missingness appears distributed across groups; no targeted action."
        ),
        "confidence": 0.8 if significant else 0.5,
    }


def find_conditional_missingness(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Scan all (target, group) column pairs for conditional missingness.

    Only considers categorical/discrete columns as grouping columns and
    columns with missing values as targets. Limits pairs for performance.
    """
    results: List[Dict[str, Any]] = []
    columns = list(df.columns)

    # Identify candidate target columns (have missing values)
    target_cols = [c for c in columns if df[c].isnull().any()]
    # Identify candidate group columns (categorical-like, not high-cardinality identifiers)
    group_cols = []
    for c in columns:
        if _is_categorical_like(df[c]) and df[c].nunique(dropna=True) <= max(20, len(df) * 0.1):
            group_cols.append(c)

    # Cap pairs
    pair_budget = 60
    pairs_checked = 0

    for target in target_cols:
        for group in group_cols:
            if target == group:
                continue
            if pairs_checked >= pair_budget:
                break
            pairs_checked += 1
            res = analyze_conditional_missingness(df, target, group)
            if res:
                results.append(res)

        if pairs_checked >= pair_budget:
            break

    severity_order = {"high": 0, "medium": 1, "low": 2}
    results.sort(
        key=lambda r: (
            severity_order.get(r.get("severity", "low"), 3),
            -r.get("confidence", 0),
        )
    )
    return results
