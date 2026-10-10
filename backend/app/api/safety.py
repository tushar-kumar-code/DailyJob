from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, List
from ..core.dependencies import get_current_user
from ..schemas.safety import SOSAlertRequest, SafetyReportCreateRequest, SafetyReportResponse
from ..services.safety_service import safety_service

router = APIRouter(prefix="/api/safety", tags=["Safety"])

@router.post("/sos")
def trigger_sos(
    payload: SOSAlertRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    res = safety_service.trigger_sos(
        user=current_user,
        lat=payload.latitude,
        lng=payload.longitude,
        location_name=payload.locationName,
        emergency_contact=payload.emergencyContact
    )
    return {"success": True, **res}

@router.post("/report", response_model=SafetyReportResponse)
def file_safety_report(
    payload: SafetyReportCreateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    report = safety_service.file_report(
        user=current_user,
        details=payload.details,
        job_id=payload.jobId,
        loc_name=payload.locationName
    )
    return report

@router.get("/reports")
def list_safety_reports(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    reports = safety_service.list_reports(current_user)
    return {"success": True, "reports": reports}
