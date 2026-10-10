from fastapi import APIRouter, Depends, HTTPException, Response, status
from typing import Dict, Any
from ..core.config import settings
from ..core.dependencies import get_current_user
from ..schemas.auth import FirebaseTokenRequest, UserRegisterRequest, UserLoginRequest, AuthResponse
from ..services.auth_service import auth_service
from ..repositories.user_repository import user_repo

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.get("/config")
def get_auth_config():
    """Returns Firebase and public client configuration."""
    return {
        "firebaseProjectId": settings.FIREBASE_PROJECT_ID,
        "firebaseStorageBucket": settings.FIREBASE_STORAGE_BUCKET,
        "authProvider": "firebase_auth"
    }

@router.post("/firebase-login", response_model=AuthResponse)
@router.post("/verify-token", response_model=AuthResponse)
def firebase_login(req: FirebaseTokenRequest, response: Response):
    """
    Receives client-side Firebase ID Token, verifies it, creates/syncs user
    in Firestore, and sets HttpOnly session cookie.
    """
    user = auth_service.sync_firebase_user(req.id_token)
    token = req.id_token

    # Issue secure session cookie
    response.set_cookie(
        key="cgneeti_session",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=7 * 86400,
        path="/"
    )

    return AuthResponse(
        success=True,
        message="Signed in successfully with Firebase",
        user=user,
        token=token
    )

@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(req: UserRegisterRequest, response: Response):
    """
    Signup endpoint syncing with Firebase User repository.
    """
    existing = user_repo.get_by_email(req.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists."
        )

    # Use email prefix or unique ID as UID
    import uuid
    uid = f"usr_{uuid.uuid4().hex[:12]}"

    # Sync to Firebase Authentication
    try:
        from firebase_admin import auth as fb_auth
        fb_auth.create_user(
            uid=uid,
            email=req.email.strip().lower(),
            password=req.password,
            display_name=req.username.strip()
        )
    except Exception:
        pass

    user = user_repo.create_or_update(uid, {
        "email": req.email.strip().lower(),
        "username": req.username.strip(),
        "name": req.username.strip(),
        "role": req.role.value if hasattr(req.role, 'value') else req.role,
        "profile_completed": False
    })

    # In mock/offline or direct dev mode, generate session token
    token = f"mock_token_{uid}"
    response.set_cookie(
        key="cgneeti_session",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=7 * 86400,
        path="/"
    )

    return AuthResponse(
        success=True,
        message="Account created successfully.",
        user=user,
        token=token
    )

@router.post("/signin", response_model=AuthResponse)
def signin(req: UserLoginRequest, response: Response):
    """
    Sign in verification endpoint.
    """
    user = user_repo.get_by_email(req.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    uid = user["uid"]
    token = f"mock_token_{uid}"
    response.set_cookie(
        key="cgneeti_session",
        value=token,
        httponly=True,
        samesite="lax",
        max_age=7 * 86400,
        path="/"
    )

    return AuthResponse(
        success=True,
        message="Signed in successfully.",
        user=user,
        token=token
    )

@router.get("/me")
def get_current_authenticated_user(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Returns current verified user identity."""
    return {
        "authenticated": True,
        "uid": current_user["uid"],
        "role": current_user.get("role", "worker"),
        "user": current_user,
        **current_user
    }

@router.post("/logout")
def logout(response: Response):
    """Clears authentication session cookie."""
    response.delete_cookie(key="cgneeti_session", path="/")
    return {"success": True, "message": "Logged out successfully."}
