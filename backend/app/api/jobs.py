from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import Dict, Any, List, Optional
from ..core.dependencies import get_current_user, require_employer
from ..schemas.job import JobCreateRequest, JobUpdateRequest, JobResponse, JobListResponse
from ..services.job_service import job_service
from ..constants.trades import INITIAL_TRADES

router = APIRouter(tags=["Jobs"])

@router.get("/api/trades")
def list_available_trades():
    """Returns supported trade categories and minimum market wages."""
    return {
        "success": True,
        "trades": INITIAL_TRADES
    }

@router.get("/api/jobs")
def list_jobs(
    tradeId: Optional[str] = Query(None, description="Trade ID filter"),
    trade: Optional[str] = Query(None, description="Trade ID filter alias"),
    city: Optional[str] = Query(None, description="City filter"),
    searchQuery: Optional[str] = Query(None, description="Search keyword in title or location"),
    search: Optional[str] = Query(None, description="Search keyword alias"),
    minWage: Optional[int] = Query(None, description="Minimum daily wage threshold"),
    min_wage: Optional[int] = Query(None, description="Minimum daily wage alias"),
    maxDistance: Optional[float] = Query(None, description="Maximum distance in kilometers"),
    max_distance: Optional[float] = Query(None, description="Maximum distance alias"),
    dateFilter: Optional[str] = Query(None, description="today | tomorrow | all"),
    date: Optional[str] = Query(None, description="Date filter alias"),
    urgentOnly: Optional[bool] = Query(None, description="Filter only urgent jobs"),
    urgent: Optional[bool] = Query(None, description="Urgent filter alias"),
    beginnerFriendly: Optional[bool] = Query(None, description="Filter only beginner-friendly jobs")
):
    """
    Lists all active jobs matching search filters.
    """
    effective_trade = tradeId or trade
    effective_search = searchQuery or search
    effective_min_wage = minWage if minWage is not None else min_wage
    effective_max_dist = maxDistance if maxDistance is not None else max_distance
    effective_date = dateFilter or date
    effective_urgent = urgentOnly if urgentOnly is not None else urgent

    jobs = job_service.list_jobs(
        trade_id=effective_trade,
        city=city,
        search_query=effective_search,
        min_wage=effective_min_wage,
        max_distance=effective_max_dist,
        date_filter=effective_date,
        urgent_only=effective_urgent,
        beginner_friendly=beginnerFriendly
    )
    return jobs

@router.get("/api/jobs/{job_id}")
def get_job_by_id(job_id: str):
    """Returns complete specifications for a specific job."""
    job = job_service.get_job_by_id(job_id)
    return {
        "success": True,
        "job": job,
        **job
    }

@router.post("/api/jobs", status_code=status.HTTP_201_CREATED)
def create_job(
    req: JobCreateRequest,
    current_employer: Dict[str, Any] = Depends(require_employer)
):
    """
    Creates a new job posting. Only authenticated employers can post jobs.
    Employer ID is strictly bound to the authenticated user.
    """
    job = job_service.create_job(current_employer, req)
    return {
        "success": True,
        "message": "Job posted successfully.",
        "job": job,
        **job
    }

@router.get("/api/employer/jobs")
def get_employer_jobs(current_employer: Dict[str, Any] = Depends(require_employer)):
    """Fetches all jobs posted by the authenticated employer."""
    jobs = job_service.list_employer_jobs(current_employer["uid"])
    return {
        "success": True,
        "count": len(jobs),
        "jobs": jobs
    }

@router.patch("/api/jobs/{job_id}")
def update_job(
    job_id: str,
    req: JobUpdateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Updates job posting. Restricted to the job owner or admin."""
    updated = job_service.update_job(current_user, job_id, req)
    return {
        "success": True,
        "message": "Job updated successfully.",
        "job": updated,
        **updated
    }

@router.delete("/api/jobs/{job_id}")
def delete_job(
    job_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Deletes job posting. Restricted to the job owner or admin."""
    deleted = job_service.delete_job(current_user, job_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return {
        "success": True,
        "message": "Job deleted successfully."
    }
