from typing import Optional
from dataclasses import dataclass

@dataclass
class SkillModel:
    id: str  # trade ID e.g. "plumber"
    workerId: str
    nameHi: str
    status: str = "claimed"  # "claimed" | "evidence_submitted" | "verified"
    proof: Optional[str] = None
    score: Optional[int] = None
    experienceYears: int = 1
    verifiedAt: Optional[str] = None
