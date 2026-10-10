from typing import Optional
from dataclasses import dataclass

@dataclass
class AttendanceRecordModel:
    id: str
    applicationId: str
    workerId: str
    jobId: str
    checkInTime: str
    checkInLocation: str
    checkInLatitude: float
    checkInLongitude: float
    checkOutTime: Optional[str] = None
    checkOutLatitude: Optional[float] = None
    checkOutLongitude: Optional[float] = None
    verifiedDistanceMeters: float = 0.0
    createdAt: Optional[str] = None
