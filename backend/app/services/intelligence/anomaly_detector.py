"""Anomaly detection across records.

Identifies unusual records using IQR, Z-score, and robust statistical methods.
Does not automatically delete or modify records.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd


def _iqr_mask(series: pd.Series) -> pd.Series:
    """Boolean mask of IQR outliers (1.5 * IQR rule)."""
    s = series.dropna()
    if len(s) < 4:
        return pd.Series(False, index=series.index)
    q1 = s.quantile(0.25)
    q3 = s.quantile(0.75)
    iqr = q3 - q1
    if iqr == 0:
        return pd.Series(False, index=series.index)
    lower = q1 - 1.5 * iqr
    upper = q3 + 1.5 * iqr
    return (series < lower) | (series > upper)


def _zscore_mask(series: pd.Series, threshold: float = 3.0) -> pd.Series:
    """Boolean mask of Z-score outliers."""
    s = series.dropna()
    if len(s) < 4:
        return pd.Series(False, index=series.index)
    mean = float(s.mean())
    std = float(s.std(ddof=1))
    if std == 0 or np.isnan(std):
        return pd.Series(False, index=series.index)
    return (series - mean).abs() > threshold * std


def _modified_zscore_mask(series: pd.Series, threshold: float = 3.5) -> pd.Series:
    """Robust Z-score using median and MAD."""
    s = series.dropna()
    if len(s) < 4:
        return pd.Series(False, index=series.index)
    median = float(s.median())
    mad = float((s - median).abs().median())
    if mad == 0 or np.isnan(mad):
        return pd.Series(False, index=series.index)
    # Modified z-score: 0.6745 * (x - median) / MAD
    mod_z = 0.6745 * (series - median).abs() / mad
    return mod_z > threshold


def detect_numeric_anomalies(
    df: pd.DataFrame,
    column: str,
    methods: Optional[List[str]] = None,
) -> List[Dict[str, Any]]:
    """Detect anomalous rows in a numeric column.

    Returns a list of per-method anomaly findings.
    """
    if column not in df.columns:
        return []
    series = df[column]
    if not pd.api.types.is_numeric_dtype(series) or pd.api.types.is_bool_dtype(series):
        return []
    if methods is None:
        methods = ["iqr", "modified_zscore"]

    findings: List[Dict[str, Any]] = []

    if "iqr" in methods:
        mask = _iqr_mask(series)
        count = int(mask.sum())
        if count > 0:
            findings.append(
                {
                    "column": column,
                    "method": "iqr",
                    "affected_rows": count,
                    "affected_percentage": round(count / len(df) * 100, 2),
                    "severity": "medium" if count / len(df) > 0.05 else "low",
                    "explanation": (
                        f"{count} value(s) in '{column}' fall outside 1.5x IQR bounds."
                    ),
                    "suggested_action": "Review extreme values for data-entry errors "
                    "or legitimate rare events.",
                    "confidence": 0.8,
                }
            )

    if "modified_zscore" in methods:
        mask = _modified_zscore_mask(series)
        count = int(mask.sum())
        if count > 0:
            findings.append(
                {
                    "column": column,
                    "method": "modified_zscore",
                    "affected_rows": count,
                    "affected_percentage": round(count / len(df) * 100, 2),
                    "severity": "medium" if count / len(df) > 0.05 else "low",
                    "explanation": (
                        f"{count} value(s) in '{column}' deviate from the median by "
                        f">3.5 MAD-based modified Z-scores (robust to outliers)."
                    ),
                    "suggested_action": "Investigate whether flagged values are "
                        "errors or valid extremes.",
                    "confidence": 0.85,
                }
            )

    if "zscore" in methods:
        mask = _zscore_mask(series)
        count = int(mask.sum())
        if count > 0:
            findings.append(
                {
                    "column": column,
                    "method": "zscore",
                    "affected_rows": count,
                    "affected_percentage": round(count / len(df) * 100, 2),
                    "severity": "medium",
                    "explanation": (
                        f"{count} value(s) in '{column}' are more than 3 standard "
                        f"deviations from the mean."
                    ),
                    "suggested_action": "Review flagged values; Z-score assumes "
                        "roughly normal distribution.",
                    "confidence": 0.7,
                }
            )

    return findings


def detect_anomalies(
    df: pd.DataFrame,
    columns: Optional[List[str]] = None,
    max_columns: int = 15,
) -> List[Dict[str, Any]]:
    """Detect anomalies across numeric columns.

    Limits the number of columns analyzed to keep it performant.
    """
    if columns is None:
        numeric_cols = [
            c
            for c in df.columns
            if pd.api.types.is_numeric_dtype(df[c]) and not pd.api.types.is_bool_dtype(df[c])
        ]
        columns = numeric_cols[:max_columns]

    all_findings: List[Dict[str, Any]] = []
    for column in columns:
        findings = detect_numeric_anomalies(df, column)
        all_findings.extend(findings)

    severity_order = {"high": 0, "medium": 1, "low": 2}
    all_findings.sort(
        key=lambda r: (
            severity_order.get(r.get("severity", "low"), 3),
            -r.get("affected_rows", 0),
        )
    )
    return all_findings
