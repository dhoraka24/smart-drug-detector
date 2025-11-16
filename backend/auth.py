"""
Authentication and authorization utilities
Handles JWT tokens, password hashing, and user authentication
"""

import os
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session, select

from backend.models import User, UserRole
from backend.database import engine

# OAuth2 scheme (using login-json endpoint)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login-json")

# JWT Configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

# Rate limiting (simple in-memory for demo)
login_attempts = {}


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    # Handle both passlib format ($2b$...) and raw bcrypt
    if hashed_password.startswith('$2'):
        # Passlib format - decode to get bcrypt hash
        try:
            return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
        except:
            # Try without encoding if already bytes
            return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password)
    else:
        # Raw bcrypt hash
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt directly"""
    # Generate salt and hash
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and verify a JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        return None


def get_user_by_email(session: Session, email: str) -> Optional[User]:
    """Get user by email"""
    statement = select(User).where(User.email == email)
    return session.exec(statement).first()


def authenticate_user(session: Session, email: str, password: str) -> Optional[User]:
    """Authenticate a user with email and password"""
    user = get_user_by_email(session, email)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def check_rate_limit(ip_address: str) -> bool:
    """
    Simple rate limiting for login attempts
    Returns True if allowed, False if rate limited
    """
    # For development: very lenient rate limiting
    # Set to False to disable rate limiting completely during development
    DISABLE_RATE_LIMIT = os.getenv("DISABLE_RATE_LIMIT", "false").lower() == "true"
    
    if DISABLE_RATE_LIMIT:
        return True  # Always allow (development only!)
    
    max_attempts = 50  # Very high limit for development
    window_minutes = 2  # Very short window (2 minutes)
    
    now = datetime.utcnow()
    key = f"{ip_address}"
    
    if key not in login_attempts:
        login_attempts[key] = []
    
    # Remove old attempts outside the window
    login_attempts[key] = [
        attempt_time for attempt_time in login_attempts[key]
        if (now - attempt_time).total_seconds() < window_minutes * 60
    ]
    
    # Check if limit exceeded
    if len(login_attempts[key]) >= max_attempts:
        return False
    
    # Record this attempt
    login_attempts[key].append(now)
    return True


def reset_rate_limit_for_ip(ip_address: str = None):
    """
    Reset rate limit for a specific IP or all IPs
    """
    if ip_address:
        if ip_address in login_attempts:
            del login_attempts[ip_address]
            return True
        return False
    else:
        # Clear all
        login_attempts.clear()
        return True


def get_db():
    """Dependency to get database session"""
    with Session(engine) as session:
        yield session


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: Session = Depends(get_db)
) -> User:
    """
    Dependency to get current authenticated user from JWT token
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception
    
    user = get_user_by_email(session, email)
    if user is None:
        raise credentials_exception
    
    return user


async def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to ensure current user is an admin
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions. Admin access required."
        )
    return current_user
