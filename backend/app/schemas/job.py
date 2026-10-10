from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from ..constants.job_status import JobStatus

class JobCreateRequest(BaseModel):
    tradeId: str = Field(..., description="Trade ID e.g. electrician, helper, plumber")
    titleHi: Optional[str] = Field(None, description="Hindi title")
    titleEn: Optional[str] = Field(None, description="English title")
    wage: int = Field(..., gt=0, description="Daily wage amount in INR")
    wageUnit: str = Field("day", description="Wage unit: day or hour")
    workersNeeded: int = Field(1, ge=1, le=50)
    city: str = Field("Raipur", description="City name")
    locationName: Optional[str] = Field(None, description="Area / Landmark")
    location: Optional[str] = Field(None, description="Area / Landmark alias")
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    date: str = Field("आज (Today)", description="Date label")
    timeSlot: str = Field("9:00 AM – 5:00 PM", description="Time slot")
    urgent: bool = Field(False)
    beginnerFriendly: bool = Field(False)
    toolsProvided: Optional[str] = Field("साइट पर उपलब्ध")
    safetyProvided: Optional[str] = Field("सुरक्षा उपकरण उपलब्ध")
    paymentMode: Optional[str] = Field("काम समाप्ति पर तुरंत भुगतान")
    cancellationPolicy: Optional[str] = Field("2 घंटे पहले सूचित करना आवश्यक")
    description: Optional[str] = Field(None)
    descriptionHi: Optional[str] = Field(None)
    descriptionEn: Optional[str] = Field(None)

    def model_post_init(self, __context: Any) -> None:
        if not self.locationName:
            self.locationName = self.location or "Worksite"
        if not self.descriptionHi and self.description:
            self.descriptionHi = self.description

class JobUpdateRequest(BaseModel):
    titleHi: Optional[str] = None
    titleEn: Optional[str] = None
    wage: Optional[int] = None
    workersNeeded: Optional[int] = None
    status: Optional[JobStatus] = None
    urgent: Optional[bool] = None
    beginnerFriendly: Optional[bool] = None
    descriptionHi: Optional[str] = None

class JobResponse(BaseModel):
    id: str
    tradeId: str
    titleHi: str
    titleEn: str
    employerId: str
    employerName: str
    employerVerified: bool = True
    employerRating: float = 4.8
    employerHires: int = 25
    cancellationRate: str = "1%"
    locationName: str
    city: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    distanceKm: float = 2.5
    travelEstimate: int = 80
    wage: int
    wageUnit: str = "day"
    date: str
    timeSlot: str
    workersNeeded: int
    workersApplied: int = 0
    status: str
    urgent: bool = False
    beginnerFriendly: bool = False
    toolsProvided: str = ""
    safetyProvided: str = ""
    paymentMode: str = ""
    cancellationPolicy: str = ""
    descriptionHi: str = ""
    descriptionEn: str = ""
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

class JobListResponse(BaseModel):
    success: bool = True
    count: int
    jobs: List[JobResponse]
