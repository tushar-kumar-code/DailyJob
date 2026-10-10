from typing import List, Dict, Any
from ..firebase.firestore import get_firestore_client
from ..utils.helpers import utc_now_iso

class BookmarkRepository:
    def __init__(self):
        self.collection_name = "bookmarks"

    def _col(self):
        return get_firestore_client().collection(self.collection_name)

    def add_bookmark(self, user_id: str, job_id: str) -> None:
        doc_id = f"{user_id}_{job_id}"
        self._col().document(doc_id).set({
            "userId": user_id,
            "jobId": job_id,
            "createdAt": utc_now_iso()
        })

    def remove_bookmark(self, user_id: str, job_id: str) -> None:
        doc_id = f"{user_id}_{job_id}"
        self._col().document(doc_id).delete()

    def get_user_bookmarks(self, user_id: str) -> List[str]:
        docs = self._col().where("userId", "==", user_id).stream()
        return [d.to_dict().get("jobId") for d in docs if d.to_dict().get("jobId")]

bookmark_repo = BookmarkRepository()
