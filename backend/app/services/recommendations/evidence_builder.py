"""Evidence builder for explainable recommendations.

Extracts deterministic, dataset-grounded evidence for each cleaning
recommendation so the LLM (and the UI) never invents statistics.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

import pandas as pd

from ..profiling.column_profiler import profile_column
from ..profiling.type_inference import infer_semantic_type


def _semantic(series: pd.Series) -> str:
    return infer_semantic_type(series).get("semantic_type", "unknown")


def _safe_float(val: Any) -> Optional[float]:
    try:
        if val is None or (isinstance(val, float) and (val != val)):
            return None
        f = float(val)
        if f != f or f in (float("inf"), float("-inf")):
            return None
        return f
    except (TypeError, ValueError):
        return None


def build_missing_value_evidence(df: pd.DataFrame, column: str) -> Dict[str, Any]:
    """Build evidence for a missing-value recommendation on a column."""
    series = df[column]
    row_count = len(df)
    missing_count = int(series.isnull().sum())
    missing_pct = float(missing_count / row_count * 100) if row_count > 0 else 0.0
    non_null = series.dropna()

    evidence: Dict[str, Any] = {
        "column": column,
        "semantic_type": _semantic(series),
        "row_count": row_count,
        "missing_count": missing_count,
        "missing_percentage": round(missing_pct, 2),
    }

    semantic = _semantic(series)
    if semantic == "numeric" and len(non_null) > 0:
        evidence.update({
            "mean": _safe_float(non_null.mean()),
            "median": _safe_float(non_null.median()),
            "std": _safe_float(non_null.std(ddof=1)) if len(non_null) > 1 else None,
            "skewness": _safe_float(non_null.skew()) if len(non_null) > 2 else None,
            "min": _safe_float(non_null.min()),
            "max": _safe_float(non_null.max()),
        })
    elif semantic in ("categorical", "boolean") and len(non_null) > 0:
        vc = non_null.astype(str).value_counts()
        evidence.update({
            "unique_values": int(len(vc)),
            "most_frequent_value": str(vc.index[0]) if len(vc) > 0 else None,
            "most_frequent_count": int(vc.iloc[0]) if len(vc) > 0 else 0,
        })
    elif semantic == "datetime":
        parsed = pd.to_datetime(non_null, errors="coerce")
        if len(parsed.dropna()) > 0:
            evidence.update({
                "min_date": str(parsed.min()),
                "max_date": str(parsed.max()),
            })

    return evidence


def build_outlier_evidence(df: pd.DataFrame, column: str) -> Dict[str, Any]:
    """Build evidence for an outlier recommendation."""
    series = df[column].dropna()
    if len(series) < 4:
        return {"column": column, "outlier_count": 0}
    q1 = float(series.quantile(0.25))
    q3 = float(series.quantile(0.75))
    iqr = q3 - q1
    lower = q1 - 1.5 * iqr
    upper = q3 + 1.5 * iqr
    outliers = df[column][(df[column] < lower) | (df[column] > upper)]
    return {
        "column": column,
        "method": "iqr",
        "q1": q1,
        "q3": q3,
        "iqr": round(iqr, 4),
        "lower_bound": round(lower, 4),
        "upper_bound": round(upper, 4),
        "outlier_count": int(len(outliers)),
        "outlier_percentage": round(float(len(outliers) / len(df) * 100), 2),
        "outlier_values": [float(v) for v in outliers.head(10).tolist()],
    }


def build_duplicate_evidence(df: pd.DataFrame) -> Dict[str, Any]:
    """Build evidence for a duplicate-rows recommendation."""
    dup_count = int(df.duplicated().sum())
    return {
        "duplicate_row_count": dup_count,
        "duplicate_percentage": round(float(dup_count / len(df) * 100), 2) if len(df) > 0 else 0.0,
        "total_rows": int(len(df)),
    }


def build_evidence_for_recommendation(
    df: pd.DataFrame,
    recommendation: Dict[str, Any],
) -> Dict[str, Any]:
    """Build a complete evidence packet for a recommendation.

    Returns a dict with the recommendation's core fields plus an `evidence`
    sub-dict grounded in actual dataframe statistics.
    """
    issue_type = recommendation.get("issue_type", "unknown")
    column = recommendation.get("column")
    affected_rows = int(recommendation.get("affected_rows", 0))
    affected_pct = float(recommendation.get("affected_percentage", 0.0))

    evidence: Dict[str, Any] = {
        "issue_type": issue_type,
        "column": column,
        "affected_rows": affected_rows,
        "affected_percentage": affected_pct,
    }

    if issue_type == "missing_values" and column:
        evidence.update(build_missing_value_evidence(df, column))
    elif issue_type == "outlier" and column:
        evidence.update(build_outlier_evidence(df, column))
    elif issue_type == "duplicate_rows":
        evidence.update(build_duplicate_evidence(df))
    elif issue_type == "constant_column" and column:
        non_null = df[column].dropna()
        evidence.update({
            "column": column,
            "unique_values": int(df[column].nunique(dropna=True)),
            "sample_value": str(non_null.iloc[0]) if len(non_null) > 0 else None,
        })

    return evidence
