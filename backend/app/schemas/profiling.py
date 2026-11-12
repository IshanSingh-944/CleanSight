"""Pydantic response models for the Data Intelligence profiling endpoints."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ColumnStatistic(BaseModel):
    min: Optional[float] = None
    max: Optional[float] = None
    mean: Optional[float] = None
    median: Optional[float] = None
    std: Optional[float] = None
    variance: Optional[float] = None
    q1: Optional[float] = None
    median_q2: Optional[float] = None
    q3: Optional[float] = None
    iqr: Optional[float] = None
    skewness: Optional[float] = None
    unique_count: Optional[int] = None
    zero_count: Optional[int] = None
    negative_count: Optional[int] = None
    outlier_count: Optional[int] = None


class CategoricalStatistic(BaseModel):
    unique_values: Optional[int] = None
    cardinality: Optional[int] = None
    most_frequent_value: Optional[str] = None
    most_frequent_value_count: Optional[int] = None
    top_10_frequencies: List[Dict[str, Any]] = []
    rare_category_count: Optional[int] = None
    whitespace_inconsistencies: Optional[int] = None
    case_inconsistencies: Optional[int] = None


class DatetimeStatistic(BaseModel):
    min_date: Optional[str] = None
    max_date: Optional[str] = None
    invalid_date_count: Optional[int] = None
    date_format_inconsistencies: Optional[int] = None
    future_date_count: Optional[int] = None
    date_range_days: Optional[int] = None


class BooleanStatistic(BaseModel):
    true_count: Optional[int] = None
    false_count: Optional[int] = None
    missing_count: Optional[int] = None
    unexpected_category_count: Optional[int] = None


class ColumnProfileResponse(BaseModel):
    name: str
    original_type: str
    suggested_type: str
    semantic_type: str
    confidence: float
    explanation: str
    example_values: List[Any] = []
    null_count: int
    null_percentage: float
    unique_count: int
    non_null_count: int
    statistics: Dict[str, Any] = {}


class DatasetProfileExtended(BaseModel):
    dataset_id: str
    filename: str
    row_count: int
    column_count: int
    file_size_bytes: int
    file_extension: str
    total_missing_cells: int
    missing_percentage: float
    duplicate_row_count: int
    constant_columns: List[str] = []
    columns: List[ColumnProfileResponse]
    issue_count: int = 0
    risk_summary: Dict[str, int] = {}
    profiling_status: str = "complete"
    memory_usage_bytes: Optional[int] = None
    empty_row_count: int
    empty_column_count: int
    numeric_column_count: int
    categorical_column_count: int
    datetime_column_count: int
    boolean_column_count: int
    mixed_type_column_count: int
    mixed_type_columns: List[str] = []
    type_distribution: Dict[str, int] = {}


class QualityDimension(BaseModel):
    dimension: str
    score: Optional[float] = None
    weight: Optional[float] = None
    affected_records: int
    total_records: int
    details: List[str] = []


class QualityIssue(BaseModel):
    type: str
    count: int
    dimension: str


class QualityScoreResponse(BaseModel):
    overall_score: Optional[float] = None
    scored_dimensions: int
    total_cells: int
    total_rows: int
    total_columns: int
    dimensions: Dict[str, QualityDimension]
    issues: List[QualityIssue] = []
    weights: Dict[str, float] = {}
    note: str


class MissingValueColumn(BaseModel):
    column: str
    semantic_type: str
    missing_count: int
    missing_percentage: float
    missing_pattern: str
    related_columns: List[str] = []
    recommendation: Dict[str, Any]


class MissingValueAnalysisResponse(BaseModel):
    total_rows: int
    total_columns: int
    total_missing_cells: int
    overall_missing_percentage: float
    columns_with_missing: int
    columns: List[MissingValueColumn]
