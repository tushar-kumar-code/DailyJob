from typing import Optional
from dataclasses import dataclass

@dataclass
class SafetyReportModel:
    id: str
    userId: str
    userName: str
    reportType: str  # "sos" | "unsafe_workplace"
    jobId: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    locationName: Optional[str] = None
    emergencyContact: Optional[str] = None
    details: Optional[str] = None
    createdAt: Optional[str] = None
    status: str = "active"  # "active" | "addressed"
