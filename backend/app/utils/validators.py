import re
from typing import Optional

EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")

def validate_email(email: str) -> bool:
    if not email or not isinstance(email, str):
        return False
    return bool(EMAIL_REGEX.match(email.strip()))

def sanitize_string(val: Optional[str]) -> str:
    if not val:
        return ""
    return str(val).strip()
