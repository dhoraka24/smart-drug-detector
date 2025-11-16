"""
Tests for preferences endpoint
Tests authentication, persistence, and profile integration
"""

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine, SQLModel
from sqlmodel.pool import StaticPool

from backend.app import app
from backend.models import User, UserPreferences
from backend.database import get_session
from backend.auth import create_access_token
from sqlmodel import select

# Test database
TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)


@pytest.fixture
def session():
    """Create test database session"""
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    SQLModel.metadata.drop_all(engine)


@pytest.fixture
def client(session):
    """Create test client with dependency override"""
    def get_session_override():
        yield session
    
    app.dependency_overrides[get_session] = get_session_override
    
    # Create test user
    test_user = User(
        email="test@example.com",
        full_name="Test User",
        password_hash="hashed_password",
        role="user"
    )
    session.add(test_user)
    session.commit()
    session.refresh(test_user)
    
    yield TestClient(app)
    
    app.dependency_overrides.clear()


@pytest.fixture
def auth_token(client, session):
    """Get auth token for test user"""
    test_user = session.exec(
        select(User).where(User.email == "test@example.com")
    ).first()
    return create_access_token(data={"sub": test_user.email})


def test_get_preferences_unauthenticated(client):
    """Test that unauthenticated requests return 401"""
    response = client.get("/api/v1/preferences")
    assert response.status_code == 401


def test_save_and_get_preferences(client, auth_token):
    """Test that preferences can be saved and retrieved"""
    # Save preferences
    update_data = {
        "theme": "dark",
        "map_default_zoom": 15,
        "show_clusters": False,
        "notify_on_warning": True,
        "prefer_offline_map": True
    }
    
    response = client.put(
        "/api/v1/preferences",
        json=update_data,
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["theme"] == "dark"
    assert data["map_default_zoom"] == 15
    assert data["show_clusters"] == False
    assert data["notify_on_warning"] == True
    assert data["prefer_offline_map"] == True
    
    # Get preferences
    response = client.get(
        "/api/v1/preferences",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["theme"] == "dark"
    assert data["map_default_zoom"] == 15
    assert data["prefer_offline_map"] == True


def test_preferences_apply_to_profile(client, auth_token, session):
    """Test that GET /api/v1/profile returns preferences embedded"""
    # First, set some preferences
    update_data = {
        "theme": "dark",
        "map_default_zoom": 14
    }
    
    client.put(
        "/api/v1/preferences",
        json=update_data,
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    # Get profile (should include preferences)
    response = client.get(
        "/api/v1/profile",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    # Profile should include preferences
    assert "preferences" in data or data.get("theme") is not None


def test_preferences_default_values(client, auth_token):
    """Test that default preferences are created if none exist"""
    response = client.get(
        "/api/v1/preferences",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["theme"] == "light"  # Default
    assert data["map_default_zoom"] == 12  # Default
    assert data["show_clusters"] == True  # Default
    assert data["prefer_offline_map"] == False  # Default


def test_preferences_validation(client, auth_token):
    """Test that invalid preference values are rejected"""
    # Invalid theme
    response = client.put(
        "/api/v1/preferences",
        json={"theme": "invalid"},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 400
    
    # Invalid zoom (too high)
    response = client.put(
        "/api/v1/preferences",
        json={"map_default_zoom": 25},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 400
    
    # Invalid zoom (too low)
    response = client.put(
        "/api/v1/preferences",
        json={"map_default_zoom": 3},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 400

