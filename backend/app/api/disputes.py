from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, List
from ..core.dependencies import get_current_user
from ..schemas.dispute import DisputeCreateRequest, DisputeResponse, DisputeListResponse
from ..services.dispute_service import dispute_service

router = APIRouter(prefix="/api/disputes", tags=["Disputes"])

@router.post("", response_model=DisputeResponse)
def create_dispute(
    payload: DisputeCreateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    dispute = dispute_service.file_dispute(
        user=current_user,
        job_id=payload.jobId,
        reason=payload.reason,
        description=payload.description,
        evidence=payload.evidence or []
    )
    return dispute

@router.get("", response_model=DisputeListResponse)
def list_disputes(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    disputes = dispute_service.list_disputes(current_user)
    return {
        "success": True,
        "disputes": disputes
    }

@router.get("/{dispute_id}", response_model=DisputeResponse)
def get_dispute(
    dispute_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    return dispute_service.get_dispute_by_id(current_user, dispute_id)
