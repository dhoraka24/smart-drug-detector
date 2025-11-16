import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine, SQLModel
from backend.app import app
from backend.database import engine
from backend.models import Telemetry, TelemetryDuplicate, User, UserRole
from backend.auth import get_password_hash, create_access_token

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
def admin_token(client):
    """Create admin user and return token"""
    with Session(test_engine) as session:
        admin = User(
            email="admin@test.com",
            full_name="Admin",
            password_hash=get_password_hash("Admin123!"),
            role=UserRole.ADMIN
        )
        session.add(admin)
        session.commit()
        session.refresh(admin)
        
        token = create_access_token(data={"sub": admin.email})
        return token


def test_duplicate_telemetry_creates_duplicate_entry(client):
    """Test that posting identical telemetry twice creates a duplicate entry"""
    device_api_key = "test-device-key"
    import os
    os.environ["DEVICE_API_KEY"] = device_api_key
    
    # First POST - should create telemetry
    telemetry_data = {
        "device_id": "test-device-001",
        "timestamp": "2025-01-01T10:00:00+00:00",
        "sensors": {
            "mq3": 300,
            "mq135": 200,
            "temp_c": 25.0,
            "humidity_pct": 50.0
        }
    }
    
    response1 = client.post(
        "/api/v1/telemetry",
        json=telemetry_data,
        headers={"x-api-key": device_api_key}
    )
    
    assert response1.status_code == 200
    assert "status" in response1.json()
    
    # Second POST with same device_id and timestamp - should return duplicate
    response2 = client.post(
        "/api/v1/telemetry",
        json=telemetry_data,
        headers={"x-api-key": device_api_key}
    )
    
    assert response2.status_code == 200
    data = response2.json()
    assert data["status"] == "duplicate"
    assert "original_id" in data
    assert "duplicate_id" in data
    
    # Verify duplicate entry was created
    with Session(test_engine) as session:
        from sqlmodel import select
        statement = select(TelemetryDuplicate).where(
            TelemetryDuplicate.original_telemetry_id == data["original_id"]
        )
        duplicate = session.exec(statement).first()
        assert duplicate is not None
        assert duplicate.is_merged == False
        assert duplicate.is_ignored == False


def test_get_duplicates_endpoint(client, admin_token):
    """Test GET /api/v1/duplicates endpoint"""
    # Create some test data
    with Session(test_engine) as session:
        # Create original telemetry
        original = Telemetry(
            device_id="test-device",
            ts="2025-01-01T10:00:00",
            mq3=300,
            mq135=200
        )
        session.add(original)
        session.commit()
        session.refresh(original)
        
        # Create duplicate entries
        for i in range(3):
            dup = TelemetryDuplicate(
                original_telemetry_id=original.id,
                device_id="test-device",
                timestamp="2025-01-01T10:00:00",
                payload_json='{"test": "data"}',
                is_merged=False,
                is_ignored=False
            )
            session.add(dup)
        session.commit()
    
    # Get duplicates
    response = client.get(
        "/api/v1/duplicates",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "duplicates" in data
    assert "total" in data
    assert len(data["duplicates"]) > 0


def test_merge_duplicates_endpoint(client, admin_token):
    """Test POST /api/v1/duplicates/merge endpoint"""
    # Create test data
    with Session(test_engine) as session:
        original = Telemetry(
            device_id="test-device",
            ts="2025-01-01T10:00:00",
            mq3=300,
            mq135=200
        )
        session.add(original)
        session.commit()
        session.refresh(original)
        
        dup1 = TelemetryDuplicate(
            original_telemetry_id=original.id,
            device_id="test-device",
            timestamp="2025-01-01T10:00:00",
            payload_json='{"test": "data1"}',
            is_merged=False,
            is_ignored=False
        )
        dup2 = TelemetryDuplicate(
            original_telemetry_id=original.id,
            device_id="test-device",
            timestamp="2025-01-01T10:00:00",
            payload_json='{"test": "data2"}',
            is_merged=False,
            is_ignored=False
        )
        session.add(dup1)
        session.add(dup2)
        session.commit()
        session.refresh(dup1)
        session.refresh(dup2)
    
    # Merge duplicates
    response = client.post(
        "/api/v1/duplicates/merge",
        json={
            "original_id": original.id,
            "duplicate_ids": [dup1.id, dup2.id]
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["merged_count"] == 2
    
    # Verify duplicates are marked as merged
    with Session(test_engine) as session:
        from sqlmodel import select
        dup1_check = session.get(TelemetryDuplicate, dup1.id)
        dup2_check = session.get(TelemetryDuplicate, dup2.id)
        assert dup1_check.is_merged == True
        assert dup2_check.is_merged == True


def test_ignore_duplicates_endpoint(client, admin_token):
    """Test POST /api/v1/duplicates/ignore endpoint"""
    # Create test data
    with Session(test_engine) as session:
        original = Telemetry(
            device_id="test-device",
            ts="2025-01-01T10:00:00",
            mq3=300,
            mq135=200
        )
        session.add(original)
        session.commit()
        session.refresh(original)
        
        dup = TelemetryDuplicate(
            original_telemetry_id=original.id,
            device_id="test-device",
            timestamp="2025-01-01T10:00:00",
            payload_json='{"test": "data"}',
            is_merged=False,
            is_ignored=False
        )
        session.add(dup)
        session.commit()
        session.refresh(dup)
    
    # Ignore duplicate
    response = client.post(
        "/api/v1/duplicates/ignore",
        json={"ids": [dup.id]},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["ignored_count"] == 1
    
    # Verify duplicate is marked as ignored
    with Session(test_engine) as session:
        dup_check = session.get(TelemetryDuplicate, dup.id)
        assert dup_check.is_ignored == True

