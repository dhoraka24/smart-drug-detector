# How Smart Drug Detector Works - Real-Time Detection

## 🔍 Real-Time Detection Process

### 1. **Hardware Level (ESP32 + Sensors)**

#### MQ3 Sensor (Alcohol/Drug Vapor Detector)
- **What it detects**: Alcohol vapors, benzene, hexane, LPG, CO
- **How it works**:
  - Contains a tin dioxide (SnO2) semiconductor
  - When alcohol/drug vapors are present, the sensor's resistance decreases
  - ESP32 reads this as an analog voltage (0-4095 on ESP32 ADC)
  - Higher reading = more vapor detected

#### MQ135 Sensor (Air Quality)
- **What it detects**: NH3, NOx, alcohol, benzene, smoke, CO2
- **How it works**: Similar to MQ3, but more sensitive to general air pollutants
- **Used for**: Supporting information (doesn't affect severity)

#### Reading Process:
```
1. ESP32 reads MQ3 from GPIO34 (analog pin)
2. Takes 10 samples and averages (reduces noise)
3. Reads MQ135 from GPIO35
4. Reads DHT22 (temperature/humidity) if connected
5. Reads GPS coordinates if NEO-6M is connected
6. Creates JSON payload with ISO8601 timestamp
7. POSTs to backend API with x-api-key header
```

### 2. **Backend Processing (FastAPI)**

#### Step-by-Step Detection Flow:

```
ESP32 POST → /api/v1/telemetry
    ↓
1. Validate API Key (x-api-key header)
    ↓
2. Parse timestamp (ISO8601 format)
    ↓
3. Check for DUPLICATE (device_id + timestamp)
    ├─ If duplicate → Return {"status": "duplicate"}
    └─ If new → Continue
    ↓
4. Save telemetry to database
    ↓
5. Determine SEVERITY (MQ3-only logic):
    ├─ mq3 < 350 → SAFE (return early, no alert)
    ├─ 350 ≤ mq3 < 500 → WARNING
    └─ mq3 ≥ 500 → HIGH
    ↓
6. If WARNING or HIGH:
    ├─ Get last 10 telemetry readings (recent history)
    ├─ Call OpenAI API with prompt:
    │  └─ Includes: device_id, timestamp, mq3, mq135, temp, humidity, GPS, history
    ├─ Parse AI response (JSON)
    ├─ If AI fails → Use fallback alert
    └─ Create alert in database
    ↓
7. Check DEBOUNCE (for HIGH alerts):
    ├─ If HIGH alert exists within DEBOUNCE_MINUTES
    └─ Set notified=False (prevent spam)
    ↓
8. Broadcast alert via WebSocket to all connected clients
    ↓
9. Return response to ESP32
```

### 3. **Frontend Display (React Dashboard)**

#### Real-Time Updates:
- **WebSocket Connection**: Connects to `ws://localhost:8000/ws/alerts`
- **On New Alert**:
  - If `notified=True` and severity is WARNING/HIGH:
    - Shows modal popup
    - Shows browser notification
    - Adds to notifications list
  - If `notified=False` (debounced):
    - Shows softer toast notification
    - Still appears in alerts list (flagged as "debounced")

#### Dashboard Features:
- **Live Counters**: Shows SAFE/WARNING/HIGH alert counts
- **Recent Alerts Table**: Displays latest alerts with severity chips
- **Device Status**: Shows latest sensor readings
- **Map View**: Shows alert locations on Leaflet map with color-coded markers

## 🧪 How to Test Real-Time Detection

### Option 1: Using Test Script (No Hardware Needed)

```bash
# Install requests if not installed
pip install requests

# Edit test_simulate_telemetry.py and set DEVICE_API_KEY
# Then run:
python test_simulate_telemetry.py
```

This will:
- Simulate gradual increase in MQ3 readings
- Show how system detects from SAFE → WARNING → HIGH
- Test duplicate detection
- Show real-time alerts in dashboard

### Option 2: Using Actual ESP32 Hardware

1. **Wire Sensors**:
   ```
   MQ3: Vcc→5V, GND→GND, Aout→GPIO34
   MQ135: Vcc→5V, GND→GND, Aout→GPIO35
   ```

2. **Upload Sketch**:
   - Open `esp32/esp32_telemetry.ino` in Arduino IDE
   - Set WiFi credentials
   - Set `backend_url` and `device_api_key`
   - Upload to ESP32

3. **Test with Real Alcohol**:
   - Place MQ3 sensor near alcohol source
   - Sensor will detect vapors
   - Reading increases (200 → 400 → 600+)
   - System creates alerts automatically

### Option 3: Using cURL/Postman

```bash
curl -X POST http://localhost:8000/api/v1/telemetry \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_device_api_key" \
  -d '{
    "device_id": "esp32-drug-001",
    "timestamp": "2025-01-15T10:30:00+05:30",
    "sensors": {
      "mq3": 600,
      "mq135": 400,
      "temp_c": 25.5,
      "humidity_pct": 55.0
    },
    "gps": {
      "lat": 13.0827,
      "lon": 80.2707,
      "alt": 12.5
    }
  }'
```

## 📊 Understanding MQ3 Readings

### Typical Values:
- **0-200**: Clean air, no detection
- **200-350**: Very low levels (SAFE)
- **350-500**: Moderate detection (WARNING) - Alcohol present
- **500-700**: High detection (HIGH) - Strong alcohol/drug vapor
- **700+**: Very high (CRITICAL) - Immediate danger

### Factors Affecting Readings:
1. **Distance from source**: Closer = higher reading
2. **Vapor concentration**: More alcohol = higher reading
3. **Temperature**: Higher temp = more vapor = higher reading
4. **Humidity**: Can affect sensor sensitivity
5. **Sensor warm-up**: MQ3 needs 2-3 minutes to stabilize

## 🔬 Real-World Detection Scenarios

### Scenario 1: Person Drinking Alcohol
- MQ3 detects alcohol in breath
- Reading: 400-500 (WARNING)
- System creates alert with AI analysis
- Location tracked if GPS enabled

### Scenario 2: Alcohol Spill
- MQ3 detects evaporating alcohol
- Reading: 600-800 (HIGH)
- System creates HIGH alert
- Debounce prevents spam if multiple readings

### Scenario 3: Drug Manufacturing
- MQ3 detects solvent vapors (benzene, hexane)
- Reading: 700+ (VERY HIGH)
- System creates critical alert
- GPS location helps authorities

## 🎯 Key Features for Real-Time Detection

1. **Fast Response**: ESP32 sends data every 30 seconds
2. **Immediate Alerts**: WebSocket broadcasts instantly
3. **AI Analysis**: OpenAI provides context and recommendations
4. **Location Tracking**: GPS coordinates for alert location
5. **Duplicate Prevention**: Prevents false duplicates
6. **Debounce Logic**: Prevents alert spam

## 📱 Monitoring Dashboard

Open `http://localhost:5173` to see:
- Real-time alert notifications
- Live sensor readings
- Alert map with locations
- Historical data
- Device status

## ⚠️ Important Notes

1. **MQ3 is sensitive**: Can detect alcohol from several meters away
2. **Warm-up time**: Sensor needs 2-3 minutes after power-on
3. **Calibration**: May need adjustment based on environment
4. **False positives**: Other gases (LPG, CO) can trigger
5. **Legal use**: Ensure compliance with local laws

## 🔧 Troubleshooting

**No alerts showing?**
- Check ESP32 is sending data
- Verify API key is correct
- Check backend logs for errors
- Ensure MQ3 reading is above 350

**Duplicate errors?**
- ESP32 might be sending same timestamp
- Check ESP32 code for timestamp generation
- Ensure device_id is unique per device

**Map not showing?**
- Ensure GPS data is included in telemetry
- Check lat/lon are valid coordinates
- Verify Leaflet CSS is loaded

