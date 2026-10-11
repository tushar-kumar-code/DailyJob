import os
import sys
import json
import logging
from typing import Optional, Any
import firebase_admin
from firebase_admin import credentials, firestore, storage, auth
from ..core.config import settings

logger = logging.getLogger("dailyjob.firebase")

_firebase_app: Optional[firebase_admin.App] = None
_firestore_client: Optional[Any] = None
_storage_bucket: Optional[Any] = None
_is_mock_mode: bool = False

def initialize_firebase() -> bool:
    """
    Initializes the Firebase Admin SDK for the dedicated DailyJob project.
    Returns True if live Firebase was initialized, False if fallback mode is active.
    """
    global _firebase_app, _firestore_client, _storage_bucket, _is_mock_mode

    if os.environ.get("FORCE_MOCK_FIREBASE") == "true" or "pytest" in sys.modules or os.environ.get("PYTEST_CURRENT_TEST"):
        _is_mock_mode = True
        logger.info("Test environment detected; using isolated mock Firestore.")
        return False

    if _firebase_app is not None:
        return not _is_mock_mode

    # Check for credentials
    cred = None
    cred_path = settings.FIREBASE_CREDENTIALS_PATH
    if not os.path.isabs(cred_path):
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        candidate_path = os.path.join(base_dir, cred_path)
        if os.path.exists(candidate_path):
            cred_path = candidate_path

    if settings.FIREBASE_CREDENTIALS_JSON:
        try:
            cred_dict = json.loads(settings.FIREBASE_CREDENTIALS_JSON)
            cred = credentials.Certificate(cred_dict)
            logger.info("Initializing Firebase with inline credentials JSON")
        except Exception as e:
            logger.warning(f"Failed to parse FIREBASE_CREDENTIALS_JSON: {e}")

    elif os.path.exists(cred_path):
        try:
            cred = credentials.Certificate(cred_path)
            logger.info(f"Initializing Firebase with certificate file at {cred_path}")
        except Exception as e:
            logger.warning(f"Failed to load certificate from {cred_path}: {e}")

    if cred:
        try:
            _firebase_app = firebase_admin.initialize_app(cred, {
                'projectId': settings.FIREBASE_PROJECT_ID,
                'storageBucket': settings.FIREBASE_STORAGE_BUCKET
            })
            _firestore_client = firestore.client()
            _is_mock_mode = False
            logger.info(f"Connected to live Firebase project '{settings.FIREBASE_PROJECT_ID}'")
            return True
        except Exception as e:
            logger.error(f"Error initializing Firebase Admin app: {e}")

    # Fallback mode for development/testing without active service account file
    if settings.USE_FIREBASE_MOCK_FALLBACK:
        _is_mock_mode = True
        logger.info("No serviceAccountKey.json found; activating DailyJob in-memory/mock Firestore engine for offline development & tests.")
        return False
    else:
        raise RuntimeError(
            f"Firebase service account not found at {cred_path} and USE_FIREBASE_MOCK_FALLBACK is disabled. "
            f"Please place your DailyJob serviceAccountKey.json in the backend directory."
        )

def get_firebase_app():
    if _firebase_app is None and not _is_mock_mode:
        initialize_firebase()
    return _firebase_app

def is_mock_mode() -> bool:
    if os.environ.get("FORCE_MOCK_FIREBASE") == "true" or "pytest" in sys.modules or os.environ.get("PYTEST_CURRENT_TEST"):
        return True
    return _is_mock_mode
