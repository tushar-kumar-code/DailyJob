from typing import Optional
from dataclasses import dataclass
from ..constants.application_status import ApplicationStatus

@dataclass
class ApplicationModel:
    id: str
    jobId: str
    workerId: str
    workerName: str
    trade: str
    wage: int
    status: ApplicationStatus = ApplicationStatus.APPLIED
    note: str = ""
    appliedAt: Optional[str] = None
    checkInTime: Optional[str] = None
    checkInLocation: Optional[str] = None
    checkOutTime: Optional[str] = None
    checkOutLocation: Optional[str] = None
    paymentStatus: str = "pending"  # "pending" | "paid"
    paidAmount: Optional[int] = None
    paidAt: Optional[str] = None
    ratingGiven: Optional[int] = None
