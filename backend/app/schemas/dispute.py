from pydantic import BaseModel, Field
from typing import List, Optional

class DisputeCreateRequest(BaseModel):
    jobId: str = Field(..., description="Related Job ID")
    reason: str = Field(..., min_length=3, description="Problem category")
    description: str = Field(..., min_length=5, description="Incident description")
    evidence: Optional[List[str]] = Field(default_factory=list, description="List of evidence URLs or file references")

class DisputeResponse(BaseModel):
    id: str
    jobId: str
    reporterId: str
    reporterName: str
    reporterRole: str
    reason: str
    description: str
    status: str
    evidence: List[str] = []
    submittedAt: Optional[str] = None
    adminNotes: Optional[str] = None

class DisputeListResponse(BaseModel):
    success: bool = True
    disputes: List[DisputeResponse]
