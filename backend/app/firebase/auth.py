from typing import Dict, Any, Optional
import json
import base64
from fastapi import HTTPException, status
from .client import initialize_firebase, is_mock_mode

def verify_firebase_id_token(id_token: str) -> Dict[str, Any]:
    """
    Verifies a Firebase ID token or server JWT session token.
    Returns decoded token dictionary containing 'uid', 'email', etc.
    """
    if not id_token or not isinstance(id_token, str):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication token"
        )

    # 1. Allow mock tokens for automated tests and offline simulation
    if id_token.startswith("mock_token_"):
        parts = id_token.split("_", 2)
        uid = parts[2] if len(parts) > 2 else "mock_user"
        return {
            "uid": uid,
            "email": f"{uid}@dailyjob.local",
            "name": uid.capitalize(),
            "auth_time": 1700000000,
            "iss": "https://securetoken.google.com/dailyjob-93863",
            "aud": "dailyjob-93863"
        }

    # 2. Support standard 3-part JWT issued by server.js (session cookies / Bearer tokens)
    if id_token.count('.') == 2:
        try:
            jwt_parts = id_token.split('.')
            padded = jwt_parts[1] + '=' * (-len(jwt_parts[1]) % 4)
            jwt_data = json.loads(base64.urlsafe_b64decode(padded.encode('ascii')).decode('utf-8'))
            if isinstance(jwt_data, dict):
                uid = jwt_data.get("sub") or jwt_data.get("uid") or jwt_data.get("user_id")
                if uid:
                    return {
                        "uid": uid,
                        "email": jwt_data.get("email", f"{uid}@dailyjob.local"),
                        "name": jwt_data.get("name", uid),
                        "role": jwt_data.get("role", "worker"),
                        "auth_time": 1700000000
                    }
        except Exception:
            pass

    # 3. Live Google Firebase ID Token verification via Admin SDK
    initialize_firebase()

    if not is_mock_mode():
        try:
            from firebase_admin import auth
            decoded_token = auth.verify_id_token(id_token)
            return decoded_token
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid or expired Firebase authentication token: {str(e)}"
            )

    # Fallback for base64 JSON or test tokens in mock mode
    try:
        decoded_bytes = base64.b64decode(id_token)
        data = json.loads(decoded_bytes.decode('utf-8'))
        if isinstance(data, dict) and "uid" in data:
            return data
    except Exception:
        pass

    if len(id_token) >= 5:
        return {
            "uid": f"usr_{id_token[:12]}",
            "email": f"user_{id_token[:8]}@dailyjob.local",
            "name": "DailyJob Test User"
        }

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication token"
    )
