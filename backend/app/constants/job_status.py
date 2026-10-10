from enum import Enum

class JobStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    FILLED = "filled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
