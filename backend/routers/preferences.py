"""
User preferences routes
Handles user UI preferences (theme, map settings, notifications, offline map preference)

Environment Variables:
- None required (uses existing database connection)

Usage:
- GET /api/v1/preferences - Returns current user preferences (requires auth)
- PUT /api/v1/preferences - Updates user preferences (requires auth)

Tests:
- Run: pytest backend/tests/test_preferences.py
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from datetime import datetime

from backend.models import User, UserPreferences
from backend.schemas import PreferencesResponse, PreferencesUpdate
from backend.auth import get_current_user
from backend.database import get_session

router = APIRouter(prefix="/api/v1/preferences", tags=["preferences"])


@router.get("", response_model=PreferencesResponse)
async def get_preferences(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Get user preferences
    Returns: { theme, map_default_zoom, show_clusters, notify_on_warning, prefer_offline_map }
    If preferences don't exist, creates default values (upsert semantics)
    """
    prefs = session.get(UserPreferences, current_user.id)
    
    if not prefs:
        # Create default preferences if they don't exist (upsert semantics)
        prefs = UserPreferences(
            user_id=current_user.id,
            theme="light",
            map_default_zoom=12,
            show_clusters=True,
            notify_on_warning=True,
            prefer_offline_map=False
        )
        session.add(prefs)
        session.commit()
        session.refresh(prefs)
    
    return PreferencesResponse(
        theme=prefs.theme,
        map_default_zoom=prefs.map_default_zoom,
        show_clusters=prefs.show_clusters,
        notify_on_warning=prefs.notify_on_warning,
        prefer_offline_map=getattr(prefs, 'prefer_offline_map', False)
    )


@router.put("", response_model=PreferencesResponse)
async def update_preferences(
    prefs_update: PreferencesUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Update user preferences
    Stores preferences in user_preferences table (per-user storage)
    Body: { theme?: "light"|"dark", map_default_zoom?: number, show_clusters?: bool, notify_on_warning?: bool, prefer_offline_map?: bool }
    """
    prefs = session.get(UserPreferences, current_user.id)
    
    if not prefs:
        # Create new preferences record
        prefs = UserPreferences(user_id=current_user.id)
        session.add(prefs)
    
    # Update fields if provided
    if prefs_update.theme is not None:
        if prefs_update.theme not in ["light", "dark"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="theme must be 'light' or 'dark'"
            )
        prefs.theme = prefs_update.theme
    
    if prefs_update.map_default_zoom is not None:
        if not (5 <= prefs_update.map_default_zoom <= 18):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="map_default_zoom must be between 5 and 18"
            )
        prefs.map_default_zoom = prefs_update.map_default_zoom
    
    if prefs_update.show_clusters is not None:
        prefs.show_clusters = prefs_update.show_clusters
    
    if prefs_update.notify_on_warning is not None:
        prefs.notify_on_warning = prefs_update.notify_on_warning
    
    if prefs_update.prefer_offline_map is not None:
        prefs.prefer_offline_map = prefs_update.prefer_offline_map
    
    prefs.updated_at = datetime.utcnow()
    
    session.add(prefs)
    session.commit()
    session.refresh(prefs)
    
    return PreferencesResponse(
        theme=prefs.theme,
        map_default_zoom=prefs.map_default_zoom,
        show_clusters=prefs.show_clusters,
        notify_on_warning=prefs.notify_on_warning,
        prefer_offline_map=getattr(prefs, 'prefer_offline_map', False)
    )
