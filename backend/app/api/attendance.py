from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
from ..core.dependencies import get_current_user, require_worker
from ..schemas.attendance import CheckInRequest, CheckOutRequest, AttendanceResponse
from ..services.attendance_service import attendance_service

router = APIRouter(prefix="/api/applications", tags=["Attendance & Work Execution"])

@router.post("/{application_id}/check-in", response_model=AttendanceResponse)
def check_in_work(
    application_id: str,
    req: CheckInRequest,
    current_worker: Dict[str, Any] = Depends(require_worker)
):
    """
    Worker checks in at worksite with device GPS coordinates.
    Validates distance within proximity threshold before starting job.
    """
    res = attendance_service.check_in(
        current_worker,
        application_id,
        req.latitude,
        req.longitude,
        req.locationName
    )
    return AttendanceResponse(
        success=True,
        applicationId=application_id,
        status="started",
        checkInTime=res["checkInTime"],
        checkInLocation=res["application"].get("checkInLocation"),
        verifiedDistanceMeters=res["distanceMeters"],
        message="Worksite Check-In recorded successfully."
    )

@router.post("/{application_id}/check-out", response_model=AttendanceResponse)
def check_out_work(
    application_id: str,
    req: CheckOutRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Marks work shift as completed.
    """
    res = attendance_service.check_out(
        current_user,
        application_id,
        req.latitude,
        req.longitude,
        req.notes
    )
    return AttendanceResponse(
        success=True,
        applicationId=application_id,
        status="completed",
        checkOutTime=res["checkOutTime"],
        message="Work Check-Out recorded successfully."
    )
