from typing import Optional, Dict, Any, List
from ..firebase.firestore import get_firestore_client
from ..utils.helpers import utc_now_iso, generate_id

class PaymentRepository:
    def __init__(self):
        self.collection_name = "payments"

    def _col(self):
        return get_firestore_client().collection(self.collection_name)

    def create(self, payment_dict: Dict[str, Any]) -> Dict[str, Any]:
        pay_id = payment_dict.get("id") or generate_id("pay")
        data = dict(payment_dict)
        data["id"] = pay_id
        data["createdAt"] = data.get("createdAt") or utc_now_iso()
        self._col().document(pay_id).set(data)
        return data

    def get_by_id(self, payment_id: str) -> Optional[Dict[str, Any]]:
        doc = self._col().document(payment_id).get()
        if doc.exists:
            return doc.to_dict()
        return None

    def get_by_application_id(self, application_id: str) -> Optional[Dict[str, Any]]:
        docs = self._col().where("applicationId", "==", application_id).limit(1).stream()
        for doc in docs:
            return doc.to_dict()
        return None

    def list_by_worker(self, worker_id: str) -> List[Dict[str, Any]]:
        docs = self._col().where("workerId", "==", worker_id).stream()
        return [d.to_dict() for d in docs]

    def list_by_employer(self, employer_id: str) -> List[Dict[str, Any]]:
        docs = self._col().where("employerId", "==", employer_id).stream()
        return [d.to_dict() for d in docs]

payment_repo = PaymentRepository()
