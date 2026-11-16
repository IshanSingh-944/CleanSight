"""Cross-column relationship analysis engine.

Analyzes relationships between pairs of columns instead of examining each
column in isolation. Deterministic, explainable, and type-aware.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd

from app.services.profiling.type_inference import infer_semantic_type


def _semantic(series: pd.Series) -> str:
    return infer_semantic_type(series).get("semantic_type", "unknown")


def _is_numeric(series: pd.Series) -> bool:
    return pd.api.types.is_numeric_dtype(series) and not pd.api.types.is_bool_dtype(series)


def _is_categorical(series: pd.Series) -> bool:
    semantic = _semantic(series)
    return semantic in ("categorical", "identifier", "phone", "postal_code", "email", "boolean")


def _is_datetime(series: pd.Series) -> bool:
    return pd.api.types.is_datetime64_any_dtype(series) or _semantic(series) == "datetime"


def _pearson(x: pd.Series, y: pd.Series) -> Optional[float]:
    try:
        combined = pd.concat([x, y], axis=1).dropna()
        if len(combined) < 3:
            return None
        corr = combined.iloc[:, 0].corr(combined.iloc[:, 1], method="pearson")
        if pd.isna(corr):
            return None
        return float(corr)
    except Exception:
        return None


def _spearman(x: pd.Series, y: pd.Series) -> Optional[float]:
    try:
        combined = pd.concat([x, y], axis=1).dropna()
        if len(combined) < 3:
            return None
        corr = combined.iloc[:, 0].corr(combined.iloc[:, 1], method="spearman")
        if pd.isna(corr):
            return None
        return float(corr)
    except Exception:
        return None


def analyze_numeric_numeric(
    col_a: str, series_a: pd.Series, col_b: str, series_b: pd.Series
) -> Optional[Dict[str, Any]]:
    """Analyze relationship between two numeric columns."""
    if not (_is_numeric(series_a) and _is_numeric(series_b)):
        return None

    pearson = _pearson(series_a, series_b)
    spearman = _spearman(series_a, series_b)
    if pearson is None and spearman is None:
        return None

    abs_p = abs(pearson) if pearson is not None else 0.0
    abs_s = abs(spearman) if spearman is not None else 0.0
    strength = max(abs_p, abs_s)

    # Determine redundancy: very strong linear correlation
    redundant = strength >= 0.9

    direction = "none"
    if pearson is not None:
        if pearson > 0.5:
            direction = "strong_positive"
        elif pearson < -0.5:
            direction = "strong_negative"
        elif pearson > 0.2:
            direction = "weak_positive"
        elif pearson < -0.2:
            direction = "weak_negative"

    details: Dict[str, Any] = {
        "pearson": pearson,
        "spearman": spearman,
        "strength": round(strength, 4),
        "direction": direction,
        "redundant": redundant,
    }

    explanation = (
        f"Columns '{col_a}' and '{col_b}' show a {direction} relationship "
        f"(Pearson r={pearson:.3f}" if pearson is not None else ""
        f"{', ' if pearson is not None and spearman is not None else ''}"
        f"{'Spearman rho=' + format(spearman, '.3f') if spearman is not None else ''}"
        f")."
    )
    if redundant:
        explanation += (
            " The columns are highly correlated and may be redundant; "
            "consider keeping only one for analysis."
        )

    return {
        "issue_type": "numeric_correlation",
        "affected_columns": [col_a, col_b],
        "affected_rows": 0,  # relationship-level, not row-level
        "severity": "high" if redundant else ("medium" if strength >= 0.6 else "low"),
        "evidence": details,
        "explanation": explanation,
        "suggested_action": (
            "Review for redundancy and keep the more informative column."
            if redundant
            else "Monitor relationship; no action required unless unexpected."
        ),
        "confidence": round(strength, 2),
    }


def analyze_categorical_categorical(
    col_a: str, series_a: pd.Series, col_b: str, series_b: pd.Series
) -> Optional[Dict[str, Any]]:
    """Analyze co-occurrence between two categorical columns."""
    if not (_is_categorical(series_a) and _is_categorical(series_b)):
        return None

    df = pd.DataFrame({col_a: series_a.astype(str), col_b: series_b.astype(str)}).dropna()
    if len(df) == 0:
        return None

    total = len(df)
    # Count unique combinations
    combos = df.groupby([col_a, col_b]).size()
    unique_combos = len(combos)
    max_possible = df[col_a].nunique() * df[col_b].nunique()
    combo_ratio = unique_combos / max_possible if max_possible > 0 else 0

    # Flag unexpected combinations: combinations with very low support relative to
    # individual category frequencies (possible data-entry inconsistency)
    unexpected: List[Dict[str, Any]] = []
    freq_a = df[col_a].value_counts()
    freq_b = df[col_b].value_counts()
    for (va, vb), count in combos.items():
        expected = (freq_a.get(va, 0) * freq_b.get(vb, 0)) / total if total > 0 else 0
        if count > 0 and expected > 0 and count / expected < 0.05 and count <= 3:
            unexpected.append(
                {
                    col_a: str(va),
                    col_b: str(vb),
                    "count": int(count),
                    "expected_approx": round(float(expected), 2),
                }
            )

    severity = "medium" if unexpected else ("low" if combo_ratio < 0.5 else "low")

    return {
        "issue_type": "categorical_cooccurrence",
        "affected_columns": [col_a, col_b],
        "affected_rows": 0,
        "severity": severity,
        "evidence": {
            "unique_combinations": int(unique_combos),
            "max_possible_combinations": int(max_possible),
            "combination_ratio": round(combo_ratio, 4),
            "unexpected_combinations": unexpected[:10],
        },
        "explanation": (
            f"Columns '{col_a}' and '{col_b}' have {unique_combos} unique "
            f"combinations out of {max_possible} possible "
            f"({combo_ratio:.0%} coverage)."
        ),
        "suggested_action": (
            "Review unexpected category pairings for data-entry errors."
            if unexpected
            else "No action required."
        ),
        "confidence": 0.7,
    }


def analyze_numeric_categorical(
    col_num: str, series_num: pd.Series, col_cat: str, series_cat: pd.Series
) -> Optional[Dict[str, Any]]:
    """Analyze numeric distribution differences across categorical groups."""
    if not (_is_numeric(series_num) and _is_categorical(series_cat)):
        return None

    df = pd.DataFrame({col_num: series_num, col_cat: series_cat.astype(str)}).dropna()
    if len(df) == 0 or df[col_cat].nunique() < 2:
        return None

    group_stats = df.groupby(col_cat)[col_num].agg(["count", "mean", "median"]).reset_index()
    overall_mean = float(df[col_num].mean())

    # Find groups whose mean deviates most from overall mean
    group_stats["mean_diff"] = (group_stats["mean"] - overall_mean).abs()
    group_stats = group_stats.sort_values("mean_diff", ascending=False)

    top = group_stats.head(3)
    deviations: List[Dict[str, Any]] = []
    for _, row in top.iterrows():
        deviations.append(
            {
                "group": str(row[col_cat]),
                "count": int(row["count"]),
                "mean": round(float(row["mean"]), 4),
                "median": round(float(row["median"]), 4),
                "diff_from_overall": round(float(row["mean_diff"]), 4),
            }
        )

    # Group-specific missingness
    missing_by_group = (
        df.groupby(col_cat)[col_num].apply(lambda s: int(s.isnull().sum())).reset_index()
    )
    missing_by_group.columns = [col_cat, "missing_count"]

    return {
        "issue_type": "numeric_by_category",
        "affected_columns": [col_num, col_cat],
        "affected_rows": 0,
        "severity": "medium" if deviations else "low",
        "evidence": {
            "overall_mean": round(overall_mean, 4),
            "group_count": int(df[col_cat].nunique()),
            "top_deviations": deviations,
            "missing_by_group": missing_by_group.to_dict("records"),
        },
        "explanation": (
            f"Numeric column '{col_num}' shows different distributions across "
            f"categories of '{col_cat}'."
        ),
        "suggested_action": "Investigate whether group differences reflect real "
        "phenomena or data-quality issues.",
        "confidence": 0.75,
    }


def analyze_datetime_numeric(
    col_dt: str, series_dt: pd.Series, col_num: str, series_num: pd.Series
) -> Optional[Dict[str, Any]]:
    """Analyze numeric values over time for temporal anomalies."""
    if not (_is_datetime(series_dt) and _is_numeric(series_num)):
        return None

    dt_parsed = pd.to_datetime(series_dt, errors="coerce")
    df = pd.DataFrame({col_dt: dt_parsed, col_num: series_num}).dropna()
    if len(df) < 3:
        return None

    df = df.sort_values(col_dt)
    values = df[col_num].astype(float)
    overall_mean = float(values.mean())

    # Split into early/late halves and compare means
    mid = len(df) // 2
    early_mean = float(values.iloc[:mid].mean()) if mid > 0 else overall_mean
    late_mean = float(values.iloc[mid:].mean()) if len(df) - mid > 0 else overall_mean
    drift = late_mean - early_mean

    # Count values beyond 3 std (robust-ish)
    std = float(values.std()) if len(values) > 1 else 0.0
    outliers = int((np.abs(values - overall_mean) > 3 * std).sum()) if std > 0 else 0

    return {
        "issue_type": "numeric_over_time",
        "affected_columns": [col_dt, col_num],
        "affected_rows": 0,
        "severity": "medium" if abs(drift) > abs(overall_mean) * 0.2 else "low",
        "evidence": {
            "row_count": int(len(df)),
            "date_range": {
                "min": str(df[col_dt].min()),
                "max": str(df[col_dt].max()),
            },
            "overall_mean": round(overall_mean, 4),
            "early_half_mean": round(early_mean, 4),
            "late_half_mean": round(late_mean, 4),
            "mean_drift": round(drift, 4),
            "outlier_count_3sigma": outliers,
        },
        "explanation": (
            f"Numeric column '{col_num}' trended {'up' if drift > 0 else 'down' if drift < 0 else 'flat'} "
            f"over time (drift={drift:.3f})."
        ),
        "suggested_action": "Review temporal trend for seasonal effects or "
        "data-quality drift.",
        "confidence": 0.7,
    }


def analyze_all_column_pairs(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Run cross-column analysis on all column pairs.

    Limits analysis to avoid O(n^2) explosion on wide datasets.
    """
    columns = list(df.columns)
    # Cap the number of columns analyzed pairwise to keep it performant
    if len(columns) > 30:
        columns = columns[:30]

    results: List[Dict[str, Any]] = []
    for i in range(len(columns)):
        for j in range(i + 1, len(columns)):
            col_a, col_b = columns[i], columns[j]
            series_a, series_b = df[col_a], df[col_b]

            sa = _semantic(series_a)
            sb = _semantic(series_b)

            # Numeric-numeric
            if _is_numeric(series_a) and _is_numeric(series_b):
                res = analyze_numeric_numeric(col_a, series_a, col_b, series_b)
                if res:
                    results.append(res)
            # Categorical-categorical
            elif _is_categorical(series_a) and _is_categorical(series_b):
                res = analyze_categorical_categorical(col_a, series_a, col_b, series_b)
                if res:
                    results.append(res)
            # Numeric-categorical (either order)
            elif _is_numeric(series_a) and _is_categorical(series_b):
                res = analyze_numeric_categorical(col_a, series_a, col_b, series_b)
                if res:
                    results.append(res)
            elif _is_numeric(series_b) and _is_categorical(series_a):
                res = analyze_numeric_categorical(col_b, series_b, col_a, series_a)
                if res:
                    results.append(res)
            # Datetime-numeric (either order)
            elif _is_datetime(series_a) and _is_numeric(series_b):
                res = analyze_datetime_numeric(col_a, series_a, col_b, series_b)
                if res:
                    results.append(res)
            elif _is_datetime(series_b) and _is_numeric(series_a):
                res = analyze_datetime_numeric(col_b, series_b, col_a, series_a)
                if res:
                    results.append(res)

    # Sort by severity then confidence
    severity_order = {"high": 0, "medium": 1, "low": 2}
    results.sort(
        key=lambda r: (severity_order.get(r.get("severity", "low"), 3), -r.get("confidence", 0))
    )
    return results
