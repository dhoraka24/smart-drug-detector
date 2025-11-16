"""
Tests for profile endpoints
"""

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine
from sqlmodel.pool import StaticPool

from backend.app import app
from backend.models import User, UserRole, UserPreferences
from backend.auth import get_password_hash, create_access_token
from backend.database import get_session


# Test database
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)


@pytest.fixture
def client():
    """Create test client with overridden database"""
    def get_test_session():
        with Session(test_engine) as session:
            yield session
    
    app.dependency_overrides[get_session] = get_test_session
    
    # Create tables
    from backend.models import SQLModel
    SQLModel.metadata.create_all(test_engine)
    
    client = TestClient(app)
    yield client
    
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(client):
    """Create a test user and return auth token"""
    with Session(test_engine) as session:
        user = User(
            email="test@example.com",
            full_name="Test User",
            password_hash=get_password_hash("Test1234!"),
            role=UserRole.USER
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        
        token = create_access_token(data={"sub": user.email})
        return {"user": user, "token": token}


def test_get_and_update_profile(client, test_user):
    """Test getting and updating user profile"""
    token = test_user["token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get profile
    response = client.get("/api/v1/profile", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Test User"
    
    # Update profile
    update_data = {
        "full_name": "Updated Name",
        "email": "updated@example.com"
    }
    response = client.put("/api/v1/profile", json=update_data, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "Updated Name"
    assert data["email"] == "updated@example.com"
    
    # Verify update persisted
    response = client.get("/api/v1/profile", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "Updated Name"
    assert data["email"] == "updated@example.com"


def test_preferences_saved_and_loaded(client, test_user):
    """Test that preferences are saved and loaded correctly"""
    token = test_user["token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get default preferences
    response = client.get("/api/v1/preferences", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["theme"] == "light"
    assert data["map_default_zoom"] == 13
    assert data["show_clusters"] == True
    
    # Update preferences
    update_data = {
        "theme": "dark",
        "map_default_zoom": 15,
        "show_clusters": False,
        "notify_on_warning": False
    }
    response = client.put("/api/v1/preferences", json=update_data, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["theme"] == "dark"
    assert data["map_default_zoom"] == 15
    assert data["show_clusters"] == False
    
    # Verify update persisted
    response = client.get("/api/v1/preferences", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["theme"] == "dark"
    assert data["map_default_zoom"] == 15
    assert data["show_clusters"] == False
    assert data["notify_on_warning"] == False
