"""
Seed script to create sample duplicate telemetry entries for testing
Run this to populate the database with test duplicates
"""

import sys
import os
import json
from datetime import datetime, timedelta

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import engine, create_db_and_tables
from backend.models import Telemetry, TelemetryDuplicate
from backend.auth import get_password_hash
from sqlmodel import Session, select

def seed_duplicates():
    """Create sample telemetry and duplicates"""
    create_db_and_tables()
    
    with Session(engine) as session:
        # Create some original telemetry entries
        base_time = datetime.utcnow() - timedelta(days=1)
        
        for i in range(5):
            device_id = f"esp32-test-{i+1:03d}"
            ts = base_time + timedelta(minutes=i*10)
            
            # Check if already exists
            existing = session.exec(
                select(Telemetry).where(
                    Telemetry.device_id == device_id,
                    Telemetry.ts == ts
                )
            ).first()
            
            if existing:
                original = existing
            else:
                original = Telemetry(
                    device_id=device_id,
                    ts=ts,
                    mq3=300 + (i * 50),
                    mq135=200 + (i * 30),
                    temp_c=25.0 + i,
                    humidity_pct=50.0 + (i * 5),
                    lat=13.0827 + (i * 0.01),
                    lon=80.2707 + (i * 0.01)
                )
                session.add(original)
                session.commit()
                session.refresh(original)
            
            # Create 2-4 duplicate entries for each original
            num_duplicates = 2 + (i % 3)
            for j in range(num_duplicates):
                payload = {
                    "device_id": device_id,
                    "timestamp": ts.isoformat(),
                    "sensors": {
                        "mq3": original.mq3 + (j * 2),  # Slight variation
                        "mq135": original.mq135 + (j * 1),
                        "temp_c": original.temp_c,
                        "humidity_pct": original.humidity_pct
                    },
                    "gps": {
                        "lat": original.lat,
                        "lon": original.lon,
                        "alt": 12.5
                    }
                }
                
                duplicate = TelemetryDuplicate(
                    original_telemetry_id=original.id,
                    device_id=device_id,
                    timestamp=ts,
                    payload_json=json.dumps(payload),
                    received_at=ts + timedelta(seconds=30 + (j * 10)),
                    is_merged=False,
                    is_ignored=False
                )
                session.add(duplicate)
        
        session.commit()
        
        print("=" * 60)
        print("Sample duplicates created successfully!")
        print("=" * 60)
        print(f"Created duplicates for {5} original telemetry entries")
        print("Check the Duplicate Telemetry page in the frontend")
        print("=" * 60)


if __name__ == "__main__":
    seed_duplicates()

