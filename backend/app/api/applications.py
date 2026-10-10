from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, List
from ..core.dependencies import get_current_user, require_worker
from ..schemas.application import ApplyJobRequest, ApplicationStatusUpdateRequest, ApplicationListResponse
from ..services.application_service import application_service

router = APIRouter(tags=["Applications & Hiring"])

@router.post("/api/jobs/{job_id}/apply", status_code=status.HTTP_201_CREATED)
def apply_to_job(
    job_id: str,
    req: ApplyJobRequest,
    current_worker: Dict[str, Any] = Depends(require_worker)
):
    """
    Worker applies for a job posting.
    Prevents duplicate applications and applying to own job.
    """
    app = application_service.apply_to_job(current_worker, job_id, req.note or "")
    return {
        "success": True,
        "message": "Application submitted successfully.",
        "application": app,
        **app
    }

@router.get("/api/jobs/{job_id}/applicants")
def get_job_applicants(
    job_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Employer reviews candidate applications for a posted job.
    Guarded to job owner or admin.
    """
    applicants = application_service.get_applicants_for_job(current_user, job_id)
    return {
        "success": True,
        "count": len(applicants),
        "applicants": applicants
    }

@router.get("/api/user/applications")
def get_worker_applications(current_worker: Dict[str, Any] = Depends(require_worker)):
    """Worker views all their applications and current execution statuses."""
    apps = application_service.get_user_applications(current_worker["uid"])
    return {
        "success": True,
        "count": len(apps),
        "applications": apps
    }

@router.get("/api/applications/{application_id}")
def get_application_by_id(
    application_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Fetches details of a specific application."""
    app = application_service.get_application_by_id(current_user, application_id)
    return {
        "success": True,
        "application": app,
        **app
    }

@router.patch("/api/applications/{application_id}/status")
def update_application_status(
    application_id: str,
    req: ApplicationStatusUpdateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Executes controlled state transitions (e.g. employer selects worker, worker confirms availability).
    """
    updated = application_service.update_application_status(
        current_user,
        application_id,
        req.action,
        {"note": req.note} if req.note else None
    )
    return {
        "success": True,
        "message": f"Application status updated to '{updated['status']}'",
        "application": updated,
        **updated
    }
