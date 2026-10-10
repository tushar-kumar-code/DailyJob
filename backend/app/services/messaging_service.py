from typing import Dict, Any, List
from datetime import datetime
from fastapi import HTTPException, status
from ..repositories.message_repository import message_repo
from ..repositories.job_repository import job_repo
from ..repositories.application_repository import application_repo

class MessagingService:
    def _verify_job_participant(self, user: Dict[str, Any], job_id: str) -> Dict[str, Any]:
        job = job_repo.get_by_id(job_id)
        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

        is_employer = job.get("employerId") == user["uid"]
        is_admin = user.get("role") == "admin"

        if is_employer or is_admin:
            return job

        # Check if worker applied
        worker_app = application_repo.get_by_job_and_worker(job_id, user["uid"])
        if worker_app:
            return job

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not a participant in this job discussion"
        )

    def get_job_thread(self, user: Dict[str, Any], job_id: str) -> Dict[str, Any]:
        job = self._verify_job_participant(user, job_id)
        messages = message_repo.get_messages_for_job(job_id)
        return {
            "jobId": job_id,
            "jobTitle": job.get("titleHi") or job.get("titleEn") or "काम बातचीत",
            "conversation": messages
        }

    def send_message(self, user: Dict[str, Any], job_id: str, text: str) -> Dict[str, Any]:
        job = self._verify_job_participant(user, job_id)
        now = datetime.now()
        sender_role = user.get("role", "worker")
        sender_name = user.get("username") or user.get("name") or "User"

        msg_data = {
            "jobId": job_id,
            "senderId": user["uid"],
            "senderName": sender_name,
            "senderRole": sender_role,
            "text": text.strip(),
            "time": now.strftime("%I:%M %p")
        }

        return message_repo.add_message(msg_data)

messaging_service = MessagingService()
