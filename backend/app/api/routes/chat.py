from fastapi import APIRouter, HTTPException
from ...schemas.chat import ChatRequest, ChatResponse
from .datasets import PROFILE_STORE, RECOMMENDATION_STORE, load_dataset_from_db_if_needed
from .execution import EXECUTION_RESULTS_STORE, load_cleaned_dataset_from_db_if_needed
from ...services.ai_chat import AIChatAssistant

router = APIRouter(prefix="/datasets", tags=["chat"])

CHAT_HISTORY_STORE = {}

@router.post("/{dataset_id}/chat", response_model=ChatResponse)
async def dataset_chat_enquire(dataset_id: str, body: ChatRequest):
    if dataset_id not in PROFILE_STORE:
        load_dataset_from_db_if_needed(dataset_id)
        if dataset_id not in PROFILE_STORE:
            raise HTTPException(status_code=404, detail="Dataset profile not found.")
        
    profile = PROFILE_STORE[dataset_id]
    recommendations = RECOMMENDATION_STORE.get(dataset_id, [])
    execution_result = EXECUTION_RESULTS_STORE.get(dataset_id, None)
    if not execution_result:
        load_cleaned_dataset_from_db_if_needed(dataset_id)
        execution_result = EXECUTION_RESULTS_STORE.get(dataset_id, None)
    
    history_dicts = [h.dict() for h in body.history] if body.history else []
    
    print(f"\n--- [AI Enquire Chat Incoming] ---")
    print(f"Dataset: {profile.get('filename')} (ID: {dataset_id})")
    print(f"User Message: {body.message}")
    print(f"History Length: {len(history_dicts)}")
    
    answer = AIChatAssistant.generate_chat_response(
        profile, recommendations, execution_result, body.message, history_dicts
    )
    
    print(f"Assistant Answer: {answer[:120]}...\n")
    
    # Store session conversation history
    if dataset_id not in CHAT_HISTORY_STORE:
        CHAT_HISTORY_STORE[dataset_id] = []
    CHAT_HISTORY_STORE[dataset_id].append({"role": "user", "content": body.message})
    CHAT_HISTORY_STORE[dataset_id].append({"role": "assistant", "content": answer})
    
    return {
        "response": answer,
        "dataset_id": dataset_id
    }

@router.get("/{dataset_id}/chat-history")
async def get_dataset_chat_history(dataset_id: str):
    return {
        "dataset_id": dataset_id,
        "history": CHAT_HISTORY_STORE.get(dataset_id, [])
    }
