# ✅ Verify ESP32 → Backend Connection

## Current Status
- ✅ Computer: "Buildathon-13" network (IP: 172.16.17.139)
- ✅ ESP32: "Buildathon-13" network
- ✅ ESP32 Code: `http://172.16.17.139:8000/api/v1/telemetry`
- ✅ Same network - connection should work!

---

## 🔍 Step 1: Check Backend Terminal

**Backend terminal-la (where uvicorn running) check pannunga:**

**Should see:**
```
INFO: POST /api/v1/telemetry
INFO: 127.0.0.1:xxxxx - "POST /api/v1/telemetry HTTP/1.1" 200 OK
```

**If no requests kanala:**
- ESP32 backend reach pannala
- Check Serial Monitor for errors

---

## 🔍 Step 2: Check Serial Monitor

**ESP32 Serial Monitor-la should see:**

**Success:**
```
Connected to WiFi
IP address: 172.16.x.x
HTTP POST: http://172.16.17.139:8000/api/v1/telemetry
HTTP Response code: 200
Data sent successfully
```

**Error messages:**
- `Connection failed` → Network issue
- `HTTP error: 401` → API key mismatch
- `HTTP error: 400` → Data format issue
- `Connection refused` → Backend not running

---

## 🔍 Step 3: Check Browser Console

1. **Dashboard open pannunga:** `http://localhost:5173`
2. **F12 press pannunga** (Developer Tools)
3. **Console tab open pannunga**
4. **Check for errors:**
   - Network errors?
   - WebSocket errors?
   - API errors?

---

## 🔍 Step 4: Verify API Key

**ESP32 Code (Line 83):**
```cpp
const String DEVICE_API_KEY = "esp32-secure-key-2024";
```

**Backend .env file:**
```
DEVICE_API_KEY=esp32-secure-key-2024
```

**Must match exactly!**

---

## 🔍 Step 5: Check Device ID

**ESP32 Code (Line 77):**
```cpp
const String DEVICE_ID = "esp32-drug-001";
```

**Dashboard-la filter check pannunga:**
- Device selector-la "esp32-drug-001" kanum
- Or "All Devices" select pannunga

---

## 🛠️ Quick Troubleshooting

### Issue 1: Backend Terminal-la No Requests

**Check:**
1. Backend running-a? (`http://localhost:8000` open pannunga)
2. Serial Monitor-la "Data sent successfully" kanum-a?
3. Firewall block pannirukka?

**Fix:**
- Backend restart pannunga
- Firewall allow pannunga (port 8000)

---

### Issue 2: Serial Monitor-la HTTP Error 401

**Problem:** API key mismatch

**Fix:**
1. Backend `.env` file check pannunga
2. ESP32 code-la same key use pannunga
3. Backend restart pannunga (after .env change)

---

### Issue 3: Serial Monitor-la Connection Failed

**Problem:** Network/Backend not reachable

**Fix:**
1. Backend running-a verify pannunga
2. `http://172.16.17.139:8000` browser-la open pannunga
3. Should show: `{"message":"Smart Drug Detector API"}`

---

### Issue 4: Dashboard-la Data Kanala

**But Serial Monitor-la "Data sent successfully" kanum**

**Check:**
1. Browser console-la errors kanum-a?
2. WebSocket connected-a? (Top-right "Connected" badge)
3. Device filter correct-a?
4. Dashboard refresh pannunga (F5)

**Fix:**
- Backend terminal-la requests varuthu-nu verify pannunga
- Browser console-la errors check pannunga
- Dashboard hard refresh (Ctrl+F5)

---

## ✅ Success Checklist

- [ ] Backend terminal-la POST requests varuthu
- [ ] Serial Monitor-la "Data sent successfully"
- [ ] Serial Monitor-la HTTP 200 response
- [ ] Browser console-la no errors
- [ ] Dashboard-la real-time data update
- [ ] Device list-la "esp32-drug-001" kanum
- [ ] Charts update aagum

---

## 🎯 Most Likely Issues

1. **Backend not receiving requests:**
   - Check Serial Monitor for errors
   - Check firewall

2. **API key mismatch:**
   - Verify both places same key

3. **Dashboard not updating:**
   - Check browser console
   - Hard refresh (Ctrl+F5)
   - Check WebSocket connection

---

## 📞 Next Steps

1. **Backend terminal check pannunga** - requests varuthu-nu verify
2. **Serial Monitor check pannunga** - "Data sent successfully" kanum-a?
3. **Browser console check pannunga** - errors kanum-a?

**Results share pannunga - then exact fix sollalam!**

