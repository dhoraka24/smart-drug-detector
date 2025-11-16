# ESP32 Smart Drug Detector - Setup Guide (New Code)

## 📋 Overview

This is the improved ESP32 code with:
- ✅ State machine (SAFE, WARNING, DANGER)
- ✅ LED indicators (Green, Yellow, Red)
- ✅ Buzzer alerts
- ✅ OLED display support
- ✅ GPS tracking
- ✅ Sensor calibration
- ✅ Sustained detection logic
- ✅ Median filtering for accurate readings

## 🔧 Configuration Steps

### 1. Update Backend URL

Open `esp32/esp32_telemetry/esp32_telemetry.ino` and update:

```cpp
// Replace YOUR_IP_ADDRESS with your computer's IP address
// Find your IP: Windows: ipconfig, Linux/Mac: ifconfig
const String BACKEND_URL = "http://192.168.1.100:8000/api/v1/telemetry";
```

**Example:**
- If your backend IP is `192.168.1.50`, use: `"http://192.168.1.50:8000/api/v1/telemetry"`
- If using HTTPS: `"https://your-backend.example.com/api/v1/telemetry"`

### 2. Update Device API Key

```cpp
// This MUST match the DEVICE_API_KEY in your backend/.env file
const String DEVICE_API_KEY = "your-actual-api-key-here";
```

**Important:** 
- Check `backend/.env` file for `DEVICE_API_KEY`
- Copy the exact value to ESP32 code
- Both must match for authentication to work

### 3. Update WiFi Credentials (if needed)

```cpp
const char* WIFI_SSID = "Your-WiFi-Name";
const char* WIFI_PASS = "Your-WiFi-Password";
```

### 4. Feature Flags (Optional)

You can enable/disable features:

```cpp
#define USE_DHT 1      // 1 = Enable DHT22, 0 = Disable
#define USE_GPS 1      // 1 = Enable GPS, 0 = Disable
#define USE_OLED 1     // 1 = Enable OLED, 0 = Disable
```

## 📦 Required Libraries

Install these libraries in Arduino IDE:

1. **WiFi** (built-in for ESP32)
2. **HTTPClient** (built-in for ESP32)
3. **ArduinoJson** by Benoit Blanchon (v6.x or v7.x)
4. **TinyGPSPlus** by Mikal Hart
5. **Adafruit GFX Library** by Adafruit
6. **Adafruit SSD1306** by Adafruit
7. **DHT sensor library** by Adafruit

### Install via Arduino IDE:
1. Go to **Sketch → Include Library → Manage Libraries**
2. Search and install each library listed above

## 🔌 Hardware Connections

### Required Sensors:
- **MQ3** (Alcohol/Drug Sensor)
  - Vcc → 5V
  - GND → GND
  - Aout → GPIO34 (ADC1_CH6)

- **MQ135** (Air Quality Sensor)
  - Vcc → 5V
  - GND → GND
  - Aout → GPIO35 (ADC1_CH7)

### Optional Components:

- **DHT22** (Temperature/Humidity)
  - Vcc → 3.3V
  - GND → GND
  - Data → GPIO4

- **GPS NEO-6M**
  - Vcc → 5V
  - GND → GND
  - TX → GPIO16 (RX2)
  - RX → GPIO17 (TX2)

- **OLED SSD1306** (I2C)
  - Vcc → 3.3V
  - GND → GND
  - SDA → GPIO21 (SDA)
  - SCL → GPIO22 (SCL)

- **LEDs**
  - Green LED → GPIO14
  - Yellow LED → GPIO12
  - Red LED → GPIO13

- **Buzzer**
  - Positive → GPIO27
  - Negative → GND

## ⚙️ Configuration Parameters

### Timing:
```cpp
const int LOOP_DELAY_MS = 1500;                    // Main loop delay
const unsigned long SEND_COOLDOWN_SECONDS = 300;   // 5 minutes between sends
const int CALIBRATION_SECONDS = 10;                // Sensor calibration time
```

### Detection Thresholds:
```cpp
const int MQ3_DELTA_WARNING = 60;                   // Warning threshold
const int MQ3_DELTA_DANGER = 150;                   // Danger threshold
const int MQ135_CORROBORATE_THRESHOLD = 80;        // MQ135 confirmation
const int SUSTAINED_REQUIRED = 3;                   // Sustained readings needed
```

**Adjust these values based on your testing environment!**

## 🚀 Upload & Test

1. **Select Board:**
   - Tools → Board → ESP32 Dev Module (or your ESP32 board)

2. **Select Port:**
   - Tools → Port → COMx (Windows) or /dev/ttyUSBx (Linux/Mac)

3. **Upload Code:**
   - Click Upload button (or Ctrl+U)

4. **Open Serial Monitor:**
   - Tools → Serial Monitor
   - Set baud rate to 115200

5. **Watch for:**
   ```
   === ESP32 Drug Detector Booting ===
   Calibrating sensors for 10 seconds...
   Calibration done: MQ3=XXX MQ135=XXX
   Connecting to WiFi...
   WiFi connected!
   IP: 192.168.1.XXX
   ```

## 📊 How It Works

### State Machine:
- **SAFE** (Green LED): Normal operation, no threats detected
- **WARNING** (Yellow LED): Possible chemical vapors detected
- **DANGER** (Red LED + Buzzer): Strong drug vapors detected

### Detection Logic:
1. **Calibration:** 10-second baseline reading on startup
2. **Continuous Monitoring:** Reads sensors every 1.5 seconds
3. **Delta Calculation:** Compares current reading vs baseline
4. **Sustained Detection:** Requires 3 consecutive readings to change state
5. **Telemetry:** Sends data to backend when WARNING or DANGER state

### Data Flow:
```
Sensors → Median Filter → Delta Calculation → State Evaluation → 
Sustained Check → Output (LEDs/Buzzer) → Telemetry (if alert)
```

## 🔍 Troubleshooting

### WiFi Not Connecting:
- Check SSID and password
- Ensure 2.4GHz WiFi (ESP32 doesn't support 5GHz)
- Check router settings

### Backend Connection Failed:
- Verify backend is running: `python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000`
- Check IP address in BACKEND_URL
- Verify DEVICE_API_KEY matches backend/.env
- Check firewall settings

### GPS Not Working:
- Ensure GPS module has clear view of sky
- Wait 1-2 minutes for GPS to get fix
- Check wiring (TX→GPIO16, RX→GPIO17)
- Verify GPS baud rate is 9600

### OLED Not Displaying:
- Check I2C address (default 0x3C)
- Verify wiring (SDA→GPIO21, SCL→GPIO22)
- Check if OLED library is installed

### Sensors Reading Incorrectly:
- Adjust thresholds based on your environment
- Recalibrate by power cycling ESP32
- Check sensor wiring and power supply

## 📝 Serial Monitor Output

### Normal Operation:
```
MQ3=245 Δ=15 | MQ135=180 Δ=10
State: SAFE
```

### Warning Detected:
```
MQ3=310 Δ=80 | MQ135=250 Δ=80
State: WARNING
Sending telemetry...
Telemetry sent successfully!
```

### Danger Detected:
```
MQ3=450 Δ=200 | MQ135=350 Δ=170
State: DANGER
Sending telemetry...
Telemetry sent successfully!
```

## ✅ Success Indicators

1. **Serial Monitor:** Shows "WiFi connected!" and sensor readings
2. **LEDs:** Green LED on during SAFE state
3. **Backend Terminal:** Shows `POST /api/v1/telemetry 200 OK`
4. **Website:** Alerts appear in real-time on dashboard

## 🎯 Next Steps

1. ✅ Upload code to ESP32
2. ✅ Verify WiFi connection
3. ✅ Check backend receives telemetry
4. ✅ Test with actual sensors
5. ✅ Adjust thresholds if needed
6. ✅ Monitor website dashboard for alerts

---

**Need Help?** Check the main `ESP32_CONNECTION_GUIDE_TAMIL.md` for detailed connection instructions.

