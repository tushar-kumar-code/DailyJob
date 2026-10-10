from typing import Dict, Any, List, Optional
from fastapi import HTTPException, status
from ..repositories.application_repository import application_repo
from ..repositories.job_repository import job_repo
from ..repositories.notification_repository import notification_repo
from ..constants.application_status import ApplicationStatus, ALLOWED_TRANSITIONS
from ..utils.helpers import utc_now_iso

class ApplicationService:
    def apply_to_job(self, worker: Dict[str, Any], job_id: str, note: str = "") -> Dict[str, Any]:
        job = job_repo.get_by_id(job_id)
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

        # 1. Closed/completed/cancelled check
        if job.get("status") not in ("open", None):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This job is no longer accepting applications")

        # 2. Worker cannot apply to own job
        if job.get("employerId") == worker["uid"]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot apply to your own posted job")

        # 3. Duplicate apply prevention
        existing = application_repo.get_by_job_and_worker(job_id, worker["uid"])
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You have already applied to this job")

        worker_name = worker.get("username") or worker.get("name") or "Worker"

        new_app = {
            "jobId": job_id,
            "workerId": worker["uid"],
            "workerName": worker_name,
            "trade": job.get("tradeId", "general"),
            "wage": job.get("wage", 700),
            "status": ApplicationStatus.APPLIED.value,
            "note": note,
            "appliedAt": utc_now_iso(),
            "paymentStatus": "pending"
        }

        created = application_repo.create(new_app)
        job_repo.increment_workers_applied(job_id)

        # Notify Employer
        notification_repo.create({
            "userId": job["employerId"],
            "titleHi": "नया आवेदन मिला",
            "titleEn": "New Job Application Received",
            "messageHi": f"{worker_name} ने '{job.get('titleHi', '')}' के लिए आवेदन किया।",
            "messageEn": f"{worker_name} applied for '{job.get('titleEn', '')}'.",
            "time": "अभी",
            "linkHash": f"#/applicants/{job_id}"
        })

        return created

    def get_applicants_for_job(self, user: Dict[str, Any], job_id: str) -> List[Dict[str, Any]]:
        job = job_repo.get_by_id(job_id)
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

        # IDOR check: only job owner or admin can view applicants
        if job.get("employerId") != user["uid"] and user.get("role") != "admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: You do not own this job")

        return application_repo.list_by_job(job_id)

    def get_user_applications(self, worker_id: str) -> List[Dict[str, Any]]:
        return application_repo.list_by_worker(worker_id)

    def get_application_by_id(self, user: Dict[str, Any], app_id: str) -> Dict[str, Any]:
        app = application_repo.get_by_id(app_id)
        if not app:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

        job = job_repo.get_by_id(app["jobId"])
        # Only participating worker, employer or admin can view
        is_worker = app.get("workerId") == user["uid"]
        is_employer = job and job.get("employerId") == user["uid"]
        is_admin = user.get("role") == "admin"

        if not (is_worker or is_employer or is_admin):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this application")

        return app

    def update_application_status(self, user: Dict[str, Any], app_id: str, action: str, extra: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        app = application_repo.get_by_id(app_id)
        if not app:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

        job = job_repo.get_by_id(app["jobId"])
        current_status = ApplicationStatus(app["status"])
        is_worker = app.get("workerId") == user["uid"]
        is_employer = job and job.get("employerId") == user["uid"]
        is_admin = user.get("role") == "admin"

        # Action mapping
        if action == "select":
            if not (is_employer or is_admin):
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the employer can select applicants")
            target_status = ApplicationStatus.SELECTED
        elif action == "confirm":
            if not (is_worker or is_admin):
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the selected worker can confirm availability")
            target_status = ApplicationStatus.CONFIRMED
        elif action == "reject":
            if not (is_employer or is_admin):
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the employer can reject applicants")
            target_status = ApplicationStatus.REJECTED
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unrecognized status action '{action}'")

        # Controlled transition validation
        allowed = ALLOWED_TRANSITIONS.get(current_status, [])
        if target_status not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Illegal state transition from '{current_status.value}' to '{target_status.value}'"
            )

        updated = application_repo.update_status(app_id, target_status.value, extra)

        # Notify counterpart
        if target_status == ApplicationStatus.SELECTED:
            notification_repo.create({
                "userId": app["workerId"],
                "titleHi": "आपको काम के लिए चुना गया! 🎉",
                "titleEn": "You Were Selected! 🎉",
                "messageHi": f"नियोक्ता ने आपको '{job.get('titleHi', '')}' के लिए चुना है। पुष्टि करें।",
                "messageEn": f"Employer selected you for '{job.get('titleEn', '')}'. Please confirm.",
                "time": "अभी",
                "linkHash": "#/today-work"
            })
        elif target_status == ApplicationStatus.CONFIRMED:
            notification_repo.create({
                "userId": job["employerId"],
                "titleHi": "कामगार ने काम की पुष्टि की",
                "titleEn": "Worker Confirmed Availability",
                "messageHi": f"{app.get('workerName', 'Worker')} कार्यस्थल पर आने के लिए तैयार है।",
                "messageEn": f"{app.get('workerName', 'Worker')} confirmed availability.",
                "time": "अभी",
                "linkHash": "#/active-work"
            })

        return updated

application_service = ApplicationService()
