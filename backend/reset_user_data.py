import os
import sys
import json
import time
from datetime import datetime
from typing import Dict, Any, List

# Ensure backend root is in python path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from app.firebase.client import initialize_firebase, is_mock_mode
from app.firebase.firestore import get_firestore_client
import firebase_admin
from firebase_admin import auth

COLLECTIONS_TO_CLEAR = [
    "users",
    "jobs",
    "applications",
    "notifications",
    "messages",
    "payments",
    "safety_alerts",
    "skills",
    "disputes",
    "bookmarks"
]

def create_backup(backup_dir: str) -> Dict[str, Any]:
    os.makedirs(backup_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_summary = {
        "timestamp": timestamp,
        "collections": {},
        "auth_users_count": 0,
        "local_users_count": 0
    }

    # 1. Backup local data/users.json
    workspace_root = os.path.dirname(current_dir)
    users_json_path = os.path.join(workspace_root, "data", "users.json")
    if os.path.exists(users_json_path):
        try:
            with open(users_json_path, "r", encoding="utf-8") as f:
                local_users = json.load(f)
            backup_summary["local_users_count"] = len(local_users)
            users_backup_file = os.path.join(backup_dir, f"users_json_backup_{timestamp}.json")
            with open(users_backup_file, "w", encoding="utf-8") as f:
                json.dump(local_users, f, indent=2, ensure_ascii=False)
            print(f"[Backup] Saved {len(local_users)} local users to {users_backup_file}")
        except Exception as e:
            print(f"[Backup Warning] Error backing up data/users.json: {e}")

    # 2. Backup Firestore collections
    db = get_firestore_client()
    firestore_data: Dict[str, List[Dict[str, Any]]] = {}
    
    for col_name in COLLECTIONS_TO_CLEAR:
        try:
            docs = list(db.collection(col_name).stream())
            docs_data = []
            for d in docs:
                data = d.to_dict() or {}
                data["_doc_id"] = d.id
                docs_data.append(data)
            firestore_data[col_name] = docs_data
            backup_summary["collections"][col_name] = len(docs_data)
            print(f"[Backup] Found {len(docs_data)} document(s) in collection '{col_name}'")
        except Exception as e:
            print(f"[Backup Warning] Error reading collection '{col_name}': {e}")
            firestore_data[col_name] = []
            backup_summary["collections"][col_name] = 0

    firestore_backup_file = os.path.join(backup_dir, f"firestore_backup_{timestamp}.json")
    with open(firestore_backup_file, "w", encoding="utf-8") as f:
        json.dump(firestore_data, f, indent=2, ensure_ascii=False, default=str)
    print(f"[Backup] Saved all Firestore collections to {firestore_backup_file}")

    # 3. Backup Firebase Auth users
    auth_users_data = []
    try:
        page = auth.list_users()
        for u in page.iterate_all():
            auth_users_data.append({
                "uid": u.uid,
                "email": u.email,
                "display_name": u.display_name,
                "phone_number": u.phone_number,
                "disabled": u.disabled,
                "created_at": u.user_metadata.creation_timestamp if u.user_metadata else None
            })
        backup_summary["auth_users_count"] = len(auth_users_data)
        auth_backup_file = os.path.join(backup_dir, f"firebase_auth_backup_{timestamp}.json")
        with open(auth_backup_file, "w", encoding="utf-8") as f:
            json.dump(auth_users_data, f, indent=2, ensure_ascii=False)
        print(f"[Backup] Saved {len(auth_users_data)} Firebase Auth users to {auth_backup_file}")
    except Exception as e:
        print(f"[Backup Warning] Error backing up Firebase Auth: {e}")

    return backup_summary

def clear_data() -> Dict[str, Any]:
    print("\n--- Starting Data Cleanup ---")
    results = {
        "local_users_cleared": False,
        "firestore_deleted": {},
        "auth_users_deleted": 0
    }

    # 1. Clear data/users.json safely
    workspace_root = os.path.dirname(current_dir)
    users_json_path = os.path.join(workspace_root, "data", "users.json")
    try:
        with open(users_json_path, "w", encoding="utf-8") as f:
            json.dump([], f, indent=2)
        results["local_users_cleared"] = True
        print(f"[Clean] Successfully reset {users_json_path} to empty list []")
    except Exception as e:
        print(f"[Clean Error] Failed to reset {users_json_path}: {e}")

    # 2. Clear Firestore collections (batch deletion)
    db = get_firestore_client()
    all_col_names = set(COLLECTIONS_TO_CLEAR)
    try:
        for c in db.collections():
            all_col_names.add(c.id)
    except Exception as e:
        print(f"[Warning] Error listing collections: {e}")

    for col_name in all_col_names:
        try:
            col_ref = db.collection(col_name)
            docs = list(col_ref.stream())
            deleted_count = 0
            if docs:
                batch = db.batch()
                b_count = 0
                for d in docs:
                    batch.delete(d.reference)
                    b_count += 1
                    deleted_count += 1
                    if b_count >= 400:  # Firestore batch max is 500
                        batch.commit()
                        batch = db.batch()
                        b_count = 0
                if b_count > 0:
                    batch.commit()
            results["firestore_deleted"][col_name] = deleted_count
            print(f"[Clean] Deleted {deleted_count} document(s) from collection '{col_name}'")
        except Exception as e:
            print(f"[Clean Error] Error cleaning collection '{col_name}': {e}")
            results["firestore_deleted"][col_name] = 0

    # 3. Clear Firebase Auth users
    try:
        page = auth.list_users()
        uids = [u.uid for u in page.iterate_all()]
        if uids:
            chunk_size = 500
            for i in range(0, len(uids), chunk_size):
                chunk = uids[i:i + chunk_size]
                res = auth.delete_users(chunk)
                print(f"[Clean] Deleted batch of {res.success_count} auth users (errors: {res.failure_count})")
            results["auth_users_deleted"] = len(uids)
            print(f"[Clean] Total {len(uids)} Firebase Auth users removed.")
        else:
            print("[Clean] No Firebase Auth users to delete.")
    except Exception as e:
        print(f"[Clean Error] Error deleting Firebase Auth users: {e}")

    return results

def main():
    print("=" * 60)
    print(" DailyJob User & Test Data Reset Utility")
    print("=" * 60)
    
    initialize_firebase()
    if is_mock_mode():
        print("[Notice] Running in MOCK FIREBASE mode.")
    else:
        print("[Notice] Running with LIVE FIREBASE (dailyjob-93863).")

    workspace_root = os.path.dirname(current_dir)
    backup_dir = os.path.join(workspace_root, "data", "backups")
    
    print(f"\nStep 1: Creating full timestamped backup in {backup_dir}...")
    backup_summary = create_backup(backup_dir)
    
    print("\nStep 2: Cleaning all user data...")
    clean_results = clear_data()
    
    print("\n" + "=" * 60)
    print(" Cleanup Complete!")
    print(f" - Local users reset: {clean_results['local_users_cleared']}")
    print(f" - Firebase Auth users deleted: {clean_results['auth_users_deleted']}")
    print(f" - Firestore collections cleared: {json.dumps(clean_results['firestore_deleted'], indent=2)}")
    print(f" - Backups safely stored at: {backup_dir}")
    print("=" * 60)

if __name__ == "__main__":
    main()
