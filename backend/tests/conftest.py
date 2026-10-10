import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.repositories.user_repository import user_repo

@pytest.fixture(scope="session", autouse=True)
def setup_test_users():
    """Ensure test users with distinct roles exist in mock Firestore."""
    user_repo.create_or_update("test_worker_1", {
        "email": "worker1@dailyjob.local",
        "username": "Ramesh Kumar",
        "name": "Ramesh Kumar",
        "role": "worker",
        "profile_completed": True,
        "worker_profile": {
            "name": "Ramesh Kumar",
            "age": 28,
            "trade": "plumber",
            "experience": "5 years"
        }
    })

    user_repo.create_or_update("test_employer_1", {
        "email": "employer1@dailyjob.local",
        "username": "Sharma Construction",
        "name": "Sharma Construction",
        "role": "employer",
        "profile_completed": True,
        "employer_profile": {
            "name": "Sharma Construction",
            "city": "Raipur"
        }
    })

    user_repo.create_or_update("test_admin_1", {
        "email": "admin1@dailyjob.local",
        "username": "Platform Admin",
        "name": "Platform Admin",
        "role": "admin",
        "profile_completed": True
    })

    user_repo.create_or_update("test_worker_2", {
        "email": "worker2@dailyjob.local",
        "username": "Suresh Yadav",
        "name": "Suresh Yadav",
        "role": "worker",
        "profile_completed": True
    })

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def worker_headers():
    return {"Authorization": "Bearer mock_token_test_worker_1"}

@pytest.fixture
def employer_headers():
    return {"Authorization": "Bearer mock_token_test_employer_1"}

@pytest.fixture
def admin_headers():
    return {"Authorization": "Bearer mock_token_test_admin_1"}

@pytest.fixture
def worker2_headers():
    return {"Authorization": "Bearer mock_token_test_worker_2"}
