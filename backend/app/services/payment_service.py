from typing import Dict, Any, List, Optional
from fastapi import HTTPException, status
from ..repositories.application_repository import application_repo
from ..repositories.job_repository import job_repo
from ..repositories.payment_repository import payment_repo
from ..repositories.user_repository import user_repo
from ..repositories.notification_repository import notification_repo
from ..constants.application_status import ApplicationStatus
from ..utils.helpers import utc_now_iso

class PaymentService:
    def mark_payment_paid(self, employer: Dict[str, Any], app_id: str, payment_method: str = "UPI", override_amount: Optional[int] = None) -> Dict[str, Any]:
        app = application_repo.get_by_id(app_id)
        if not app:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

        job = job_repo.get_by_id(app["jobId"])
        is_employer = job and job.get("employerId") == employer["uid"]
        is_admin = employer.get("role") == "admin"

        if not (is_employer or is_admin):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the employer can release payment")

        # Must be in completed status to be paid
        if app.get("status") not in (ApplicationStatus.COMPLETED.value, ApplicationStatus.STARTED.value):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot release payment: Work must be completed first. Current status: '{app.get('status')}'"
            )

        amount = override_amount or app.get("wage") or 700
        now = utc_now_iso()

        # Update application
        updated_app = application_repo.update_status(app_id, ApplicationStatus.PAID.value, {
            "paymentStatus": "paid",
            "paidAmount": amount,
            "paidAt": now
        })

        # Record payment ledger entry
        job_obj = job_repo.get_by_id(app["jobId"])
        job_title = (job_obj.get("titleHi") or job_obj.get("titleEn")) if job_obj else app.get("trade", "कार्य")
        employer_name = employer.get("name") or employer.get("username") or "Employer"

        pay_record = payment_repo.create({
            "applicationId": app_id,
            "jobId": app["jobId"],
            "jobTitle": job_title,
            "workerId": app["workerId"],
            "employerId": employer["uid"],
            "employerName": employer_name,
            "amount": amount,
            "status": "paid",
            "paymentMethod": payment_method,
            "paidAt": now
        })

        # Increment worker jobsCompleted count
        worker = user_repo.get_by_uid(app["workerId"])
        if worker:
            completed_count = worker.get("jobsCompleted", 0) + 1
            user_repo.create_or_update(app["workerId"], {"jobsCompleted": completed_count})

        # Notify worker
        notification_repo.create({
            "userId": app["workerId"],
            "titleHi": f"₹{amount} का भुगतान प्राप्त हुआ! 💰",
            "titleEn": f"Payment of ₹{amount} Received! 💰",
            "messageHi": f"काम पूरा करने के लिए ₹{amount} का भुगतान सफल रहा।",
            "messageEn": f"Payment of ₹{amount} received for job completion.",
            "time": "अभी",
            "linkHash": "#/earnings"
        })

        return pay_record

    def get_payment_by_app_id(self, user: Dict[str, Any], app_id: str) -> Optional[Dict[str, Any]]:
        record = payment_repo.get_by_application_id(app_id)
        if not record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment record not found")
        # Check permissions
        if record.get("workerId") != user["uid"] and record.get("employerId") != user["uid"] and user.get("role") != "admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        return record

    def get_worker_earnings(self, worker_id: str) -> Dict[str, Any]:
        payments = payment_repo.list_by_worker(worker_id)
        payments.sort(key=lambda x: x.get("paidAt") or x.get("createdAt") or "", reverse=True)
        for p in payments:
            if not p.get("jobTitle") and p.get("jobId"):
                try:
                    job = job_repo.get_by_id(p["jobId"])
                    if job:
                        p["jobTitle"] = job.get("titleHi") or job.get("titleEn")
                        p["employerName"] = p.get("employerName") or job.get("employerName")
                except Exception:
                    pass
            if not p.get("jobTitle"):
                p["jobTitle"] = "दैनिक कार्य मजदूरी"
        total_earned = sum(p.get("amount", 0) for p in payments if p.get("status") == "paid")
        travel_spent = int(len(payments) * 75) if payments else 0
        net_take_home = max(0, total_earned - travel_spent)
        return {
            "totalEarned": total_earned,
            "travelSpent": travel_spent,
            "netTakeHome": net_take_home,
            "payments": payments
        }

payment_service = PaymentService()
