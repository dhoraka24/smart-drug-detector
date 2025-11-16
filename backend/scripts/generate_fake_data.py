"""
Script to generate fake drug detection data for testing/demo
Creates telemetry and alerts with GPS coordinates at college location
"""

import sys
import os
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from datetime import datetime, timedelta, timezone
from sqlmodel import Session, select
from backend.database import engine
from backend.models import Telemetry, Alert, DeviceSettings
import random

# College location coordinates - PSNA College of Engineering, Dindigul
# Coordinates: PSNA College of Engineering, Dindigul, Tamil Nadu
COLLEGE_LAT = 10.3624  # PSNA College of Engineering, Dindigul
COLLEGE_LON = 77.9702  # PSNA College of Engineering, Dindigul
COLLEGE_ALT = 300.0  # meters above sea level (Dindigul elevation ~300m)

# Device IDs
DEVICE_IDS = ["ESP32_001", "ESP32_002", "ESP32_003"]

# Fake data scenarios
SCENARIOS = [
    {
        "severity": "SAFE",
        "mq3_range": (200, 350),
        "mq135_range": (100, 200),
        "temp_range": (25.0, 30.0),
        "humidity_range": (50.0, 70.0),
        "message": "Normal air quality detected",
        "explanation": "Sensor readings are within safe parameters. No drug vapors detected.",
        "action": "Continue monitoring. No action required.",
    },
    {
        "severity": "WARNING",
        "mq3_range": (350, 500),
        "mq135_range": (200, 350),
        "temp_range": (28.0, 32.0),
        "humidity_range": (60.0, 75.0),
        "message": "Elevated alcohol/drug vapor levels detected",
        "explanation": "MQ3 sensor detected elevated levels of alcohol or drug vapors. Air quality is moderate.",
        "action": "Investigate the area. Check for potential sources. Increase monitoring frequency.",
    },
    {
        "severity": "HIGH",
        "mq3_range": (500, 800),
        "mq135_range": (350, 600),
        "temp_range": (30.0, 35.0),
        "humidity_range": (65.0, 80.0),
        "message": "HIGH ALERT: Significant drug/alcohol vapor detected!",
        "explanation": "MQ3 sensor readings indicate high concentration of alcohol or drug vapors. Immediate attention required.",
        "action": "URGENT: Secure the area. Notify authorities. Evacuate if necessary. Document the incident.",
    },
]

def get_or_create_device_settings(session: Session, device_id: str):
    """Get or create device settings"""
    settings = session.get(DeviceSettings, device_id)
    if not settings:
        settings = DeviceSettings(
            device_id=device_id,
            mq3_safe=350,
            mq3_warning=500,
            mq3_danger=500,
            debounce_minutes=5,
            notify_on_warning=True
        )
        session.add(settings)
        session.commit()
    return settings

def generate_fake_telemetry(session: Session, num_records: int = 20):
    """Generate fake telemetry data with GPS coordinates"""
    print(f"Generating {num_records} fake telemetry records...")
    
    base_time = datetime.now(timezone.utc).replace(tzinfo=None)
    created_count = 0
    
    for i in range(num_records):
        device_id = random.choice(DEVICE_IDS)
        
        # Realistic distribution: 70% SAFE, 20% WARNING, 10% HIGH
        r = random.random()
        if r < 0.7:
            scenario = SCENARIOS[0]  # SAFE
        elif r < 0.9:
            scenario = SCENARIOS[1]  # WARNING
        else:
            scenario = SCENARIOS[2]  # HIGH
        
        # Generate timestamp (spread over last 24 hours)
        hours_ago = random.uniform(0, 24)
        ts = base_time - timedelta(hours=hours_ago)
        
        # Check if telemetry already exists
        existing = session.exec(
            select(Telemetry).where(
                Telemetry.device_id == device_id,
                Telemetry.ts == ts
            )
        ).first()
        
        if existing:
            continue
        
        # Generate sensor readings
        mq3 = random.randint(*scenario["mq3_range"])
        mq135 = random.randint(*scenario["mq135_range"])
        temp_c = round(random.uniform(*scenario["temp_range"]), 1)
        humidity_pct = round(random.uniform(*scenario["humidity_range"]), 1)
        
        # Add small random variation to GPS (within college campus area)
        lat = COLLEGE_LAT + random.uniform(-0.001, 0.001)  # ~100m variation
        lon = COLLEGE_LON + random.uniform(-0.001, 0.001)
        alt = COLLEGE_ALT + random.uniform(-2.0, 2.0)
        
        telemetry = Telemetry(
            device_id=device_id,
            ts=ts,
            mq3=mq3,
            mq135=mq135,
            temp_c=temp_c,
            humidity_pct=humidity_pct,
            lat=lat,
            lon=lon,
            alt=alt,
            received_at=datetime.now(timezone.utc).replace(tzinfo=None)
        )
        
        try:
            session.add(telemetry)
            session.commit()
            session.refresh(telemetry)
            created_count += 1
            
            # Only create alerts for WARNING or HIGH (not SAFE)
            if scenario["severity"] in ["WARNING", "HIGH"]:
                create_alert_for_telemetry(session, telemetry, scenario)
            
        except Exception as e:
            session.rollback()
            print(f"Error creating telemetry {i+1}: {e}")
            continue
    
    print(f"[OK] Created {created_count} telemetry records with GPS coordinates")
    return created_count

def create_alert_for_telemetry(session: Session, telemetry: Telemetry, scenario: dict):
    """Create alert for telemetry data"""
    # Check if alert already exists
    existing = session.exec(
        select(Alert).where(
            Alert.device_id == telemetry.device_id,
            Alert.ts == telemetry.ts
        )
    ).first()
    
    if existing:
        return
    
    # Determine confidence based on severity
    confidence_map = {
        "SAFE": "high",
        "WARNING": "medium",
        "HIGH": "high"
    }
    
    alert = Alert(
        device_id=telemetry.device_id,
        ts=telemetry.ts,
        severity=scenario["severity"],
        short_message=scenario["message"],
        explanation=scenario["explanation"],
        recommended_action=scenario["action"],
        confidence=confidence_map[scenario["severity"]],
        mq3=telemetry.mq3,
        mq135=telemetry.mq135,
        lat=telemetry.lat,
        lon=telemetry.lon,
        alt=telemetry.alt,
        notified=scenario["severity"] in ["WARNING", "HIGH"]
    )
    
    try:
        session.add(alert)
        session.commit()
        session.refresh(alert)
        print(f"  [OK] Created {scenario['severity']} alert for {telemetry.device_id} at {telemetry.ts}")
    except Exception as e:
        session.rollback()
        print(f"  [ERROR] Error creating alert: {e}")

def main():
    """Main function to generate fake data"""
    print("=" * 60)
    print("Generating Fake Drug Detection Data")
    print("=" * 60)
    print(f"College Location: PSNA College of Engineering, Dindigul")
    print(f"Coordinates: {COLLEGE_LAT}, {COLLEGE_LON}")
    print(f"Devices: {', '.join(DEVICE_IDS)}")
    print()
    
    with Session(engine) as session:
        # Ensure device settings exist
        for device_id in DEVICE_IDS:
            get_or_create_device_settings(session, device_id)
        
        # Generate realistic data: 70% SAFE, 20% WARNING, 10% HIGH
        num_records = 50  # Generate 50 records for realistic distribution
        generate_fake_telemetry(session, num_records)
        
        # Count created records
        telemetry_count = session.exec(select(Telemetry)).all()
        alerts_count = session.exec(select(Alert)).all()
        
        # Filter alerts at PSNA location (within 0.01 degrees = ~1km)
        psna_alerts = [
            a for a in alerts_count 
            if a.lat and a.lon 
            and abs(a.lat - COLLEGE_LAT) < 0.01 
            and abs(a.lon - COLLEGE_LON) < 0.01
        ]
        
        print()
        print("=" * 60)
        print("Summary:")
        print(f"  Total Telemetry Records: {len(telemetry_count)}")
        print(f"  Total Alerts: {len(alerts_count)}")
        print(f"  Alerts at PSNA College: {len(psna_alerts)}")
        print("=" * 60)
        print()
        print("[OK] Fake data generation complete!")
        print("  Check the map page to see 3 alerts at PSNA College location.")

if __name__ == "__main__":
    main()

