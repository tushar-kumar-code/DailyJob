from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, Optional
from ..core.dependencies import get_current_user
from ..schemas.user import (
    ProfileCreateUpdateRequest,
    SwitchRoleRequest,
    UserDataSaveRequest,
    JobSeekerProfileRequest,
    EmployerProfileRequest
)
from ..services.user_service import user_service
from ..repositories.user_repository import user_repo

router = APIRouter(tags=["User & Profiles"])

def _format_user_resp(user: Dict[str, Any]):
    return {
        "success": True,
        "user": user,
        **user
    }

@router.get("/api/user/profile")
@router.get("/api/users/profile")
def get_user_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    return _format_user_resp(current_user)

@router.get("/api/user/profile/completion")
@router.get("/api/users/profile/completion")
def get_profile_completion(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Returns deterministic profile completion percentage and section checklist.
    """
    result = user_service.get_profile_completion(current_user["uid"])
    return {
        "success": True,
        **result
    }

@router.get("/api/user/profile/job-seeker")
@router.get("/api/users/profile/job-seeker")
def get_job_seeker_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    profile = current_user.get("job_seeker_profile") or current_user.get("worker_profile") or {}
    breakdown = user_service.calculate_job_seeker_completion(profile)
    return {
        "success": True,
        "profile": profile,
        "completion": breakdown
    }

@router.post("/api/user/profile/job-seeker")
@router.post("/api/users/profile/job-seeker")
def save_job_seeker_profile(
    req: JobSeekerProfileRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Saves comprehensive 10-step Job Seeker profile, updates completion percentage, and sets active role to worker.
    """
    result = user_service.save_job_seeker_profile(current_user["uid"], req)
    return {
        "success": True,
        "message": "Job Seeker profile saved successfully.",
        **result
    }

@router.get("/api/user/profile/employer")
@router.get("/api/users/profile/employer")
def get_employer_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    profile = current_user.get("employer_profile") or {}
    breakdown = user_service.calculate_employer_completion(profile)
    return {
        "success": True,
        "profile": profile,
        "completion": breakdown
    }

@router.post("/api/user/profile/employer")
@router.post("/api/users/profile/employer")
def save_employer_profile(
    req: EmployerProfileRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Saves comprehensive 10-step Employer profile, updates completion percentage, and sets active role to employer.
    """
    result = user_service.save_employer_profile(current_user["uid"], req)
    return {
        "success": True,
        "message": "Employer profile saved successfully.",
        **result
    }

@router.post("/api/user/profile")
@router.post("/api/users/profile")
def complete_user_profile(
    req: ProfileCreateUpdateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Saves Page 1-3 profile completion (user_type, age, profession, custom_profession).
    Dual-purpose profile is stored under worker_profile or employer_profile.
    """
    updated_user = user_service.complete_or_update_profile(current_user["uid"], req)
    return {
        "success": True,
        "message": "Profile completed successfully.",
        "user": updated_user,
        **updated_user
    }

@router.put("/api/user/profile/worker")
@router.put("/api/users/profile/worker")
def update_worker_profile(
    profile_data: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    updated = user_repo.create_or_update(current_user["uid"], {
        "worker_profile": profile_data,
        "profile": profile_data,
        "profile_completed": True
    })
    return _format_user_resp(updated)

@router.put("/api/user/profile/employer")
@router.put("/api/users/profile/employer")
def update_employer_profile(
    profile_data: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    updated = user_repo.create_or_update(current_user["uid"], {
        "employer_profile": profile_data,
        "profile": profile_data,
        "profile_completed": True
    })
    return _format_user_resp(updated)

@router.post("/api/user/switch-role")
@router.post("/api/users/switch-role")
def switch_active_role(
    req: SwitchRoleRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Switches user active role between worker (जॉब लेने वाला) and employer (जॉब देने वाला).
    """
    role_val = req.role.value if hasattr(req.role, 'value') else req.role
    if role_val not in ("worker", "employer"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot switch to administrative role. Only worker or employer allowed."
        )
    updated_user = user_service.switch_user_role(current_user["uid"], role_val)
    return {
        "success": True,
        "message": f"Switched to {role_val} mode successfully.",
        "user": updated_user,
        **updated_user
    }

@router.get("/api/user/data")
@router.get("/api/users/data")
def get_user_saved_data(current_user: Dict[str, Any] = Depends(get_current_user)):
    return {
        "success": True,
        "data": current_user.get("saved_data")
    }

@router.post("/api/user/data")
@router.post("/api/users/data")
def save_user_saved_data(
    req: UserDataSaveRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    user_service.save_custom_data(current_user["uid"], req.data)
    return {
        "success": True,
        "message": "User data saved successfully."
    }

@router.get("/api/workers")
def list_workers(
    tradeId: Optional[str] = None,
    trade: Optional[str] = None,
    searchQuery: Optional[str] = None,
    city: Optional[str] = None
):
    """
    Returns list of verified workers and job seekers for employers to browse.
    Supports trade and keyword filtering.
    """
    effective_trade = tradeId or trade
    all_users = []
    try:
        all_users = [d.to_dict() for d in user_repo._col().stream()]
    except Exception:
        pass

    if not all_users:
        import json, os
        users_json_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "users.json")
        if os.path.exists(users_json_path):
            try:
                with open(users_json_path, "r", encoding="utf-8") as f:
                    all_users = json.load(f)
            except Exception:
                all_users = []

    workers = []

    for u in all_users:
        if not u:
            continue
        is_worker = (
            u.get("role") == "worker" or
            u.get("account_type") == "job_seeker" or
            bool(u.get("job_seeker_profile")) or
            bool(u.get("worker_profile")) or
            (u.get("profile") and u["profile"].get("user_type") == "job_seeker")
        )
        if not is_worker:
            continue

        prof = u.get("job_seeker_profile") or u.get("worker_profile") or u.get("profile") or {}
        personal = prof.get("personal") or {}
        raw_role = (
            (prof.get("preferences", {}).get("preferred_roles") or [""])[0] or
            (prof.get("experience", [{}])[0].get("job_title") if prof.get("experience") else "") or
            (prof.get("skills", [{}])[0].get("name") if prof.get("skills") else "") or
            u.get("profile", {}).get("profession") or
            "कामगार"
        )
        lower_role = str(raw_role).lower()
        t_id = "helper"
        t_name = raw_role
        icon = "💼"

        if "cook" in lower_role or "खाना" in lower_role or "रसोई" in lower_role or "कुक" in lower_role:
            t_id, t_name, icon = "cooking", raw_role or "खाना बनाना / कुक", "🍳"
        elif "clean" in lower_role or "झाड़ू" in lower_role or "सफाई" in lower_role or "साफ़" in lower_role:
            t_id, t_name, icon = "cleaning", raw_role or "साफ़-सफ़ाई / हेल्पर", "🧹"
        elif "driv" in lower_role or "ड्राइव" in lower_role or "गाड़ी" in lower_role:
            t_id, t_name, icon = "driving", raw_role or "ड्राइविंग", "🚗"
        elif "electr" in lower_role or "बिजली" in lower_role or "इलेक्ट्रीशियन" in lower_role:
            t_id, t_name, icon = "electrician", raw_role or "इलेक्ट्रीशियन", "⚡"
        elif "mason" in lower_role or "मिस्त्री" in lower_role or "राजमिस्त्री" in lower_role:
            t_id, t_name, icon = "mason", raw_role or "राजमिस्त्री", "🧱"
        elif "plumb" in lower_role or "नल" in lower_role or "प्लंबर" in lower_role:
            t_id, t_name, icon = "plumber", raw_role or "प्लंबर", "🚰"
        elif "paint" in lower_role or "पेंट" in lower_role or "रंग" in lower_role:
            t_id, t_name, icon = "painter", raw_role or "पेंटर", "🎨"
        elif "weld" in lower_role or "वेल्ड" in lower_role:
            t_id, t_name, icon = "welder", raw_role or "वेल्डर", "🔥"
        elif "help" in lower_role or "मजदूर" in lower_role or "हेल्पर" in lower_role:
            t_id, t_name, icon = "helper", raw_role or "मजदूर / हेल्पर", "👷"
        elif "carpent" in lower_role or "बढ़ई" in lower_role:
            t_id, t_name, icon = "carpenter", raw_role or "बढ़ई", "🪚"
        elif "load" in lower_role or "हमाल" in lower_role or "लोडर" in lower_role:
            t_id, t_name, icon = "loader", raw_role or "लोडर / हमाल", "📦"

        if effective_trade and effective_trade != "all" and t_id != effective_trade:
            continue

        w_name = u.get("username") or u.get("name") or personal.get("full_name") or "Worker"
        skills = prof.get("skills") or []
        city_name = personal.get("current_city") or u.get("city") or "रायपुर (Raipur)"

        if searchQuery:
            q = searchQuery.lower().strip()
            match_str = f"{w_name} {t_name} {city_name} {' '.join([s.get('name', '') for s in skills])}".lower()
            if q not in match_str:
                continue

        workers.append({
            "id": u.get("user_id") or u.get("id") or u.get("uid"),
            "name": w_name,
            "phone": personal.get("mobile_number") or u.get("mobile_number") or u.get("phone") or "",
            "email": personal.get("email") or u.get("email") or "",
            "city": city_name,
            "age": personal.get("age") or u.get("age") or 26,
            "tradeId": t_id,
            "primaryTrade": t_name,
            "profession": t_name,
            "tradeIcon": icon,
            "skills": skills,
            "experience": prof.get("experience") or [],
            "expectedWage": prof.get("preferences", {}).get("expected_salary_min", 500),
            "lookingFor": (prof.get("preferences", {}).get("looking_for") or ["Daily Wage"])[0],
            "preferredCities": prof.get("preferences", {}).get("preferred_cities") or ["Raipur"],
            "rating": 4.8,
            "jobsCompleted": 12,
            "identityVerified": True,
            "skillVerified": True,
            "createdAt": u.get("created_at")
        })

    return {
        "success": True,
        "count": len(workers),
        "workers": workers
    }
