from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "DailyJob API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    PORT: int = 8001
    HOST: str = "0.0.0.0"
    
    # NEW DailyJob Firebase Configuration
    FIREBASE_PROJECT_ID: str = Field(default="dailyjob-platform", description="Dedicated DailyJob Firebase Project ID")
    FIREBASE_STORAGE_BUCKET: str = Field(default="dailyjob-platform.appspot.com", description="Dedicated Firebase Storage Bucket")
    FIREBASE_CREDENTIALS_PATH: str = Field(default="serviceAccountKey.json", description="Path to service account JSON")
    FIREBASE_CREDENTIALS_JSON: str = Field(default="", description="Optional inline JSON credentials string")
    
    # Proximity threshold for GPS check-in (in meters)
    ATTENDANCE_PROXIMITY_METERS: float = Field(default=500.0, description="Max allowed distance from worksite in meters for check-in")
    
    # Fallback to local in-memory storage for test suites / offline dev
    USE_FIREBASE_MOCK_FALLBACK: bool = Field(default=True)
    
    # CORS
    ALLOWED_ORIGINS: Union[List[str], str] = [
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:8001",
        "http://127.0.0.1:8001",
    ]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_origins(cls, v):
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [x.strip() for x in v.split(",") if x.strip()]
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
