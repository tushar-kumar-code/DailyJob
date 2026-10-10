from typing import Optional, Dict, Any, List
from ..firebase.firestore import get_firestore_client
from ..utils.helpers import utc_now_iso, generate_id

class SafetyRepository:
    def __init__(self):
        self.collection_name = "safety_reports"

    def _col(self):
        return get_firestore_client().collection(self.collection_name)

    def create(self, report_dict: Dict[str, Any]) -> Dict[str, Any]:
        rep_id = report_dict.get("id") or generate_id("safety")
        data = dict(report_dict)
        data["id"] = rep_id
        data["createdAt"] = data.get("createdAt") or utc_now_iso()
        if "status" not in data:
            data["status"] = "active"
        self._col().document(rep_id).set(data)
        return data

    def list_all(self) -> List[Dict[str, Any]]:
        return [d.to_dict() for d in self._col().stream()]

    def list_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        docs = self._col().where("userId", "==", user_id).stream()
        return [d.to_dict() for d in docs]

safety_repo = SafetyRepository()
