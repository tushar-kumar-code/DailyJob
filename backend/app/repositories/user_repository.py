from typing import Optional, Dict, Any, List
from ..firebase.firestore import get_firestore_client
from ..utils.helpers import utc_now_iso

class UserRepository:
    def __init__(self):
        self.collection_name = "users"

    def _col(self):
        return get_firestore_client().collection(self.collection_name)

    def get_by_uid(self, uid: str) -> Optional[Dict[str, Any]]:
        doc = self._col().document(uid).get()
        if doc.exists:
            data = doc.to_dict()
            data["uid"] = uid
            data["user_id"] = uid
            data["id"] = uid
            return data
        return None

    def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        clean_email = email.strip().lower()
        docs = self._col().where("email", "==", clean_email).limit(1).stream()
        for doc in docs:
            data = doc.to_dict()
            data["uid"] = doc.id
            data["user_id"] = doc.id
            data["id"] = doc.id
            return data
        return None

    def create_or_update(self, uid: str, user_dict: Dict[str, Any]) -> Dict[str, Any]:
        now = utc_now_iso()
        doc_ref = self._col().document(uid)
        existing = doc_ref.get()

        data = dict(user_dict)
        data["uid"] = uid
        data["user_id"] = uid
        data["id"] = uid
        data["updated_at"] = now

        if not existing.exists:
            data["created_at"] = now
            if "role" not in data:
                data["role"] = "worker"
            if "profile_completed" not in data:
                data["profile_completed"] = False
            doc_ref.set(data)
        else:
            doc_ref.set(data, merge=True)

        return self.get_by_uid(uid)

    def save_user_data(self, uid: str, saved_data: Dict[str, Any]) -> None:
        self._col().document(uid).set({
            "saved_data": saved_data,
            "updated_at": utc_now_iso()
        }, merge=True)

    def switch_role(self, uid: str, new_role: str) -> Optional[Dict[str, Any]]:
        user = self.get_by_uid(uid)
        if not user:
            return None

        updates = {
            "role": new_role,
            "updated_at": utc_now_iso()
        }
        if new_role == "worker" and user.get("worker_profile"):
            updates["profile"] = user["worker_profile"]
        elif new_role == "employer" and user.get("employer_profile"):
            updates["profile"] = user["employer_profile"]

        self._col().document(uid).set(updates, merge=True)
        return self.get_by_uid(uid)

user_repo = UserRepository()
