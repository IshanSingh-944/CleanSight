"""Data Intelligence profiling API routes.

Endpoints:
  GET /api/profiling/datasets/{dataset_id}/profile      - extended dataset profile
  GET /api/profiling/datasets/{dataset_id}/quality-score - data quality score
  GET /api/profiling/datasets/{dataset_id}/columns       - column profiles (paginated)
  GET /api/profiling/datasets/{dataset_id}/missing-analysis - missing value intelligence
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import JSONResponse

from app.api.routes.datasets import (
    DATASET_STORE,
    load_dataset_from_db_if_needed,
)
from app.services.db import get_db_connection
from app.services.profiling.dataset_profiler import profile_dataset_extended
from app.services.profiling.quality_scorer import compute_quality_score
from app.services.profiling.missing_value_analyzer import analyze_missing_values
from app.schemas.profiling import (
    DatasetProfileExtended,
    QualityScoreResponse,
    MissingValueAnalysisResponse,
    ColumnProfileResponse,
)

router = APIRouter(prefix="/profiling/datasets", tags=["profiling"])


def _get_dataframe(dataset_id: str):
    """Resolve a DataFrame for a dataset from memory or SQLite."""
    df = DATASET_STORE.get(dataset_id)
    if df is not None:
        return df
    df = load_dataset_from_db_if_needed(dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found.")
    DATASET_STORE[dataset_id] = df
    return df


def _get_profile(dataset_id: str) -> Optional[Dict[str, Any]]:
    """Resolve the profile dict from memory or SQLite."""
    from app.api.routes.datasets import PROFILE_STORE

    profile = PROFILE_STORE.get(dataset_id)
    if profile is not None:
        return profile
    # Force load from DB (load_dataset_from_db_if_needed populates PROFILE_STORE)
    df = load_dataset_from_db_if_needed(dataset_id)
    if df is None:
        return None
    return PROFILE_STORE.get(dataset_id)


@router.get("/{dataset_id}/profile", response_model=DatasetProfileExtended)
async def get_extended_profile(dataset_id: str):
    df = _get_dataframe(dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    # Reuse file metadata from existing profile store if available
    profile = _get_profile(dataset_id)
    filename = profile.get("filename", "dataset.csv") if profile else "dataset.csv"
    file_extension = profile.get("file_extension", "csv") if profile else "csv"
    file_size = profile.get("file_size_bytes", 0) if profile else 0

    extended = profile_dataset_extended(
        df, dataset_id, filename, file_size, file_extension
    )
    return extended


@router.get("/{dataset_id}/quality-score", response_model=QualityScoreResponse)
async def get_quality_score(dataset_id: str):
    df = _get_dataframe(dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found.")
    result = compute_quality_score(df)
    return result


@router.get("/{dataset_id}/columns", response_model=List[ColumnProfileResponse])
async def get_columns(
    dataset_id: str,
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    page_size: int = Query(50, ge=1, le=500, description="Items per page"),
):
    df = _get_dataframe(dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    from app.services.profiling.column_profiler import profile_all_columns
    columns = profile_all_columns(df)

    total = len(columns)
    start = (page - 1) * page_size
    end = start + page_size
    paginated = columns[start:end]

    # Attach pagination headers
    return JSONResponse(
        content=paginated,
        headers={
            "X-Total-Count": str(total),
            "X-Page": str(page),
            "X-Page-Size": str(page_size),
        },
    )


@router.get("/{dataset_id}/missing-analysis", response_model=MissingValueAnalysisResponse)
async def get_missing_analysis(dataset_id: str):
    df = _get_dataframe(dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found.")
    return analyze_missing_values(df)
