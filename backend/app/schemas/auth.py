from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any
from ..constants.roles import UserRole

class FirebaseTokenRequest(BaseModel):
    id_token: Optional[str] = Field(None, description="Firebase ID Token from client SDK")
    idToken: Optional[str] = Field(None, description="CamelCase alias for id_token")

    def model_post_init(self, __context: Any) -> None:
        if not self.id_token and self.idToken:
            self.id_token = self.idToken
        if not self.id_token:
            raise ValueError("id_token or idToken is required")

class UserRegisterRequest(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=2, max_length=50)
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    mobile_number: Optional[str] = Field(None, description="Valid mobile phone number")
    password: Optional[str] = Field(None, min_length=6)
    confirm_password: Optional[str] = Field(None, min_length=6)
    account_type: Optional[str] = Field("job_seeker", description="job_seeker or employer")
    role: UserRole = UserRole.WORKER

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str
    username: Optional[str] = None

class AuthResponse(BaseModel):
    success: bool = True
    message: str = "Success"
    user: Optional[Dict[str, Any]] = None
    token: Optional[str] = None
