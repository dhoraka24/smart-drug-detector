# 🔧 ESP32 Connection Troubleshooting Guide

## ✅ Code Updates Done

1. ✅ **WiFi credentials fixed:** "Buildathon-13" / "Niat@400"
2. ✅ **Detailed logging added:** Serial Monitor-la full debug info kanum
3. ✅ **Periodic sending:** SAFE state-la kooda every 30 seconds data send aagum

---

## 📋 Step-by-Step Fix

### STEP 1: Upload Updated Code

1. **Arduino IDE-la code upload pannunga**
2. **Serial Monitor open pannunga** (115200 baud)
3. **Wait for:**
   ```
   WiFi connected!
   IP address: 172.16.x.x
   ```

---

### STEP 2: Check Serial Monitor Output

**Ippo Serial Monitor-la detailed messages kanum:**

#### ✅ Success Case:
```
=== Sending Telemetry ===
HTTP POST: http://172.16.17.139:8000/api/v1/telemetry
Payload size: 245
HTTP Response code: 200
Data sent successfully!
Response: {"status":"ok","message":"Telemetry received"}
```

#### ❌ Error Cases:

**Error 1: WiFi Not Connected**
```
WiFi not connected! Reconnecting...
ERROR: WiFi connection failed!
```
**Fix:** WiFi credentials check pannunga, network-la irukka verify pannunga

**Error 2: HTTP Connection Failed**
```
HTTP Response code: -1
ERROR: HTTP request failed! Code: -1
WiFi Status: 3
WiFi IP: 0.0.0.0
```
**Fix:** 
- Backend server running-a? (`http://localhost:8000` test pannunga)
- IP address correct-a? (172.16.17.139)
- Firewall block pannutha?

**Error 3: HTTP 401 Unauthorized**
```
HTTP Response code: 401
ERROR: HTTP request failed! Code: 401
Response: {"detail":"Invalid API key"}
```
**Fix:** API key match aaguthu-a? (`esp32-secure-key-2024`)

**Error 4: HTTP 404 Not Found**
```
HTTP Response code: 404
ERROR: HTTP request failed! Code: 404
```
**Fix:** Backend URL correct-a? (`/api/v1/telemetry`)

**Error 5: HTTP 500 Server Error**
```
HTTP Response code: 500
ERROR: HTTP request failed! Code: 500
```
**Fix:** Backend terminal-la errors check pannunga

---

### STEP 3: Verify Backend Receiving Data

**Backend terminal-la (where uvicorn is running) should show:**
```
INFO:     127.0.0.1:xxxxx - "POST /api/v1/telemetry HTTP/1.1" 200 OK
```

**If POST requests kanum:**
✅ **ESP32 successfully connected!**

**If POST requests kanala:**
- Serial Monitor-la errors check pannunga
- Backend server running-a verify pannunga

---

### STEP 4: Check Dashboard

**Browser-la dashboard open pannunga:**
```
http://localhost:5173
```

**Login pannunga, then Dashboard-la:**
- ✅ Real-time sensor readings kanum
- ✅ Device list-la "esp32-drug-001" kanum
- ✅ Charts update aagum

---

## 🔍 Common Issues & Solutions

### Issue 1: "WiFi connection failed"

**Symptoms:**
```
WiFi not connected! Reconnecting...
ERROR: WiFi connection failed!
```

**Solutions:**
1. WiFi SSID correct-a? ("Buildathon-13")
2. WiFi password correct-a? ("Niat@400")
3. ESP32 network range-la irukka?
4. WiFi router-la device block aagirukka?

---

### Issue 2: "HTTP Response code: -1"

**Symptoms:**
```
HTTP Response code: -1
ERROR: HTTP request failed!
```

**Solutions:**
1. **Backend server running-a?**
   ```powershell
   # Test in browser
   http://localhost:8000
   ```

2. **IP address correct-a?**
   - Computer IP: `172.16.17.139`
   - ESP32 code-la: `http://172.16.17.139:8000/api/v1/telemetry`
   - Same network-la irukka?

3. **Firewall check:**
   - Windows Firewall port 8000 block pannutha?
   - Antivirus block pannutha?

4. **Network connectivity:**
   ```powershell
   # ESP32 IP address find pannunga
   # Serial Monitor-la "WiFi IP: 172.16.x.x" kanum
   # Computer-la ping test pannunga
   ping 172.16.x.x
   ```

---

### Issue 3: "HTTP Response code: 401"

**Symptoms:**
```
HTTP Response code: 401
Response: {"detail":"Invalid API key"}
```

**Solutions:**
1. **ESP32 code-la API key:**
   ```cpp
   const String DEVICE_API_KEY = "esp32-secure-key-2024";
   ```

2. **Backend .env file-la API key:**
   ```
   DEVICE_API_KEY=esp32-secure-key-2024
   ```

3. **Both match aaguthu-a?** ✅

---

### Issue 4: "No data in dashboard"

**Symptoms:**
- Serial Monitor-la "Data sent successfully" kanum
- Backend terminal-la POST requests kanum
- But dashboard-la data kanala

**Solutions:**
1. **Dashboard refresh pannunga** (Ctrl+F5)
2. **Browser console-la errors check pannunga** (F12)
3. **Frontend server running-a?** (`http://localhost:5173`)
4. **Login pannirukka?**

---

### Issue 5: "Data only sends in WARNING/DANGER"

**Fixed!** ✅

**Ippo SAFE state-la kooda every 30 seconds data send aagum.**

**Serial Monitor-la should see:**
```
Periodic send (SAFE state) - sending telemetry
=== Sending Telemetry ===
HTTP POST: http://172.16.17.139:8000/api/v1/telemetry
HTTP Response code: 200
Data sent successfully!
```

---

## 🎯 Quick Verification Checklist

### ESP32 Side:
- [ ] Code uploaded successfully
- [ ] Serial Monitor open (115200 baud)
- [ ] "WiFi connected!" message kanum
- [ ] "=== Sending Telemetry ===" message kanum
- [ ] "HTTP Response code: 200" kanum
- [ ] "Data sent successfully!" kanum

### Backend Side:
- [ ] Backend server running (`http://localhost:8000` works)
- [ ] Backend terminal-la POST requests kanum
- [ ] No errors in backend terminal

### Frontend Side:
- [ ] Frontend server running (`http://localhost:5173` works)
- [ ] Can login successfully
- [ ] Dashboard-la data kanum
- [ ] Real-time updates aagum

---

## 🚀 Expected Serial Monitor Output

**After code upload, should see:**

```
=== ESP32 Drug Detector Booting ===
Calibrating sensors for 10 seconds...
WiFi connecting to: Buildathon-13
WiFi connected!
IP address: 172.16.x.x
Calibration complete. Baseline MQ3=xxx, MQ135=xxx
MQ3=xxx Δ=xxx | MQ135=xxx Δ=xxx
Periodic send (SAFE state) - sending telemetry
=== Sending Telemetry ===
HTTP POST: http://172.16.17.139:8000/api/v1/telemetry
Payload size: 245
HTTP Response code: 200
Data sent successfully!
Response: {"status":"ok","message":"Telemetry received"}
MQ3=xxx Δ=xxx | MQ135=xxx Δ=xxx
```

---

## 🆘 Still Not Working?

**If still issues iruntha:**

1. **Serial Monitor full output share pannunga** (copy-paste)
2. **Backend terminal output share pannunga**
3. **Browser console errors share pannunga** (F12 → Console)

**I'll help debug further!** 🔧

