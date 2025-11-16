from sqlmodel import SQLModel, Field, UniqueConstraint
from datetime import datetime
from typing import Optional
from enum import Enum


class UserRole(str, Enum):
    """User role enumeration"""
    ADMIN = "admin"
    USER = "user"


class User(SQLModel, table=True):
    """User model for authentication"""
    __tablename__ = "users"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    full_name: str
    password_hash: str
    role: UserRole = Field(default=UserRole.USER)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None


class Telemetry(SQLModel, table=True):
    """Telemetry data from ESP32 devices"""
    __tablename__ = "telemetry"
    __table_args__ = (UniqueConstraint("device_id", "ts", name="unique_device_timestamp"),)
    
    id: Optional[int] = Field(default=None, primary_key=True)
    device_id: str = Field(index=True)
    ts: datetime = Field(index=True)  # timestamp from device
    mq3: int
    mq135: int
    temp_c: Optional[float] = None
    humidity_pct: Optional[float] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    alt: Optional[float] = None
    received_at: datetime = Field(default_factory=datetime.utcnow)


class Alert(SQLModel, table=True):
    """Alerts generated from telemetry analysis"""
    __tablename__ = "alerts"
    __table_args__ = (UniqueConstraint("device_id", "ts", name="unique_alert_device_timestamp"),)
    
    id: Optional[int] = Field(default=None, primary_key=True)
    device_id: str = Field(index=True)
    ts: datetime = Field(index=True)  # timestamp from telemetry
    severity: str  # "SAFE", "WARNING", "HIGH"
    short_message: str
    explanation: str
    recommended_action: str
    confidence: str  # "high", "medium", "low"
    mq3: int
    mq135: int
    lat: Optional[float] = None
    lon: Optional[float] = None
    alt: Optional[float] = None
    notified: bool = Field(default=False)  # True if notification should be sent
    created_at: datetime = Field(default_factory=datetime.utcnow)


class DeviceSettings(SQLModel, table=True):
    """Device-specific threshold settings"""
    __tablename__ = "device_settings"
    
    device_id: str = Field(primary_key=True)
    mq3_safe: int = Field(default=350)
    mq3_warning: int = Field(default=500)
    mq3_danger: int = Field(default=500)
    debounce_minutes: int = Field(default=5)
    notify_on_warning: bool = Field(default=True)


class TelemetryDuplicate(SQLModel, table=True):
    """Duplicate telemetry entries detected by backend"""
    __tablename__ = "telemetry_duplicates"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    original_telemetry_id: int = Field(foreign_key="telemetry.id", index=True)
    device_id: str = Field(index=True)
    timestamp: datetime = Field(index=True)
    payload_json: str  # TEXT field storing raw JSON
    received_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    is_merged: bool = Field(default=False, index=True)
    is_ignored: bool = Field(default=False, index=True)


class UserPreferences(SQLModel, table=True):
    """User preferences for UI customization"""
    __tablename__ = "user_preferences"
    
    user_id: int = Field(primary_key=True, foreign_key="users.id")
    theme: str = Field(default="light")  # "light" or "dark"
    map_default_zoom: int = Field(default=12)  # 5-18 range
    show_clusters: bool = Field(default=True)
    notify_on_warning: bool = Field(default=True)
    prefer_offline_map: bool = Field(default=False)  # Prefer offline map tiles even when online
    updated_at: datetime = Field(default_factory=datetime.utcnow)