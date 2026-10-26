from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict

class ExecutionRequest(BaseModel):
    approved_action_ids: List[str] = Field(..., description="List of explicit approved action IDs to execute")
    parameters: Optional[Dict[str, Any]] = Field(default=None, description="Optional per-action configuration overrides")

class ExecutionAuditItem(BaseModel):
    action_id: str
    issue_type: str
    column: Optional[str] = None
    title: str
    status: str # "success", "failed", "blocked", "skipped"
    risk_level: str
    message: str
    rows_affected: int = 0

class ExecutionResultResponse(BaseModel):
    dataset_id: str
    execution_id: str
    status: str # "success", "partial", "failed"
    original_row_count: int
    final_row_count: int
    original_column_count: int
    final_column_count: int
    total_missing_before: int
    total_missing_after: int
    duplicate_rows_before: int
    duplicate_rows_after: int
    audit_log: List[ExecutionAuditItem]
    preview_rows: List[Dict[str, Any]]
    column_profiles_after: List[Dict[str, Any]]
    message: str
