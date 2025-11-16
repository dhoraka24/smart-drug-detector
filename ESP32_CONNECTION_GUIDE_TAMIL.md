# ESP32 Hardware - Website Connection Guide (Tamil/English)
# ESP32 Hardware - Website Connection Guide

## 🎯 Overview / மொத்த கண்ணோட்டம்

ESP32 hardware-um website-um connect panna intha steps follow pannunga.

## 📋 Prerequisites / முன் தேவைகள்

1. ✅ Backend server run aagutha irukkanum
2. ✅ Frontend website run aagutha irukkanum  
3. ✅ ESP32 board irukkanum
4. ✅ Sensors connected aagirukkanum (MQ3, MQ135, etc.)

---

## 🔧 Step 1: Backend Setup / பேக்எண்ட் அமைப்பு

### 1.1 Backend .env File Create Pannunga

`backend` folder-la `.env` file create pannunga (illa irundha):

```env
OPENAI_API_KEY=your-openai-api-key-here
DEVICE_API_KEY=esp32-secret-key-12345
JWT_SECRET_KEY=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
DATABASE_URL=sqlite:///./database.db
```

**⚠️ IMPORTANT:** 
- `DEVICE_API_KEY` - intha key ESP32 code-la use pannanum
- Example: `DEVICE_API_KEY=my-secret-device-key-2024`

### 1.2 Backend Server Start Pannunga

```bash
cd backend
python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

Server run aagiruchuna:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

---

## 🔌 Step 2: Find Your Computer IP Address / உங்கள் கணினி IP முகவரியைக் கண்டறியவும்

### Windows:
```cmd
ipconfig
```
"IPv4 Address" kandupidunga. Example: `10.249.151.102` or `192.168.137.1`

### Which IP Use Pannanum?

- **Same WiFi network-la irundha:** Main IP use pannunga (example: `10.249.151.102`)
- **Different network-la irundha:** Router port forwarding setup pannanum

---

## 📝 Step 3: ESP32 Code Update Pannunga

`esp32/esp32_telemetry.ino` file open pannunga, intha lines change pannunga:

### Line 22-23: WiFi Credentials
```cpp
const char* ssid = "YOUR_WIFI_NAME";           // Unga WiFi name
const char* password = "YOUR_WIFI_PASSWORD";    // Unga WiFi password
```

### Line 26: Backend URL (IMPORTANT!)
```cpp
// Unga computer IP address use pannunga
const char* backend_url = "http://10.249.151.102:8000/api/v1/telemetry";
// OR
const char* backend_url = "http://192.168.137.1:8000/api/v1/telemetry";
```

**⚠️ Note:** Unga actual IP address use pannunga! `10.249.151.102` or `192.168.137.1` replace pannunga.

### Line 27: Device API Key
```cpp
// Backend .env file-la irukura DEVICE_API_KEY same-a use pannunga
const char* device_api_key = "esp32-secret-key-12345";
```

**⚠️ IMPORTANT:** Intha key backend `.env` file-la irukura `DEVICE_API_KEY` same-a irukkanum!

### Line 28: Device ID
```cpp
const char* device_id = "esp32-drug-001";  // Unga device name
```

---

## 💻 Step 4: Arduino IDE Setup

### 4.1 Libraries Install Pannunga

Arduino IDE-la intha libraries install pannunga:
1. **ArduinoJson** (by Benoit Blanchon)
2. **DHT sensor library** (by Adafruit)
3. **TinyGPS++** (by Mikal Hart)

**How to Install:**
- Tools → Manage Libraries → Search library name → Install

### 4.2 ESP32 Board Support Add Pannunga

1. File → Preferences
2. "Additional Board Manager URLs" add pannunga:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Tools → Board → Boards Manager
4. "ESP32" search pannunga → Install

---

## 📤 Step 5: Upload Code to ESP32

1. **ESP32 USB-la connect pannunga**
2. **Arduino IDE-la:**
   - Tools → Board → **ESP32 Dev Module** select pannunga
   - Tools → Port → **COM port** select pannunga (example: COM3, COM4)
   - Tools → Upload Speed → **115200** select pannunga
3. **Upload button click pannunga** (→ arrow button)

Upload successful aagiruchuna:
```
Connecting........
Writing at 0x00010000... (100%)
Leaving...
Hard resetting via RTS pin...
```

---

## ✅ Step 6: Test Connection

### 6.1 Serial Monitor Open Pannunga

Arduino IDE-la:
- Tools → Serial Monitor
- Baud rate: **115200** select pannunga

Expected output:
```
Connecting to WiFi...
Connected! IP address: 192.168.1.50
Sending telemetry:
{"device_id":"esp32-drug-001","timestamp":"...","sensors":{...}}
Telemetry sent successfully!
```

### 6.2 Backend Terminal Check Pannunga

Backend terminal-la intha line show aagum:
```
INFO:     POST /api/v1/telemetry    200 OK
```

### 6.3 Website-la Check Pannunga

1. Website open pannunga: `http://localhost:5173`
2. Login pannunga
3. Dashboard-la alerts automatically show aagum
4. Real-time data update aagum

---

## 🔍 Troubleshooting / சிக்கல் தீர்ப்பு

### Problem 1: WiFi Connect Aagala

**Solution:**
- WiFi name, password correct-a irukka check pannunga
- 2.4GHz WiFi use pannunga (5GHz work aagathu)
- Serial Monitor-la error message read pannunga

### Problem 2: Backend-ku Data Pogaathu

**Check List:**
1. ✅ Backend server run aagutha? (`http://localhost:8000` open pannunga)
2. ✅ IP address correct-a irukka? (ipconfig command-ala verify pannunga)
3. ✅ API key match aagutha? (ESP32 code-la backend .env-la same key irukka?)
4. ✅ Firewall block pannutha? (Windows Firewall temporarily disable pannunga test pannunga)

**Test Command:**
```bash
# ESP32 same network-la irundha, browser-la test pannunga:
http://10.249.151.102:8000/
```

### Problem 3: "Invalid API key" Error

**Solution:**
- ESP32 code-la `device_api_key` backend `.env` file-la irukura `DEVICE_API_KEY` same-a irukkanum
- Both places-la same key use pannunga

### Problem 4: Serial Monitor-la "HTTP Error: 401"

**Meaning:** API key wrong
**Solution:** ESP32 code-la API key correct-a update pannunga

### Problem 5: Serial Monitor-la "HTTP Error: 500"

**Meaning:** Backend server problem
**Solution:** 
- Backend terminal-la error message check pannunga
- `.env` file-la `DEVICE_API_KEY` set aagirukka check pannunga

---

## 📊 Complete Flow / முழு ஓட்டம்

```
ESP32 Hardware
    ↓
Read Sensors (MQ3, MQ135, DHT22, GPS)
    ↓
Create JSON Payload
    ↓
POST http://YOUR_IP:8000/api/v1/telemetry
    ↓
Backend Receives Data
    ↓
Check Duplicate
    ↓
Determine Severity (MQ3-based)
    ↓
If WARNING/HIGH → Call OpenAI
    ↓
Create Alert
    ↓
WebSocket Broadcast
    ↓
Frontend Updates Real-time
    ↓
Website Shows Alerts! ✅
```

---

## 🎉 Success Indicators / வெற்றி குறிகாட்டிகள்

✅ **Serial Monitor:**
```
Connected! IP address: 192.168.1.50
Telemetry sent successfully!
```

✅ **Backend Terminal:**
```
INFO:     POST /api/v1/telemetry    200 OK
```

✅ **Website Dashboard:**
- Alerts automatically show aagum
- Real-time charts update aagum
- Device status "Active" show aagum

---

## 📝 Quick Reference / விரைவு குறிப்பு

### ESP32 Code Configuration:
```cpp
// WiFi
const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";

// Backend (Unga IP use pannunga)
const char* backend_url = "http://10.249.151.102:8000/api/v1/telemetry";

// API Key (Backend .env-la irukura DEVICE_API_KEY)
const char* device_api_key = "esp32-secret-key-12345";

// Device ID
const char* device_id = "esp32-drug-001";
```

### Backend .env Configuration:
```env
DEVICE_API_KEY=esp32-secret-key-12345
```

**⚠️ IMPORTANT:** ESP32 code-la `device_api_key` and backend `.env` file-la `DEVICE_API_KEY` **same-a irukkanum!**

---

## 🚀 That's It! / அவ்வளவுதான்!

1. ✅ Backend .env file-la `DEVICE_API_KEY` set pannunga
2. ✅ ESP32 code-la WiFi, Backend URL, API Key update pannunga
3. ✅ ESP32-ku upload pannunga
4. ✅ **Automatic-a work aagum!** 🎉

Website automatically connect aagum, alerts automatically show aagum!

---

## 📞 Need Help? / உதவி தேவையா?

1. Serial Monitor-la error message check pannunga
2. Backend terminal-la logs check pannunga
3. Browser console-la (F12) errors check pannunga
4. `QUICK_START_ESP32.md` file reference pannunga

