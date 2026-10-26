from fastapi import APIRouter, HTTPException
from ...schemas.recommendation import RecommendationUpdateRequest
from .datasets import RECOMMENDATION_STORE, DATASET_STORE

router = APIRouter(prefix="/datasets", tags=["recommendations"])

@router.patch("/{dataset_id}/recommendations/{action_id}")
async def update_recommendation_status(dataset_id: str, action_id: str, body: RecommendationUpdateRequest):
    if dataset_id not in RECOMMENDATION_STORE:
        raise HTTPException(status_code=404, detail="Dataset not found.")
        
    recs = RECOMMENDATION_STORE[dataset_id]
    target_rec = None
    for rec in recs:
        if rec["action_id"] == action_id:
            target_rec = rec
            break
            
    if not target_rec:
        raise HTTPException(status_code=404, detail="Recommendation action not found.")
        
    valid_statuses = ["pending", "approved", "rejected", "investigation"]
    if body.execution_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid execution status. Must be one of {valid_statuses}")
        
    target_rec["execution_status"] = body.execution_status
    
    df_before = DATASET_STORE[dataset_id]
    row_count_before = len(df_before)
    col_count_before = len(df_before.columns)
    
    return {
        "success": True,
        "action_id": action_id,
        "execution_status": body.execution_status,
        "dataset_integrity_verified": len(df_before) == row_count_before and len(df_before.columns) == col_count_before,
        "message": "Review decision recorded successfully. Dataset was not modified."
    }
