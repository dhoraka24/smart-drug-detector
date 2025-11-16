import os
from datetime import datetime, timedelta
from sqlmodel import Session, select
from backend.models import Telemetry, Alert, DeviceSettings


def determine_severity_mq3_only(mq3: int) -> str:
    """
    Determine severity based on MQ3 ONLY (hard rule).
    - SAFE if mq3 < 700
    - WARNING if 700 ≤ mq3 < 1000
    - HIGH if mq3 ≥ 1000
    """
    if mq3 < 700:
        return "SAFE"
    elif mq3 < 1000:
        return "WARNING"
    else:
        return "HIGH"


def check_duplicate(session: Session, device_id: str, timestamp: datetime) -> bool:
    """
    Check if telemetry with same (device_id, timestamp) already exists.
    Returns True if duplicate found.
    """
    statement = select(Telemetry).where(
        Telemetry.device_id == device_id,
        Telemetry.ts == timestamp
    )
    existing = session.exec(statement).first()
    return existing is not None


def get_recent_history(session: Session, device_id: str, limit: int = 10) -> list:
    """
    Get last N telemetry readings for a device (ordered oldest→newest).
    Returns list of dicts suitable for JSON serialization.
    """
    statement = (
        select(Telemetry)
        .where(Telemetry.device_id == device_id)
        .order_by(Telemetry.ts.desc())
        .limit(limit)
    )
    telemetries = session.exec(statement).all()
    
    # Reverse to get oldest→newest
    telemetries = list(reversed(telemetries))
    
    return [
        {
            "device_id": t.device_id,
            "timestamp": t.ts.isoformat(),
            "mq3": t.mq3,
            "mq135": t.mq135,
            "temp_c": t.temp_c,
            "humidity_pct": t.humidity_pct,
            "lat": t.lat,
            "lon": t.lon
        }
        for t in telemetries
    ]


def check_duplicate_alert(session: Session, device_id: str, timestamp: datetime) -> bool:
    """
    Check if alert with same (device_id, timestamp) already exists.
    Returns True if duplicate found.
    """
    statement = select(Alert).where(
        Alert.device_id == device_id,
        Alert.ts == timestamp
    )
    existing = session.exec(statement).first()
    return existing is not None


def check_debounce(session: Session, device_id: str, severity: str) -> bool:
    """
    Check if a HIGH alert for the same device with notified=True exists
    within DEBOUNCE_MINUTES.
    Returns True if debounced (should set notified=False).
    """
    if severity != "HIGH":
        return False
    
    debounce_minutes = int(os.getenv("DEBOUNCE_MINUTES", "5"))
    cutoff_time = datetime.utcnow() - timedelta(minutes=debounce_minutes)
    
    statement = (
        select(Alert)
        .where(
            Alert.device_id == device_id,
            Alert.severity == "HIGH",
            Alert.notified == True,
            Alert.created_at >= cutoff_time
        )
    )
    recent_alert = session.exec(statement).first()
    
    return recent_alert is not None


def get_or_create_device_settings(session: Session, device_id: str) -> DeviceSettings:
    """Get existing device settings or create default ones"""
    settings = session.get(DeviceSettings, device_id)
    if not settings:
        settings = DeviceSettings(device_id=device_id)
        session.add(settings)
        session.commit()
        session.refresh(settings)
    return settings
