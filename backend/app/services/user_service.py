from typing import Dict, Any, Optional
from fastapi import HTTPException, status
from ..repositories.user_repository import user_repo
from ..utils.helpers import utc_now_iso

class UserService:
    def complete_or_update_profile(self, uid: str, profile_req) -> Dict[str, Any]:
        user = user_repo.get_by_uid(uid)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        profession = (profile_req.profession or "").strip()
        if profession == "Other" and profile_req.custom_profession:
            profession = profile_req.custom_profession.strip()

        profile_data = {
            "user_type": profile_req.user_type,
            "age": profile_req.age,
            "profession": profession,
            "custom_profession": profile_req.custom_profession if profile_req.profession == "Other" else None,
            "completed_at": utc_now_iso()
        }

        updates: Dict[str, Any] = {
            "profile_completed": True,
            "age": profile_req.age,
            "profile": profile_data
        }

        # Dual Profile provision
        if profile_req.user_type == "job_seeker":
            updates["worker_profile"] = profile_data
            updates["role"] = "worker"
        elif profile_req.user_type == "employer":
            updates["employer_profile"] = profile_data
            updates["role"] = "employer"

        user = user_repo.create_or_update(uid, updates)
        return user

    def calculate_job_seeker_completion(self, profile: Dict[str, Any]) -> Dict[str, Any]:
        if not profile:
            return {
                "percentage": 0,
                "completed_sections": [],
                "missing_sections": [
                    "Personal Information", "Employment Status", "Education",
                    "Skills", "Work Experience", "Job Preferences",
                    "Languages", "Portfolio & Resume", "Privacy & Visibility"
                ],
                "is_ready_for_matching": False
            }

        sections = [
            ("Personal Information", bool(
                profile.get("personal") and
                profile["personal"].get("full_name") and
                (profile["personal"].get("mobile_number") or profile["personal"].get("email")) and
                profile["personal"].get("current_city")
            )),
            ("Employment Status", bool(
                profile.get("employment_status") and
                profile["employment_status"].get("status")
            )),
            ("Education", bool(
                profile.get("education") and
                len(profile["education"]) > 0 and
                profile["education"][0].get("level")
            )),
            ("Skills", bool(
                profile.get("skills") and
                len(profile["skills"]) > 0 and
                profile["skills"][0].get("name")
            )),
            ("Work Experience", bool(
                profile.get("has_experience") is False or (
                    profile.get("has_experience") is True and
                    profile.get("experience") and
                    len(profile["experience"]) > 0
                )
            )),
            ("Job Preferences", bool(
                profile.get("preferences") and (
                    profile["preferences"].get("looking_for") or
                    profile["preferences"].get("preferred_roles") or
                    profile["preferences"].get("work_modes")
                )
            )),
            ("Languages", bool(
                profile.get("languages") and
                len(profile["languages"]) > 0 and
                profile["languages"][0].get("language")
            )),
            ("Portfolio & Resume", bool(
                profile.get("portfolio") and (
                    profile["portfolio"].get("resume_url") or
                    profile["portfolio"].get("linkedin_url") or
                    profile["portfolio"].get("portfolio_url")
                )
            )),
            ("Privacy & Visibility", bool(
                profile.get("visibility") and
                profile["visibility"].get("visibility")
            )),
            ("Final Confirmation", bool(
                profile.get("is_submitted") or profile.get("completed_at")
            ))
        ]

        completed = [name for name, done in sections if done]
        missing = [name for name, done in sections if not done]
        percentage = round((len(completed) / len(sections)) * 100)

        # Candidate is ready for matching if personal info, status, education, and skills are provided
        essential_met = all([
            any(name == "Personal Information" for name in completed),
            any(name == "Employment Status" for name in completed),
            any(name == "Skills" for name in completed)
        ])

        return {
            "percentage": percentage,
            "completed_sections": completed,
            "missing_sections": missing,
            "is_ready_for_matching": essential_met and percentage >= 40
        }

    def calculate_employer_completion(self, profile: Dict[str, Any]) -> Dict[str, Any]:
        if not profile:
            return {
                "percentage": 0,
                "completed_sections": [],
                "missing_sections": [
                    "Business Type", "Business Information", "Office Location",
                    "Recruiter Contact", "Hiring Information", "Hiring Locations",
                    "Business Verification", "Company Profile & Culture", "Hiring Preferences", "Profile Visibility"
                ],
                "is_ready_for_matching": False
            }

        sections = [
            ("Business Type", bool(profile.get("business_type"))),
            ("Business Information", bool(
                profile.get("business_info") and
                profile["business_info"].get("name") and
                (profile["business_info"].get("industry") or profile["business_info"].get("description"))
            )),
            ("Office Location", bool(
                profile.get("location") and (
                    profile["location"].get("city") or profile["location"].get("work_model")
                )
            )),
            ("Recruiter Contact", bool(
                profile.get("recruiter_info") and
                profile["recruiter_info"].get("name") and
                (profile["recruiter_info"].get("official_email") or profile["recruiter_info"].get("mobile_number"))
            )),
            ("Hiring Information", bool(
                profile.get("hiring_info") and (
                    len(profile["hiring_info"].get("hiring_types", [])) > 0 or
                    len(profile["hiring_info"].get("categories", [])) > 0
                )
            )),
            ("Hiring Locations", bool(
                profile.get("hiring_location") and (
                    len(profile["hiring_location"].get("cities", [])) > 0 or
                    profile["hiring_location"].get("remote_hiring") or
                    profile["hiring_location"].get("onsite_hiring")
                )
            )),
            ("Business Verification", bool(
                profile.get("verification") and (
                    profile["verification"].get("official_website") or
                    profile["verification"].get("official_email") or
                    profile["verification"].get("gstin") or
                    profile["verification"].get("registration_number")
                )
            )),
            ("Company Profile & Culture", bool(
                profile.get("company_profile") and (
                    profile["company_profile"].get("description") or
                    profile["company_profile"].get("mission") or
                    len(profile["company_profile"].get("benefits", [])) > 0 or
                    profile["company_profile"].get("work_culture")
                )
            )),
            ("Hiring Preferences", bool(
                profile.get("hiring_preferences") and (
                    profile["hiring_preferences"].get("candidate_experience") or
                    len(profile["hiring_preferences"].get("preferred_skills", [])) > 0
                )
            )),
            ("Profile Visibility", bool(
                profile.get("visibility") and profile["visibility"].get("visibility")
            ))
        ]

        completed = [name for name, done in sections if done]
        missing = [name for name, done in sections if not done]
        percentage = round((len(completed) / len(sections)) * 100)

        essential_met = all([
            any(name == "Business Information" for name in completed),
            any(name == "Recruiter Contact" for name in completed),
            any(name == "Hiring Information" for name in completed)
        ])

        return {
            "percentage": percentage,
            "completed_sections": completed,
            "missing_sections": missing,
            "is_ready_for_matching": essential_met and percentage >= 40
        }

    def save_job_seeker_profile(self, uid: str, profile_req) -> Dict[str, Any]:
        user = user_repo.get_by_uid(uid)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        req_dict = profile_req.model_dump() if hasattr(profile_req, "model_dump") else profile_req.dict()
        req_dict["updated_at"] = utc_now_iso()
        req_dict["is_submitted"] = True

        # Normalize work_type and workType
        if req_dict.get("workType") and not req_dict.get("work_type"):
            req_dict["work_type"] = req_dict["workType"]
        elif req_dict.get("work_type") and not req_dict.get("workType"):
            req_dict["workType"] = req_dict["work_type"]

        breakdown = self.calculate_job_seeker_completion(req_dict)
        percentage = breakdown["percentage"]

        # Extract name and mobile if present in personal info
        personal = req_dict.get("personal") or {}
        name = personal.get("full_name") or user.get("name") or user.get("username")
        mobile = personal.get("mobile_number") or user.get("mobile_number")
        age = personal.get("age") or user.get("age")

        updates: Dict[str, Any] = {
            "job_seeker_profile": req_dict,
            "worker_profile": req_dict,
            "role": "worker",
            "account_type": "job_seeker",
            "profile_completed": percentage >= 60,
            "completion_percentage": percentage,
            "completion_breakdown": breakdown,
            "name": name,
            "mobile_number": mobile,
            "age": age,
            "updated_at": utc_now_iso()
        }

        updated_user = user_repo.create_or_update(uid, updates)
        return {
            "user": updated_user,
            "profile": req_dict,
            "completion": breakdown
        }

    def save_employer_profile(self, uid: str, profile_req) -> Dict[str, Any]:
        user = user_repo.get_by_uid(uid)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        req_dict = profile_req.model_dump() if hasattr(profile_req, "model_dump") else profile_req.dict()
        req_dict["updated_at"] = utc_now_iso()
        req_dict["is_submitted"] = True

        # Keep verification status controlled / protected
        existing_profile = user.get("employer_profile") or {}
        existing_verification = existing_profile.get("verification") or {}
        if "verification" in req_dict and isinstance(req_dict["verification"], dict):
            # Do not allow client to self-promote to 'verified'
            current_status = existing_verification.get("status", "not_verified")
            submitted_status = req_dict["verification"].get("status")
            if submitted_status == "verified" and current_status != "verified":
                req_dict["verification"]["status"] = "pending"
            elif not req_dict["verification"].get("status"):
                req_dict["verification"]["status"] = current_status

        breakdown = self.calculate_employer_completion(req_dict)
        percentage = breakdown["percentage"]

        recruiter = req_dict.get("recruiter_info") or {}
        biz = req_dict.get("business_info") or {}
        name = recruiter.get("name") or biz.get("name") or user.get("name") or user.get("username")
        mobile = recruiter.get("mobile_number") or user.get("mobile_number")

        updates: Dict[str, Any] = {
            "employer_profile": req_dict,
            "role": "employer",
            "account_type": "employer",
            "profile_completed": percentage >= 60,
            "completion_percentage": percentage,
            "completion_breakdown": breakdown,
            "name": name,
            "mobile_number": mobile,
            "updated_at": utc_now_iso()
        }

        updated_user = user_repo.create_or_update(uid, updates)
        return {
            "user": updated_user,
            "profile": req_dict,
            "completion": breakdown
        }

    def get_profile_completion(self, uid: str) -> Dict[str, Any]:
        user = user_repo.get_by_uid(uid)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        account_type = user.get("account_type") or ("employer" if user.get("role") == "employer" else "job_seeker")

        if account_type == "employer":
            profile = user.get("employer_profile") or {}
            breakdown = self.calculate_employer_completion(profile)
        else:
            profile = user.get("job_seeker_profile") or user.get("worker_profile") or {}
            breakdown = self.calculate_job_seeker_completion(profile)

        return {
            "account_type": account_type,
            "breakdown": breakdown
        }

    def switch_user_role(self, uid: str, target_role: str) -> Dict[str, Any]:
        if target_role not in ("worker", "employer"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Target role must be worker or employer")
        updated_user = user_repo.switch_role(uid, target_role)
        if not updated_user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return updated_user

    def save_custom_data(self, uid: str, data: Dict[str, Any]) -> None:
        user_repo.save_user_data(uid, data)

user_service = UserService()
