# ESP32 - Website Connection (Quick Setup) 🚀

## Step-by-Step Instructions

### 1️⃣ Backend Server Start Pannunga

**Terminal-la:**
```bash
cd backend
..\venv\Scripts\activate
python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

**Important:** Backend running-a irukkanum. ESP32 connect pannumbodhu backend ready-a irukkanum.

---

### 2️⃣ Computer IP Address Find Pannunga

**Windows Command Prompt-la:**
```cmd
ipconfig
```

**Output-la "IPv4 Address" kandupidunga:**
- Example: `192.168.1.100` or `192.168.0.105`
- Itha note pannunga - ESP32 code-la use pannanum

**Note:** ESP32 same WiFi network-la irukkanum (same router).

---

### 3️⃣ API Key Setup Pannunga

**Option A: .env file already iruntha:**
- `backend/.env` file open pannunga
- `DEVICE_API_KEY=...` value eduthukonga

**Option B: .env file illana:**
- `backend/.env` file create pannunga
- Add pannunga:
```
DEVICE_API_KEY=your-secret-key-12345
JWT_SECRET_KEY=your-jwt-secret-key
OPENAI_API_KEY=your-openai-key-if-needed
```

**Example:**
```
DEVICE_API_KEY=esp32-device-key-2024-secure
```

Itha copy pannunga - ESP32 code-la use pannanum.

---

### 4️⃣ ESP32 Code Update Pannunga

**Arduino IDE-la:**
1. File open: `esp32/esp32_telemetry/esp32_telemetry.ino`

2. **Line 61-63: WiFi Credentials Update:**
```cpp
const char* WIFI_SSID = "YOUR_WIFI_NAME";        // Unga WiFi name
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";    // Unga WiFi password
```

3. **Line 75: Backend URL Update:**
```cpp
// Computer IP address use pannunga (Step 2-la kandupidicha IP)
const String BACKEND_URL = "http://192.168.1.100:8000/api/v1/telemetry";
// Example: http://192.168.1.100:8000/api/v1/telemetry
//          http://192.168.0.105:8000/api/v1/telemetry
```

4. **Line 83: Device API Key Update:**
```cpp
// .env file-la iruntha DEVICE_API_KEY value
const String DEVICE_API_KEY = "your-secret-key-12345";
// Example: const String DEVICE_API_KEY = "esp32-device-key-2024-secure";
```

5. **Line 77: Device ID (Optional):**
```cpp
const String DEVICE_ID = "ESP32_001"; // Multiple devices venumna change pannunga
```

---

### 5️⃣ ESP32-la Code Upload Pannunga

1. **Board Select:**
   - Tools → Board → ESP32 Arduino → ESP32 Dev Module

2. **Port Select:**
   - ESP32 USB-la connect pannunga
   - Tools → Port → COM3 (or unga COM port number)

3. **Upload:**
   - Upload button click pannunga (→)
   - "Done uploading" varumbodhu wait pannunga

---

### 6️⃣ Serial Monitor-la Check Pannunga

1. **Serial Monitor Open:**
   - Tools → Serial Monitor
   - Baud rate: **115200** select pannunga

2. **Expected Output:**
   ```
   === ESP32 Drug Detector Booting ===
   Calibrating sensors for 10 seconds...
   Calibration done: MQ3=XXX MQ135=XXX
   Connecting to WiFi...
   WiFi connected!
   IP: 192.168.1.50
   Sending telemetry...
   Telemetry sent successfully!
   ```

3. **Error iruntha:**
   - WiFi credentials check pannunga
   - Backend URL correct-a irukka verify pannunga
   - API key match aagutha check pannunga

---

### 7️⃣ Website-la Verify Pannunga

1. **Dashboard Open:**
   - Browser-la: `http://localhost:5173`
   - Login pannunga

2. **Check Pannunga:**
   - Dashboard-la real-time sensor data kanum
   - Map-la device location markers kanum (GPS enabled-na)
   - Alerts automatically create aagum (MQ3 > 350-na)

---

## ✅ Quick Checklist

- [ ] Backend server running (port 8000)
- [ ] Computer IP address find panniten (`ipconfig`)
- [ ] API key `.env` file-la setup panniten
- [ ] ESP32 code-la WiFi credentials update panniten
- [ ] ESP32 code-la backend URL update panniten (computer IP)
- [ ] ESP32 code-la API key update panniten
- [ ] Code ESP32-la upload panniten
- [ ] Serial Monitor-la "WiFi connected" kanum
- [ ] Website-la data kanum

---

## 🔧 Common Issues & Solutions

### ❌ ESP32 WiFi-la Connect Aagala:
- WiFi SSID and password correct-a irukka check pannunga
- WiFi **2.4GHz** network use pannunga (5GHz support illa)
- WiFi signal strength check pannunga

### ❌ Backend-la Data Varala:
- Backend server running-a irukka check pannunga:
  ```bash
  # Backend terminal-la check pannunga
  # "Application startup complete" kanum
  ```
- Computer IP address correct-a irukka verify pannunga
- Firewall port 8000 block pannirukka check pannunga
- API key match aagutha verify pannunga

### ❌ Serial Monitor-la "Failed to send telemetry":
- Backend URL correct-a irukka check pannunga
- Backend server running-a irukka verify pannunga
- API key `.env` file-la iruntha value match aagutha check pannunga

---

## 📱 Automatic Operation

**Once upload panniten, ESP32 automatic-a:**
- ✅ Every 1.5 seconds sensor data read pannum
- ✅ WARNING or DANGER detect pannumbodhu backend-ku data send pannum
- ✅ Alerts automatically create aagum
- ✅ Website-la real-time update aagum

**No manual work needed!** Fully automatic! 🚀

---

## 🎯 Example Configuration

```cpp
// WiFi (Line 61-63)
const char* WIFI_SSID = "MyHomeWiFi";
const char* WIFI_PASS = "mypassword123";

// Backend URL (Line 75) - Computer IP use pannunga
const String BACKEND_URL = "http://192.168.1.100:8000/api/v1/telemetry";

// Device API Key (Line 83) - .env file-la iruntha value
const String DEVICE_API_KEY = "esp32-device-key-2024-secure";

// Device ID (Line 77)
const String DEVICE_ID = "ESP32_001";
```

---

## 🔐 Security Notes

- API key secret-a irukkanum (random string)
- `.env` file Git-la commit pannadhinga
- Production-la HTTPS use pannunga (HTTP illa)

---

**Setup complete panniten-na, ESP32 automatic-a website-ku data send pannum!** 🎉

