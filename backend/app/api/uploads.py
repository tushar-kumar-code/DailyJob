from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from typing import Dict, Any, Optional
from ..core.dependencies import get_current_user
from ..firebase.storage import validate_file, upload_file_to_storage

router = APIRouter(prefix="/api/uploads", tags=["Uploads"])

@router.post("")
async def upload_file(
    file: UploadFile = File(...),
    folder: Optional[str] = Form("evidence"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    if folder not in ["evidence", "profiles", "documents"]:
        folder = "evidence"

    contents = await file.read()
    validate_file(file.filename or "upload.jpg", len(contents))
    
    file_url = upload_file_to_storage(
        file_bytes=contents,
        filename=file.filename or "file.jpg",
        folder=f"{current_user['uid']}/{folder}"
    )
    
    return {
        "success": True,
        "url": file_url,
        "filename": file.filename,
        "size": len(contents)
    }
