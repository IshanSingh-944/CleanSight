"""Pydantic response models for explainable recommendations."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict


class RecommendationEvidence(BaseModel):
    """Deterministic, dataset-grounded evidence for a recommendation."""

    model_config = ConfigDict(extra="allow")

    issue_type: str
    column: Optional[str] = None
    affected_rows: int = 0
    affected_percentage: float = 0.0


class ExplainableRecommendation(BaseModel):
    """A single explainable cleaning recommendation."""

    model_config = ConfigDict(extra="allow")

    action_id: str
    issue_type: str
    affected_columns: List[str] = []
    affected_rows: int = 0
    affected_percentage: float = 0.0
    current_problem: str
    supporting_evidence: RecommendationEvidence
    proposed_cleaning_operation: str
    explanation: str
    alternative_solutions: List[str] = []
    expected_impact: Dict[str, Any] = {}
    potential_side_effects: str = ""
    confidence: float = 0.0
    risk_level: str = "medium"
    approval_required: bool = True
    validation_checks: List[str] = []
    execution_status: str = "pending"


class ImpactPreview(BaseModel):
    """Before/after impact estimate for executing recommendations."""

    model_config = ConfigDict(extra="allow")

    original_row_count: int
    final_row_count: int
    original_column_count: int
    final_column_count: int
    original_missing_cells: int
    final_missing_cells: int
    original_duplicate_rows: int
    estimated_row_change: int
    estimated_column_change: int
    estimated_missing_change: int
    estimated_duplicate_reduction: int
    per_action: List[Dict[str, Any]] = []
    note: str = ""


class ExplainRecommendationsResponse(BaseModel):
    """Response for GET /datasets/{dataset_id}/recommendations/explain."""

    dataset_id: str
    recommendations: List[ExplainableRecommendation] = []
    impact_preview: ImpactPreview
    total: int
    note: str = (
        "Every recommendation is grounded in deterministic profiling evidence. "
        "The LLM may explain results but never overrides validation or executes code."
    )


class RecommendationExplainRequest(BaseModel):
    """Request body for POST /datasets/{dataset_id}/recommendations/explain."""

    question: str
    action_id: Optional[str] = None


class RecommendationExplainResponse(BaseModel):
    """Response for AI Enquire explain questions."""

    question: str
    answer: str
    evidence: Dict[str, Any] = {}
    related_columns: List[str] = []
    risk_level: str = ""
    requires_approval: bool = False
