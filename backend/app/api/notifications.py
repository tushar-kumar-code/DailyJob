from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
from ..core.dependencies import get_current_user
from ..schemas.notification import NotificationListResponse
from ..services.notification_service import notification_service

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

@router.get("", response_model=NotificationListResponse)
def get_user_notifications(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    data = notification_service.get_user_notifications(current_user["uid"])
    return {
        "success": True,
        "unreadCount": data["unreadCount"],
        "notifications": data["notifications"]
    }

@router.patch("/{notification_id}/read")
def mark_notification_read(
    notification_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    notification_service.mark_read(current_user["uid"], notification_id)
    return {"success": True, "message": "Marked as read"}

@router.patch("/read-all")
def mark_all_notifications_read(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    count = notification_service.mark_all_read(current_user["uid"])
    return {"success": True, "markedCount": count}
