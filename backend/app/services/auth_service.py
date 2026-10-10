from typing import Dict, Any, Optional
from fastapi import HTTPException, status
from ..repositories.user_repository import user_repo
from ..firebase.auth import verify_firebase_id_token
from ..utils.validators import validate_email, sanitize_string

class AuthService:
    def sync_firebase_user(self, id_token: str, custom_role: Optional[str] = None) -> Dict[str, Any]:
        """
        Takes a Firebase ID token generated on client, validates it with
        Firebase Admin SDK, and syncs user into Firestore.
        """
        decoded = verify_firebase_id_token(id_token)
        uid = decoded["uid"]
        email = decoded.get("email") or f"{uid}@dailyjob.local"
        name = decoded.get("name") or email.split("@")[0]

        existing = user_repo.get_by_uid(uid)
        if not existing:
            user = user_repo.create_or_update(uid, {
                "email": email,
                "username": name,
                "name": name,
                "role": custom_role or "worker",
                "profile_completed": False
            })
        else:
            user = existing

        return user

auth_service = AuthService()
