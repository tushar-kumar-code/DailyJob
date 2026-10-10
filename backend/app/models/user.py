from typing import Optional, Dict, Any
from dataclasses import dataclass, field
from ..constants.roles import UserRole

@dataclass
class ProfileDataModel:
    user_type: str  # "job_seeker" | "employer"
    age: int
    profession: str
    custom_profession: Optional[str] = None
    completed_at: Optional[str] = None

@dataclass
class UserModel:
    uid: str
    email: str
    username: str
    name: Optional[str] = None
    mobile_number: Optional[str] = None
    role: UserRole = UserRole.WORKER
    account_type: Optional[str] = "job_seeker"
    profile_completed: bool = False
    age: Optional[int] = None
    worker_profile: Optional[Dict[str, Any]] = None
    employer_profile: Optional[Dict[str, Any]] = None
    job_seeker_profile: Optional[Dict[str, Any]] = None
    profile: Optional[Dict[str, Any]] = None
    completion_percentage: int = 0
    saved_data: Optional[Dict[str, Any]] = None
    auth_provider: str = "firebase"
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
