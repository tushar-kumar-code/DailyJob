from typing import Dict, Any, Optional
from datetime import datetime
from fastapi import HTTPException, status
from ..repositories.application_repository import application_repo
from ..repositories.job_repository import job_repo
from ..repositories.notification_repository import notification_repo
from ..utils.distance import haversine_distance_meters, is_within_proximity
from ..constants.application_status import ApplicationStatus
from ..core.config import settings

class AttendanceService:
    def check_in(self, worker: Dict[str, Any], app_id: str, lat: float, lng: float, loc_name: Optional[str] = None) -> Dict[str, Any]:
        app = application_repo.get_by_id(app_id)
        if not app:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

        if app.get("workerId") != worker["uid"] and worker.get("role") != "admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the assigned worker can check in")

        if app.get("status") != ApplicationStatus.CONFIRMED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot check in: Application is in '{app.get('status')}' state. Must be 'confirmed'."
            )

        job = job_repo.get_by_id(app["jobId"])
        dist_meters = 0.0
        # If job coordinates are available, perform proximity check
        if job and job.get("latitude") and job.get("longitude"):
            within_range, dist_meters = is_within_proximity(
                lat, lng,
                job["latitude"], job["longitude"],
                max_meters=settings.ATTENDANCE_PROXIMITY_METERS
            )
            if not within_range:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Check-In failed: Too far from worksite. Device GPS is {int(dist_meters)}m away (allowed radius: {int(settings.ATTENDANCE_PROXIMITY_METERS)}m)."
                )

        now = datetime.now()
        time_str = now.strftime("%I:%M %p")
        location_desc = loc_name or f"{job.get('locationName', 'Worksite')} (GPS Match: {int(dist_meters)}m)"

        updated = application_repo.update_status(app_id, ApplicationStatus.STARTED.value, {
            "checkInTime": time_str,
            "checkInLocation": location_desc,
            "checkInLatitude": lat,
            "checkInLongitude": lng
        })

        # Notify employer
        if job and job.get("employerId"):
            notification_repo.create({
                "userId": job["employerId"],
                "titleHi": "कामगार ने Check-In किया",
                "titleEn": "Worker Checked In",
                "messageHi": f"{app.get('workerName', 'कामगार')} ने {time_str} पर कार्यस्थल पर चेक-इन किया।",
                "messageEn": f"{app.get('workerName', 'Worker')} checked in at {time_str}.",
                "time": "अभी",
                "linkHash": "#/active-work"
            })

        return {
            "application": updated,
            "distanceMeters": dist_meters,
            "checkInTime": time_str
        }

    def check_out(self, user: Dict[str, Any], app_id: str, lat: Optional[float] = None, lng: Optional[float] = None, notes: Optional[str] = None) -> Dict[str, Any]:
        app = application_repo.get_by_id(app_id)
        if not app:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

        job = job_repo.get_by_id(app["jobId"])
        is_worker = app.get("workerId") == user["uid"]
        is_employer = job and job.get("employerId") == user["uid"]
        is_admin = user.get("role") == "admin"

        if not (is_worker or is_employer or is_admin):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

        if app.get("status") != ApplicationStatus.STARTED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot check out: Work has not been started. Current status: '{app.get('status')}'"
            )

        now = datetime.now()
        time_str = now.strftime("%I:%M %p")

        updated = application_repo.update_status(app_id, ApplicationStatus.COMPLETED.value, {
            "checkOutTime": time_str,
            "checkOutLatitude": lat,
            "checkOutLongitude": lng
        })

        # Notify counterpart
        target_uid = job["employerId"] if is_worker else app["workerId"]
        notification_repo.create({
            "userId": target_uid,
            "titleHi": "काम समाप्त (Check-Out दर्ज हुआ)",
            "titleEn": "Work Completed (Check-Out Recorded)",
            "messageHi": f"आज का कार्य {time_str} पर समाप्त मार्क किया गया। भुगतान जारी करें।",
            "messageEn": f"Work marked completed at {time_str}. Please release payment.",
            "time": "अभी",
            "linkHash": "#/active-work"
        })

        return {
            "application": updated,
            "checkOutTime": time_str
        }

attendance_service = AttendanceService()
