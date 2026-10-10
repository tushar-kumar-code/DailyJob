from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class SkillVerifyRequest(BaseModel):
    tradeId: str = Field(..., description="Trade ID to verify")
    experienceYears: int = Field(..., ge=1, le=50)
    answers: Optional[List[Dict[str, Any]]] = Field(default_factory=list)

class SkillItem(BaseModel):
    id: str
    nameHi: str
    status: str
    proof: Optional[str] = None
    score: Optional[int] = None

class SkillListResponse(BaseModel):
    success: bool = True
    skills: List[SkillItem]
