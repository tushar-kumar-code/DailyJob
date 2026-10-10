from typing import Optional, Dict, Any, List
from ..firebase.firestore import get_firestore_client
from ..utils.helpers import utc_now_iso, generate_id
from ..constants.trades import INITIAL_TRADES

class JobRepository:
    def __init__(self):
        self.collection_name = "jobs"

    def _col(self):
        return get_firestore_client().collection(self.collection_name)

    def create(self, job_dict: Dict[str, Any]) -> Dict[str, Any]:
        job_id = job_dict.get("id") or generate_id("job")
        job_data = dict(job_dict)
        job_data["id"] = job_id
        job_data["createdAt"] = job_data.get("createdAt") or utc_now_iso()
        job_data["updatedAt"] = utc_now_iso()
        if "workersApplied" not in job_data:
            job_data["workersApplied"] = 0
        if "status" not in job_data:
            job_data["status"] = "open"

        self._col().document(job_id).set(job_data)
        return self.get_by_id(job_id)

    def get_by_id(self, job_id: str) -> Optional[Dict[str, Any]]:
        doc = self._col().document(job_id).get()
        if doc.exists:
            data = doc.to_dict()
            data["id"] = job_id
            return data
        return None

    def list_jobs(self,
                  trade_id: Optional[str] = None,
                  city: Optional[str] = None,
                  search_query: Optional[str] = None,
                  min_wage: Optional[int] = None,
                  max_distance: Optional[float] = None,
                  date_filter: Optional[str] = None,
                  urgent_only: Optional[bool] = None,
                  beginner_friendly: Optional[bool] = None) -> List[Dict[str, Any]]:
        
        all_docs = [d.to_dict() for d in self._col().stream()]
        results = []

        for j in all_docs:
            if j.get("status") not in ("open", None):
                continue
            if trade_id and trade_id != "all" and j.get("tradeId") != trade_id:
                continue
            if city and j.get("city", "").lower() != city.lower():
                continue
            if min_wage and (j.get("wage") or 0) < min_wage:
                continue
            if max_distance and (j.get("distanceKm") or 0) > max_distance:
                continue
            if urgent_only and not j.get("urgent"):
                continue
            if beginner_friendly and not j.get("beginnerFriendly"):
                continue

            # Date filter matching
            if date_filter and date_filter != "all":
                j_date = j.get("date", "").lower()
                if date_filter == "today" and ("आज" not in j_date and "today" not in j_date):
                    continue
                elif date_filter == "tomorrow" and ("कल" not in j_date and "tomorrow" not in j_date):
                    continue

            # Search query matching
            if search_query:
                q = search_query.lower().strip()
                title_hi = j.get("titleHi", "").lower()
                title_en = j.get("titleEn", "").lower()
                loc = j.get("locationName", "").lower()
                city_name = j.get("city", "").lower()
                if q not in title_hi and q not in title_en and q not in loc and q not in city_name:
                    continue

            results.append(j)

        return results

    def list_all(self) -> List[Dict[str, Any]]:
        docs = self._col().stream()
        return [d.to_dict() for d in docs]

    def list_by_employer(self, employer_id: str) -> List[Dict[str, Any]]:
        docs = self._col().where("employerId", "==", employer_id).stream()
        return [d.to_dict() for d in docs]

    def update(self, job_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        doc_ref = self._col().document(job_id)
        if not doc_ref.get().exists:
            return None
        data = dict(updates)
        data["updatedAt"] = utc_now_iso()
        doc_ref.set(data, merge=True)
        return self.get_by_id(job_id)

    def delete(self, job_id: str) -> bool:
        doc_ref = self._col().document(job_id)
        if not doc_ref.get().exists:
            return False
        doc_ref.delete()
        return True

    def increment_workers_applied(self, job_id: str) -> None:
        job = self.get_by_id(job_id)
        if job:
            current = job.get("workersApplied", 0)
            self._col().document(job_id).set({"workersApplied": current + 1}, merge=True)

job_repo = JobRepository()
