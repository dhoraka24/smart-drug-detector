"""
Test script to simulate ESP32 telemetry data for real-time testing
This helps test the system without actual hardware
"""

import requests
import json
import time
from datetime import datetime, timedelta
import random

# Configuration
BACKEND_URL = "http://localhost:8000/api/v1/telemetry"
DEVICE_API_KEY = "your_device_api_key_here"  # Change this to match your .env
DEVICE_ID = "esp32-drug-001"

# Simulate different scenarios
SCENARIOS = {
    "safe": {
        "mq3": 200,  # Below 350 - SAFE
        "mq135": 150,
        "description": "Normal air - SAFE level"
    },
    "warning": {
        "mq3": 400,  # Between 350-500 - WARNING
        "mq135": 300,
        "description": "Detected alcohol vapor - WARNING level"
    },
    "high": {
        "mq3": 600,  # Above 500 - HIGH
        "mq135": 450,
        "description": "High concentration detected - HIGH alert"
    },
    "very_high": {
        "mq3": 800,  # Very high
        "mq135": 600,
        "description": "Very high concentration - CRITICAL"
    }
}


def generate_timestamp():
    """Generate ISO8601 timestamp"""
    now = datetime.now()
    # Add timezone offset (IST: +05:30)
    ist_offset = timedelta(hours=5, minutes=30)
    ist_time = now + ist_offset
    return ist_time.strftime("%Y-%m-%dT%H:%M:%S+05:30")


def send_telemetry(mq3, mq135, temp_c=25.0, humidity_pct=50.0, lat=13.0827, lon=80.2707):
    """Send telemetry data to backend"""
    payload = {
        "device_id": DEVICE_ID,
        "timestamp": generate_timestamp(),
        "sensors": {
            "mq3": mq3,
            "mq135": mq135,
            "temp_c": temp_c,
            "humidity_pct": humidity_pct
        },
        "gps": {
            "lat": lat,
            "lon": lon,
            "alt": 12.5
        }
    }
    
    headers = {
        "Content-Type": "application/json",
        "x-api-key": DEVICE_API_KEY
    }
    
    try:
        response = requests.post(BACKEND_URL, json=payload, headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.json()
    except Exception as e:
        print(f"Error: {e}")
        return None


def simulate_real_time_detection():
    """Simulate real-time detection with gradual increase"""
    print("=" * 60)
    print("SIMULATING REAL-TIME DRUG DETECTION")
    print("=" * 60)
    print("\nThis simulates how the system detects alcohol/drug vapors in real-time")
    print("MQ3 sensor readings will gradually increase to show detection\n")
    
    # Start with safe levels
    current_mq3 = 200
    current_mq135 = 150
    
    for step in range(20):
        # Gradually increase MQ3 (simulating vapor detection)
        if step < 5:
            # Safe zone
            current_mq3 = 200 + (step * 10)
            severity = "SAFE"
        elif step < 10:
            # Warning zone
            current_mq3 = 350 + ((step - 5) * 20)
            severity = "WARNING"
        elif step < 15:
            # High zone
            current_mq3 = 500 + ((step - 10) * 30)
            severity = "HIGH"
        else:
            # Very high
            current_mq3 = 800 + ((step - 15) * 20)
            severity = "VERY HIGH"
        
        current_mq135 = int(current_mq3 * 0.7)  # MQ135 typically lower
        
        print(f"\nStep {step + 1}/20 - {severity}")
        print(f"MQ3: {current_mq3} | MQ135: {current_mq135}")
        
        result = send_telemetry(
            mq3=current_mq3,
            mq135=current_mq135,
            temp_c=25.0 + random.uniform(-2, 2),
            humidity_pct=50.0 + random.uniform(-5, 5)
        )
        
        if result:
            if result.get("status") == "duplicate":
                print("⚠️  Duplicate detected - skipping")
            elif result.get("status") == "SAFE":
                print("✅ SAFE - No alert")
            elif result.get("status") == "alert_created":
                print(f"🚨 ALERT CREATED - Severity: {result.get('severity')}, Notified: {result.get('notified')}")
        
        # Wait 5 seconds between readings (simulating real sensor)
        time.sleep(5)


def test_scenario(scenario_name):
    """Test a specific scenario"""
    if scenario_name not in SCENARIOS:
        print(f"Unknown scenario: {scenario_name}")
        return
    
    scenario = SCENARIOS[scenario_name]
    print(f"\nTesting: {scenario['description']}")
    print(f"MQ3: {scenario['mq3']}, MQ135: {scenario['mq135']}\n")
    
    result = send_telemetry(
        mq3=scenario['mq3'],
        mq135=scenario['mq135']
    )
    
    if result:
        print(f"\nResult: {json.dumps(result, indent=2)}")


def main():
    print("\n" + "=" * 60)
    print("SMART DRUG DETECTOR - TELEMETRY SIMULATOR")
    print("=" * 60)
    print("\nOptions:")
    print("1. Simulate real-time detection (gradual increase)")
    print("2. Test SAFE scenario")
    print("3. Test WARNING scenario")
    print("4. Test HIGH scenario")
    print("5. Test VERY HIGH scenario")
    print("6. Test duplicate detection")
    
    choice = input("\nEnter choice (1-6): ").strip()
    
    if choice == "1":
        simulate_real_time_detection()
    elif choice == "2":
        test_scenario("safe")
    elif choice == "3":
        test_scenario("warning")
    elif choice == "4":
        test_scenario("high")
    elif choice == "5":
        test_scenario("very_high")
    elif choice == "6":
        # Test duplicate
        print("\nSending first telemetry...")
        send_telemetry(mq3=400, mq135=300)
        time.sleep(2)
        print("\nSending duplicate (same timestamp)...")
        # Use same timestamp to test duplicate
        send_telemetry(mq3=400, mq135=300)
    else:
        print("Invalid choice")


if __name__ == "__main__":
    # Check if API key is set
    if DEVICE_API_KEY == "your_device_api_key_here":
        print("⚠️  WARNING: Please set DEVICE_API_KEY in this script!")
        print("   Get it from your .env file (DEVICE_API_KEY)")
        print()
    
    main()

