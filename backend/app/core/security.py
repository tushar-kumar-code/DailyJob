from typing import Dict, Any, Optional
from fastapi import HTTPException, status
from ..firebase.auth import verify_firebase_id_token
from ..repositories.user_repository import user_repo

def authenticate_firebase_token(id_token: str) -> Dict[str, Any]:
    """
    Decodes token, extracts UID and ensures a corresponding
    Firestore User profile exists.
    """
    decoded = verify_firebase_id_token(id_token)
    uid = decoded.get("uid")
    if not uid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload is missing user identity (UID)"
        )

    # Fetch user document from Firestore or auto-initialize
    user = user_repo.get_by_uid(uid)
    if not user:
        email = decoded.get("email") or f"{uid}@dailyjob.local"
        name = decoded.get("name") or decoded.get("email", "").split("@")[0] or "User"
        user = user_repo.create_or_update(uid, {
            "email": email,
            "username": name,
            "name": name,
            "role": decoded.get("role", "worker"),
            "profile_completed": False
        })

    return user
