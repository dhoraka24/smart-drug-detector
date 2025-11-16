"""
Tests for alert history endpoint
Tests raw list fetching, aggregation, and parameter validation
"""

import pytest
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine, SQLModel
from sqlmodel.pool import StaticPool

from backend.app import app
from backend.models import Alert, User
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
    
    # Create admin user
    admin_user = User(
        email="admin@example.com",
        full_name="Admin User",
        password_hash="hashed_password",
        role="admin"
    )
    session.add(admin_user)
    session.commit()
    session.refresh(admin_user)
    
    yield TestClient(app)
    
    app.dependency_overrides.clear()


@pytest.fixture
def auth_token(client, session):
    """Get auth token for test user"""
    test_user = session.exec(
        select(User).where(User.email == "test@example.com")
    ).first()
    return create_access_token(data={"sub": test_user.email})


@pytest.fixture
def sample_alerts(session):
    """Create sample alerts for testing"""
    base_time = datetime.now(timezone.utc).replace(tzinfo=None)
    
    alerts = []
    for i in range(10):
        alert = Alert(
            device_id="esp32-drug-001",
            ts=base_time + timedelta(minutes=i * 5),
            severity="HIGH" if i % 3 == 0 else "WARNING" if i % 2 == 0 else "SAFE",
            short_message=f"Test alert {i}",
            explanation="Test explanation",
            recommended_action="Test action",
            confidence="high",
            mq3=300 + i * 10,
            mq135=200 + i * 5,
            lat=13.0827 + (i * 0.001),
            lon=80.2707 + (i * 0.001),
            notified=False
        )
        alerts.append(alert)
        session.add(alert)
    
    session.commit()
    return alerts, base_time


def test_fetch_raw_list(client, auth_token, sample_alerts):
    """Test fetching raw list of alerts"""
    alerts, base_time = sample_alerts
    
    from_time = (base_time - timedelta(minutes=1)).isoformat() + 'Z'
    to_time = (base_time + timedelta(hours=1)).isoformat() + 'Z'
    
    response = client.get(
        f"/api/v1/alerts/history?from={from_time}&to={to_time}",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 10
    
    # Check first alert structure
    first_alert = data[0]
    assert "id" in first_alert
    assert "device_id" in first_alert
    assert "ts" in first_alert
    assert "severity" in first_alert
    assert "lat" in first_alert
    assert "lon" in first_alert


def test_aggregate_buckets(client, auth_token, sample_alerts):
    """Test aggregation mode with time buckets"""
    alerts, base_time = sample_alerts
    
    from_time = (base_time - timedelta(minutes=1)).isoformat() + 'Z'
    to_time = (base_time + timedelta(hours=1)).isoformat() + 'Z'
    
    response = client.get(
        f"/api/v1/alerts/history?from={from_time}&to={to_time}&aggregate=true&bucket_minutes=10",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    
    # Check bucket structure
    bucket = data[0]
    assert "bucket_start" in bucket
    assert "counts" in bucket
    assert "repr_lat" in bucket
    assert "repr_lon" in bucket
    assert "total_count" in bucket
    
    # Check counts structure
    assert isinstance(bucket["counts"], dict)
    assert "SAFE" in bucket["counts"] or "WARNING" in bucket["counts"] or "HIGH" in bucket["counts"]


def test_limit_and_parameter_validation(client, auth_token, sample_alerts):
    """Test limit parameter and validation"""
    alerts, base_time = sample_alerts
    
    from_time = (base_time - timedelta(minutes=1)).isoformat() + 'Z'
    to_time = (base_time + timedelta(hours=1)).isoformat() + 'Z'
    
    # Test with limit
    response = client.get(
        f"/api/v1/alerts/history?from={from_time}&to={to_time}&limit=5",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) <= 5
    
    # Test invalid time range (from > to)
    response = client.get(
        f"/api/v1/alerts/history?from={to_time}&to={from_time}",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    assert response.status_code == 400
    
    # Test missing bucket_minutes when aggregate=true
    response = client.get(
        f"/api/v1/alerts/history?from={from_time}&to={to_time}&aggregate=true",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    assert response.status_code == 400


def test_device_filter(client, auth_token, sample_alerts, session):
    """Test filtering by device_id"""
    alerts, base_time = sample_alerts
    
    # Create alerts for different device
    other_alert = Alert(
        device_id="esp32-drug-002",
        ts=base_time + timedelta(minutes=60),
        severity="WARNING",
        short_message="Other device alert",
        explanation="Test",
        recommended_action="Test",
        confidence="high",
        mq3=400,
        mq135=300,
        lat=13.1000,
        lon=80.3000,
        notified=False
    )
    session.add(other_alert)
    session.commit()
    
    from_time = (base_time - timedelta(minutes=1)).isoformat() + 'Z'
    to_time = (base_time + timedelta(hours=2)).isoformat() + 'Z'
    
    # Filter by device_id
    response = client.get(
        f"/api/v1/alerts/history?from={from_time}&to={to_time}&device_id=esp32-drug-001",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert all(alert["device_id"] == "esp32-drug-001" for alert in data)


def test_time_range_limits(client, auth_token):
    """Test time range limits for non-admin users"""
    base_time = datetime.now(timezone.utc).replace(tzinfo=None)
    
    # Try to request > 48 hours (should fail for non-admin)
    from_time = (base_time - timedelta(hours=50)).isoformat() + 'Z'
    to_time = base_time.isoformat() + 'Z'
    
    response = client.get(
        f"/api/v1/alerts/history?from={from_time}&to={to_time}",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    assert response.status_code == 400
    assert "exceeds maximum" in response.json()["detail"].lower()

