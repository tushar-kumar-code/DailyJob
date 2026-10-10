from enum import Enum
from typing import Dict, List

class ApplicationStatus(str, Enum):
    APPLIED = "applied"
    SELECTED = "selected"
    CONFIRMED = "confirmed"
    STARTED = "started"
    COMPLETED = "completed"
    PAID = "paid"
    REJECTED = "rejected"

# Allowed forward transitions
ALLOWED_TRANSITIONS: Dict[ApplicationStatus, List[ApplicationStatus]] = {
    ApplicationStatus.APPLIED: [ApplicationStatus.SELECTED, ApplicationStatus.REJECTED],
    ApplicationStatus.SELECTED: [ApplicationStatus.CONFIRMED, ApplicationStatus.REJECTED],
    ApplicationStatus.CONFIRMED: [ApplicationStatus.STARTED, ApplicationStatus.REJECTED],
    ApplicationStatus.STARTED: [ApplicationStatus.COMPLETED],
    ApplicationStatus.COMPLETED: [ApplicationStatus.PAID],
    ApplicationStatus.PAID: [],
    ApplicationStatus.REJECTED: [],
}
