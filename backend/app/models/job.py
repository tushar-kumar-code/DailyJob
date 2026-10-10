from typing import Optional
from dataclasses import dataclass
from ..constants.job_status import JobStatus

@dataclass
class JobModel:
    id: str
    tradeId: str
    titleHi: str
    titleEn: str
    employerId: str
    employerName: str
    wage: int
    wageUnit: str = "day"
    workersNeeded: int = 1
    workersApplied: int = 0
    locationName: str = ""
    city: str = "Raipur"
    latitude: Optional[float] = 21.2514  # Default Raipur coords
    longitude: Optional[float] = 81.6296
    distanceKm: float = 2.5
    travelEstimate: int = 80
    date: str = "आज (Today)"
    timeSlot: str = "9:00 AM – 5:00 PM"
    status: JobStatus = JobStatus.OPEN
    urgent: bool = False
    beginnerFriendly: bool = False
    toolsProvided: str = ""
    safetyProvided: str = ""
    paymentMode: str = "काम समाप्त होने पर तुरंत"
    cancellationPolicy: str = "2 घंटे पहले सूचित करना आवश्यक"
    descriptionHi: str = ""
    descriptionEn: str = ""
    employerVerified: bool = True
    employerRating: float = 4.8
    employerHires: int = 25
    cancellationRate: str = "1%"
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None
