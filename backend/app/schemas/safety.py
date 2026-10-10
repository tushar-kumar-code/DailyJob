from pydantic import BaseModel, Field
from typing import Optional, List

class SOSAlertRequest(BaseModel):
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    locationName: Optional[str] = "Current Worksite"
    emergencyContact: Optional[str] = None

class SafetyReportCreateRequest(BaseModel):
    jobId: Optional[str] = None
    details: str = Field(..., min_length=5, description="Safety issue details")
    locationName: Optional[str] = None

class SafetyReportResponse(BaseModel):
    id: str
    userId: str
    userName: str
    reportType: str
    jobId: Optional[str] = None
    locationName: Optional[str] = None
    status: str
    createdAt: Optional[str] = None
    message: str = "Safety alert logged"
