from typing import Dict, Any, List, Optional
from fastapi import HTTPException, status
from ..repositories.job_repository import job_repo
from ..repositories.user_repository import user_repo
from ..constants.trades import get_trade_by_id

class JobService:
    def create_job(self, employer: Dict[str, Any], job_req) -> Dict[str, Any]:
        trade = get_trade_by_id(job_req.tradeId)
        trade_name = job_req.customTradeTitle if job_req.customTradeTitle else (trade["nameHi"] if trade else job_req.tradeId)
        trade_en = job_req.customTradeTitle if job_req.customTradeTitle else (trade["nameEn"] if trade else job_req.tradeId)

        title_hi = job_req.titleHi or f"{trade_name} चाहिए - {job_req.locationName}"
        title_en = job_req.titleEn or f"{trade_en} Needed - {job_req.locationName}"
        desc_hi = job_req.descriptionHi or f"{trade_name} कार्य हेतु कामगार चाहिए।"

        # Calculate estimated travel cost based on distance
        distance_km = 2.5
        travel_est = int(distance_km * 35)

        employer_id = employer["uid"]
        employer_name = employer.get("username") or employer.get("name") or "Employer"

        job_data = {
            "tradeId": job_req.tradeId,
            "customTradeTitle": job_req.customTradeTitle,
            "titleHi": title_hi,
            "titleEn": title_en,
            "employerId": employer_id,
            "employerName": employer_name,
            "employerVerified": True,
            "employerRating": employer.get("rating", 4.8),
            "employerHires": employer.get("totalHires", 20),
            "cancellationRate": "0%",
            "locationName": job_req.locationName,
            "city": job_req.city,
            "landmark": job_req.landmark,
            "latitude": job_req.latitude or 21.2514,
            "longitude": job_req.longitude or 81.6296,
            "distanceKm": distance_km,
            "travelEstimate": travel_est,
            "wage": job_req.wage,
            "wageUnit": job_req.wageUnit,
            "paymentTiming": job_req.paymentTiming,
            "paymentTerms": job_req.paymentTerms,
            "date": job_req.date,
            "startDate": job_req.startDate or job_req.date,
            "endDate": job_req.endDate,
            "durationDays": job_req.durationDays,
            "durationText": job_req.durationText,
            "assignmentType": job_req.assignmentType,
            "timeSlot": job_req.timeSlot,
            "breakIncluded": job_req.breakIncluded,
            "workersNeeded": job_req.workersNeeded,
            "workersApplied": 0,
            "status": "open",
            "urgent": job_req.urgent,
            "beginnerFriendly": job_req.beginnerFriendly,
            "toolsResponsibility": job_req.toolsResponsibility,
            "toolsProvided": job_req.toolsProvided,
            "foodProvided": job_req.foodProvided,
            "travelProvided": job_req.travelProvided,
            "safetyEquipment": job_req.safetyEquipment,
            "safetyProvided": job_req.safetyProvided,
            "paymentMode": job_req.paymentMode,
            "cancellationPolicy": job_req.cancellationPolicy,
            "specialConditions": job_req.specialConditions,
            "estimatedTotal": job_req.estimatedTotal,
            "descriptionHi": desc_hi,
            "descriptionEn": job_req.descriptionEn or desc_hi,
            "employerPhone": employer.get("mobileNumber") or employer.get("phone") or ""
        }

        if not job_data.get("employerPhone"):
            emp_user = user_repo.get_by_uid(employer_id) or {}
            job_data["employerPhone"] = emp_user.get("mobileNumber") or emp_user.get("phone") or ""

        return job_repo.create(job_data)

    def get_job_by_id(self, job_id: str) -> Dict[str, Any]:
        job = job_repo.get_by_id(job_id)
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
        if not job.get("employerPhone") and job.get("employerId"):
            emp_user = user_repo.get_by_uid(job["employerId"]) or {}
            job["employerPhone"] = emp_user.get("mobileNumber") or emp_user.get("phone") or ""
        return job

    def list_jobs(self, **filters) -> List[Dict[str, Any]]:
        jobs = job_repo.list_jobs(**filters)
        for job in jobs:
            if not job.get("employerPhone") and job.get("employerId"):
                emp_user = user_repo.get_by_uid(job["employerId"]) or {}
                job["employerPhone"] = emp_user.get("mobileNumber") or emp_user.get("phone") or ""
        return jobs

    def list_employer_jobs(self, employer_id: str) -> List[Dict[str, Any]]:
        return job_repo.list_by_employer(employer_id)

    def update_job(self, user: Dict[str, Any], job_id: str, updates) -> Dict[str, Any]:
        job = self.get_job_by_id(job_id)
        # IDOR protection: only owner or admin can update
        if job.get("employerId") != user["uid"] and user.get("role") != "admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: You do not own this job")

        update_dict = updates.model_dump(exclude_unset=True)
        updated = job_repo.update(job_id, update_dict)
        return updated

    def delete_job(self, user: Dict[str, Any], job_id: str) -> bool:
        job = self.get_job_by_id(job_id)
        # IDOR protection
        if job.get("employerId") != user["uid"] and user.get("role") != "admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: You do not own this job")
        return job_repo.delete(job_id)

job_service = JobService()
