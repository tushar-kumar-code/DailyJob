from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from ..constants.job_status import JobStatus

class JobCreateRequest(BaseModel):
    tradeId: str = Field(..., description="Trade ID e.g. electrician, helper, plumber, other")
    customTradeTitle: Optional[str] = Field(None, description="Custom trade title when tradeId is other")
    titleHi: Optional[str] = Field(None, description="Hindi title")
    titleEn: Optional[str] = Field(None, description="English title")
    wage: int = Field(..., gt=0, description="Daily wage amount in INR")
    wageUnit: str = Field("day", description="Wage unit: day, hour, week, month, task")
    paymentTiming: Optional[str] = Field(None, description="daily_end, completion, weekly, monthly, advance_completion")
    paymentTerms: Optional[str] = Field(None, description="Additional payment terms / notes")
    workersNeeded: int = Field(1, ge=1, le=500)
    city: str = Field("Raipur", description="City name")
    locationName: Optional[str] = Field(None, description="Area / Landmark")
    location: Optional[str] = Field(None, description="Area / Landmark alias")
    landmark: Optional[str] = Field(None, description="Landmark / Directions")
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    date: str = Field("आज (Today)", description="Date label")
    startDate: Optional[str] = Field(None, description="Start date")
    endDate: Optional[str] = Field(None, description="End date")
    durationDays: Optional[int] = Field(None, description="Duration in days")
    durationText: Optional[str] = Field(None, description="Readable duration e.g. 3 दिन, लगातार")
    assignmentType: Optional[str] = Field(None, description="one_day, temporary, recurring, ongoing")
    timeSlot: str = Field("9:00 AM – 5:00 PM", description="Time slot")
    breakIncluded: Optional[str] = Field(None, description="Break details")
    toolsResponsibility: Optional[str] = Field(None, description="employer, worker, both")
    toolsProvided: Optional[str] = Field("साइट पर उपलब्ध")
    foodProvided: Optional[str] = Field(None, description="Food provision details")
    travelProvided: Optional[str] = Field(None, description="Travel allowance details")
    safetyEquipment: Optional[str] = Field(None, description="Safety gear provided")
    safetyProvided: Optional[str] = Field("सुरक्षा उपकरण उपलब्ध")
    paymentMode: Optional[str] = Field("काम समाप्ति पर तुरंत भुगतान")
    cancellationPolicy: Optional[str] = Field("2 घंटे पहले सूचित करना आवश्यक")
    specialConditions: Optional[str] = Field(None, description="Special work conditions")
    estimatedTotal: Optional[int] = Field(None, description="Calculated estimated total")
    urgent: bool = Field(False)
    beginnerFriendly: bool = Field(False)
    description: Optional[str] = Field(None)
    descriptionHi: Optional[str] = Field(None)
    descriptionEn: Optional[str] = Field(None)

    def model_post_init(self, __context: Any) -> None:
        if not self.locationName:
            self.locationName = self.location or "Worksite"
        if not self.descriptionHi and self.description:
            self.descriptionHi = self.description
        if self.toolsResponsibility and (not self.toolsProvided or self.toolsProvided == "साइट पर उपलब्ध"):
            resp_map = {
                "employer": "काम देने वाला उपलब्ध कराएगा",
                "worker": "काम करने वाला अपना लाएगा",
                "both": "दोनों मिलकर / जो उपलब्ध हो"
            }
            self.toolsProvided = resp_map.get(self.toolsResponsibility, self.toolsResponsibility)
        if self.safetyEquipment and (not self.safetyProvided or self.safetyProvided == "सुरक्षा उपकरण उपलब्ध"):
            self.safetyProvided = self.safetyEquipment
        if self.paymentTiming and (not self.paymentMode or self.paymentMode == "काम समाप्ति पर तुरंत भुगतान"):
            timing_map = {
                "daily_end": "रोज काम खत्म होने पर तुरंत भुगतान",
                "completion": "काम पूरा होने पर एकमुश्त भुगतान",
                "weekly": "हर हफ्ते भुगतान",
                "monthly": "महीने के अंत में भुगतान",
                "advance_completion": "आधा एडवांस + आधा काम खत्म होने पर"
            }
            self.paymentMode = timing_map.get(self.paymentTiming, self.paymentTiming)

class JobUpdateRequest(BaseModel):
    titleHi: Optional[str] = None
    titleEn: Optional[str] = None
    wage: Optional[int] = None
    wageUnit: Optional[str] = None
    workersNeeded: Optional[int] = None
    status: Optional[JobStatus] = None
    urgent: Optional[bool] = None
    beginnerFriendly: Optional[bool] = None
    descriptionHi: Optional[str] = None

class JobResponse(BaseModel):
    id: str
    tradeId: str
    customTradeTitle: Optional[str] = None
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
    landmark: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    distanceKm: float = 2.5
    travelEstimate: int = 80
    wage: int
    wageUnit: str = "day"
    paymentTiming: Optional[str] = None
    paymentTerms: Optional[str] = None
    date: str
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    durationDays: Optional[int] = None
    durationText: Optional[str] = None
    assignmentType: Optional[str] = None
    timeSlot: str
    breakIncluded: Optional[str] = None
    workersNeeded: int
    workersApplied: int = 0
    status: str
    bookedWorkerId: Optional[str] = None
    bookedWorkerName: Optional[str] = None
    urgent: bool = False
    beginnerFriendly: bool = False
    toolsResponsibility: Optional[str] = None
    toolsProvided: str = ""
    foodProvided: Optional[str] = None
    travelProvided: Optional[str] = None
    safetyEquipment: Optional[str] = None
    safetyProvided: str = ""
    paymentMode: str = ""
    cancellationPolicy: str = ""
    specialConditions: Optional[str] = None
    estimatedTotal: Optional[int] = None
    descriptionHi: str = ""
    descriptionEn: str = ""
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

class JobListResponse(BaseModel):
    success: bool = True
    count: int
    jobs: List[JobResponse]
