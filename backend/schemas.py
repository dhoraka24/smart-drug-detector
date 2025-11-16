from pydantic import BaseModel, Field, validator, EmailStr
from datetime import datetime
from typing import Optional, List, Dict, Any

from backend.models import UserRole


# Authentication Schemas
class UserCreate(BaseModel):
    """Schema for user registration"""
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=8, max_length=100)
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v


class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str


class Token(BaseModel):
    """Schema for JWT token response"""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Schema for token payload data"""
    email: Optional[str] = None


class UserResponse(BaseModel):
    """Schema for user response (without password)"""
    id: int
    email: str
    full_name: str
    role: UserRole
    created_at: datetime
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class UserPublic(BaseModel):
    """Public user information"""
    id: int
    email: str
    full_name: str
    role: UserRole
    
    class Config:
        from_attributes = True


# Existing Telemetry Schemas
class GPSData(BaseModel):
    lat: float
    lon: float
    alt: Optional[float] = None


class SensorsData(BaseModel):
    mq3: int
    mq135: int
    temp_c: Optional[float] = None
    humidity_pct: Optional[float] = None


class TelemetryCreate(BaseModel):
    """Telemetry JSON from ESP32"""
    device_id: str
    timestamp: str  # ISO8601 format
    sensors: SensorsData
    gps: Optional[GPSData] = None
    
    @validator('timestamp')
    def validate_timestamp(cls, v):
        try:
            # Try parsing ISO8601
            datetime.fromisoformat(v.replace('Z', '+00:00'))
            return v
        except ValueError:
            raise ValueError('Invalid ISO8601 timestamp format')


class TelemetryResponse(BaseModel):
    id: int
    device_id: str
    ts: datetime
    mq3: int
    mq135: int
    temp_c: Optional[float]
    humidity_pct: Optional[float]
    lat: Optional[float]
    lon: Optional[float]
    alt: Optional[float]
    received_at: datetime
    
    class Config:
        from_attributes = True


class AlertResponse(BaseModel):
    id: int
    device_id: str
    ts: datetime
    severity: str
    short_message: str
    explanation: str
    recommended_action: str
    confidence: str
    mq3: int
    mq135: int
    lat: Optional[float]
    lon: Optional[float]
    alt: Optional[float]
    notified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class DeviceSettingsResponse(BaseModel):
    device_id: str
    mq3_safe: int
    mq3_warning: int
    mq3_danger: int
    debounce_minutes: int
    notify_on_warning: bool
    
    class Config:
        from_attributes = True


class DeviceSettingsUpdate(BaseModel):
    mq3_safe: Optional[int] = None
    mq3_warning: Optional[int] = None
    mq3_danger: Optional[int] = None
    debounce_minutes: Optional[int] = None
    notify_on_warning: Optional[bool] = None


class AboutResponse(BaseModel):
    system_name: str
    version: str
    description: str
    spec_pdf_url: str


# Profile Schemas
class ProfileResponse(BaseModel):
    """User profile with preferences"""
    id: int
    email: str
    full_name: str
    role: UserRole
    created_at: datetime
    last_login: Optional[datetime] = None
    preferences: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True


class ProfileUpdate(BaseModel):
    """Update user profile"""
    full_name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    
    @validator('full_name', pre=True)
    def empty_string_to_none(cls, v):
        """Convert empty strings to None"""
        if v == '' or (isinstance(v, str) and v.strip() == ''):
            return None
        return v
    
    @validator('email', pre=True)
    def empty_email_to_none(cls, v):
        """Convert empty strings to None"""
        if v == '' or (isinstance(v, str) and v.strip() == ''):
            return None
        return v


class PasswordChange(BaseModel):
    """Change user password"""
    current_password: str
    new_password: str = Field(..., min_length=6)


# Preferences Schemas
class PreferencesResponse(BaseModel):
    """User preferences"""
    theme: str = Field(default="light")  # "light" or "dark"
    map_default_zoom: int = Field(default=12, ge=5, le=18)
    show_clusters: bool = Field(default=True)
    notify_on_warning: bool = Field(default=True)
    prefer_offline_map: bool = Field(default=False)  # Prefer offline map tiles
    
    class Config:
        from_attributes = True


class PreferencesUpdate(BaseModel):
    """Update user preferences"""
    theme: Optional[str] = None
    map_default_zoom: Optional[int] = Field(None, ge=5, le=18)
    show_clusters: Optional[bool] = None
    notify_on_warning: Optional[bool] = None
    prefer_offline_map: Optional[bool] = None


# Health Schemas
class HealthResponse(BaseModel):
    """Health check response"""
    server_time: str
    ws_clients: int
    last_telemetry_received_at: Optional[str] = None