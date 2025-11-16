# ESP32 Setup Guide - Step by Step

## 📋 Prerequisites

1. **Arduino IDE** installed
2. **ESP32 Board Support** installed
3. **Required Libraries**:
   - ArduinoJson
   - DHT sensor library (if using DHT22)
   - TinyGPS++ (if using GPS)

## 🔧 Step 1: Install ESP32 Board Support

1. Open Arduino IDE
2. Go to **File → Preferences**
3. In "Additional Board Manager URLs", add:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Go to **Tools → Board → Boards Manager**
5. Search for "ESP32" and install **"esp32 by Espressif Systems"**
6. Wait for installation to complete

## 📚 Step 2: Install Required Libraries

1. Go to **Tools → Manage Libraries**
2. Install these libraries:
   - **ArduinoJson** by Benoit Blanchon
   - **DHT sensor library** by Adafruit (if using DHT22)
   - **TinyGPS++** by Mikal Hart (if using GPS)

## 🔌 Step 3: Wire Your Sensors

### MQ3 Sensor (Required):
```
MQ3 Vcc  → ESP32 5V
MQ3 GND  → ESP32 GND
MQ3 Aout → ESP32 GPIO34 (ADC1_CH6)
```

### MQ135 Sensor (Required):
```
MQ135 Vcc  → ESP32 5V
MQ135 GND  → ESP32 GND
MQ135 Aout → ESP32 GPIO35 (ADC1_CH7)
```

### DHT22 (Optional):
```
DHT22 Vcc  → ESP32 3.3V
DHT22 GND  → ESP32 GND
DHT22 Data → ESP32 GPIO4
```

### GPS NEO-6M (Optional):
```
GPS Vcc → ESP32 5V
GPS GND → ESP32 GND
GPS TX  → ESP32 GPIO16 (RX2)
GPS RX  → ESP32 GPIO17 (TX2)
```

## ⚙️ Step 4: Configure ESP32 Code

1. Open `esp32/esp32_telemetry.ino` in Arduino IDE

2. **Update WiFi Credentials** (Line 22-23):
```cpp
const char* ssid = "YOUR_WIFI_SSID";        // Your WiFi name
const char* password = "YOUR_WIFI_PASSWORD"; // Your WiFi password
```

3. **Update Backend URL** (Line 26):
```cpp
// If backend is on same computer:
const char* backend_url = "http://192.168.1.100:8000/api/v1/telemetry";

// Or if backend is on different computer/server:
const char* backend_url = "http://your-server-ip:8000/api/v1/telemetry";

// For localhost testing (if ESP32 and backend on same network):
// Find your computer's IP: 
// Windows: ipconfig (look for IPv4 Address)
// Linux/Mac: ifconfig or ip addr
```

4. **Update Device API Key** (Line 27):
```cpp
// Get this from your .env file (DEVICE_API_KEY)
const char* device_api_key = "your_device_api_key_here";
```

5. **Update Device ID** (Line 28) - Optional:
```cpp
const char* device_id = "esp32-drug-001"; // Change if you have multiple devices
```

## 🚀 Step 5: Upload Code to ESP32

1. **Select Board**:
   - Go to **Tools → Board → ESP32 Arduino → ESP32 Dev Module**

2. **Select Port**:
   - Connect ESP32 via USB
   - Go to **Tools → Port → COM3** (or your COM port)
   - Windows: Check Device Manager for COM port
   - Linux: Usually `/dev/ttyUSB0` or `/dev/ttyACM0`

3. **Upload Settings** (if needed):
   - **Upload Speed**: 115200
   - **CPU Frequency**: 240MHz
   - **Flash Frequency**: 80MHz
   - **Flash Size**: 4MB

4. **Upload**:
   - Click **Upload** button (→) or press **Ctrl+U**
   - Wait for "Done uploading" message

## ✅ Step 6: Verify Connection

1. **Open Serial Monitor**:
   - Go to **Tools → Serial Monitor**
   - Set baud rate to **115200**

2. **Check Output**:
   You should see:
   ```
   Connecting to WiFi...
   Connected! IP address: 192.168.1.50
   Sending telemetry:
   {"device_id":"esp32-drug-001","timestamp":"...","sensors":{...}}
   Telemetry sent successfully!
   ```

3. **Check Backend Logs**:
   - Your backend should show:
   ```
   INFO: POST /api/v1/telemetry
   ```

4. **Check Dashboard**:
   - Open `http://localhost:5173`
   - You should see:
     - Device status updating
     - Alerts appearing (if MQ3 > 350)
     - Map showing locations (if GPS enabled)

## 🔄 Automatic Connection

**YES!** Once uploaded, ESP32 will:
- ✅ Automatically connect to WiFi on boot
- ✅ Start reading sensors every 30 seconds
- ✅ Automatically send data to your backend
- ✅ No manual intervention needed!

## 🐛 Troubleshooting

### ESP32 Not Connecting to WiFi:
- Check WiFi SSID and password are correct
- Ensure WiFi is 2.4GHz (ESP32 doesn't support 5GHz)
- Check WiFi signal strength

### Backend Not Receiving Data:
- Check backend is running: `uvicorn app:app --reload`
- Check backend URL in ESP32 code matches your server
- Check firewall allows port 8000
- Verify API key matches `.env` file

### Serial Monitor Shows Errors:
- **"Failed to send telemetry"**: 
  - Check backend URL is correct
  - Check backend is running
  - Check API key is correct

- **"WiFi connection failed"**:
  - Double-check SSID and password
  - Try restarting ESP32

### Finding Your Computer's IP Address:

**Windows:**
```cmd
ipconfig
```
Look for "IPv4 Address" under your WiFi adapter

**Linux/Mac:**
```bash
ifconfig
# or
ip addr
```

### Testing Backend URL:
Open browser and go to:
```
http://YOUR_IP:8000/
```
Should show: `{"message":"Smart Drug Detector API","version":"1.0.0"}`

## 📱 Quick Test Checklist

- [ ] ESP32 board support installed
- [ ] Libraries installed (ArduinoJson, etc.)
- [ ] Sensors wired correctly
- [ ] WiFi credentials updated
- [ ] Backend URL updated (with your computer's IP)
- [ ] Device API key updated
- [ ] Code uploaded successfully
- [ ] Serial Monitor shows "Connected!"
- [ ] Backend receives data
- [ ] Dashboard shows updates

## 🎯 Example Configuration

```cpp
// WiFi
const char* ssid = "MyHomeWiFi";
const char* password = "mypassword123";

// Backend (replace 192.168.1.100 with your computer's IP)
const char* backend_url = "http://192.168.1.100:8000/api/v1/telemetry";

// API Key (from .env file)
const char* device_api_key = "my-secret-api-key-12345";

// Device ID
const char* device_id = "esp32-drug-001";
```

## 🔐 Security Notes

1. **Never commit API keys** to Git
2. **Use strong API keys** (random strings)
3. **Change default device IDs** if deploying multiple devices
4. **Use HTTPS in production** (not HTTP)

## 📞 Next Steps

After ESP32 is connected:
1. Monitor Serial Monitor for any errors
2. Check dashboard for real-time updates
3. Test with actual alcohol source near MQ3 sensor
4. Watch alerts appear automatically!

---

**Remember**: ESP32 will automatically send data every 30 seconds once uploaded. No need to do anything else - it's fully automatic! 🚀

