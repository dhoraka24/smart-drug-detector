from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlmodel import Session, select
from contextlib import asynccontextmanager
import os
from datetime import datetime
from typing import List, Optional
from dotenv import load_dotenv

# Load environment variables from .env file
# Try loading from backend/.env first, then fallback to root .env
env_path = os.path.join(os.path.dirname(__file__), '.env')
print(f"[DEBUG] Looking for .env file at: {env_path}")
if os.path.exists(env_path):
    print(f"[DEBUG] .env file found at: {env_path}")
    # Try loading with override=True to ensure it loads
    load_dotenv(env_path, override=True)
    # Also try reading the file directly as fallback
    try:
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    key = key.strip()
                    value = value.strip()
                    if key == "DEVICE_API_KEY":
                        os.environ[key] = value
                        print(f"[DEBUG] Set DEVICE_API_KEY directly from file: {value[:10]}...")
                        break
    except Exception as e:
        print(f"[DEBUG] Error reading .env file directly: {e}")
    
    # Verify it loaded
    test_key = os.getenv("DEVICE_API_KEY", "")
    if test_key:
        print(f"[DEBUG] DEVICE_API_KEY loaded successfully: {test_key[:10]}...")
    else:
        print("[DEBUG] WARNING: DEVICE_API_KEY not found after loading .env file!")
        # Fallback: set it directly
        os.environ["DEVICE_API_KEY"] = "esp32-secure-key-2024"
        print("[DEBUG] Set DEVICE_API_KEY as fallback")
else:
    print(f"[DEBUG] .env file not found at: {env_path}, trying root directory...")
    # Fallback to root directory .env
    root_env = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
    print(f"[DEBUG] Looking for .env file at root: {root_env}")
    if os.path.exists(root_env):
        load_dotenv(root_env, override=True)
        print("[DEBUG] Loaded .env from root directory")
    else:
        load_dotenv(override=True)  # Try default location
        print("[DEBUG] WARNING: Using default load_dotenv() - .env file may not be found")
        # Final fallback
        if not os.getenv("DEVICE_API_KEY"):
            os.environ["DEVICE_API_KEY"] = "esp32-secure-key-2024"
            print("[DEBUG] Set DEVICE_API_KEY as final fallback")

from backend.models import Telemetry, Alert, DeviceSettings, User, TelemetryDuplicate
from backend.schemas import (
    TelemetryCreate, TelemetryResponse, AlertResponse,
    DeviceSettingsResponse, DeviceSettingsUpdate, AboutResponse
)
from backend.utils import (
    determine_severity_mq3_only, check_duplicate, check_duplicate_alert,
    get_recent_history, check_debounce, get_or_create_device_settings
)
from backend.openai_client import call_openai, get_fallback_alert
from backend.database import engine, create_db_and_tables, get_session
from backend.auth import get_current_user, get_current_admin, reset_rate_limit_for_ip
from backend.routers import auth, duplicates, profile, preferences, health, alerts_export, alerts_history, maps
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except:
                pass
    
    async def broadcast_ping(self):
        """Broadcast ping message to all connected clients"""
        ping_message = {
            "type": "ping",
            "server_time": datetime.utcnow().isoformat() + "Z"
        }
        await self.broadcast(ping_message)


manager = ConnectionManager()

# Track last telemetry received time
last_telemetry_received_at: Optional[datetime] = None


# Background task for WebSocket ping (runs globally, not per connection)
async def websocket_ping_task():
    """Background task to send ping messages to all WebSocket clients every 15 seconds"""
    import asyncio
    while True:
        await asyncio.sleep(15)
        try:
            await manager.broadcast_ping()
        except:
            pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager with background tasks"""
    import asyncio
    create_db_and_tables()
    
    # Start WebSocket ping task
    ping_task = asyncio.create_task(websocket_ping_task())
    
    yield
    
    # Cleanup
    ping_task.cancel()
    try:
        await ping_task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="Smart Drug Detector API",
    description="Backend API for Smart Drug Detector Dashboard",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for spec.pdf and INO file
os.makedirs("backend/static", exist_ok=True)
app.mount("/static", StaticFiles(directory="backend/static"), name="static")

# Include routers
app.include_router(auth.router)
app.include_router(duplicates.router)
app.include_router(profile.router)
app.include_router(preferences.router)
app.include_router(alerts_export.router)
app.include_router(alerts_history.router)
app.include_router(maps.router)

# Setup health router with manager reference (must import here to avoid circular import)
from backend.routers import health
health.set_manager(manager)
app.include_router(health.router)

# Serve ESP32 INO file
@app.get("/esp32/esp32_telemetry.ino")
async def get_ino_file():
    """Serve ESP32 INO file"""
    try:
        with open("esp32/esp32_telemetry.ino", "r", encoding="utf-8") as f:
            content = f.read()
        from fastapi.responses import Response
        return Response(content=content, media_type="text/plain")
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="INO file not found")


def verify_api_key(x_api_key: str = Header(...)):
    """Verify x-api-key header matches DEVICE_API_KEY"""
    device_api_key = os.getenv("DEVICE_API_KEY", "")
    logger.info(f"DEVICE_API_KEY from env: {device_api_key[:10] if device_api_key else 'NOT FOUND'}...")
    logger.info(f"Received x-api-key: {x_api_key[:10]}...")
    if not device_api_key:
        logger.error("DEVICE_API_KEY not found in environment variables!")
        raise HTTPException(status_code=500, detail="DEVICE_API_KEY not configured")
    if x_api_key != device_api_key:
        logger.warning(f"API key mismatch! Expected: {device_api_key[:10]}..., Got: {x_api_key[:10]}...")
        raise HTTPException(status_code=401, detail="Invalid API key")
    logger.info("API key verified successfully")
    return x_api_key


@app.get("/")
async def root():
    return {"message": "Smart Drug Detector API", "version": "1.0.0"}


@app.post("/api/v1/admin/reset-rate-limit")
async def reset_rate_limit_endpoint(
    ip_address: Optional[str] = None,
    current_user: User = Depends(get_current_admin)
):
    """
    Reset rate limit for login attempts (Admin only)
    Useful if you're locked out during development
    """
    reset_rate_limit_for_ip(ip_address)
    return {"message": "Rate limit reset successfully", "ip": ip_address or "all"}


@app.post("/api/v1/telemetry")
async def create_telemetry(
    telemetry: TelemetryCreate,
    session: Session = Depends(get_session),
    api_key: str = Depends(verify_api_key)
):
    """
    Accept telemetry data from ESP32 device.
    Validates API key, checks duplicates, determines severity, calls OpenAI if needed.
    Note: This endpoint uses device API key authentication (not JWT) for ESP32 devices.
    """
    import json
    global last_telemetry_received_at
    
    # Update last telemetry time (for health endpoint)
    last_telemetry_received_at = datetime.utcnow()
    from backend.routers import health
    health.set_last_telemetry_time(last_telemetry_received_at)
    
    # Get raw JSON payload for duplicate storage
    # Note: FastAPI already parsed the body, so we reconstruct it
    raw_payload = json.dumps(telemetry.dict())
    
    # Parse timestamp
    try:
        # Handle timezone-aware and naive timestamps
        ts_str = telemetry.timestamp.replace('Z', '+00:00')
        ts = datetime.fromisoformat(ts_str)
        # Convert to UTC naive datetime if timezone-aware
        if ts.tzinfo is not None:
            from datetime import timezone
            ts = ts.astimezone(timezone.utc).replace(tzinfo=None)
    except (ValueError, AttributeError) as e:
        raise HTTPException(status_code=400, detail=f"Invalid timestamp format: {e}")

    # Check for existing telemetry with same (device_id, timestamp)
    existing_statement = select(Telemetry).where(
        Telemetry.device_id == telemetry.device_id,
        Telemetry.ts == ts
    )
    existing_telemetry = session.exec(existing_statement).first()
    
    # If duplicate exists, store it and return duplicate response
    if existing_telemetry:
        # Store duplicate entry
        duplicate_entry = TelemetryDuplicate(
            original_telemetry_id=existing_telemetry.id,
            device_id=telemetry.device_id,
            timestamp=ts,
            payload_json=raw_payload,
            is_merged=False,
            is_ignored=False
        )
        session.add(duplicate_entry)
        session.commit()
        session.refresh(duplicate_entry)
        
        # Return duplicate response (200 OK with duplicate status)
        return {
            "status": "duplicate",
            "message": "Telemetry with same device_id and timestamp already exists.",
            "original_id": existing_telemetry.id,
            "duplicate_id": duplicate_entry.id
        }

    # Save telemetry (with error handling for constraint violations)
    try:
        db_telemetry = Telemetry(
            device_id=telemetry.device_id,
            ts=ts,
            mq3=telemetry.sensors.mq3,
            mq135=telemetry.sensors.mq135,
            temp_c=telemetry.sensors.temp_c,
            humidity_pct=telemetry.sensors.humidity_pct,
            lat=telemetry.gps.lat if telemetry.gps else None,
            lon=telemetry.gps.lon if telemetry.gps else None,
            alt=telemetry.gps.alt if telemetry.gps else None
        )
        session.add(db_telemetry)
        session.commit()
        session.refresh(db_telemetry)
    except Exception as e:
        session.rollback()
        # If it's a unique constraint violation, handle as duplicate
        error_str = str(e).upper()
        if "UNIQUE" in error_str or "unique_device_timestamp" in error_str or "INTEGRITY" in error_str:
            # Try to find existing telemetry
            existing_statement = select(Telemetry).where(
                Telemetry.device_id == telemetry.device_id,
                Telemetry.ts == ts
            )
            existing_telemetry = session.exec(existing_statement).first()
            
            if existing_telemetry:
                # Store duplicate entry
                duplicate_entry = TelemetryDuplicate(
                    original_telemetry_id=existing_telemetry.id,
                    device_id=telemetry.device_id,
                    timestamp=ts,
                    payload_json=raw_payload,
                    is_merged=False,
                    is_ignored=False
                )
                session.add(duplicate_entry)
                session.commit()
                session.refresh(duplicate_entry)
                
                return {
                    "status": "duplicate",
                    "message": "Telemetry with same device_id and timestamp already exists.",
                    "original_id": existing_telemetry.id,
                    "duplicate_id": duplicate_entry.id
                }
            else:
                return {
                    "status": "duplicate",
                    "message": "Telemetry with same device_id and timestamp already exists."
                }
        raise HTTPException(status_code=500, detail=f"Error saving telemetry: {e}")

    # Determine severity (MQ3-only)
    severity = determine_severity_mq3_only(telemetry.sensors.mq3)

    # If SAFE, return early
    if severity == "SAFE":
        return {
            "status": "SAFE",
            "mq3": telemetry.sensors.mq3
        }

    # For WARNING or HIGH, call OpenAI
    recent_history = get_recent_history(session, telemetry.device_id, limit=10)
    
    ai_response = call_openai(
        device_id=telemetry.device_id,
        timestamp=telemetry.timestamp,
        mq3=telemetry.sensors.mq3,
        mq135=telemetry.sensors.mq135,
        temp_c=telemetry.sensors.temp_c,
        humidity_pct=telemetry.sensors.humidity_pct,
        lat=telemetry.gps.lat if telemetry.gps else None,
        lon=telemetry.gps.lon if telemetry.gps else None,
        recent_history=recent_history
    )

    # Use AI response or fallback
    if not ai_response:
        ai_response = get_fallback_alert(
            severity=severity,
            mq3=telemetry.sensors.mq3,
            mq135=telemetry.sensors.mq135
        )

    # Ensure severity matches MQ3 logic (AI might return different)
    ai_response["severity"] = severity

    # Check if alert already exists for this telemetry (prevent duplicate alerts)
    if check_duplicate_alert(session, telemetry.device_id, ts):
        # Alert already exists for this telemetry, return existing alert info
        statement = select(Alert).where(
            Alert.device_id == telemetry.device_id,
            Alert.ts == ts
        )
        existing_alert = session.exec(statement).first()
        return {
            "status": "alert_exists",
            "severity": existing_alert.severity,
            "notified": existing_alert.notified,
            "message": "Alert already exists for this telemetry"
        }

    # Check debounce
    is_debounced = check_debounce(session, telemetry.device_id, severity)
    notified = not is_debounced if severity == "HIGH" else True

    # Create alert (with error handling for duplicates)
    try:
        alert = Alert(
            device_id=telemetry.device_id,
            ts=ts,
            severity=ai_response["severity"],
            short_message=ai_response["short_message"],
            explanation=ai_response.get("explanation", ""),
            recommended_action=ai_response.get("recommended_action", ""),
            confidence=ai_response.get("confidence", "medium"),
            mq3=telemetry.sensors.mq3,
            mq135=telemetry.sensors.mq135,
            lat=telemetry.gps.lat if telemetry.gps else None,
            lon=telemetry.gps.lon if telemetry.gps else None,
            alt=telemetry.gps.alt if telemetry.gps else None,
            notified=notified
        )
        session.add(alert)
        session.commit()
        session.refresh(alert)
    except Exception as e:
        session.rollback()
        # If alert creation fails, check if it's a duplicate
        existing_alert = session.exec(
            select(Alert).where(
                Alert.device_id == telemetry.device_id,
                Alert.ts == ts
            )
        ).first()
        if existing_alert:
            return {
                "status": "alert_exists",
                "severity": existing_alert.severity,
                "notified": existing_alert.notified,
                "message": "Alert already exists for this telemetry"
            }
        raise HTTPException(status_code=500, detail=f"Error creating alert: {e}")

    # Update last telemetry received time (for health endpoint)
    # Note: last_telemetry_received_at is already declared as global at function start
    last_telemetry_received_at = datetime.utcnow()
    from backend.routers import health
    health.set_last_telemetry_time(last_telemetry_received_at)
    
    # Log alert with GPS if available (structured logging)
    if alert.lat and alert.lon and alert.lat != 0.0 and alert.lon != 0.0:
        logger.info(
            f"Alert with GPS: device_id={alert.device_id}, severity={alert.severity}, "
            f"lat={alert.lat}, lon={alert.lon}, mq3={alert.mq3}, mq135={alert.mq135}"
        )
    
    # Broadcast alert via WebSocket (updated format with "data" key)
    # Format timestamp as ISO with 'Z' suffix to indicate UTC
    ts_iso = alert.ts.isoformat()
    if not ts_iso.endswith('Z'):
        ts_iso = ts_iso + 'Z'
    
    alert_data = {
        "type": "new_alert",
        "data": {
            "id": alert.id,
            "device_id": alert.device_id,
            "ts": ts_iso,
            "severity": alert.severity,
            "short_message": alert.short_message,
            "lat": alert.lat if alert.lat else None,
            "lon": alert.lon if alert.lon else None,
            "mq3": alert.mq3,
            "mq135": alert.mq135,
            "notified": alert.notified
        }
    }
    await manager.broadcast(alert_data)

    return {
        "status": "alert_created",
        "severity": alert.severity,
        "notified": alert.notified
    }


# Alerts endpoint moved to alerts_export.py router


@app.get("/api/v1/telemetry", response_model=List[TelemetryResponse])
async def get_telemetry(
    device_id: Optional[str] = None,
    limit: int = 100,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get telemetry data, optionally filtered by device_id - Requires authentication"""
    statement = select(Telemetry)
    if device_id:
        statement = statement.where(Telemetry.device_id == device_id)
    statement = statement.order_by(Telemetry.received_at.desc()).limit(limit)
    telemetries = session.exec(statement).all()
    return telemetries


@app.post("/api/v1/device-settings/{device_id}", response_model=DeviceSettingsResponse)
async def update_device_settings(
    device_id: str,
    settings_update: DeviceSettingsUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin)  # Admin only
):
    """Update device settings (thresholds stored but MQ3 logic remains default) - Admin only"""
    settings = get_or_create_device_settings(session, device_id)
    
    update_data = settings_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(settings, key, value)
    
    session.add(settings)
    session.commit()
    session.refresh(settings)
    return settings


@app.get("/api/v1/device-settings/{device_id}", response_model=DeviceSettingsResponse)
async def get_device_settings(
    device_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get device settings - Requires authentication"""
    settings = get_or_create_device_settings(session, device_id)
    return settings


@app.get("/api/v1/about", response_model=AboutResponse)
async def about():
    """Return system information - Public endpoint"""
    return {
        "system_name": "Smart Drug Detector",
        "version": "1.0.0",
        "description": "A real-time drug vapor detection system using MQ3 and MQ135 sensors with AI-powered analysis.",
        "spec_pdf_url": "/static/spec.pdf"
    }


@app.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket):
    """WebSocket endpoint for real-time alert updates"""
    await manager.connect(websocket)
    try:
        while True:
            # Wait for client messages (e.g., {"subscribe": "device_id"})
            data = await websocket.receive_text()
            try:
                import json
                msg = json.loads(data)
                if msg.get("subscribe"):
                    # Could filter by device_id here if needed
                    await websocket.send_json({"type": "subscribed", "device_id": msg.get("subscribe")})
            except:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# Background task for WebSocket ping (runs globally, not per connection)
async def websocket_ping_task():
    """Background task to send ping messages to all WebSocket clients every 15 seconds"""
    import asyncio
    while True:
        await asyncio.sleep(15)
        try:
            await manager.broadcast_ping()
        except:
            pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager with background tasks"""
    import asyncio
    create_db_and_tables()
    
    # Start WebSocket ping task
    ping_task = asyncio.create_task(websocket_ping_task())
    
    yield
    
    # Cleanup
    ping_task.cancel()
    try:
        await ping_task
    except asyncio.CancelledError:
        pass
