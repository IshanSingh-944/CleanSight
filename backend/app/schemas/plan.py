from typing import List, Optional
from pydantic import BaseModel

class PlanRequest(BaseModel):
    objective: Optional[str] = "Prepare dataset for Exploratory Data Analysis"
    planning_options: Optional[dict] = {}

class PlanResponse(BaseModel):
    dataset_id: str
    objective: str
    recommendations_generated: int
    recommendations: List[dict]
    source: str
