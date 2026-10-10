from typing import Optional, Dict, Any, List
from ..firebase.firestore import get_firestore_client
from ..utils.helpers import utc_now_iso, generate_id

class DisputeRepository:
    def __init__(self):
        self.collection_name = "disputes"

    def _col(self):
        return get_firestore_client().collection(self.collection_name)

    def create(self, dispute_dict: Dict[str, Any]) -> Dict[str, Any]:
        disp_id = dispute_dict.get("id") or generate_id("disp")
        data = dict(dispute_dict)
        data["id"] = disp_id
        data["submittedAt"] = data.get("submittedAt") or utc_now_iso()
        if "status" not in data:
            data["status"] = "under_review"
        self._col().document(disp_id).set(data)
        return data

    def get_by_id(self, dispute_id: str) -> Optional[Dict[str, Any]]:
        doc = self._col().document(dispute_id).get()
        if doc.exists:
            return doc.to_dict()
        return None

    def list_all(self) -> List[Dict[str, Any]]:
        return [d.to_dict() for d in self._col().stream()]

    def list_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        docs = self._col().where("reporterId", "==", user_id).stream()
        return [d.to_dict() for d in docs]

dispute_repo = DisputeRepository()
