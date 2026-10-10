from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, List
from ..core.dependencies import get_current_user, require_worker
from ..schemas.skill import SkillVerifyRequest, SkillListResponse
from ..services.skill_service import skill_service
from ..constants.trades import INITIAL_TRADES

router = APIRouter(prefix="/api/skills", tags=["Skills"])

@router.get("", response_model=SkillListResponse)
def get_skills(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    skills = skill_service.get_skills_for_worker(current_user["uid"])
    return {
        "success": True,
        "skills": skills
    }

@router.post("/verify")
def verify_skill(
    payload: SkillVerifyRequest,
    current_user: Dict[str, Any] = Depends(require_worker)
):
    res = skill_service.verify_skill(
        worker=current_user,
        trade_id=payload.tradeId,
        experience_years=payload.experienceYears,
        answers=payload.answers or []
    )
    return {"success": True, "skill": res}

@router.get("/catalog")
def get_trades_catalog():
    """Return system trade benchmarks, wage baselines, and safety equipment requirements."""
    return {"success": True, "trades": INITIAL_TRADES}
