"""
Migration script to add user_preferences table and prefer_offline_map column

Usage:
    python backend/db_migrations/001_add_user_preferences.py

Environment:
    Uses DATABASE_URL from environment or defaults to sqlite:///./database.db
"""

import sqlite3
import os
from pathlib import Path

# Database path
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./database.db")
# Extract path from SQLite URL
db_path = DATABASE_URL.replace("sqlite:///", "")

def run_migration():
    """Run migration to add user_preferences table and prefer_offline_map column"""
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}. Creating tables first...")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if user_preferences table exists
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='user_preferences'
        """)
        table_exists = cursor.fetchone() is not None
        
        if not table_exists:
            print("Creating user_preferences table...")
            cursor.execute("""
                CREATE TABLE user_preferences (
                    user_id INTEGER PRIMARY KEY,
                    theme TEXT NOT NULL DEFAULT 'light',
                    map_default_zoom INTEGER NOT NULL DEFAULT 12,
                    show_clusters INTEGER NOT NULL DEFAULT 1,
                    notify_on_warning INTEGER NOT NULL DEFAULT 1,
                    prefer_offline_map INTEGER NOT NULL DEFAULT 0,
                    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            """)
            print("[OK] user_preferences table created")
        else:
            print("[OK] user_preferences table already exists")
            
            # Check if prefer_offline_map column exists
            cursor.execute("PRAGMA table_info(user_preferences)")
            columns = [col[1] for col in cursor.fetchall()]
            
            if 'prefer_offline_map' not in columns:
                print("Adding prefer_offline_map column...")
                cursor.execute("""
                    ALTER TABLE user_preferences 
                    ADD COLUMN prefer_offline_map INTEGER NOT NULL DEFAULT 0
                """)
                print("[OK] prefer_offline_map column added")
            else:
                print("[OK] prefer_offline_map column already exists")
        
        # Create index
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id 
            ON user_preferences(user_id)
        """)
        print("[OK] Index created")
        
        conn.commit()
        print("\n[SUCCESS] Migration completed successfully!")
        
    except Exception as e:
        conn.rollback()
        print(f"[ERROR] Error during migration: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    print("Running user_preferences migration...")
    run_migration()

