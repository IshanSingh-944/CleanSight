from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ChatMessage(BaseModel):
    role: str = Field(..., description="user or assistant")
    content: str = Field(..., description="Message text")

class ChatRequest(BaseModel):
    message: str = Field(..., description="Current user question")
    history: Optional[List[ChatMessage]] = Field(default=[], description="Previous conversation turns")

class ChatResponse(BaseModel):
    response: str = Field(..., description="Assistant reply")
    dataset_id: str
