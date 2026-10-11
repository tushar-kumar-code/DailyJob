from typing import Optional, Dict, Any
from fastapi import Header, Cookie, HTTPException, status, Depends
from .security import authenticate_firebase_token
from ..constants.roles import UserRole

def get_current_user(
    authorization: Optional[str] = Header(None),
    cgneeti_session: Optional[str] = Cookie(None)
) -> Dict[str, Any]:
    """
    Extracts Bearer token from Authorization header or session cookie
    and verifies it against Firebase Authentication / JWT session.
    """
    candidates = []
    dummy_tokens = {"session_token", "token_local", "null", "undefined", ""}

    if authorization and authorization.startswith("Bearer "):
        tok = authorization[7:].strip()
        if tok and tok not in dummy_tokens:
            candidates.append(tok)

    if cgneeti_session:
        tok = cgneeti_session.strip()
        if tok and tok not in dummy_tokens and tok not in candidates:
            candidates.append(tok)

    if not candidates:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in."
        )

    last_exc = None
    for token in candidates:
        try:
            return authenticate_firebase_token(token)
        except HTTPException as e:
            last_exc = e
        except Exception as e:
            last_exc = HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Token verification failed: {str(e)}"
            )

    raise last_exc or HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication token. Please sign in again."
    )

def require_worker(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    role = current_user.get("role", "worker")
    if role not in (UserRole.WORKER.value, "worker", UserRole.ADMIN.value):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted: Only workers can perform this action."
        )
    return current_user

def require_employer(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    role = current_user.get("role", "worker")
    if role in (UserRole.EMPLOYER.value, "employer", UserRole.ADMIN.value):
        return current_user

    uid = current_user.get("uid")
    if uid:
        from ..repositories.user_repository import user_repo
        db_user = user_repo.get_by_uid(uid)
        if db_user:
            if db_user.get("role") in (UserRole.EMPLOYER.value, "employer", UserRole.ADMIN.value):
                return db_user
            if db_user.get("account_type") == "employer" or db_user.get("employer_profile"):
                updated = user_repo.switch_role(uid, "employer")
                if updated:
                    return updated

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access restricted: Only employers can perform this action."
    )

def require_admin(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    role = current_user.get("role")
    if role not in (UserRole.ADMIN.value, "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Admin privileges required."
        )
    return current_user
