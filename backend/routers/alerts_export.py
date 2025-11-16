"""
Alerts routes with GPS filtering and CSV export
Handles alert retrieval with lat/lon filtering and CSV export functionality
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import Response
from sqlmodel import Session, select, and_
from typing import List, Optional
import csv
import io
from datetime import datetime

from backend.models import Alert, User
from backend.schemas import AlertResponse
from backend.auth import get_current_user, get_current_admin, get_db

router = APIRouter(prefix="/api/v1/alerts", tags=["alerts"])


@router.get("", response_model=List[AlertResponse])
async def get_alerts(
    lat_only: bool = Query(False, description="Return only alerts with GPS coordinates"),
    limit: int = Query(50, ge=1, le=1000, description="Maximum number of alerts to return"),
    device_id: Optional[str] = Query(None, description="Filter by device ID"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get latest alerts, optionally filtered by GPS coordinates
    - If lat_only=true: Returns only alerts where lat != 0 and lon != 0
    - Ordered newest → oldest
    - Requires authentication
    """
    statement = select(Alert)
    
    # Apply GPS filter if requested
    if lat_only:
        statement = statement.where(
            and_(
                Alert.lat.isnot(None),
                Alert.lon.isnot(None),
                Alert.lat != 0.0,
                Alert.lon != 0.0
            )
        )
    
    # Apply device filter if provided
    if device_id:
        statement = statement.where(Alert.device_id == device_id)
    
    # Order by newest first and limit
    statement = statement.order_by(Alert.created_at.desc()).limit(limit)
    
    alerts = session.exec(statement).all()
    return alerts


@router.get("/export")
async def export_alerts_csv(
    lat_only: bool = Query(True, description="Export only alerts with GPS coordinates"),
    limit: int = Query(1000, ge=1, le=10000, description="Maximum number of alerts to export"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)  # Admin only for export
):
    """
    Export alerts to CSV format
    Returns CSV file with alerts data
    Admin only - requires authentication
    """
    statement = select(Alert)
    
    # Apply GPS filter if requested
    if lat_only:
        statement = statement.where(
            and_(
                Alert.lat.isnot(None),
                Alert.lon.isnot(None),
                Alert.lat != 0.0,
                Alert.lon != 0.0
            )
        )
    
    # Order by newest first and limit
    statement = statement.order_by(Alert.created_at.desc()).limit(limit)
    
    alerts = session.exec(statement).all()
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "id", "device_id", "timestamp", "severity", "mq3", "mq135",
        "lat", "lon", "short_message"
    ])
    
    # Write data rows
    for alert in alerts:
        writer.writerow([
            alert.id,
            alert.device_id,
            alert.ts.isoformat() if alert.ts else "",
            alert.severity,
            alert.mq3,
            alert.mq135,
            alert.lat if alert.lat else "",
            alert.lon if alert.lon else "",
            alert.short_message
        ])
    
    # Generate filename with current date
    filename = f"alerts_gps_{datetime.utcnow().strftime('%Y-%m-%d')}.csv"
    
    # Return CSV as downloadable file
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )
