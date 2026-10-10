from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from ..constants.application_status import ApplicationStatus

class ApplyJobRequest(BaseModel):
    note: Optional[str] = Field("", max_length=250, description="Optional application message")

class ApplicationStatusUpdateRequest(BaseModel):
    action: Optional[str] = Field(None, description="Allowed actions: select, confirm, checkin, checkout, pay, reject")
    status: Optional[str] = Field(None, description="Direct status target: selected, confirmed, rejected")
    note: Optional[str] = None
    location: Optional[str] = None

    def model_post_init(self, __context: Any) -> None:
        if not self.action and self.status:
            if self.status == "selected":
                self.action = "select"
            elif self.status == "confirmed":
                self.action = "confirm"
            elif self.status == "rejected":
                self.action = "reject"
            else:
                self.action = self.status

class ApplicationResponse(BaseModel):
    id: str
    jobId: str
    workerId: str
    workerName: str
    trade: str
    wage: int
    status: str
    note: Optional[str] = ""
    appliedAt: Optional[str] = None
    checkInTime: Optional[str] = None
    checkInLocation: Optional[str] = None
    checkOutTime: Optional[str] = None
    paymentStatus: str = "pending"
    paidAmount: Optional[int] = None
    paidAt: Optional[str] = None
    ratingGiven: Optional[int] = None
    job: Optional[Dict[str, Any]] = None
    worker: Optional[Dict[str, Any]] = None

class ApplicationListResponse(BaseModel):
    success: bool = True
    count: int
    applications: List[ApplicationResponse]
