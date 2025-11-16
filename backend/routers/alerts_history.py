"""
Alert history endpoint for replay functionality
Supports raw alert retrieval and time-bucketed aggregation for performance
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select, and_, func, case
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta, timezone
import json
import logging

from backend.models import Alert, User
from backend.schemas import AlertResponse
from backend.auth import get_current_user, get_current_admin
from backend.database import get_session

router = APIRouter(prefix="/api/v1/alerts", tags=["alerts"])

logger = logging.getLogger(__name__)

# Maximum limits for safety
MAX_LIMIT_RAW = 50000
MAX_LIMIT_AGGREGATE = 100000
DEFAULT_MAX_RANGE_HOURS = 48  # Default max range for non-admin users
ADMIN_MAX_RANGE_HOURS = 168  # 7 days for admin


class AlertHistoryItem(AlertResponse):
    """Alert item for history response (same as AlertResponse)"""
    pass


class AggregationBucket(BaseModel):
    """Time-bucketed aggregation result"""
    bucket_start: str  # ISO8601 timestamp
    counts: dict  # {"SAFE": int, "WARNING": int, "HIGH": int}
    repr_lat: Optional[float]  # Representative latitude (centroid or first alert)
    repr_lon: Optional[float]  # Representative longitude
    total_count: int  # Total alerts in bucket
    
    class Config:
        from_attributes = True


@router.get("/history")
async def get_alert_history(
    from_time: str = Query(..., description="Start time (ISO8601)"),
    to_time: str = Query(..., description="End time (ISO8601)"),
    device_id: Optional[str] = Query(None, description="Filter by device ID"),
    limit: int = Query(10000, ge=1, le=MAX_LIMIT_RAW, description="Maximum alerts to return"),
    aggregate: bool = Query(False, description="Return aggregated buckets instead of raw alerts"),
    bucket_minutes: Optional[int] = Query(None, ge=1, le=1440, description="Bucket size in minutes (required if aggregate=true)"),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Get alert history for replay functionality
    
    - Raw mode (aggregate=false): Returns ordered list of alerts with GPS coordinates
    - Aggregation mode (aggregate=true): Returns time-bucketed counts per severity
    
    Performance notes:
    - For ranges > 48 hours (non-admin) or > 7 days (admin), use aggregation mode
    - Default limit is 10k alerts; max 50k for raw mode
    - Aggregation mode supports up to 100k alerts
    """
    try:
        # Parse timestamps
        from_dt = datetime.fromisoformat(from_time.replace('Z', '+00:00'))
        to_dt = datetime.fromisoformat(to_time.replace('Z', '+00:00'))
        
        # Convert to UTC naive if timezone-aware
        if from_dt.tzinfo:
            from_dt = from_dt.astimezone(timezone.utc).replace(tzinfo=None)
        if to_dt.tzinfo:
            to_dt = to_dt.astimezone(timezone.utc).replace(tzinfo=None)
    except (ValueError, AttributeError) as e:
        raise HTTPException(status_code=400, detail=f"Invalid timestamp format: {e}")
    
    # Validate time range
    if from_dt >= to_dt:
        raise HTTPException(status_code=400, detail="from_time must be before to_time")
    
    # Enforce range limits based on user role
    range_hours = (to_dt - from_dt).total_seconds() / 3600
    max_range = ADMIN_MAX_RANGE_HOURS if current_user.role == "admin" else DEFAULT_MAX_RANGE_HOURS
    
    if range_hours > max_range:
        raise HTTPException(
            status_code=400,
            detail=f"Time range exceeds maximum ({max_range}h). Use aggregation mode for large ranges."
        )
    
    # Build base query
    statement = select(Alert).where(
        and_(
            Alert.ts >= from_dt,
            Alert.ts <= to_dt,
            Alert.lat.isnot(None),
            Alert.lon.isnot(None),
            Alert.lat != 0.0,
            Alert.lon != 0.0
        )
    )
    
    # Apply device filter
    if device_id:
        statement = statement.where(Alert.device_id == device_id)
    
    if aggregate:
        # Aggregation mode
        if not bucket_minutes:
            raise HTTPException(
                status_code=400,
                detail="bucket_minutes is required when aggregate=true"
            )
        
        # Calculate bucket size in seconds
        bucket_seconds = bucket_minutes * 60
        
        # SQL aggregation query
        # Group by time bucket and severity, calculate counts and representative coordinates
        # Note: This is a simplified aggregation; for production, consider using database-specific functions
        alerts = session.exec(
            statement.order_by(Alert.ts.asc())
        ).all()
        
        # Manual aggregation (for SQLite compatibility)
        buckets = {}
        for alert in alerts:
            # Calculate bucket start time
            bucket_start_seconds = int((alert.ts - from_dt).total_seconds() // bucket_seconds) * bucket_seconds
            bucket_start = from_dt + timedelta(seconds=bucket_start_seconds)
            bucket_key = bucket_start.isoformat() + 'Z'
            
            if bucket_key not in buckets:
                buckets[bucket_key] = {
                    "bucket_start": bucket_key,
                    "counts": {"SAFE": 0, "WARNING": 0, "HIGH": 0},
                    "repr_lat": alert.lat,
                    "repr_lon": alert.lon,
                    "total_count": 0,
                    "lat_sum": 0.0,
                    "lon_sum": 0.0,
                    "lat_count": 0
                }
            
            bucket = buckets[bucket_key]
            bucket["counts"][alert.severity] = bucket["counts"].get(alert.severity, 0) + 1
            bucket["total_count"] += 1
            
            # Update representative coordinates (centroid)
            if alert.lat and alert.lon:
                bucket["lat_sum"] += alert.lat
                bucket["lon_sum"] += alert.lon
                bucket["lat_count"] += 1
                bucket["repr_lat"] = bucket["lat_sum"] / bucket["lat_count"]
                bucket["repr_lon"] = bucket["lon_sum"] / bucket["lat_count"]
        
        # Convert to response format
        result = []
        for bucket_key in sorted(buckets.keys()):
            bucket = buckets[bucket_key]
            result.append(AggregationBucket(
                bucket_start=bucket["bucket_start"],
                counts=bucket["counts"],
                repr_lat=bucket["repr_lat"],
                repr_lon=bucket["repr_lon"],
                total_count=bucket["total_count"]
            ))
        
        return result
    
    else:
        # Raw mode - return individual alerts
        statement = statement.order_by(Alert.ts.asc()).limit(limit)
        alerts = session.exec(statement).all()
        
        # Check if we're approaching the limit
        if len(alerts) >= limit:
            logger.warning(
                f"Query returned {len(alerts)} alerts (limit: {limit}). "
                "Consider using aggregate=true for better performance."
            )
        
        return alerts


@router.get("/history/stream")
async def stream_alert_history(
    from_time: str = Query(..., description="Start time (ISO8601)"),
    to_time: str = Query(..., description="End time (ISO8601)"),
    device_id: Optional[str] = Query(None, description="Filter by device ID"),
    batch_size: int = Query(500, ge=1, le=5000, description="Alerts per batch"),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Stream alert history as Server-Sent Events (SSE)
    Useful for large datasets where loading all at once would be too slow
    
    Returns: JSON array chunks in chronological order
    Format: data: [{"id": 1, ...}, {"id": 2, ...}]\n\n
    """
    try:
        from_dt = datetime.fromisoformat(from_time.replace('Z', '+00:00'))
        to_dt = datetime.fromisoformat(to_time.replace('Z', '+00:00'))
        
        if from_dt.tzinfo:
            from_dt = from_dt.astimezone(timezone.utc).replace(tzinfo=None)
        if to_dt.tzinfo:
            to_dt = to_dt.astimezone(timezone.utc).replace(tzinfo=None)
    except (ValueError, AttributeError) as e:
        raise HTTPException(status_code=400, detail=f"Invalid timestamp format: {e}")
    
    if from_dt >= to_dt:
        raise HTTPException(status_code=400, detail="from_time must be before to_time")
    
    # Build query
    statement = select(Alert).where(
        and_(
            Alert.ts >= from_dt,
            Alert.ts <= to_dt,
            Alert.lat.isnot(None),
            Alert.lon.isnot(None),
            Alert.lat != 0.0,
            Alert.lon != 0.0
        )
    )
    
    if device_id:
        statement = statement.where(Alert.device_id == device_id)
    
    statement = statement.order_by(Alert.ts.asc())
    
    async def generate():
        """Generator function for SSE streaming"""
        offset = 0
        while True:
            batch_statement = statement.offset(offset).limit(batch_size)
            batch = session.exec(batch_statement).all()
            
            if not batch:
                break
            
            # Convert to dict format
            batch_data = [
                {
                    "id": alert.id,
                    "device_id": alert.device_id,
                    "ts": alert.ts.isoformat() + 'Z',
                    "severity": alert.severity,
                    "short_message": alert.short_message,
                    "mq3": alert.mq3,
                    "mq135": alert.mq135,
                    "lat": alert.lat,
                    "lon": alert.lon
                }
                for alert in batch
            ]
            
            # SSE format: data: <json>\n\n
            yield f"data: {json.dumps(batch_data)}\n\n"
            
            offset += batch_size
            
            if len(batch) < batch_size:
                break
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable nginx buffering
        }
    )

