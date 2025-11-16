import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine, SQLModel
from backend.app import app
from backend.database import engine
from backend.models import User, UserRole
from backend.auth import get_password_hash, get_user_by_email

# Create test database
test_engine = create_engine("sqlite:///:memory:")


@pytest.fixture
def client():
    """Create test client"""
    SQLModel.metadata.create_all(test_engine)
    
    # Override get_db dependency
    def get_test_db():
        with Session(test_engine) as session:
            yield session
    
    app.dependency_overrides[app.dependency_overrides.get("get_db")] = get_test_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    SQLModel.metadata.drop_all(test_engine)
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(client):
    """Create a test user"""
    with Session(test_engine) as session:
        user = User(
            email="test@example.com",
            full_name="Test User",
            password_hash=get_password_hash("TestPassword123!"),
            role=UserRole.USER
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        return user


def test_signup_creates_user(client):
    """Test that signup creates a new user"""
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "email": "newuser@example.com",
            "full_name": "New User",
            "password": "SecurePass123!"
        }
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["full_name"] == "New User"
    assert data["role"] == "user"
    assert "password" not in data  # Password should not be in response


def test_signup_duplicate_email(client, test_user):
    """Test that signup fails with duplicate email"""
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "email": "test@example.com",
            "full_name": "Another User",
            "password": "AnotherPass123!"
        }
    )
    
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]


def test_signup_weak_password(client):
    """Test that signup fails with weak password"""
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "email": "user@example.com",
            "full_name": "User",
            "password": "short"  # Less than 8 characters
        }
    )
    
    assert response.status_code == 422  # Validation error


def test_login_returns_token_for_valid_credentials(client, test_user):
    """Test that login returns token for valid credentials"""
    response = client.post(
        "/api/v1/auth/login-json",
        json={
            "email": "test@example.com",
            "password": "TestPassword123!"
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert "user" in data
    assert data["user"]["email"] == "test@example.com"


def test_login_fails_with_invalid_credentials(client, test_user):
    """Test that login fails with invalid credentials"""
    response = client.post(
        "/api/v1/auth/login-json",
        json={
            "email": "test@example.com",
            "password": "WrongPassword123!"
        }
    )
    
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]


def test_protected_route_requires_auth(client):
    """Test that protected routes require authentication"""
    response = client.get("/api/v1/auth/me")
    
    assert response.status_code == 401
    assert "Not authenticated" in response.json()["detail"] or "Could not validate credentials" in response.json()["detail"]


def test_get_current_user_with_valid_token(client, test_user):
    """Test that /me endpoint returns user info with valid token"""
    # First login to get token
    login_response = client.post(
        "/api/v1/auth/login-json",
        json={
            "email": "test@example.com",
            "password": "TestPassword123!"
        }
    )
    token = login_response.json()["access_token"]
    
    # Use token to access protected endpoint
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Test User"


def test_admin_endpoint_requires_admin_role(client):
    """Test that admin endpoints require admin role"""
    # Create regular user
    with Session(test_engine) as session:
        user = User(
            email="regular@example.com",
            full_name="Regular User",
            password_hash=get_password_hash("Password123!"),
            role=UserRole.USER
        )
        session.add(user)
        session.commit()
    
    # Login as regular user
    login_response = client.post(
        "/api/v1/auth/login-json",
        json={
            "email": "regular@example.com",
            "password": "Password123!"
        }
    )
    token = login_response.json()["access_token"]
    
    # Try to access admin endpoint
    response = client.post(
        "/api/v1/device-settings/test-device",
        headers={"Authorization": f"Bearer {token}"},
        json={"mq3_safe": 300}
    )
    
    assert response.status_code == 403
    assert "Not enough permissions" in response.json()["detail"]

