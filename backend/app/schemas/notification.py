from pydantic import BaseModel
from typing import List, Optional

class NotificationItem(BaseModel):
    id: str
    userId: str
    titleHi: str
    titleEn: str
    messageHi: str
    messageEn: str
    time: str
    read: bool = False
    linkHash: str = ""
    createdAt: Optional[str] = None

class NotificationListResponse(BaseModel):
    success: bool = True
    unreadCount: int = 0
    notifications: List[NotificationItem]
