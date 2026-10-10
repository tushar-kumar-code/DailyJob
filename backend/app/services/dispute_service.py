from typing import Dict, Any, List, Optional
from fastapi import HTTPException, status
from ..repositories.dispute_repository import dispute_repo
from ..repositories.job_repository import job_repo
from ..repositories.application_repository import application_repo

class DisputeService:
    def file_dispute(self, user: Dict[str, Any], job_id: str, reason: str, description: str, evidence: List[str]) -> Dict[str, Any]:
        job = job_repo.get_by_id(job_id)
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

        # Validate user is connected to job
        is_employer = job.get("employerId") == user["uid"]
        is_worker = False
        app = application_repo.get_by_job_and_worker(job_id, user["uid"])
        if app:
            is_worker = True

        if not (is_employer or is_worker or user.get("role") == "admin"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You are not a party involved in this job"
            )

        user_name = user.get("username") or user.get("name") or "User"
        user_role = "employer" if is_employer else "worker"

        dispute_data = {
            "jobId": job_id,
            "reporterId": user["uid"],
            "reporterName": user_name,
            "reporterRole": user_role,
            "reason": reason,
            "description": description,
            "status": "under_review",
            "evidence": evidence or []
        }

        return dispute_repo.create(dispute_data)

    def list_disputes(self, user: Dict[str, Any]) -> List[Dict[str, Any]]:
        if user.get("role") == "admin":
            return dispute_repo.list_all()
        return dispute_repo.list_by_user(user["uid"])

    def get_dispute_by_id(self, user: Dict[str, Any], dispute_id: str) -> Dict[str, Any]:
        disp = dispute_repo.get_by_id(dispute_id)
        if not disp:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dispute not found")
        if disp.get("reporterId") != user["uid"] and user.get("role") != "admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        return disp

dispute_service = DisputeService()
