from enum import Enum

class UserRole(str, Enum):
    WORKER = "worker"
    EMPLOYER = "employer"
    ADMIN = "admin"
