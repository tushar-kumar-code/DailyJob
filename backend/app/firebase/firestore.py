from typing import Any, Dict, List, Optional
import copy
from .client import initialize_firebase, is_mock_mode

class MockDocumentSnapshot:
    def __init__(self, doc_id: str, data: Optional[Dict[str, Any]]):
        self.id = doc_id
        self._data = copy.deepcopy(data) if data is not None else None
        self.exists = data is not None

    def to_dict(self) -> Optional[Dict[str, Any]]:
        return copy.deepcopy(self._data)

class MockDocumentReference:
    def __init__(self, collection: 'MockCollectionReference', doc_id: str):
        self.collection = collection
        self.id = doc_id

    def get(self) -> MockDocumentSnapshot:
        data = self.collection._docs.get(self.id)
        return MockDocumentSnapshot(self.id, data)

    def set(self, data: Dict[str, Any], merge: bool = False) -> None:
        if merge and self.id in self.collection._docs:
            self.collection._docs[self.id].update(copy.deepcopy(data))
        else:
            self.collection._docs[self.id] = copy.deepcopy(data)

    def update(self, data: Dict[str, Any]) -> None:
        if self.id not in self.collection._docs:
            raise KeyError(f"Document {self.id} does not exist")
        self.collection._docs[self.id].update(copy.deepcopy(data))

    def delete(self) -> None:
        if self.id in self.collection._docs:
            del self.collection._docs[self.id]

class MockQuery:
    def __init__(self, collection: 'MockCollectionReference', filters: Optional[List] = None, limit_val: Optional[int] = None):
        self.collection = collection
        self.filters = filters or []
        self._limit = limit_val

    def where(self, field_path: str, op_string: str, value: Any) -> 'MockQuery':
        new_filters = list(self.filters)
        new_filters.append((field_path, op_string, value))
        return MockQuery(self.collection, new_filters, self._limit)

    def limit(self, count: int) -> 'MockQuery':
        return MockQuery(self.collection, self.filters, count)

    def stream(self):
        results = []
        for doc_id, data in self.collection._docs.items():
            match = True
            for field, op, val in self.filters:
                doc_val = data.get(field)
                if op == "==" and doc_val != val:
                    match = False
                    break
                elif op == ">=" and (doc_val is None or doc_val < val):
                    match = False
                    break
                elif op == "<=" and (doc_val is None or doc_val > val):
                    match = False
                    break
                elif op == ">" and (doc_val is None or doc_val <= val):
                    match = False
                    break
                elif op == "<" and (doc_val is None or doc_val >= val):
                    match = False
                    break
                elif op == "in" and doc_val not in val:
                    match = False
                    break
                elif op == "array_contains" and (not isinstance(doc_val, list) or val not in doc_val):
                    match = False
                    break
            if match:
                results.append(MockDocumentSnapshot(doc_id, data))

        if self._limit is not None:
            results = results[:self._limit]
        return results

class MockCollectionReference:
    def __init__(self, name: str, db: 'MockFirestoreDB'):
        self.name = name
        self.db = db
        self._docs: Dict[str, Dict[str, Any]] = {}

    def document(self, doc_id: str) -> MockDocumentReference:
        return MockDocumentReference(self, doc_id)

    def where(self, field_path: str, op_string: str, value: Any) -> MockQuery:
        return MockQuery(self).where(field_path, op_string, value)

    def limit(self, count: int) -> MockQuery:
        return MockQuery(self, limit_val=count)

    def stream(self):
        return [MockDocumentSnapshot(doc_id, data) for doc_id, data in self._docs.items()]

class MockFirestoreDB:
    def __init__(self):
        self._collections: Dict[str, MockCollectionReference] = {}

    def collection(self, name: str) -> MockCollectionReference:
        if name not in self._collections:
            self._collections[name] = MockCollectionReference(name, self)
        return self._collections[name]

    def reset(self):
        self._collections.clear()

_mock_db: Optional[MockFirestoreDB] = None

def get_firestore_client():
    initialize_firebase()
    if is_mock_mode():
        global _mock_db
        if _mock_db is None:
            _mock_db = MockFirestoreDB()
        return _mock_db
    else:
        from firebase_admin import firestore
        return firestore.client()
