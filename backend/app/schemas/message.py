from pydantic import BaseModel, Field
from typing import List, Optional

class SendMessageRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000, description="Message content")

class MessageItem(BaseModel):
    id: str
    jobId: str
    senderId: str
    senderName: str
    senderRole: str
    text: str
    time: str
    createdAt: Optional[str] = None
    read: bool = False

class MessageThreadResponse(BaseModel):
    success: bool = True
    jobId: str
    jobTitle: str
    conversation: List[MessageItem]
