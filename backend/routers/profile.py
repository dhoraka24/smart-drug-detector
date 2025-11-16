"""
Profile management routes
Handles user profile retrieval and updates
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import datetime

from backend.models import User, UserPreferences
from backend.schemas import ProfileResponse, ProfileUpdate, PasswordChange
from backend.auth import get_current_user, get_password_hash, verify_password
from backend.database import get_session

router = APIRouter(prefix="/api/v1", tags=["profile"])


@router.get("/profile", response_model=ProfileResponse)
async def get_profile(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Get current user's profile with preferences
    Returns: { id, email, full_name, role, created_at, last_login, preferences }
    """
    # Get user preferences
    prefs = session.get(UserPreferences, current_user.id)
    preferences_dict = None
    if prefs:
        preferences_dict = {
            "theme": prefs.theme,
            "map_default_zoom": prefs.map_default_zoom,
            "show_clusters": prefs.show_clusters,
            "notify_on_warning": prefs.notify_on_warning,
            "prefer_offline_map": getattr(prefs, 'prefer_offline_map', False)
        }
    
    return ProfileResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        created_at=current_user.created_at,
        last_login=current_user.last_login,
        preferences=preferences_dict
    )


@router.put("/profile", response_model=ProfileResponse)
async def update_profile(
    profile_update: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Update user profile (full_name and/or email)
    Email change allowed but must be unique
    """
    # Handle empty strings as None (frontend may send empty strings)
    # Empty strings mean "don't change this field", so we preserve current value
    if profile_update.full_name is not None:
        if profile_update.full_name.strip() == '':
            # Empty string means don't change - keep current value
            profile_update.full_name = None
        else:
            # Non-empty string - update it
            current_user.full_name = profile_update.full_name
    
    if profile_update.email is not None:
        if profile_update.email.strip() == '':
            # Empty string means don't change - keep current value
            profile_update.email = None
        elif profile_update.email != current_user.email:
            # Email is being changed - check if it's already in use
            from backend.auth import get_user_by_email
            existing_user = get_user_by_email(session, profile_update.email)
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already in use"
                )
            current_user.email = profile_update.email
    
    # Merge user into current session (get_current_user may use a different session)
    # This ensures the user object is attached to this session
    current_user = session.merge(current_user)
    session.commit()
    session.refresh(current_user)
    
    # Get preferences for response
    prefs = session.get(UserPreferences, current_user.id)
    preferences_dict = None
    if prefs:
        preferences_dict = {
            "theme": prefs.theme,
            "map_default_zoom": prefs.map_default_zoom,
            "show_clusters": prefs.show_clusters,
            "notify_on_warning": prefs.notify_on_warning,
            "prefer_offline_map": getattr(prefs, 'prefer_offline_map', False)
        }
    
    return ProfileResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        created_at=current_user.created_at,
        last_login=current_user.last_login,
        preferences=preferences_dict
    )


@router.post("/profile/change-password")
async def change_password(
    password_change: PasswordChange,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Change user password
    Requires current password for verification
    """
    # Verify current password
    if not verify_password(password_change.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Validate new password (already validated by schema, but double-check)
    if len(password_change.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters long"
        )
    
    # Update password
    current_user.password_hash = get_password_hash(password_change.new_password)
    session.add(current_user)
    session.commit()
    
    return {"message": "Password changed successfully"}
