"""
Migration script to add indexes on alerts table for replay performance
- Index on alerts.ts (timestamp) for time-range queries
- Composite index on alerts(lat, lon) for geospatial queries (if not exists)
"""

import sqlite3
import os
from pathlib import Path

# Database path
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./database.db")
# Extract path from SQLite URL
db_path = DATABASE_URL.replace("sqlite:///", "")

def add_indexes():
    """Add indexes to alerts table"""
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}. Creating tables first...")
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if indexes already exist
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='index' AND name='idx_alerts_ts'
        """)
        ts_index_exists = cursor.fetchone() is not None
        
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='index' AND name='idx_alerts_lat_lon'
        """)
        lat_lon_index_exists = cursor.fetchone() is not None
        
        # Add timestamp index if missing
        if not ts_index_exists:
            print("Adding index on alerts.ts...")
            cursor.execute("""
                CREATE INDEX idx_alerts_ts ON alerts(ts)
            """)
            print("✓ Index idx_alerts_ts created")
        else:
            print("✓ Index idx_alerts_ts already exists")
        
        # Add composite lat/lon index if missing
        if not lat_lon_index_exists:
            print("Adding composite index on alerts(lat, lon)...")
            cursor.execute("""
                CREATE INDEX idx_alerts_lat_lon ON alerts(lat, lon)
            """)
            print("✓ Index idx_alerts_lat_lon created")
        else:
            print("✓ Index idx_alerts_lat_lon already exists")
        
        # Add composite index for time-range + GPS queries (optimized for replay)
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='index' AND name='idx_alerts_ts_lat_lon'
        """)
        ts_lat_lon_index_exists = cursor.fetchone() is not None
        
        if not ts_lat_lon_index_exists:
            print("Adding composite index on alerts(ts, lat, lon)...")
            cursor.execute("""
                CREATE INDEX idx_alerts_ts_lat_lon ON alerts(ts, lat, lon)
            """)
            print("✓ Index idx_alerts_ts_lat_lon created")
        else:
            print("✓ Index idx_alerts_ts_lat_lon already exists")
        
        conn.commit()
        print("\n✅ Migration completed successfully!")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Error during migration: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    print("Running alert indexes migration...")
    add_indexes()

