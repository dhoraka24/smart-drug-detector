"""
Script to clear all telemetry and alert data from database
"""

import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from sqlmodel import Session, select, delete
from backend.database import engine
from backend.models import Telemetry, Alert

def clear_all_data():
    """Clear all telemetry and alert data"""
    print("=" * 60)
    print("Clearing All Telemetry and Alert Data")
    print("=" * 60)
    
    with Session(engine) as session:
        # Count existing records
        telemetry_count = len(session.exec(select(Telemetry)).all())
        alerts_count = len(session.exec(select(Alert)).all())
        
        print(f"Found {telemetry_count} telemetry records")
        print(f"Found {alerts_count} alert records")
        print()
        
        # Delete all alerts
        session.exec(delete(Alert))
        print(f"[OK] Deleted {alerts_count} alerts")
        
        # Delete all telemetry
        session.exec(delete(Telemetry))
        print(f"[OK] Deleted {telemetry_count} telemetry records")
        
        session.commit()
        
        print()
        print("=" * 60)
        print("[OK] All data cleared successfully!")
        print("=" * 60)

if __name__ == "__main__":
    clear_all_data()

