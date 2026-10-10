from typing import Optional, Dict, Any, List
from ..firebase.firestore import get_firestore_client
from ..utils.helpers import utc_now_iso, generate_id

class MessageRepository:
    def __init__(self):
        self.collection_name = "messages"

    def _col(self):
        return get_firestore_client().collection(self.collection_name)

    def get_messages_for_job(self, job_id: str) -> List[Dict[str, Any]]:
        docs = self._col().where("jobId", "==", job_id).stream()
        results = [d.to_dict() for d in docs]
        # Sort chronologically
        results.sort(key=lambda m: m.get("createdAt") or "")
        return results

    def add_message(self, message_dict: Dict[str, Any]) -> Dict[str, Any]:
        msg_id = message_dict.get("id") or generate_id("msg")
        data = dict(message_dict)
        data["id"] = msg_id
        data["createdAt"] = data.get("createdAt") or utc_now_iso()
        self._col().document(msg_id).set(data)
        return data

message_repo = MessageRepository()
