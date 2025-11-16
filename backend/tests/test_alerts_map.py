"""
Tests for alerts map endpoints (GPS filtering)
"""

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine
from sqlmodel.pool import StaticPool
from datetime import datetime

from backend.app import app
from backend.models import User, UserRole, Alert
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


@pytest.fixture
def test_alerts(client, test_user):
    """Create test alerts with and without GPS"""
    with Session(test_engine) as session:
        # Alert with GPS
        alert1 = Alert(
            device_id="esp32-001",
            ts=datetime.utcnow(),
            severity="HIGH",
            short_message="Test alert with GPS",
            explanation="Test",
            recommended_action="Test",
            confidence="high",
            mq3=500,
            mq135=300,
            lat=13.0827,
            lon=80.2707,
            notified=True
        )
        
        # Alert without GPS (lat/lon = 0)
        alert2 = Alert(
            device_id="esp32-001",
            ts=datetime.utcnow(),
            severity="WARNING",
            short_message="Test alert without GPS",
            explanation="Test",
            recommended_action="Test",
            confidence="medium",
            mq3=400,
            mq135=250,
            lat=0.0,
            lon=0.0,
            notified=False
        )
        
        # Alert with GPS (Chennai coordinates)
        alert3 = Alert(
            device_id="esp32-002",
            ts=datetime.utcnow(),
            severity="HIGH",
            short_message="Another GPS alert",
            explanation="Test",
            recommended_action="Test",
            confidence="high",
            mq3=550,
            mq135=350,
            lat=13.0827,
            lon=80.2707,
            notified=True
        )
        
        session.add_all([alert1, alert2, alert3])
        session.commit()
        session.refresh(alert1)
        session.refresh(alert2)
        session.refresh(alert3)
        
        return [alert1, alert2, alert3]


def test_alerts_latlon_query_returns_only_with_coords(client, test_user, test_alerts):
    """Test that lat_only=true returns only alerts with GPS coordinates"""
    token = test_user["token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get all alerts
    response = client.get("/api/v1/alerts", headers=headers)
    assert response.status_code == 200
    all_alerts = response.json()
    assert len(all_alerts) >= 3
    
    # Get only alerts with GPS (lat_only=true)
    response = client.get("/api/v1/alerts?lat_only=true", headers=headers)
    assert response.status_code == 200
    gps_alerts = response.json()
    
    # Should only return alerts with non-zero lat/lon
    assert len(gps_alerts) >= 2  # alert1 and alert3 have GPS
    for alert in gps_alerts:
        assert alert["lat"] is not None
        assert alert["lon"] is not None
        assert alert["lat"] != 0.0
        assert alert["lon"] != 0.0
    
    # Verify alert2 (with 0,0) is not in results
    alert_ids = [a["id"] for a in gps_alerts]
    assert test_alerts[1].id not in alert_ids  # alert2 should not be included
