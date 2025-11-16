"""
Authentication routes
Handles user registration, login, and authentication
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlmodel import Session
from datetime import datetime

from backend.models import User, UserRole
from backend.schemas import UserCreate, UserLogin, Token, UserResponse, UserPublic
from backend.auth import (
    get_password_hash, authenticate_user, create_access_token,
    get_current_user, get_db, check_rate_limit
)

router = APIRouter(prefix="/api/v1/auth", tags=["authentication"])


@router.post("/signup", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
async def signup(
    user_data: UserCreate,
    session: Session = Depends(get_db)
):
    """
    Register a new user
    Creates a user with role "user" (admin users must be created via seed script)
    """
    # Check if user already exists
    from backend.auth import get_user_by_email
    existing_user = get_user_by_email(session, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        password_hash=hashed_password,
        role=UserRole.USER
    )
    
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    
    return new_user


@router.post("/login-json", response_model=dict)
async def login_json(
    login_data: UserLogin,
    session: Session = Depends(get_db),
    request: Request = None
):
    """
    Login endpoint accepting JSON (alternative to OAuth2PasswordRequestForm)
    Returns token and user information
    """
    # Get client IP for rate limiting
    client_ip = request.client.host if request else "unknown"
    
    # Check rate limit
    if not check_rate_limit(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Please try again later."
        )
    
    # Authenticate user
    user = authenticate_user(session, login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    session.add(user)
    session.commit()
    
    # Create access token
    access_token = create_access_token(data={"sub": user.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value
        }
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current authenticated user information
    Protected endpoint requiring valid JWT token
    """
    return current_user


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user)
):
    """
    Logout endpoint
    Note: JWT tokens are stateless, so this is mainly for client-side token removal
    In production, you might want to implement a token blacklist/revocation system
    """
    return {"message": "Successfully logged out"}
