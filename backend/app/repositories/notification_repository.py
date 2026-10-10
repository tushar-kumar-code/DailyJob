from typing import Optional, Dict, Any, List
from ..firebase.firestore import get_firestore_client
from ..utils.helpers import utc_now_iso, generate_id

class NotificationRepository:
    def __init__(self):
        self.collection_name = "notifications"

    def _col(self):
        return get_firestore_client().collection(self.collection_name)

    def create(self, notif_dict: Dict[str, Any]) -> Dict[str, Any]:
        notif_id = notif_dict.get("id") or generate_id("notif")
        data = dict(notif_dict)
        data["id"] = notif_id
        data["createdAt"] = data.get("createdAt") or utc_now_iso()
        if "read" not in data:
            data["read"] = False
        self._col().document(notif_id).set(data)
        return data

    def list_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        docs = self._col().where("userId", "==", user_id).stream()
        results = [d.to_dict() for d in docs]
        results.sort(key=lambda n: n.get("createdAt") or "", reverse=True)
        return results

    def mark_as_read(self, notif_id: str) -> bool:
        doc_ref = self._col().document(notif_id)
        if not doc_ref.get().exists:
            return False
        doc_ref.set({"read": True}, merge=True)
        return True

    def mark_all_as_read(self, user_id: str) -> int:
        docs = self._col().where("userId", "==", user_id).stream()
        count = 0
        for doc in docs:
            self._col().document(doc.id).set({"read": True}, merge=True)
            count += 1
        return count

notification_repo = NotificationRepository()
