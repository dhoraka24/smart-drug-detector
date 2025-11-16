"""
Simple test script to submit telemetry data to the API
Run this after starting the backend server
"""

import requests
import json
import time
import random

API_URL = "http://localhost:8000/api/v1/telemetry"

def submit_test_telemetry():
    """Submit test telemetry data"""
    data = {
        "device_id": "ESP32-001",
        "mq3_reading": random.uniform(100, 500),
        "temperature": random.uniform(20, 35),
        "humidity": random.uniform(50, 80),
        "latitude": 6.9271 + random.uniform(-0.01, 0.01),
        "longitude": 79.8612 + random.uniform(-0.01, 0.01)
    }
    
    try:
        response = requests.post(API_URL, json=data)
        if response.status_code == 200:
            print(f"✅ Telemetry submitted: MQ3={data['mq3_reading']:.2f}, Temp={data['temperature']:.1f}°C")
            return response.json()
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Connection error: {e}")
        print("Make sure the backend server is running on http://localhost:8000")
        return None

if __name__ == "__main__":
    print("Testing Smart Drug Detector API")
    print("=" * 50)
    
    # Submit a few test readings
    for i in range(5):
        print(f"\nTest {i+1}/5:")
        submit_test_telemetry()
        time.sleep(2)
    
    print("\n" + "=" * 50)
    print("Test complete! Check the dashboard at http://localhost:5173")

