from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
from ..core.dependencies import get_current_user
from ..schemas.message import SendMessageRequest, MessageThreadResponse
from ..services.messaging_service import messaging_service

router = APIRouter(prefix="/api/messages", tags=["Messages"])

@router.get("/{job_id}", response_model=MessageThreadResponse)
def get_job_messages(
    job_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    thread = messaging_service.get_job_thread(current_user, job_id)
    return {
        "success": True,
        "jobId": thread["jobId"],
        "jobTitle": thread["jobTitle"],
        "conversation": thread["conversation"]
    }

@router.post("/{job_id}")
def send_message(
    job_id: str,
    payload: SendMessageRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    msg = messaging_service.send_message(current_user, job_id, payload.text)
    return {"success": True, "message": msg}
