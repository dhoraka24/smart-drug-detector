# 🔌 ESP32 Power Supply & Connection Troubleshooting

## Problem
ESP32 laptop power supply-la connect pannumbodhu dashboard connect agala, data telemetry sent agala.

---

## ✅ Step 1: Power Supply Check

### Option A: USB Power (Recommended)
- **USB 2.0 port:** Minimum 500mA (may not be enough)
- **USB 3.0 port:** 900mA (better)
- **USB-C port:** Up to 3A (best)

### Option B: External Power Supply
- **5V, 1A minimum** (2A recommended)
- Use **USB power adapter** (phone charger)
- Connect to ESP32's **USB port**

### Option C: Power via VIN Pin
- **5V-12V DC** power supply
- Connect **positive** to VIN pin
- Connect **negative** to GND pin

---

## ✅ Step 2: Serial Monitor Check

**Arduino IDE-la Serial Monitor open pannunga (115200 baud):**

### Expected Output (Success):
```
=== ESP32 Drug Detector Booting ===
Calibrating sensors for 10 seconds...
Calibration done: MQ3=xxx MQ135=xxx
Connecting to WiFi...
WiFi connected!
IP: 10.249.151.103
=== Sending Telemetry ===
HTTP POST: http://10.249.151.102:8000/api/v1/telemetry
HTTP Response code: 200
Data sent successfully!
```

### Error Outputs:

**1. Power Issue:**
```
=== ESP32 Drug Detector Booting ===
[No output or random characters]
```
**Fix:** Use external power supply (5V, 2A)

**2. WiFi Not Connecting:**
```
Connecting to WiFi...
..........
WiFi failed.
```
**Fix:** 
- Check WiFi SSID and password
- Check if laptop and ESP32 are on same network
- Move ESP32 closer to WiFi router

**3. Backend Not Reaching:**
```
WiFi connected!
IP: 10.249.151.103
=== Sending Telemetry ===
HTTP Response code: 500
ERROR: HTTP request failed!
```
**Fix:** 
- Check backend server is running
- Check backend/.env file has DEVICE_API_KEY
- Restart backend server

---

## ✅ Step 3: Quick Fixes

### Fix 1: Use External Power Supply
1. **Phone charger** (5V, 2A) use pannunga
2. ESP32 USB port-la connect pannunga
3. Serial Monitor-la check pannunga

### Fix 2: Check WiFi Connection
1. **Laptop WiFi:** "Galaxy A23 5G FD99" connect pannunga
2. **ESP32 Code:** Same WiFi SSID and password
3. **Both same network-la irukkanum**

### Fix 3: Check Backend Server
1. Backend terminal-la check pannunga:
   ```
   INFO: Application startup complete.
   ```
2. Browser-la open pannunga: `http://localhost:8000`
3. If not working, restart backend:
   ```powershell
   .\venv\Scripts\python.exe -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
   ```

### Fix 4: Verify API Key
1. **ESP32 Code (Line 83):**
   ```cpp
   const String DEVICE_API_KEY = "esp32-secure-key-2024";
   ```
2. **Backend .env file:**
   ```
   DEVICE_API_KEY=esp32-secure-key-2024
   ```
3. **Must match exactly!**

---

## ✅ Step 4: Test Connection

### Test 1: WiFi Connection
**Serial Monitor-la check:**
- `WiFi connected!` kanum-a?
- `IP: 10.249.x.x` kanum-a?

### Test 2: Backend Connection
**Backend terminal-la check:**
- `INFO: 10.249.151.103:xxxxx - "POST /api/v1/telemetry HTTP/1.1" 200 OK` kanum-a?

### Test 3: Dashboard Connection
**Browser-la check:**
- `http://localhost:5173` open pannunga
- Dashboard-la data kanum-a?

---

## 🔧 Common Issues & Solutions

### Issue 1: ESP32 Not Booting
**Symptoms:** Serial Monitor-la nothing kanum
**Solution:** 
- External power supply use pannunga (5V, 2A)
- USB cable check pannunga (data cable, not charging only)

### Issue 2: WiFi Connecting But No Data
**Symptoms:** WiFi connected, but no POST requests
**Solution:**
- Check backend server running
- Check backend/.env file
- Check IP address in ESP32 code

### Issue 3: HTTP 500 Error
**Symptoms:** `HTTP Response code: 500`
**Solution:**
- Backend server restart pannunga
- Check `backend/.env` file exists
- Check `DEVICE_API_KEY` matches

### Issue 4: HTTP 401 Error
**Symptoms:** `HTTP Response code: 401`
**Solution:**
- API key mismatch
- ESP32 code-la and backend .env-la same key irukkanum

---

## 📋 Checklist

Before testing, verify:
- [ ] ESP32 external power supply connected (5V, 2A)
- [ ] USB cable connected (for Serial Monitor)
- [ ] WiFi SSID and password correct in ESP32 code
- [ ] Laptop and ESP32 on same WiFi network
- [ ] Backend server running (`http://localhost:8000`)
- [ ] Backend `.env` file has `DEVICE_API_KEY`
- [ ] ESP32 code has correct `BACKEND_URL` (IP address)
- [ ] ESP32 code has correct `DEVICE_API_KEY`
- [ ] Serial Monitor open (115200 baud)

---

## 🚀 Quick Test Command

**Backend terminal-la test pannunga:**
```powershell
curl http://localhost:8000/api/v1/health/connected
```

**Expected response:**
```json
{"connected": true, "last_telemetry": "..."}
```

---

## 💡 Pro Tips

1. **Always use external power supply** for ESP32 (not laptop USB)
2. **Keep Serial Monitor open** to see real-time status
3. **Check backend terminal** for incoming POST requests
4. **Use same WiFi network** for laptop and ESP32
5. **Restart backend** after changing .env file

---

## 📞 Next Steps

1. **Serial Monitor output share pannunga** - exact error kanum
2. **Backend terminal output share pannunga** - POST requests kanum-a?
3. **Power supply details share pannunga** - 5V, 2A use pannirukkingala?

**Ippo Serial Monitor-la enna kanuthu share pannunga - fix pannalam!**

