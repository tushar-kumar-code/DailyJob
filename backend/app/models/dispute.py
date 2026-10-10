from typing import Optional, List
from dataclasses import dataclass, field

@dataclass
class DisputeModel:
    id: str
    jobId: str
    reporterId: str
    reporterName: str
    reporterRole: str  # "worker" | "employer"
    reason: str
    description: str
    status: str = "under_review"  # "under_review" | "resolved" | "dismissed"
    evidence: List[str] = field(default_factory=list)
    submittedAt: Optional[str] = None
    resolvedAt: Optional[str] = None
    adminNotes: Optional[str] = None
