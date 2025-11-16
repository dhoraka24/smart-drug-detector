"""
Database seed script to create admin user
Run this once to create the default admin account

Run from project root: python backend/seed_admin.py
Or from backend directory: python seed_admin.py (if PYTHONPATH includes parent)
"""

import sys
import os

# Add parent directory to path so we can import backend module
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import engine, create_db_and_tables
from backend.models import User, UserRole
from backend.auth import get_password_hash
from sqlmodel import Session, select

def create_admin_user():
    """Create default admin user"""
    create_db_and_tables()
    
    with Session(engine) as session:
        # Check if admin already exists
        statement = select(User).where(User.email == "admin@example.com")
        existing = session.exec(statement).first()
        
        if existing:
            print("Admin user already exists!")
            print(f"Email: {existing.email}")
            print(f"Role: {existing.role}")
            return
        
        # Create admin user
        admin = User(
            email="admin@example.com",
            full_name="Administrator",
            password_hash=get_password_hash("Admin123!"),
            role=UserRole.ADMIN
        )
        
        session.add(admin)
        session.commit()
        session.refresh(admin)
        
        print("=" * 60)
        print("Admin user created successfully!")
        print("=" * 60)
        print(f"Email: {admin.email}")
        print(f"Password: Admin123!")
        print(f"Role: {admin.role.value}")
        print("=" * 60)
        print("WARNING: IMPORTANT: Change the default password after first login!")
        print("=" * 60)


if __name__ == "__main__":
    create_admin_user()

