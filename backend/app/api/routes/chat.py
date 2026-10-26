from fastapi import APIRouter, HTTPException
from ...schemas.chat import ChatRequest, ChatResponse
from .datasets import PROFILE_STORE, RECOMMENDATION_STORE
from .execution import EXECUTION_RESULTS_STORE
from ...services.ai_chat import AIChatAssistant

router = APIRouter(prefix="/datasets", tags=["chat"])

@router.post("/{dataset_id}/chat", response_model=ChatResponse)
async def dataset_chat_enquire(dataset_id: str, body: ChatRequest):
    if dataset_id not in PROFILE_STORE:
        raise HTTPException(status_code=404, detail="Dataset profile not found.")
        
    profile = PROFILE_STORE[dataset_id]
    recommendations = RECOMMENDATION_STORE.get(dataset_id, [])
    execution_result = EXECUTION_RESULTS_STORE.get(dataset_id, None)
    
    history_dicts = [h.dict() for h in body.history] if body.history else []
    
    answer = AIChatAssistant.generate_chat_response(
        profile, recommendations, execution_result, body.message, history_dicts
    )
    
    return {
        "response": answer,
        "dataset_id": dataset_id
    }
