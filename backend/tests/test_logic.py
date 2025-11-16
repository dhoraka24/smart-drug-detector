import pytest
from datetime import datetime, timedelta
from sqlmodel import Session, create_engine
from backend.models import Telemetry, Alert
from backend.utils import (
    determine_severity_mq3_only,
    check_duplicate,
    check_debounce
)
from backend.database import engine


def test_severity_decision_safe():
    """Test SAFE severity for mq3 < 350"""
    assert determine_severity_mq3_only(349) == "SAFE"
    assert determine_severity_mq3_only(0) == "SAFE"
    assert determine_severity_mq3_only(200) == "SAFE"


def test_severity_decision_warning():
    """Test WARNING severity for 350 ≤ mq3 < 500"""
    assert determine_severity_mq3_only(350) == "WARNING"
    assert determine_severity_mq3_only(400) == "WARNING"
    assert determine_severity_mq3_only(499) == "WARNING"


def test_severity_decision_high():
    """Test HIGH severity for mq3 ≥ 500"""
    assert determine_severity_mq3_only(500) == "HIGH"
    assert determine_severity_mq3_only(600) == "HIGH"
    assert determine_severity_mq3_only(1000) == "HIGH"


def test_duplicate_detection():
    """Test duplicate telemetry detection"""
    # Create test database session
    test_engine = create_engine("sqlite:///:memory:")
    from sqlmodel import SQLModel
    SQLModel.metadata.create_all(test_engine)
    
    with Session(test_engine) as session:
        device_id = "test-device-001"
        ts = datetime.utcnow()
        
        # Create first telemetry
        telemetry1 = Telemetry(
            device_id=device_id,
            ts=ts,
            mq3=400,
            mq135=300,
            temp_c=25.0,
            humidity_pct=50.0
        )
        session.add(telemetry1)
        session.commit()
        
        # Check duplicate - should return True
        assert check_duplicate(session, device_id, ts) == True
        
        # Different timestamp - should return False
        ts2 = ts + timedelta(seconds=1)
        assert check_duplicate(session, device_id, ts2) == False
        
        # Different device - should return False
        assert check_duplicate(session, "other-device", ts) == False


def test_debounce_logic():
    """Test debounce logic for HIGH alerts"""
    # Create test database session
    test_engine = create_engine("sqlite:///:memory:")
    from sqlmodel import SQLModel
    SQLModel.metadata.create_all(test_engine)
    
    import os
    os.environ["DEBOUNCE_MINUTES"] = "5"
    
    with Session(test_engine) as session:
        device_id = "test-device-001"
        now = datetime.utcnow()
        
        # Create a HIGH alert with notified=True within debounce window
        alert1 = Alert(
            device_id=device_id,
            ts=now - timedelta(minutes=2),
            severity="HIGH",
            short_message="Test alert",
            explanation="Test",
            recommended_action="Test",
            confidence="high",
            mq3=600,
            mq135=400,
            notified=True,
            created_at=now - timedelta(minutes=2)
        )
        session.add(alert1)
        session.commit()
        
        # Check debounce - should return True (debounced)
        assert check_debounce(session, device_id, "HIGH") == True
        
        # Create alert outside debounce window
        alert2 = Alert(
            device_id=device_id,
            ts=now - timedelta(minutes=10),
            severity="HIGH",
            short_message="Old alert",
            explanation="Test",
            recommended_action="Test",
            confidence="high",
            mq3=600,
            mq135=400,
            notified=True,
            created_at=now - timedelta(minutes=10)
        )
        session.add(alert2)
        session.commit()
        
        # Should still be debounced because alert1 is within window
        assert check_debounce(session, device_id, "HIGH") == True
        
        # Delete alert1 and check again
        session.delete(alert1)
        session.commit()
        
        # Now should not be debounced (alert2 is outside window)
        assert check_debounce(session, device_id, "HIGH") == False
        
        # WARNING severity should not be debounced
        assert check_debounce(session, device_id, "WARNING") == False

