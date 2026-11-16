"""Pydantic response models for cross-column intelligence endpoints."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, ConfigDict


class IntelligenceFinding(BaseModel):
    """A single cross-column intelligence finding."""

    model_config = ConfigDict(extra="allow")

    issue_type: str = Field(..., description="Type of intelligence finding.")
    affected_columns: List[str] = Field(..., description="Columns involved.")
    affected_rows: int = Field(..., description="Number of affected rows (0 for relationship-level).")
    severity: str = Field(..., description="low | medium | high")
    evidence: Dict[str, Any] = Field(..., description="Structured supporting evidence.")
    explanation: str = Field(..., description="Human-readable explanation.")
    suggested_action: str = Field(..., description="Recommended next step.")
    confidence: float = Field(..., description="Confidence score 0.0-1.0.")


class CrossColumnInsightsResponse(BaseModel):
    """Response for GET /datasets/{dataset_id}/intelligence."""

    dataset_id: str
    column_count: int
    row_count: int
    relationships: List[IntelligenceFinding] = Field(
        default=[], description="Column relationship findings."
    )
    conditional_missingness: List[IntelligenceFinding] = Field(
        default=[], description="Conditional missingness findings."
    )
    business_rule_violations: List[IntelligenceFinding] = Field(
        default=[], description="Business-rule inconsistency findings."
    )
    anomalies: List[IntelligenceFinding] = Field(
        default=[], description="Anomaly detection findings."
    )
    total_findings: int
    note: str = Field(
        default=(
            "All findings are deterministic and evidence-based. "
            "No LLM is used as the primary detection mechanism."
        )
    )


class BusinessRuleDefinition(BaseModel):
    """A user-configurable business rule."""

    rule_id: str
    name: str
    description: str
    rule_type: str = Field(..., description="deterministic | statistical | review")
    columns: List[str]
    severity: str = "medium"
    explanation: Optional[str] = None
    suggested_action: Optional[str] = None


class BusinessRuleEvaluationResponse(BaseModel):
    """Response for evaluating business rules against a dataset."""

    dataset_id: str
    rules_evaluated: int
    violations: List[BusinessRuleDefinition] = Field(
        default=[], description="Rules that were violated."
    )
    violation_details: List[Dict[str, Any]] = Field(default=[], description="Per-rule results.")
