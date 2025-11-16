# 🚀 Complete Setup - Step-by-Step Guide

## 📋 Order of Operations

**First:** Backend → Frontend → ESP32

**Why?**
- Backend must run first (frontend and ESP32 depend on it)
- Frontend can start next (for testing)
- ESP32 connects last (sends data to backend)

---

## ✅ STEP 1: Backend Server Start Pannunga (FIRST!)

### 1.1 Open PowerShell Terminal

```powershell
cd C:\Users\dhora\smart-drug-detector
```

### 1.2 Start Backend Server

```powershell
.\venv\Scripts\python.exe -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

### 1.3 Wait for Success Message

**Should see:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

### 1.4 Verify Backend Working

**New browser tab-la open pannunga:**
```
http://localhost:8000
```

**Should see:**
```json
{"message":"Smart Drug Detector API","version":"1.0.0"}
```

✅ **Backend ready!**

**⚠️ IMPORTANT:** Backend terminal open-a vachirukka - close pannadhinga!

---

## ✅ STEP 2: Frontend Server Start Pannunga (SECOND!)

### 2.1 Open NEW PowerShell Terminal

**Backend terminal open-a vachirukka - new terminal open pannunga!**

### 2.2 Navigate to Frontend

```powershell
cd C:\Users\dhora\smart-drug-detector\frontend
```

### 2.3 Start Frontend Server

```powershell
npm run dev
```

### 2.4 Wait for Success Message

**Should see:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

### 2.5 Verify Frontend Working

**Browser-la open pannunga:**
```
http://localhost:5173
```

**Should see:**
- Login page
- No "Cannot connect to server" error

✅ **Frontend ready!**

**⚠️ IMPORTANT:** Frontend terminal open-a vachirukka - close pannadhinga!

---

## ✅ STEP 3: ESP32 Connect Pannunga (LAST!)

### 3.1 Verify Network Connection

**Computer and ESP32 same WiFi network-la irukkanum!**

**Current setup:**
- ✅ Computer: "Buildathon-13" network (IP: 172.16.17.139)
- ✅ ESP32: "Buildathon-13" network
- ✅ Same network - perfect!

---

### 3.2 Verify ESP32 Code Settings

**Open:** `esp32/esp32_telemetry/esp32_telemetry.ino`

**Check these lines:**

**Line 61-63: WiFi Credentials**
```cpp
const char* WIFI_SSID = "Buildathon-13";
const char* WIFI_PASS = "Niat@400";
```

**Line 75: Backend URL**
```cpp
const String BACKEND_URL = "http://172.16.17.139:8000/api/v1/telemetry";
```

**Line 83: API Key**
```cpp
const String DEVICE_API_KEY = "esp32-secure-key-2024";
```

**All correct-a?** ✅

---

### 3.3 Upload Code to ESP32

1. **Arduino IDE open pannunga**
2. **File → Open:** `esp32/esp32_telemetry/esp32_telemetry.ino`
3. **Tools → Board → ESP32 Dev Module**
4. **Tools → Port → (your ESP32 port, e.g., COM3)**
5. **Click Upload button** (→ icon)
6. **Wait for "Done uploading"**

---

### 3.4 Open Serial Monitor

1. **Tools → Serial Monitor**
2. **Baud rate: 115200**
3. **Should see:**
   ```
   Starting ESP32 Drug Detector...
   Connecting to WiFi: Buildathon-13
   WiFi connected!
   IP address: 172.16.x.x
   ```

---

### 3.5 Verify ESP32 Sending Data

**Serial Monitor-la should see:**
```
HTTP POST: http://172.16.17.139:8000/api/v1/telemetry
HTTP Response code: 200
Data sent successfully
MQ3=xxx Δ=xxx | MQ135=xxx Δ=xxx
```

**If "Data sent successfully" kanum:**
✅ **ESP32 connected!**

---

### 3.6 Verify Backend Receiving Data

**Backend terminal-la (STEP 1) check pannunga:**

**Should see:**
```
INFO: POST /api/v1/telemetry
INFO: 127.0.0.1:xxxxx - "POST /api/v1/telemetry HTTP/1.1" 200 OK
```

**If POST requests varuthu:**
✅ **Backend receiving data!**

---

### 3.7 Verify Dashboard Showing Data

**Browser-la dashboard open pannunga:**
```
http://localhost:5173
```

**Login pannunga, then:**

**Dashboard-la should see:**
- ✅ Real-time sensor readings
- ✅ Device list-la "esp32-drug-001" kanum
- ✅ Charts update aagum
- ✅ Status cards update aagum

✅ **Complete setup done!**

---

## 📊 Complete Setup Checklist

### Backend
- [ ] Backend server running (`http://localhost:8000` works)
- [ ] Terminal-la "Uvicorn running" kanum
- [ ] No errors in terminal

### Frontend
- [ ] Frontend server running (`http://localhost:5173` works)
- [ ] Login page open aaguthu
- [ ] No "Cannot connect" error
- [ ] Can login successfully

### ESP32
- [ ] ESP32 code uploaded
- [ ] Serial Monitor-la "WiFi connected" kanum
- [ ] Serial Monitor-la "Data sent successfully" kanum
- [ ] Serial Monitor-la HTTP 200 response kanum
- [ ] Backend terminal-la POST requests varuthu
- [ ] Dashboard-la real-time data kanum

---

## 🎯 Summary: Order of Operations

1. **Backend** (Terminal 1) - Start first, keep running
2. **Frontend** (Terminal 2) - Start second, keep running
3. **ESP32** (Arduino IDE) - Upload code, verify connection
4. **Dashboard** (Browser) - Login, verify data

---

## 🆘 Troubleshooting

### Backend not starting?
- Project root-la run pannunga (not backend folder)
- Port 8000 already use aagirukka? Kill other processes

### Frontend showing "Cannot connect"?
- Backend running-a verify pannunga
- `http://localhost:8000` browser-la test pannunga
- Frontend restart pannunga

### ESP32 not connecting?
- WiFi credentials correct-a?
- Backend IP correct-a? (172.16.17.139)
- API key match aaguthu-a?
- Serial Monitor-la errors check pannunga

### Dashboard-la data kanala?
- ESP32 "Data sent successfully" kanum-a?
- Backend terminal-la POST requests varuthu-a?
- Dashboard refresh pannunga (Ctrl+F5)
- Browser console-la errors check pannunga

---

## 🎉 Success!

**All three running-a iruntha:**
- ✅ Backend terminal: Running
- ✅ Frontend terminal: Running
- ✅ ESP32 Serial Monitor: Sending data
- ✅ Dashboard: Showing real-time data

**You're all set!** 🚀

