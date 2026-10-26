from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class ColumnProfile(BaseModel):
    name: str
    inferred_type: str
    non_null_count: int
    missing_count: int
    missing_percentage: float
    unique_count: int
    min_val: Optional[Any] = None
    max_val: Optional[Any] = None
    mean_val: Optional[Any] = None
    median_val: Optional[Any] = None
    sample_values: List[Any] = []
    detected_issue_count: int = 0

class DatasetProfile(BaseModel):
    dataset_id: str
    filename: str
    row_count: int
    column_count: int
    file_size_bytes: int
    file_extension: str
    total_missing_cells: int
    missing_percentage: float
    duplicate_row_count: int
    constant_columns: List[str]
    columns: List[ColumnProfile]
    issue_count: int
    risk_summary: Dict[str, int]
    profiling_status: str
