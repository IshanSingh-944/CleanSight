"""Dataset-level profiling engine extending the existing Profiler.

Adds dataset-wide statistics (empty rows/columns, memory usage, type
distribution, mixed-type columns) while reusing the existing Profiler
for backward compatibility.
"""

from __future__ import annotations

from typing import Any, Dict, List

import pandas as pd

from app.services.profiler import Profiler as BaseProfiler
from .column_profiler import profile_all_columns


def _count_empty_rows(df: pd.DataFrame) -> int:
    try:
        return int(df.isnull().all(axis=1).sum())
    except Exception:
        return 0


def _count_empty_columns(df: pd.DataFrame) -> int:
    try:
        return int(df.isnull().all(axis=0).sum())
    except Exception:
        return 0


def _type_distribution(columns: List[Dict[str, Any]]) -> Dict[str, int]:
    dist: Dict[str, int] = {}
    for c in columns:
        st = c.get("semantic_type", "unknown")
        dist[st] = dist.get(st, 0) + 1
    return dist


def profile_dataset_extended(
    df: pd.DataFrame,
    dataset_id: str,
    filename: str,
    file_size: int,
    extension: str,
) -> Dict[str, Any]:
    """Return an extended dataset profile including all column profiles."""
    base = BaseProfiler.profile_dataframe(
        df, dataset_id, filename, file_size, extension
    )

    column_profiles = profile_all_columns(df)

    type_distribution = _type_distribution(column_profiles)
    mixed_type_columns = [
        c["name"]
        for c in column_profiles
        if c.get("semantic_type") == "unknown"
    ]

    memory_usage = None
    try:
        memory_usage = int(df.memory_usage(deep=True).sum())
    except Exception:
        pass

    extended = {
        **base,
        "columns": column_profiles,
        "memory_usage_bytes": memory_usage,
        "empty_row_count": _count_empty_rows(df),
        "empty_column_count": _count_empty_columns(df),
        "numeric_column_count": type_distribution.get("numeric", 0),
        "categorical_column_count": type_distribution.get("categorical", 0),
        "datetime_column_count": type_distribution.get("datetime", 0),
        "boolean_column_count": type_distribution.get("boolean", 0),
        "mixed_type_column_count": len(mixed_type_columns),
        "mixed_type_columns": mixed_type_columns,
        "type_distribution": type_distribution,
    }
    return extended
