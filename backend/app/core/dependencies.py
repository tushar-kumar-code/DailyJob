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
    and verifies it against Firebase Authentication.
    """
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:].strip()
    elif cgneeti_session:
        token = cgneeti_session.strip()

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in."
        )

    return authenticate_firebase_token(token)

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
    if role not in (UserRole.EMPLOYER.value, "employer", UserRole.ADMIN.value):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted: Only employers can perform this action."
        )
    return current_user

def require_admin(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    role = current_user.get("role")
    if role not in (UserRole.ADMIN.value, "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Admin privileges required."
        )
    return current_user
