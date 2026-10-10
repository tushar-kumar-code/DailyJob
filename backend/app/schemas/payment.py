from pydantic import BaseModel, Field
from typing import Optional, List

class MarkPaidRequest(BaseModel):
    paymentMethod: Optional[str] = Field("UPI", description="Payment method: UPI, Cash, Bank")
    amount: Optional[int] = Field(None, gt=0, description="Optional override amount")

class PaymentResponse(BaseModel):
    id: str
    applicationId: str
    jobId: str
    jobTitle: Optional[str] = None
    employerName: Optional[str] = None
    workerId: str
    employerId: str
    amount: int
    status: str
    paymentMethod: str
    paidAt: Optional[str] = None
    createdAt: Optional[str] = None

class PayoutAccountSchema(BaseModel):
    bankName: Optional[str] = ""
    accountNumber: Optional[str] = ""
    ifsc: Optional[str] = ""
    upiId: Optional[str] = ""
    holderName: Optional[str] = ""
    isVerified: Optional[bool] = False
    updatedAt: Optional[str] = None

class EarningsSummaryResponse(BaseModel):
    success: bool = True
    totalEarned: int
    netTakeHome: int
    travelSpent: int
    payments: List[PaymentResponse]
    payoutAccount: Optional[PayoutAccountSchema] = None
