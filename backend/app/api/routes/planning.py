from fastapi import APIRouter, HTTPException
from ...schemas.plan import PlanRequest, PlanResponse
from ...services.llm_planner import LLMPlanner
from .datasets import PROFILE_STORE, RECOMMENDATION_STORE, load_dataset_from_db_if_needed

router = APIRouter(prefix="/datasets", tags=["planning"])

@router.post("/{dataset_id}/plan", response_model=PlanResponse)
async def generate_dataset_plan(dataset_id: str, body: PlanRequest):
    if dataset_id not in PROFILE_STORE:
        load_dataset_from_db_if_needed(dataset_id)
        if dataset_id not in PROFILE_STORE:
            raise HTTPException(status_code=404, detail="Dataset profile not found.")
        
    profile = PROFILE_STORE[dataset_id]
    existing_recs = RECOMMENDATION_STORE.get(dataset_id, [])
    
    existing_issues = [
        {
            "issue_type": r["issue_type"],
            "column": r.get("column"),
            "evidence": r["evidence"],
            "affected_rows": r["affected_rows"],
            "affected_percentage": r["affected_percentage"]
        }
        for r in existing_recs
    ]
    
    objective = body.objective or "Prepare dataset for Exploratory Data Analysis"
    
    llm_recs = LLMPlanner.generate_plan(profile, existing_issues, objective)
    
    seen_ids = {r["action_id"] for r in existing_recs}
    added_count = 0
    
    for rec in llm_recs:
        if rec["action_id"] not in seen_ids:
            existing_recs.append(rec)
            seen_ids.add(rec["action_id"])
            added_count += 1
            
    RECOMMENDATION_STORE[dataset_id] = existing_recs
    
    return {
        "dataset_id": dataset_id,
        "objective": objective,
        "recommendations_generated": len(llm_recs),
        "recommendations": existing_recs,
        "source": "llm_hybrid_planner"
    }
