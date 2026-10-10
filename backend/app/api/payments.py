from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, List
from ..core.dependencies import get_current_user, require_employer, require_worker
from ..schemas.payment import MarkPaidRequest, PaymentResponse, EarningsSummaryResponse
from ..services.payment_service import payment_service

router = APIRouter(prefix="/api/payments", tags=["Payments & Earnings"])

@router.post("/{application_id}/mark-paid", response_model=Dict[str, Any])
def mark_payment_paid(
    application_id: str,
    req: MarkPaidRequest,
    current_employer: Dict[str, Any] = Depends(require_employer)
):
    """
    Employer marks completed job as paid.
    Updates application to paid status and records ledger transaction.
    """
    record = payment_service.mark_payment_paid(
        current_employer,
        application_id,
        req.paymentMethod or "UPI",
        req.amount
    )
    return {
        "success": True,
        "message": f"Payment of ₹{record['amount']} released successfully.",
        "payment": record,
        "paymentStatus": record.get("status", "paid"),
        **record
    }

@router.get("/{application_id}", response_model=Dict[str, Any])
def get_payment_details(
    application_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Fetches payment receipt for a job application."""
    record = payment_service.get_payment_by_app_id(current_user, application_id)
    return {
        "success": True,
        "payment": record
    }

from ..repositories.user_repository import user_repo
from ..utils.helpers import utc_now_iso

@router.get("/payout-account", response_model=Dict[str, Any])
def get_payout_account(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Fetches user linked Bank and UPI account details."""
    user = user_repo.get_by_uid(current_user["uid"]) or current_user
    return {
        "success": True,
        "payoutAccount": user.get("payoutAccount")
    }

@router.post("/payout-account", response_model=Dict[str, Any])
def update_payout_account(
    req: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Saves user real Bank and UPI payout account details."""
    account_info = {
        "bankName": (req.get("bankName") or "").strip(),
        "accountNumber": (req.get("accountNumber") or "").strip(),
        "ifsc": (req.get("ifsc") or "").strip().upper(),
        "upiId": (req.get("upiId") or "").strip().lower(),
        "holderName": (req.get("holderName") or current_user.get("name") or current_user.get("username") or "").strip(),
        "isVerified": bool(req.get("upiId") or req.get("accountNumber")),
        "updatedAt": utc_now_iso()
    }
    user_repo.create_or_update(current_user["uid"], {"payoutAccount": account_info})
    return {
        "success": True,
        "message": "बैंक / UPI विवरण सुरक्षित रूप से सेव हो गया।",
        "payoutAccount": account_info
    }

@router.get("", response_model=EarningsSummaryResponse)
def get_earnings_ledger(current_user: Dict[str, Any] = Depends(get_current_user)):
    """User views gross earnings, travel deductions, and net in-hand income."""
    earnings = payment_service.get_worker_earnings(current_user["uid"])
    user = user_repo.get_by_uid(current_user["uid"]) or current_user
    return EarningsSummaryResponse(
        success=True,
        totalEarned=earnings["totalEarned"],
        netTakeHome=earnings["netTakeHome"],
        travelSpent=earnings["travelSpent"],
        payments=earnings["payments"],
        payoutAccount=user.get("payoutAccount")
    )
