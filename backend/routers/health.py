"""
Health check routes
Provides server status, WebSocket client count, and last telemetry time
"""

from fastapi import APIRouter
from datetime import datetime
from typing import Optional

from backend.schemas import HealthResponse

router = APIRouter(prefix="/api/v1/health", tags=["health"])

# Global references set by app.py
manager = None
last_telemetry_received_at: Optional[datetime] = None


def set_manager(mgr):
    """Set the WebSocket connection manager (called from app.py)"""
    global manager
    manager = mgr


def set_last_telemetry_time(time: datetime):
    """Update last telemetry received time (called from app.py)"""
    global last_telemetry_received_at
    last_telemetry_received_at = time


@router.get("/connected", response_model=HealthResponse)
async def get_health_status():
    """
    Get server health and connection status
    No auth required - used for connection indicator
    Returns: { server_time, ws_clients, last_telemetry_received_at }
    """
    ws_client_count = 0
    if manager:
        ws_client_count = len(manager.active_connections)
    
    last_telemetry_str = None
    if last_telemetry_received_at:
        last_telemetry_str = last_telemetry_received_at.isoformat() + "Z"
    
    return HealthResponse(
        server_time=datetime.utcnow().isoformat() + "Z",
        ws_clients=ws_client_count,
        last_telemetry_received_at=last_telemetry_str
    )
