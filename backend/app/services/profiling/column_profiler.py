"""Column-level profiling for each semantic/physical data type.

Extends the existing Profiler with deep per-column statistics appropriate to
the detected type, without mutating the source DataFrame.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd

from .type_inference import infer_semantic_type, infer_all_columns, _sample_values


def _safe_float(val: Any) -> Optional[float]:
    try:
        if val is None or (isinstance(val, float) and np.isnan(val)):
            return None
        f = float(val)
        if np.isnan(f) or np.isinf(f):
            return None
        return f
    except (TypeError, ValueError):
        return None


def profile_numeric(series: pd.Series) -> Dict[str, Any]:
    non_null = series.dropna()
    row_count = len(series)
    non_null_count = int(non_null.count())
    result: Dict[str, Any] = {
        "min": None,
        "max": None,
        "mean": None,
        "median": None,
        "std": None,
        "variance": None,
        "q1": None,
        "median_q2": None,
        "q3": None,
        "iqr": None,
        "skewness": None,
        "unique_count": None,
        "zero_count": None,
        "negative_count": None,
        "outlier_count": None,
    }

    if non_null_count == 0:
        return result

    try:
        result["min"] = _safe_float(non_null.min())
        result["max"] = _safe_float(non_null.max())
        result["mean"] = _safe_float(non_null.mean())
        result["median"] = _safe_float(non_null.median())
        result["std"] = _safe_float(non_null.std(ddof=1)) if non_null_count > 1 else None
        result["variance"] = _safe_float(non_null.var(ddof=1)) if non_null_count > 1 else None

        q1 = non_null.quantile(0.25)
        q2 = non_null.quantile(0.50)
        q3 = non_null.quantile(0.75)
        result["q1"] = _safe_float(q1)
        result["median_q2"] = _safe_float(q2)
        result["q3"] = _safe_float(q3)

        iqr_val = None
        if result["q1"] is not None and result["q3"] is not None:
            iqr_val = float(result["q3"]) - float(result["q1"])
            result["iqr"] = iqr_val

        result["skewness"] = _safe_float(non_null.skew()) if non_null_count > 2 else None
        result["unique_count"] = int(non_null.nunique(dropna=True))
        result["zero_count"] = int((non_null == 0).sum())
        result["negative_count"] = int((non_null < 0).sum())

        # IQR-based outliers
        if iqr_val is not None and iqr_val > 0 and result["q1"] is not None and result["q3"] is not None:
            lower = float(result["q1"]) - 1.5 * iqr_val
            upper = float(result["q3"]) + 1.5 * iqr_val
            outliers = non_null[(non_null < lower) | (non_null > upper)]
            result["outlier_count"] = int(len(outliers))
    except Exception:
        pass

    return result


def profile_categorical(series: pd.Series) -> Dict[str, Any]:
    non_null = series.dropna().astype(str)
    row_count = len(series)
    non_null_count = int(non_null.count())
    result: Dict[str, Any] = {
        "unique_values": None,
        "cardinality": None,
        "most_frequent_value": None,
        "most_frequent_value_count": None,
        "top_10_frequencies": [],
        "rare_category_count": None,
        "whitespace_inconsistencies": None,
        "case_inconsistencies": None,
    }

    if non_null_count == 0:
        return result

    try:
        vc = non_null.value_counts()
        result["unique_values"] = int(len(vc))
        result["cardinality"] = int(len(vc))
        if len(vc) > 0:
            top = vc.index[0]
            result["most_frequent_value"] = str(top)
            result["most_frequent_value_count"] = int(vc.iloc[0])
            top_10 = vc.head(10)
            result["top_10_frequencies"] = [
                {"value": str(k), "count": int(v)} for k, v in top_10.items()
            ]

        # Rare categories: appearing once (singletons)
        result["rare_category_count"] = int((vc == 1).sum())

        # Whitespace inconsistencies
        ws_mask = non_null.str.startswith(" ") | non_null.str.endswith(" ")
        result["whitespace_inconsistencies"] = int(ws_mask.sum())

        # Case inconsistencies: same word appears in different cases
        lowered = non_null.str.lower()
        case_groups = lowered.groupby(lowered).nunique()
        inconsistent = int((case_groups > 1).sum())
        result["case_inconsistencies"] = inconsistent
    except Exception:
        pass

    return result


def profile_datetime(series: pd.Series) -> Dict[str, Any]:
    non_null = series.dropna()
    row_count = len(series)
    non_null_count = int(non_null.count())
    result: Dict[str, Any] = {
        "min_date": None,
        "max_date": None,
        "invalid_date_count": None,
        "date_format_inconsistencies": None,
        "future_date_count": None,
        "date_range_days": None,
    }

    if non_null_count == 0:
        return result

    try:
        parsed = pd.to_datetime(non_null, errors="coerce")
        valid_count = int(parsed.notna().sum())
        result["invalid_date_count"] = int(non_null_count - valid_count)

        if valid_count > 0:
            result["min_date"] = parsed.min().isoformat()
            result["max_date"] = parsed.max().isoformat()
            delta = parsed.max() - parsed.min()
            result["date_range_days"] = int(delta.days)

            now = pd.Timestamp.now()
            result["future_date_count"] = int((parsed > now).sum())

        # Format inconsistencies: if original is object, check if all parse cleanly
        if pd.api.types.is_object_dtype(series):
            result["date_format_inconsistencies"] = int(non_null_count - valid_count)
    except Exception:
        pass

    return result


def profile_boolean(series: pd.Series) -> Dict[str, Any]:
    non_null = series.dropna()
    row_count = len(series)
    non_null_count = int(non_null.count())
    result: Dict[str, Any] = {
        "true_count": None,
        "false_count": None,
        "missing_count": None,
        "unexpected_category_count": None,
    }

    if non_null_count == 0:
        return result

    try:
        if pd.api.types.is_bool_dtype(series):
            result["true_count"] = int(series.sum())
            result["false_count"] = int((~series).sum())
            result["missing_count"] = int(series.isnull().sum())
            result["unexpected_category_count"] = 0
        else:
            lowered = non_null.astype(str).str.lower()
            true_count = int(lowered.isin({"true", "t", "yes", "y", "1"}).sum())
            false_count = int(lowered.isin({"false", "f", "no", "n", "0"}).sum())
            result["true_count"] = true_count
            result["false_count"] = false_count
            result["missing_count"] = int(series.isnull().sum())
            result["unexpected_category_count"] = int(non_null_count - true_count - false_count)
    except Exception:
        pass

    return result


def profile_column(series: pd.Series, semantic_info: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Produce a complete profile for a single column."""
    if semantic_info is None:
        semantic_info = infer_semantic_type(series)

    row_count = len(series)
    non_null_count = int(series.notnull().sum())
    missing_count = int(series.isnull().sum())
    missing_pct = float((missing_count / row_count * 100) if row_count > 0 else 0.0)
    unique_count = int(series.nunique(dropna=True))

    base = {
        "name": str(series.name) if series.name is not None else "column",
        "original_type": semantic_info.get("original_type", str(series.dtype)),
        "suggested_type": semantic_info.get("suggested_type", str(series.dtype)),
        "semantic_type": semantic_info.get("semantic_type", "unknown"),
        "confidence": semantic_info.get("confidence", 0.0),
        "explanation": semantic_info.get("explanation", ""),
        "example_values": semantic_info.get("example_values", []),
        "null_count": missing_count,
        "null_percentage": missing_pct,
        "unique_count": unique_count,
        "non_null_count": non_null_count,
    }

    semantic = semantic_info.get("semantic_type", "unknown")

    if semantic == "numeric":
        base["statistics"] = profile_numeric(series)
    elif semantic in ("categorical", "identifier", "phone", "postal_code", "email"):
        base["statistics"] = profile_categorical(series)
    elif semantic == "datetime":
        base["statistics"] = profile_datetime(series)
    elif semantic == "boolean":
        base["statistics"] = profile_boolean(series)
    elif semantic == "currency":
        base["statistics"] = profile_numeric(series)
    elif semantic == "empty":
        base["statistics"] = {}
    else:
        base["statistics"] = profile_categorical(series)

    return base


def profile_all_columns(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Profile every column in the DataFrame."""
    inference = infer_all_columns(df)
    results: List[Dict[str, Any]] = []
    for col in df.columns:
        semantic_info = inference.get(col)
        results.append(profile_column(df[col], semantic_info))
    return results
