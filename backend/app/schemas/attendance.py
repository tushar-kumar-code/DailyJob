from pydantic import BaseModel, Field
from typing import Optional

class CheckInRequest(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Device GPS latitude")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Device GPS longitude")
    locationName: Optional[str] = Field("GPS Verified", description="Worksite address label")

class CheckOutRequest(BaseModel):
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    notes: Optional[str] = None

class AttendanceResponse(BaseModel):
    success: bool = True
    applicationId: str
    status: str
    checkInTime: Optional[str] = None
    checkInLocation: Optional[str] = None
    checkOutTime: Optional[str] = None
    verifiedDistanceMeters: Optional[float] = None
    message: str = "Attendance recorded successfully"
