from typing import Optional, Dict, Any, List
from ..firebase.firestore import get_firestore_client
from ..utils.helpers import utc_now_iso

class SkillRepository:
    def __init__(self):
        self.collection_name = "skills"

    def _col(self):
        return get_firestore_client().collection(self.collection_name)

    def get_skills_for_worker(self, worker_id: str) -> List[Dict[str, Any]]:
        docs = self._col().where("workerId", "==", worker_id).stream()
        return [d.to_dict() for d in docs]

    def save_skill(self, worker_id: str, skill_id: str, skill_data: Dict[str, Any]) -> Dict[str, Any]:
        doc_id = f"{worker_id}_{skill_id}"
        data = dict(skill_data)
        data["id"] = skill_id
        data["workerId"] = worker_id
        data["updatedAt"] = utc_now_iso()
        self._col().document(doc_id).set(data, merge=True)
        return data

skill_repo = SkillRepository()
