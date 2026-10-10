from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from ..core.dependencies import require_admin
from ..repositories.job_repository import job_repo
from ..repositories.user_repository import user_repo
from ..repositories.application_repository import application_repo
from ..repositories.dispute_repository import dispute_repo
from ..repositories.skill_repository import skill_repo

router = APIRouter(prefix="/api/admin", tags=["Admin"])

class AdminDisputeUpdateRequest(BaseModel):
    status: str
    adminNotes: Optional[str] = None

@router.get("/metrics")
def get_system_metrics(admin: Dict[str, Any] = Depends(require_admin)):
    jobs = job_repo.list_all()
    disputes = dispute_repo.list_all()
    
    return {
        "success": True,
        "metrics": {
            "totalJobs": len(jobs),
            "openJobs": sum(1 for j in jobs if j.get("status") == "open"),
            "completedJobs": sum(1 for j in jobs if j.get("status") == "completed"),
            "totalDisputes": len(disputes),
            "pendingDisputes": sum(1 for d in disputes if d.get("status") in ["under_review", "pending"]),
            "platformUptime": "99.9%"
        }
    }

@router.get("/disputes")
def get_all_disputes(admin: Dict[str, Any] = Depends(require_admin)):
    disputes = dispute_repo.list_all()
    return {"success": True, "disputes": disputes}

@router.patch("/disputes/{dispute_id}")
def update_dispute(
    dispute_id: str,
    payload: AdminDisputeUpdateRequest,
    admin: Dict[str, Any] = Depends(require_admin)
):
    updated = dispute_repo.update_status(
        dispute_id=dispute_id,
        new_status=payload.status,
        admin_notes=payload.adminNotes
    )
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dispute not found")
    return {"success": True, "dispute": updated}
