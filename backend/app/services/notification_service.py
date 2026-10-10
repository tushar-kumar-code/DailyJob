from typing import Dict, Any, List
from fastapi import HTTPException, status
from ..repositories.notification_repository import notification_repo

class NotificationService:
    def get_user_notifications(self, user_id: str) -> Dict[str, Any]:
        notifs = notification_repo.list_by_user(user_id)
        unread = sum(1 for n in notifs if not n.get("read"))
        return {
            "unreadCount": unread,
            "notifications": notifs
        }

    def mark_read(self, user_id: str, notif_id: str) -> bool:
        return notification_repo.mark_as_read(notif_id)

    def mark_all_read(self, user_id: str) -> int:
        return notification_repo.mark_all_as_read(user_id)

notification_service = NotificationService()
