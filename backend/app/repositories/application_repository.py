from typing import Optional, Dict, Any, List
from ..firebase.firestore import get_firestore_client
from ..utils.helpers import utc_now_iso, generate_id
from ..constants.application_status import ApplicationStatus

class ApplicationRepository:
    def __init__(self):
        self.collection_name = "applications"

    def _col(self):
        return get_firestore_client().collection(self.collection_name)

    def create(self, app_dict: Dict[str, Any]) -> Dict[str, Any]:
        app_id = app_dict.get("id") or generate_id("app")
        data = dict(app_dict)
        data["id"] = app_id
        data["appliedAt"] = data.get("appliedAt") or utc_now_iso()
        if "status" not in data:
            data["status"] = ApplicationStatus.APPLIED.value
        if "paymentStatus" not in data:
            data["paymentStatus"] = "pending"

        self._col().document(app_id).set(data)
        return self.get_by_id(app_id)

    def get_by_id(self, app_id: str) -> Optional[Dict[str, Any]]:
        doc = self._col().document(app_id).get()
        if doc.exists:
            data = doc.to_dict()
            data["id"] = app_id
            return data
        return None

    def get_by_job_and_worker(self, job_id: str, worker_id: str) -> Optional[Dict[str, Any]]:
        docs = self._col().where("jobId", "==", job_id).where("workerId", "==", worker_id).limit(1).stream()
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            return data
        return None

    def list_by_job(self, job_id: str) -> List[Dict[str, Any]]:
        docs = self._col().where("jobId", "==", job_id).stream()
        return [d.to_dict() for d in docs]

    def list_by_worker(self, worker_id: str) -> List[Dict[str, Any]]:
        docs = self._col().where("workerId", "==", worker_id).stream()
        return [d.to_dict() for d in docs]

    def update_status(self, app_id: str, new_status: str, extra_data: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        doc_ref = self._col().document(app_id)
        if not doc_ref.get().exists:
            return None
        updates = {"status": new_status}
        if extra_data:
            updates.update(extra_data)
        doc_ref.set(updates, merge=True)
        return self.get_by_id(app_id)

application_repo = ApplicationRepository()
