from typing import Dict, Any, List, Optional
from fastapi import HTTPException, status
from ..repositories.safety_repository import safety_repo

class SafetyService:
    def trigger_sos(self, user: Dict[str, Any], lat: Optional[float] = None, lng: Optional[float] = None, location_name: Optional[str] = None, emergency_contact: Optional[str] = None) -> Dict[str, Any]:
        user_name = user.get("username") or user.get("name") or "User"
        report = {
            "userId": user["uid"],
            "userName": user_name,
            "reportType": "sos",
            "latitude": lat,
            "longitude": lng,
            "locationName": location_name or "Current Location",
            "emergencyContact": emergency_contact or user.get("emergencyContact"),
            "status": "active"
        }
        created = safety_repo.create(report)
        return {
            "id": created["id"],
            "status": "dispatched",
            "message": f"SOS emergency alert dispatched to registered contacts and support helpline."
        }

    def file_report(self, user: Dict[str, Any], details: str, job_id: Optional[str] = None, loc_name: Optional[str] = None) -> Dict[str, Any]:
        user_name = user.get("username") or user.get("name") or "User"
        report = {
            "userId": user["uid"],
            "userName": user_name,
            "reportType": "unsafe_workplace",
            "jobId": job_id,
            "details": details,
            "locationName": loc_name,
            "status": "active"
        }
        return safety_repo.create(report)

    def list_reports(self, user: Dict[str, Any]) -> List[Dict[str, Any]]:
        if user.get("role") == "admin":
            return safety_repo.list_all()
        return safety_repo.list_by_user(user["uid"])

safety_service = SafetyService()
