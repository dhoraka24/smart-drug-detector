"""
Database migration script to add user_preferences table and telemetry index
Run this script once to update the database schema
"""

from sqlmodel import SQLModel, create_engine, text
import os

# Get database URL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./database.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})


def run_migration():
    """Run database migration"""
    print("Starting database migration...")
    
    with engine.connect() as conn:
        # Check if user_preferences table exists
        result = conn.execute(text("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='user_preferences'
        """))
        table_exists = result.fetchone() is not None
        
        if not table_exists:
            print("Creating user_preferences table...")
            # Create user_preferences table
            conn.execute(text("""
                CREATE TABLE user_preferences (
                    user_id INTEGER PRIMARY KEY,
                    theme TEXT NOT NULL DEFAULT 'light',
                    map_default_zoom INTEGER NOT NULL DEFAULT 13,
                    show_clusters INTEGER NOT NULL DEFAULT 1,
                    notify_on_warning INTEGER NOT NULL DEFAULT 1,
                    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            """))
            conn.commit()
            print("✓ user_preferences table created")
        else:
            print("✓ user_preferences table already exists")
        
        # Check if telemetry index exists
        result = conn.execute(text("""
            SELECT name FROM sqlite_master 
            WHERE type='index' AND name='idx_telemetry_lat_lon'
        """))
        index_exists = result.fetchone() is not None
        
        if not index_exists:
            print("Creating index on telemetry(lat, lon)...")
            # Create index on telemetry lat/lon for faster geospatial queries
            conn.execute(text("""
                CREATE INDEX idx_telemetry_lat_lon 
                ON telemetry(lat, lon)
            """))
            conn.commit()
            print("✓ Index on telemetry(lat, lon) created")
        else:
            print("✓ Index on telemetry(lat, lon) already exists")
    
    print("\nMigration completed successfully!")


if __name__ == "__main__":
    run_migration()
