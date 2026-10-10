from typing import Optional
from dataclasses import dataclass

@dataclass
class MessageModel:
    id: str
    jobId: str
    senderId: str
    senderName: str
    senderRole: str  # "worker" | "employer"
    text: str
    time: str
    createdAt: Optional[str] = None
    read: bool = False
