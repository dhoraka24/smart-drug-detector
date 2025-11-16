"""
Duplicate Telemetry Management Routes
Handles viewing, merging, and ignoring duplicate telemetry entries
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select, func
from datetime import datetime
from typing import Optional, List
import json

from backend.models import Telemetry, TelemetryDuplicate
from backend.schemas import TelemetryResponse
from backend.auth import get_current_user, get_current_admin, get_db

router = APIRouter(prefix="/api/v1/duplicates", tags=["duplicates"])


@router.get("", response_model=dict)
async def get_duplicates(
    device_id: Optional[str] = Query(None, description="Filter by device ID"),
    from_ts: Optional[str] = Query(None, description="Start timestamp (ISO8601)"),
    to_ts: Optional[str] = Query(None, description="End timestamp (ISO8601)"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    session: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Get duplicate telemetry entries grouped by (device_id, timestamp)
    Returns original telemetry + duplicate count + sample duplicates
    """
    # Build base query
    statement = select(
        TelemetryDuplicate.original_telemetry_id,
        TelemetryDuplicate.device_id,
        TelemetryDuplicate.timestamp,
        func.count(TelemetryDuplicate.id).label("duplicate_count")
    ).where(
        TelemetryDuplicate.is_merged == False,
        TelemetryDuplicate.is_ignored == False
    )
    
    # Apply filters
    if device_id:
        statement = statement.where(TelemetryDuplicate.device_id == device_id)
    
    if from_ts:
        try:
            from_dt = datetime.fromisoformat(from_ts.replace('Z', '+00:00'))
            if from_dt.tzinfo:
                from_dt = from_dt.astimezone().replace(tzinfo=None)
            statement = statement.where(TelemetryDuplicate.timestamp >= from_dt)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid from_ts format")
    
    if to_ts:
        try:
            to_dt = datetime.fromisoformat(to_ts.replace('Z', '+00:00'))
            if to_dt.tzinfo:
                to_dt = to_dt.astimezone().replace(tzinfo=None)
            statement = statement.where(TelemetryDuplicate.timestamp <= to_dt)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid to_ts format")
    
    # Group by and order
    statement = statement.group_by(
        TelemetryDuplicate.original_telemetry_id,
        TelemetryDuplicate.device_id,
        TelemetryDuplicate.timestamp
    ).order_by(TelemetryDuplicate.timestamp.desc())
    
    # Get total count
    count_statement = select(func.count()).select_from(statement.subquery())
    total = session.exec(count_statement).one()
    
    # Apply pagination
    statement = statement.limit(limit).offset(offset)
    
    # Execute
    results = session.exec(statement).all()
    
    # Build response with original telemetry and sample duplicates
    duplicates_list = []
    for row in results:
        original_id = row.original_telemetry_id
        device_id_val = row.device_id
        ts = row.timestamp
        dup_count = row.duplicate_count
        
        # Get original telemetry
        original = session.get(Telemetry, original_id)
        if not original:
            continue
        
        # Get sample duplicates (up to 5)
        dup_statement = select(TelemetryDuplicate).where(
            TelemetryDuplicate.original_telemetry_id == original_id,
            TelemetryDuplicate.device_id == device_id_val,
            TelemetryDuplicate.timestamp == ts,
            TelemetryDuplicate.is_merged == False,
            TelemetryDuplicate.is_ignored == False
        ).limit(5)
        
        sample_duplicates = session.exec(dup_statement).all()
        
        duplicates_list.append({
            "original_telemetry": {
                "id": original.id,
                "device_id": original.device_id,
                "ts": original.ts.isoformat(),
                "mq3": original.mq3,
                "mq135": original.mq135,
                "temp_c": original.temp_c,
                "humidity_pct": original.humidity_pct,
                "received_at": original.received_at.isoformat()
            },
            "device_id": device_id_val,
            "timestamp": ts.isoformat(),
            "duplicate_count": dup_count,
            "sample_duplicates": [
                {
                    "id": dup.id,
                    "payload_json": json.loads(dup.payload_json) if dup.payload_json else {},
                    "received_at": dup.received_at.isoformat()
                }
                for dup in sample_duplicates
            ]
        })
    
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "duplicates": duplicates_list
    }


@router.get("/{duplicate_id}", response_model=dict)
async def get_duplicate_detail(
    duplicate_id: int,
    session: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get full details of a specific duplicate entry"""
    duplicate = session.get(TelemetryDuplicate, duplicate_id)
    if not duplicate:
        raise HTTPException(status_code=404, detail="Duplicate not found")
    
    original = session.get(Telemetry, duplicate.original_telemetry_id)
    
    return {
        "id": duplicate.id,
        "original_telemetry_id": duplicate.original_telemetry_id,
        "device_id": duplicate.device_id,
        "timestamp": duplicate.timestamp.isoformat(),
        "payload_json": json.loads(duplicate.payload_json) if duplicate.payload_json else {},
        "received_at": duplicate.received_at.isoformat(),
        "is_merged": duplicate.is_merged,
        "is_ignored": duplicate.is_ignored,
        "original_telemetry": {
            "id": original.id,
            "device_id": original.device_id,
            "ts": original.ts.isoformat(),
            "mq3": original.mq3,
            "mq135": original.mq135,
            "temp_c": original.temp_c,
            "humidity_pct": original.humidity_pct
        } if original else None
    }


@router.post("/merge")
async def merge_duplicates(
    merge_data: dict,
    session: Session = Depends(get_db),
    current_user = Depends(get_current_admin)  # Admin only
):
    """
    Merge duplicate telemetry entries into original
    Body: { "original_id": int, "duplicate_ids": [int] }
    """
    original_id = merge_data.get("original_id")
    duplicate_ids = merge_data.get("duplicate_ids", [])
    
    if not original_id or not duplicate_ids:
        raise HTTPException(status_code=400, detail="original_id and duplicate_ids required")
    
    # Verify original exists
    original = session.get(Telemetry, original_id)
    if not original:
        raise HTTPException(status_code=404, detail="Original telemetry not found")
    
    # Process each duplicate
    merged_count = 0
    for dup_id in duplicate_ids:
        duplicate = session.get(TelemetryDuplicate, dup_id)
        if not duplicate:
            continue
        
        if duplicate.is_merged:
            continue  # Already merged
        
        if duplicate.original_telemetry_id != original_id:
            raise HTTPException(
                status_code=400,
                detail=f"Duplicate {dup_id} does not belong to original {original_id}"
            )
        
        # Mark as merged
        duplicate.is_merged = True
        session.add(duplicate)
        merged_count += 1
    
    session.commit()
    
    return {
        "message": f"Successfully merged {merged_count} duplicate(s)",
        "original_id": original_id,
        "merged_count": merged_count
    }


@router.post("/ignore")
async def ignore_duplicates(
    ignore_data: dict,
    session: Session = Depends(get_db),
    current_user = Depends(get_current_admin)  # Admin only
):
    """
    Ignore duplicate telemetry entries
    Body: { "ids": [int] }
    """
    ids = ignore_data.get("ids", [])
    
    if not ids:
        raise HTTPException(status_code=400, detail="ids array required")
    
    ignored_count = 0
    for dup_id in ids:
        duplicate = session.get(TelemetryDuplicate, dup_id)
        if not duplicate:
            continue
        
        if duplicate.is_ignored:
            continue  # Already ignored
        
        duplicate.is_ignored = True
        session.add(duplicate)
        ignored_count += 1
    
    session.commit()
    
    return {
        "message": f"Successfully ignored {ignored_count} duplicate(s)",
        "ignored_count": ignored_count
    }

