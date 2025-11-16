# ESP32 Setup - Your Specific Values 🎯

## Your Computer IP Address:
```
192.168.221.102
```

---

## ESP32 Code-la Update Pannunga Values:

### 1. WiFi Credentials (Line 61-63):
```cpp
const char* WIFI_SSID = "YOUR_WIFI_NAME";        // Unga WiFi name
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";    // Unga WiFi password
```

**Example:**
```cpp
const char* WIFI_SSID = "MyHomeWiFi";
const char* WIFI_PASS = "mypassword123";
```

---

### 2. Backend URL (Line 75):
```cpp
const String BACKEND_URL = "http://192.168.221.102:8000/api/v1/telemetry";
```

**Important:** Itha exact-a copy pannunga - unga computer IP address use pannirukken.

---

### 3. Device API Key (Line 83):

**First, .env file check pannunga:**

**Option A: .env file already iruntha:**
- `backend/.env` file open pannunga
- `DEVICE_API_KEY=...` value eduthukonga
- Itha ESP32 code-la paste pannunga

**Option B: .env file illana:**
1. `backend/.env` file create pannunga
2. Add pannunga:
```
DEVICE_API_KEY=esp32-device-key-2024-secure-12345
JWT_SECRET_KEY=your-jwt-secret-key-change-in-production
```

3. ESP32 code-la (Line 83):
```cpp
const String DEVICE_API_KEY = "esp32-device-key-2024-secure-12345";
```

**Important:** `.env` file-la iruntha value and ESP32 code-la iruntha value **exact-a match** aaganum!

---

### 4. Device ID (Line 77) - Optional:
```cpp
const String DEVICE_ID = "ESP32_001"; // Multiple devices venumna change pannunga
```

---

## Complete Example (Your Values):

```cpp
// WiFi (Line 61-63)
const char* WIFI_SSID = "YOUR_WIFI_NAME";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";

// Backend URL (Line 75) - YOUR COMPUTER IP
const String BACKEND_URL = "http://192.168.221.102:8000/api/v1/telemetry";

// Device API Key (Line 83) - .env file-la iruntha value
const String DEVICE_API_KEY = "your-api-key-from-env-file";

// Device ID (Line 77)
const String DEVICE_ID = "ESP32_001";
```

---

## Steps Summary:

1. ✅ **Backend Server Start:**
   ```bash
   cd backend
   ..\venv\Scripts\activate
   python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
   ```

2. ✅ **ESP32 Code Update:**
   - WiFi SSID and Password
   - Backend URL: `http://192.168.221.102:8000/api/v1/telemetry`
   - Device API Key (from .env file)

3. ✅ **Upload to ESP32:**
   - Arduino IDE-la upload pannunga

4. ✅ **Serial Monitor Check:**
   - Tools → Serial Monitor (115200 baud)
   - "WiFi connected!" kanum

5. ✅ **Website Check:**
   - `http://localhost:5173` open pannunga
   - Dashboard-la data kanum

---

## Troubleshooting:

### Backend-la Data Varala:
- Backend server running-a irukka check: `http://192.168.221.102:8000/` browser-la open pannunga
- Should show: `{"message":"Smart Drug Detector API","version":"1.0.0"}`

### API Key Error:
- `.env` file-la `DEVICE_API_KEY` value and ESP32 code-la value match aagutha verify pannunga
- Backend restart pannunga after .env file change

### WiFi Connect Aagala:
- WiFi 2.4GHz network use pannunga (5GHz support illa)
- SSID and password correct-a irukka double-check pannunga

---

**Once setup complete, ESP32 automatic-a website-ku data send pannum!** 🚀

