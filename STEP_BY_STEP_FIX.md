# 🎯 Step-by-Step Fix - Crystal Clear Instructions

## Current Problem
ESP32 connect aaguthu, but backend-la `DEVICE_API_KEY not configured` error varuthu.

---

## ✅ STEP 1: Backend Terminal-la Go

**What to do:**
1. Backend server run aagura **PowerShell terminal** open pannunga
2. Ippo server running irukkanum (logs scrolling irukum)

---

## ✅ STEP 2: Backend Server Stop Pannunga

**What to do:**
1. Backend terminal-la **`CTRL + C`** press pannunga
2. Server stop aagum
3. Terminal-la prompt kanum (cursor ready)

**Expected output:**
```
^C
INFO:     Shutting down
INFO:     Waiting for application shutdown.
INFO:     Application shutdown complete.
```

---

## ✅ STEP 3: Backend Server Restart Pannunga

**What to do:**
1. Same terminal-la type pannunga:
   ```powershell
   .\venv\Scripts\python.exe -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
   ```
2. **Enter** press pannunga

**Expected output:**
```
INFO:     Will watch for changes in these directories: ['C:\\Users\\dhora\\smart-drug-detector']
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [xxxxx] using WatchFiles
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**Important:** `Application startup complete.` kanumbodhu server ready!

---

## ✅ STEP 4: ESP32-la Data Send Pannunga

**What to do:**
1. ESP32 already running irukkanum (Serial Monitor-la output kanum)
2. **Nothing to do** - ESP32 automatically data send pannum (every 30 seconds)

---

## ✅ STEP 5: Check Backend Terminal

**What to look for:**
Backend terminal-la **POST requests** kanum:

**Success (Expected):**
```
INFO:     10.249.151.103:63425 - "POST /api/v1/telemetry HTTP/1.1" 200 OK
```

**Error (Before fix):**
```
INFO:     10.249.151.103:63425 - "POST /api/v1/telemetry HTTP/1.1" 500 Internal Server Error
```

**If `200 OK` kanum = SUCCESS! ✅**

---

## ✅ STEP 6: Check Serial Monitor

**What to look for:**
Arduino IDE Serial Monitor-la:

**Success (Expected):**
```
=== Sending Telemetry ===
HTTP POST: http://10.249.151.102:8000/api/v1/telemetry
Payload size: 193
HTTP Response code: 200
Data sent successfully!
```

**Error (Before fix):**
```
HTTP Response code: 500
ERROR: HTTP request failed! Code: 500
Response: {"detail":"DEVICE_API_KEY not configured"}
```

**If `200` and `Data sent successfully!` kanum = SUCCESS! ✅**

---

## ✅ STEP 7: Check Dashboard

**What to do:**
1. Browser-la open pannunga: `http://localhost:5173`
2. Login pannunga
3. Dashboard-la **real-time data** kanum

**Expected:**
- Sensor readings update aagum
- Telemetry data kanum
- Map-la location markers kanum

---

## 📋 Quick Checklist

Before starting, verify:
- [ ] Backend terminal open irukku
- [ ] Backend server running (logs scrolling)
- [ ] ESP32 Serial Monitor open (115200 baud)
- [ ] ESP32 WiFi connected (IP: 10.249.151.103)
- [ ] Dashboard open (`http://localhost:5173`)

---

## 🚨 If Still Getting Error 500

### Check 1: .env File
**Location:** `backend\.env`
**Content should be:**
```
DEVICE_API_KEY=esp32-secure-key-2024
```

**Verify:**
```powershell
Get-Content backend\.env
```

### Check 2: Backend Code
**File:** `backend\app.py`
**Line 13-19 should have:**
```python
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)
```

### Check 3: Restart Backend
**Must restart** after any changes!

---

## 💡 Summary

**Simple 3 Steps:**
1. **Backend terminal-la `CTRL + C`** (stop server)
2. **Restart command run pannunga** (start server)
3. **Wait for `Application startup complete.`** (server ready)

**Then ESP32 automatically data send pannum - `200 OK` kanum!**

---

## 🎯 What to Do RIGHT NOW

1. **Backend terminal-la go**
2. **`CTRL + C` press** (stop)
3. **Restart command type** (start)
4. **Wait for startup**
5. **Check for `200 OK`**

**Ippo pannunga - 2 minutes-la fix aagum!**

