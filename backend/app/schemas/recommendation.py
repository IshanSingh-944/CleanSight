from typing import List, Optional
from pydantic import BaseModel

class RecommendationResponse(BaseModel):
    action_id: str
    issue_type: str
    column: Optional[str] = None
    risk_level: str
    title: str
    description: str
    evidence: str
    affected_rows: int
    affected_percentage: float
    proposed_action: str
    rationale: str
    alternatives: List[str]
    requires_approval: bool
    execution_status: str

class RecommendationUpdateRequest(BaseModel):
    execution_status: str
