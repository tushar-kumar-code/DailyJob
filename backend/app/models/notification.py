from typing import Optional
from dataclasses import dataclass

@dataclass
class NotificationModel:
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
