"""
Migration script to fix telemetry table schema
Updates old column names to match the current model
"""
import sqlite3
import os
from pathlib import Path

# Get database path
db_path = Path("database.db")
if not db_path.exists():
    print("Database not found. It will be created with correct schema on next startup.")
    exit(0)

conn = sqlite3.connect(str(db_path))
cursor = conn.cursor()

try:
    # Check current columns
    cursor.execute("PRAGMA table_info(telemetry)")
    columns = [row[1] for row in cursor.fetchall()]
    print(f"Current columns: {columns}")
    
    # Check if old schema exists
    has_old_schema = 'mq3_reading' in columns or 'timestamp' in columns
    has_new_schema = 'ts' in columns and 'mq3' in columns
    
    if has_old_schema and not has_new_schema:
        print("Old schema detected. Migrating...")
        
        # Create new table with correct schema
        cursor.execute("""
            CREATE TABLE telemetry_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT NOT NULL,
                ts TIMESTAMP NOT NULL,
                mq3 INTEGER NOT NULL,
                mq135 INTEGER NOT NULL,
                temp_c REAL,
                humidity_pct REAL,
                lat REAL,
                lon REAL,
                alt REAL,
                received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(device_id, ts)
            )
        """)
        
        # Copy data from old table (mapping old columns to new)
        cursor.execute("""
            INSERT INTO telemetry_new (id, device_id, ts, mq3, mq135, temp_c, humidity_pct, lat, lon, alt, received_at)
            SELECT 
                id,
                device_id,
                COALESCE(timestamp, datetime('now')) as ts,
                COALESCE(mq3_reading, 0) as mq3,
                0 as mq135,  -- Default value for mq135 if not in old schema
                temperature as temp_c,
                humidity as humidity_pct,
                latitude as lat,
                longitude as lon,
                NULL as alt,
                COALESCE(timestamp, datetime('now')) as received_at
            FROM telemetry
        """)
        
        # Drop old table and rename new one
        cursor.execute("DROP TABLE telemetry")
        cursor.execute("ALTER TABLE telemetry_new RENAME TO telemetry")
        
        # Create indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_telemetry_device_id ON telemetry(device_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS ix_telemetry_ts ON telemetry(ts)")
        
        conn.commit()
        print("Migration completed successfully!")
    elif has_new_schema:
        print("Schema is already up to date.")
    else:
        print("Unknown schema. Please check the database manually.")
        
except Exception as e:
    conn.rollback()
    print(f"Migration failed: {e}")
    raise
finally:
    conn.close()

