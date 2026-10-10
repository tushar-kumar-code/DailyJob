from datetime import datetime, timezone
import uuid

def utc_now() -> datetime:
    """Return timezone-aware current UTC datetime."""
    return datetime.now(timezone.utc)

def utc_now_iso() -> str:
    """Return ISO format string of current UTC datetime."""
    return utc_now().isoformat()

def generate_id(prefix: str = "id") -> str:
    """Generate a clean unique identifier with prefix."""
    return f"{prefix}_{uuid.uuid4().hex[:12]}"
