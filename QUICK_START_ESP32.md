# Quick Start - ESP32 Connection (Tamil/English)

## 🚀 Simple Steps

### 1. Arduino IDE Setup
```
1. Arduino IDE install pannunga
2. ESP32 board support add pannunga
3. Libraries install pannunga (ArduinoJson)
```

### 2. Code-ல Changes
`esp32_telemetry.ino` file open pannunga, intha values change pannunga:

```cpp
// Line 22-23: WiFi
const char* ssid = "YOUR_WIFI_NAME";           // Unga WiFi name
const char* password = "YOUR_WIFI_PASSWORD";    // Unga WiFi password

// Line 26: Backend URL
// Unga computer IP address use pannunga
const char* backend_url = "http://192.168.1.100:8000/api/v1/telemetry";

// Line 27: API Key (backend .env file-la irukura DEVICE_API_KEY)
const char* device_api_key = "your_api_key_here";

// Line 28: Device ID
const char* device_id = "esp32-drug-001";
```

### 3. IP Address Find Pannunga

**Windows:**
```cmd
ipconfig
```
"IPv4 Address" kandupidunga (example: 192.168.1.100)

**Linux/Mac:**
```bash
ifconfig
```

### 4. Upload Pannunga

1. ESP32 USB-la connect pannunga
2. Arduino IDE-la:
   - Tools → Board → ESP32 Dev Module select pannunga
   - Tools → Port → COM port select pannunga
3. Upload button click pannunga (→)

### 5. Automatic Connection! ✅

Upload aagiruchuna:
- ✅ ESP32 automatically WiFi connect aagum
- ✅ Every 30 seconds sensor read pannum
- ✅ Automatically backend-ku data send pannum
- ✅ Website-la automatically alerts show aagum

**Manual work venam! Automatic-a work aagum!**

## 🔍 Check Pannunga

1. **Serial Monitor** (Tools → Serial Monitor):
   ```
   Connected! IP address: 192.168.1.50
   Telemetry sent successfully!
   ```

2. **Backend Terminal**:
   ```
   INFO: POST /api/v1/telemetry
   ```

3. **Website Dashboard**:
   - `http://localhost:5173` open pannunga
   - Device status update aaguthu
   - Alerts automatically show aagum

## ❌ Problem Irundha

### WiFi Connect Aagala:
- WiFi name, password correct-a irukka check pannunga
- 2.4GHz WiFi use pannunga (5GHz work aagathu)

### Backend-ku Data Pogaathu:
- Backend run aagutha check pannunga: `uvicorn app:app --reload`
- IP address correct-a irukka check pannunga
- API key match aagutha check pannunga

### Serial Monitor-la Error:
- Error message read pannunga
- WiFi/Backend URL/API key correct-a irukka verify pannunga

## 📝 Example

```cpp
// Unga WiFi
const char* ssid = "MyHome";
const char* password = "password123";

// Unga Computer IP (ipconfig command-ala kandupidunga)
const char* backend_url = "http://192.168.1.100:8000/api/v1/telemetry";

// Backend .env file-ala irukura DEVICE_API_KEY
const char* device_api_key = "abc123xyz";

// Device name
const char* device_id = "esp32-drug-001";
```

## ✅ Summary

1. Code-la WiFi, Backend URL, API Key update pannunga
2. ESP32-ku upload pannunga
3. **That's it! Automatic-a work aagum!** 🎉

Website automatically connect aagum, alerts automatically show aagum!

