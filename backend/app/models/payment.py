from typing import Optional
from dataclasses import dataclass

@dataclass
class PaymentModel:
    id: str
    applicationId: str
    jobId: str
    workerId: str
    employerId: str
    amount: int
    status: str  # "pending" | "paid" | "failed" | "cancelled"
    paymentMethod: str = "UPI"
    paidAt: Optional[str] = None
    createdAt: Optional[str] = None
