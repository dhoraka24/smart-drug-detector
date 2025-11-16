# ESP32 Hardware - Website Connection Guide (Tamil/English)

## 🚀 Quick Setup Steps

### Step 1: Backend Server Start Pannunga

```bash
# Terminal-la backend folder-la poi:
cd backend

# Virtual environment activate pannunga:
..\venv\Scripts\activate

# Backend server start pannunga:
python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

**Important:** Backend server running-a irukkanum. ESP32 connect pannumbodhu backend ready-a irukkanum.

---

### Step 2: Computer IP Address Find Pannunga

**Windows-la:**
```cmd
ipconfig
```

Output-la "IPv4 Address" kandupidunga. Example: `192.168.1.100`

**Note:** ESP32 same WiFi network-la irukkanum (same router connect pannanum).

---

### Step 3: API Key Get Pannunga

Backend `.env` file-la `DEVICE_API_KEY` value eduthukonga.

**Location:** `backend/.env` file

Example:
```
DEVICE_API_KEY=your-secret-api-key-12345
```

Itha copy pannunga - ESP32 code-la use pannanum.

---

### Step 4: ESP32 Code Update Pannunga

1. **Arduino IDE open pannunga**
2. **File open:** `esp32/esp32_telemetry/esp32_telemetry.ino`
3. **Update these values:**

```cpp
// WiFi Credentials (Line 22-23)
const char* ssid = "YOUR_WIFI_NAME";        // Unga WiFi name
const char* password = "YOUR_WIFI_PASSWORD"; // Unga WiFi password

// Backend URL (Line 26)
// Computer IP address use pannunga (Step 2-la kandupidicha IP)
const char* backend_url = "http://192.168.1.100:8000/api/v1/telemetry";
// Example: http://192.168.1.100:8000/api/v1/telemetry

// Device API Key (Line 27)
// .env file-la iruntha DEVICE_API_KEY value
const char* device_api_key = "your-secret-api-key-12345";

// Device ID (Line 28) - Optional
const char* device_id = "ESP32_001"; // Multiple devices venumna change pannunga
```

---

### Step 5: ESP32-la Code Upload Pannunga

1. **Board Select:**
   - Tools → Board → ESP32 Arduino → ESP32 Dev Module

2. **Port Select:**
   - ESP32 USB-la connect pannunga
   - Tools → Port → COM3 (or unga COM port)

3. **Upload:**
   - Upload button click pannunga (→)
   - "Done uploading" varumbodhu wait pannunga

---

### Step 6: Serial Monitor-la Check Pannunga

1. **Serial Monitor Open:**
   - Tools → Serial Monitor
   - Baud rate: 115200

2. **Expected Output:**
   ```
   Connecting to WiFi...
   WiFi connected!
   IP address: 192.168.1.50
   Sending telemetry...
   Telemetry sent successfully!
   Response: {"status":"alert_created","severity":"SAFE"}
   ```

---

### Step 7: Website-la Verify Pannunga

1. **Dashboard Open:**
   - Browser-la: `http://localhost:5173`
   - Login pannunga

2. **Check Pannunga:**
   - Dashboard-la real-time data kanum
   - Map-la markers kanum (GPS enabled-na)
   - Alerts automatically create aagum

---

## ✅ Connection Checklist

- [ ] Backend server running (port 8000)
- [ ] Computer IP address find panniten
- [ ] API key .env file-la irukku
- [ ] ESP32 code-la WiFi credentials update panniten
- [ ] ESP32 code-la backend URL update panniten (computer IP use panniten)
- [ ] ESP32 code-la API key update panniten
- [ ] Code ESP32-la upload panniten
- [ ] Serial Monitor-la "Connected" kanum
- [ ] Website-la data kanum

---

## 🔧 Troubleshooting

### ESP32 WiFi-la Connect Aagala:
- WiFi SSID and password correct-a irukka check pannunga
- WiFi 2.4GHz-a irukkanum (5GHz support illa)
- WiFi signal strength check pannunga

### Backend-la Data Varala:
- Backend server running-a irukka check pannunga
- Computer IP address correct-a irukka verify pannunga
- Firewall port 8000 block pannirukka check pannunga
- API key match aagutha verify pannunga

### Serial Monitor-la Error:
- **"Failed to send telemetry"**: Backend URL and API key check pannunga
- **"WiFi connection failed"**: WiFi credentials double-check pannunga

---

## 📱 Testing

ESP32 automatically:
- ✅ Every 30 seconds sensor data read pannum
- ✅ Backend-ku data send pannum
- ✅ Alerts create aagum (MQ3 > 350-na)
- ✅ Website-la real-time update aagum

**No manual work needed!** Once upload panniten, automatic-a work aagum.

---

## 🎯 Example Configuration

```cpp
// WiFi
const char* ssid = "MyHomeWiFi";
const char* password = "mypassword123";

// Backend (unga computer IP use pannunga)
const char* backend_url = "http://192.168.1.100:8000/api/v1/telemetry";

// API Key (.env file-la iruntha value)
const char* device_api_key = "your-secret-api-key-from-env";

// Device ID
const char* device_id = "ESP32_001";
```

---

## 🔐 Security

- API key secret-a irukkanum
- .env file Git-la commit pannadhinga
- Production-la HTTPS use pannunga (HTTP illa)

---

**Once setup complete, ESP32 automatic-a website-ku data send pannum!** 🚀

