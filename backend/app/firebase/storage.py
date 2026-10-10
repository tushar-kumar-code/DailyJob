import os
import uuid
import logging
from typing import Optional, Tuple
from fastapi import HTTPException, status
from ..core.config import settings
from .client import initialize_firebase, is_mock_mode

logger = logging.getLogger("dailyjob.storage")

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".pdf"}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB

def validate_file(filename: str, file_size: int) -> None:
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    if file_size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum limit of 5MB"
        )

def upload_file_to_storage(file_bytes: bytes, filename: str, folder: str = "evidence") -> str:
    """
    Uploads a file to Firebase Storage under the DailyJob bucket.
    Returns the public or access URL.
    """
    initialize_firebase()
    ext = os.path.splitext(filename)[1].lower() or ".jpg"
    unique_filename = f"{folder}/{uuid.uuid4().hex}{ext}"

    if not is_mock_mode():
        try:
            from firebase_admin import storage
            bucket = storage.bucket(settings.FIREBASE_STORAGE_BUCKET)
            blob = bucket.blob(unique_filename)
            blob.upload_from_string(file_bytes, content_type="application/octet-stream")
            blob.make_public()
            return blob.public_url
        except Exception as e:
            logger.error(f"Failed to upload to Firebase Storage: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload file to cloud storage"
            )

    # In mock fallback mode
    return f"https://storage.dailyjob.local/{settings.FIREBASE_STORAGE_BUCKET}/{unique_filename}"
