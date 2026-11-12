"""Intelligent missing value analysis.

For each column with missing values, identifies pattern, related columns,
and a defensible imputation recommendation without auto-executing.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd

from .type_inference import infer_semantic_type


def _semantic(series: pd.Series) -> str:
    return infer_semantic_type(series).get("semantic_type", "unknown")


def _is_random_missing(series: pd.Series) -> bool:
    """Heuristic: missingness appears random if nulls are scattered across index."""
    null_idx = series[series.isnull()].index
    if len(null_idx) == 0:
        return True
    if len(null_idx) == 1:
        return True
    # Check if nulls are clustered (consecutive runs) vs scattered
    gaps = np.diff(null_idx.values)
    clustered = int((gaps <= 3).sum())  # nulls within 3 rows of each other
    return clustered < len(null_idx) * 0.6


def analyze_missing_values(df: pd.DataFrame) -> Dict[str, Any]:
    """Analyze missing values for every column.

    Returns per-column missing intelligence and a summary.
    """
    row_count = len(df)
    results: List[Dict[str, Any]] = []
    total_missing_cells = 0
    columns_with_missing = 0

    for col in df.columns:
        series = df[col]
        missing_count = int(series.isnull().sum())
        missing_pct = float((missing_count / row_count * 100) if row_count > 0 else 0.0)

        if missing_count == 0:
            continue

        columns_with_missing += 1
        total_missing_cells += missing_count
        semantic = _semantic(series)
        random_missing = _is_random_missing(series)

        # Related columns that correlate with missingness (other columns with missing in same rows)
        null_mask = series.isnull()
        related: List[str] = []
        for other_col in df.columns:
            if other_col == col:
                continue
            other_null = df[other_col].isnull()
            # Correlation of missingness patterns
            both_null = int((null_mask & other_null).sum())
            if both_null > 0:
                related.append(other_col)

        recommendation = _recommend_imputation(series, semantic, missing_pct, random_missing)

        results.append({
            "column": str(col),
            "semantic_type": semantic,
            "missing_count": missing_count,
            "missing_percentage": round(missing_pct, 2),
            "missing_pattern": "random" if random_missing else "clustered",
            "related_columns": related[:5],
            "recommendation": recommendation,
        })

    results.sort(key=lambda x: x["missing_count"], reverse=True)

    overall_missing_pct = float((total_missing_cells / (row_count * len(df.columns)) * 100)) if (row_count * len(df.columns)) > 0 else 0.0

    return {
        "total_rows": row_count,
        "total_columns": len(df.columns),
        "total_missing_cells": total_missing_cells,
        "overall_missing_percentage": round(overall_missing_pct, 2),
        "columns_with_missing": columns_with_missing,
        "columns": results,
    }


def _recommend_imputation(
    series: pd.Series,
    semantic: str,
    missing_pct: float,
    random_missing: bool,
) -> Dict[str, Any]:
    """Produce a defensible imputation recommendation."""
    rec: Dict[str, Any] = {
        "method": None,
        "reason": "",
        "confidence": 0.0,
        "risk_level": "Low",
        "affected_rows": int(series.isnull().sum()),
        "drawbacks": "",
        "approval_required": False,
    }

    if semantic == "identifier":
        rec.update({
            "method": "flag_for_review",
            "reason": "Identifier columns should never be imputed with mean/median; missing identifiers break referential integrity.",
            "confidence": 0.95,
            "risk_level": "High",
            "drawbacks": "Any imputation would fabricate identity values.",
            "approval_required": True,
        })
        return rec

    if semantic == "datetime":
        rec.update({
            "method": "preserve_missing",
            "reason": "Dates should not be blindly imputed; missing dates may carry semantic meaning (e.g., event not yet occurred).",
            "confidence": 0.9,
            "risk_level": "Medium",
            "drawbacks": "Missing dates remain as nulls; downstream date math must handle nulls.",
            "approval_required": True,
        })
        return rec

    if semantic == "numeric":
        non_null = series.dropna()
        if len(non_null) == 0:
            rec.update({
                "method": "preserve_missing",
                "reason": "All values are missing; no basis for imputation.",
                "confidence": 1.0,
                "risk_level": "High",
                "drawbacks": "Column is entirely empty.",
                "approval_required": True,
            })
            return rec

        median_val = float(non_null.median())
        mean_val = float(non_null.mean())
        skew = abs(float(non_null.skew())) if len(non_null) > 2 else 0

        if missing_pct > 50:
            method = "preserve_missing"
            reason = "More than half the values are missing; imputation would fabricate most of the column."
            confidence = 0.9
            risk = "High"
            drawbacks = "Column largely empty; analysis on it is unreliable."
            approval = True
        elif skew > 1.0:
            method = "median_imputation"
            reason = f"Distribution is skewed (|skew|={skew:.2f}); median is more robust than mean."
            confidence = 0.8
            risk = "Medium"
            drawbacks = "Median imputation reduces variance and can bias correlation estimates."
            approval = missing_pct > 20
        else:
            method = "mean_imputation"
            reason = "Distribution is approximately symmetric; mean imputation is defensible."
            confidence = 0.75
            risk = "Medium"
            drawbacks = "Mean imputation reduces variance and underestimates uncertainty."
            approval = missing_pct > 30

        rec.update({
            "method": method,
            "reason": reason,
            "confidence": confidence,
            "risk_level": risk,
            "drawbacks": drawbacks,
            "approval_required": approval,
        })
        return rec

    if semantic in ("categorical", "boolean", "phone", "postal_code", "email"):
        non_null = series.dropna()
        if len(non_null) == 0:
            rec.update({
                "method": "preserve_missing",
                "reason": "All values are missing; no mode to impute.",
                "confidence": 1.0,
                "risk_level": "High",
                "drawbacks": "Column is entirely empty.",
                "approval_required": True,
            })
            return rec
        rec.update({
            "method": "mode_imputation_or_unknown",
            "reason": "Categorical missingness can be imputed with mode or treated as explicit 'Unknown' category.",
            "confidence": 0.7,
            "risk_level": "Low",
            "drawbacks": "Mode imputation may overstate the prevalence of the most common category.",
            "approval_required": missing_pct > 30,
        })
        return rec

    # Fallback
    rec.update({
        "method": "preserve_missing",
        "reason": "Semantic type unclear; safest to preserve missing values and let the user decide.",
        "confidence": 0.5,
        "risk_level": "Medium",
        "drawbacks": "Missing values remain unaddressed.",
        "approval_required": True,
    })
    return rec
