from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, List
from ..core.dependencies import get_current_user
from ..repositories.bookmark_repository import bookmark_repo
from ..repositories.job_repository import job_repo

router = APIRouter(tags=["Bookmarks"])

@router.post("/api/jobs/{job_id}/bookmark")
def add_bookmark(
    job_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    job = job_repo.get_by_id(job_id)
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    
    bookmark_repo.add_bookmark(current_user["uid"], job_id)
    return {"success": True, "message": "Job bookmarked", "jobId": job_id}

@router.delete("/api/jobs/{job_id}/bookmark")
def remove_bookmark(
    job_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    bookmark_repo.remove_bookmark(current_user["uid"], job_id)
    return {"success": True, "message": "Bookmark removed", "jobId": job_id}

@router.get("/api/user/saved-jobs")
def get_saved_jobs(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    job_ids = bookmark_repo.get_user_bookmarks(current_user["uid"])
    saved_jobs = []
    for jid in job_ids:
        job = job_repo.get_by_id(jid)
        if job:
            saved_jobs.append(job)
    return {"success": True, "jobs": saved_jobs, "count": len(saved_jobs)}
