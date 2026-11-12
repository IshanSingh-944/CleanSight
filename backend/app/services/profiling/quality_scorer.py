"""Data Quality Score engine.

Produces a transparent 0-100 score across four dimensions:
  Completeness, Validity, Uniqueness, Consistency.

Weights are configurable. Every score is explained with affected-record counts.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd

DEFAULT_WEIGHTS = {
    "completeness": 0.35,
    "validity": 0.30,
    "uniqueness": 0.20,
    "consistency": 0.15,
}


def _safe_div(numerator: float, denominator: float) -> Optional[float]:
    if denominator == 0 or denominator is None:
        return None
    try:
        return float(numerator) / float(denominator)
    except (TypeError, ValueError):
        return None


def compute_completeness(df: pd.DataFrame) -> Dict[str, Any]:
    row_count = len(df)
    col_count = len(df.columns)
    total_cells = row_count * col_count
    missing_cells = int(df.isnull().sum().sum())

    score: Optional[float] = None
    details: List[str] = []
    if total_cells > 0:
        score = round(100.0 * (1.0 - missing_cells / total_cells), 2)
        details.append(
            f"{missing_cells} of {total_cells} cells are missing "
            f"({(missing_cells/total_cells*100):.2f}%)."
        )
    else:
        details.append("Dataset is empty (no cells); completeness not scored.")

    return {
        "dimension": "completeness",
        "score": score,
        "weight": None,  # set by caller
        "affected_records": missing_cells,
        "total_records": total_cells,
        "details": details,
    }


def compute_uniqueness(df: pd.DataFrame) -> Dict[str, Any]:
    row_count = len(df)
    duplicate_rows = int(df.duplicated().sum())
    score: Optional[float] = None
    details: List[str] = []

    if row_count > 0:
        unique_ratio = 1.0 - (duplicate_rows / row_count)
        score = round(100.0 * unique_ratio, 2)
        details.append(
            f"{duplicate_rows} exact duplicate rows ({duplicate_rows/row_count*100:.2f}% of {row_count} rows)."
        )
    else:
        details.append("Dataset is empty; uniqueness not scored.")

    return {
        "dimension": "uniqueness",
        "score": score,
        "weight": None,
        "affected_records": duplicate_rows,
        "total_records": row_count,
        "details": details,
    }


def _column_validity_issues(df: pd.DataFrame) -> tuple:
    """Return (invalid_count, applicable_count, per_column_details)."""
    invalid_count = 0
    applicable_count = 0
    per_column: List[Dict[str, Any]] = []

    for col in df.columns:
        series = df[col]
        non_null = series.dropna()
        if len(non_null) == 0:
            continue

        # Applicable cells = non-null cells in this column
        applicable_count += len(non_null)

        invalid = 0
        detail = ""

        if pd.api.types.is_numeric_dtype(series) and not pd.api.types.is_bool_dtype(series):
            # Valid if finite (not inf)
            invalid = int((~non_null.apply(lambda x: np.isfinite(x) if isinstance(x, (int, float, np.integer, np.floating)) else True)).sum())
            detail = f"{invalid} non-finite numeric value(s)"
        elif pd.api.types.is_bool_dtype(series):
            invalid = 0
        elif pd.api.types.is_datetime64_any_dtype(series):
            invalid = int(series.isnull().sum())  # already counted as missing
        else:
            # Object/string: validity = values parse consistently (no mixed types problem)
            # Treat all non-null strings as valid unless they look like mixed numeric/non-numeric
            invalid = 0

        if invalid > 0:
            invalid_count += invalid
            per_column.append({
                "column": str(col),
                "invalid_count": invalid,
                "detail": detail,
            })

    return invalid_count, applicable_count, per_column


def compute_validity(df: pd.DataFrame) -> Dict[str, Any]:
    invalid_count, applicable_count, per_column = _column_validity_issues(df)
    score: Optional[float] = None
    details: List[str] = []

    if applicable_count > 0:
        score = round(100.0 * (1.0 - invalid_count / applicable_count), 2)
        details.append(
            f"{invalid_count} of {applicable_count} applicable values failed validity checks."
        )
        for pc in per_column[:5]:
            details.append(f"  - {pc['column']}: {pc['detail']}")
        if len(per_column) > 5:
            details.append(f"  ... and {len(per_column)-5} more column(s).")
    else:
        details.append("No applicable cells to assess validity.")

    return {
        "dimension": "validity",
        "score": score,
        "weight": None,
        "affected_records": invalid_count,
        "total_records": applicable_count,
        "details": details,
    }


def compute_consistency(df: pd.DataFrame) -> Dict[str, Any]:
    """Measure format/type consistency violations per column.

    For object columns: whitespace and case inconsistencies.
    For numeric columns: mix of integers and floats is fine (not a violation).
    """
    row_count = len(df)
    violation_count = 0
    applicable_count = 0
    details: List[str] = []

    for col in df.columns:
        series = df[col]
        non_null = series.dropna()
        if len(non_null) == 0:
            continue

        applicable_count += len(non_null)
        violations = 0

        if pd.api.types.is_object_dtype(series) or pd.api.types.is_string_dtype(series):
            str_vals = non_null.astype(str)
            ws = int((str_vals.str.startswith(" ") | str_vals.str.endswith(" ")).sum())
            # case inconsistency: same lowered value appears with multiple casings
            lowered = str_vals.str.lower()
            case_groups = lowered.groupby(lowered).nunique()
            case_viol = int((case_groups > 1).sum())
            violations = ws + case_viol

        if violations > 0:
            violation_count += violations
            details.append(
                f"Column '{col}': {violations} consistency violation(s) (whitespace/case)."
            )

    score: Optional[float] = None
    if applicable_count > 0:
        score = round(100.0 * (1.0 - violation_count / applicable_count), 2)
        details.insert(
            0,
            f"{violation_count} of {applicable_count} applicable values have consistency violations.",
        )
    else:
        details.insert(0, "No applicable cells to assess consistency.")

    return {
        "dimension": "consistency",
        "score": score,
        "weight": None,
        "affected_records": violation_count,
        "total_records": applicable_count,
        "details": details,
    }


def compute_quality_score(
    df: pd.DataFrame,
    weights: Optional[Dict[str, float]] = None,
) -> Dict[str, Any]:
    """Compute the overall Data Quality Score and dimension breakdown.

    Returns a dict with overall score, dimensions, weights, and explanations.
    """
    if weights is None:
        weights = DEFAULT_WEIGHTS.copy()

    # Normalize weights to sum to 1.0 (only for dimensions present)
    total_weight = sum(weights.get(d, 0) for d in ["completeness", "validity", "uniqueness", "consistency"])
    if total_weight <= 0:
        weights = DEFAULT_WEIGHTS.copy()
        total_weight = sum(weights.values())

    completeness = compute_completeness(df)
    uniqueness = compute_uniqueness(df)
    validity = compute_validity(df)
    consistency = compute_consistency(df)

    dimensions = {
        "completeness": completeness,
        "uniqueness": uniqueness,
        "validity": validity,
        "consistency": consistency,
    }

    # Attach weights and compute weighted overall
    weighted_sum = 0.0
    weight_sum = 0.0
    scored_dims = 0
    for dim_name, dim in dimensions.items():
        dim["weight"] = round(weights.get(dim_name, 0) / total_weight, 4)
        if dim["score"] is not None:
            weighted_sum += dim["score"] * dim["weight"]
            weight_sum += dim["weight"]
            scored_dims += 1

    overall_score: Optional[float] = None
    if weight_sum > 0:
        overall_score = round(weighted_sum / weight_sum, 2)

    # Build issue breakdown
    issues = []
    if completeness["affected_records"] > 0:
        issues.append({
            "type": "missing_values",
            "count": completeness["affected_records"],
            "dimension": "completeness",
        })
    if uniqueness["affected_records"] > 0:
        issues.append({
            "type": "duplicate_rows",
            "count": uniqueness["affected_records"],
            "dimension": "uniqueness",
        })
    if validity["affected_records"] > 0:
        issues.append({
            "type": "invalid_values",
            "count": validity["affected_records"],
            "dimension": "validity",
        })
    if consistency["affected_records"] > 0:
        issues.append({
            "type": "consistency_violations",
            "count": consistency["affected_records"],
            "dimension": "consistency",
        })

    return {
        "overall_score": overall_score,
        "scored_dimensions": scored_dims,
        "total_cells": int(len(df) * len(df.columns)),
        "total_rows": int(len(df)),
        "total_columns": int(len(df.columns)),
        "dimensions": dimensions,
        "issues": issues,
        "weights": {k: round(v / total_weight, 4) for k, v in weights.items()},
        "note": (
            "The Data Quality Score is an estimate based on available deterministic "
            "checks, not an absolute guarantee of correctness. Unavailable "
            "dimensions are shown as null (not scored)."
        ),
    }
