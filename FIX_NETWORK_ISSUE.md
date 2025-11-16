# 🔧 Fix: ESP32 Dashboard-la Connect Aagala

## ❌ Problem
- Serial Monitor-la ESP32 data varuthu ✅
- Dashboard-la data kanala ❌

## 🔍 Root Cause

**Network Mismatch!**

- **ESP32:** "Buildathon-13" network-la irukku
- **Computer:** "hostelwifi" network-la irukku (IP: 172.16.17.139)
- **ESP32 Code:** `http://172.16.17.139:8000` ku try pannuthu
- **But:** Different network-la irundha reach aaga mudiyathu!

---

## ✅ Solution Options

### Option 1: Computer-um "Buildathon-13" Network-la Connect Pannunga (Recommended)

1. **Computer WiFi-la "Buildathon-13" connect pannunga**
2. **New IP address find pannunga:**
   ```powershell
   ipconfig | findstr /i "IPv4"
   ```
3. **ESP32 code-la new IP update pannunga:**
   - Open: `esp32/esp32_telemetry/esp32_telemetry.ino`
   - Line 75: Update with new IP
   - Example: `http://192.168.1.100:8000/api/v1/telemetry`
4. **ESP32 code upload pannunga**

---

### Option 2: ESP32-um "hostelwifi" Network-la Connect Pannunga

1. **ESP32 code-la WiFi credentials change pannunga:**
   ```cpp
   const char* WIFI_SSID = "hostelwifi";  // or actual SSID
   const char* WIFI_PASS = "hostelwifi-password";
   ```
2. **ESP32 code upload pannunga**
3. **ESP32 "hostelwifi" connect aagum**
4. **Backend IP (172.16.17.139) use pannalam**

---

### Option 3: Both Same Router-la iruntha

If both networks same router-la iruntha (different SSIDs):
- Find router's IP range
- Use correct IP from that range

---

## 🔍 Verify Network Connection

### Step 1: Check ESP32 Serial Monitor

**Should see:**
```
Connected to WiFi
IP address: 192.168.x.x
Data sent successfully
```

**If "Connection failed" or "HTTP error" kanum:**
- Network mismatch issue
- IP address wrong

---

### Step 2: Check Backend Terminal

**Backend terminal-la should see:**
```
INFO: POST /api/v1/telemetry
```

**If no requests varala:**
- ESP32 backend reach pannala
- Network/IP issue

---

### Step 3: Check Browser Console

**F12 press pannitu Console tab open pannunga**

**Should see:**
- WebSocket connected
- No network errors

**If errors kanum:**
- Check backend running
- Check CORS settings

---

## 📝 Quick Fix Steps

1. **Computer "Buildathon-13" network-la connect pannunga**
2. **New IP find pannunga:**
   ```powershell
   ipconfig
   ```
3. **ESP32 code-la update:**
   ```cpp
   const String BACKEND_URL = "http://NEW_IP:8000/api/v1/telemetry";
   ```
4. **Upload to ESP32**
5. **Serial Monitor verify pannunga**
6. **Dashboard refresh pannunga**

---

## ✅ Success Indicators

**Serial Monitor:**
- ✅ "Connected to WiFi"
- ✅ "Data sent successfully"
- ✅ HTTP 200 response

**Backend Terminal:**
- ✅ POST requests varanum
- ✅ No errors

**Dashboard:**
- ✅ Real-time data update
- ✅ Device list-la new device kanum
- ✅ Charts update aagum

---

## 🆘 Still Not Working?

1. **Check firewall:**
   - Windows Firewall backend port 8000 block pannirukka?
   - Allow pannunga

2. **Check backend running:**
   - `http://localhost:8000` browser-la open pannunga
   - Should show JSON response

3. **Check device_id:**
   - ESP32: `esp32-drug-001`
   - Dashboard filter check pannunga

4. **Check API key:**
   - ESP32 code-la `DEVICE_API_KEY` = Backend `.env` la `DEVICE_API_KEY`
   - Exact match venum!

---

## 🎯 Most Common Issue

**99% cases-la: Network mismatch!**

ESP32 and Computer **same WiFi network-la irukkanum**!

**Quick Check:**
- ESP32 WiFi: "Buildathon-13" ✅
- Computer WiFi: "Buildathon-13" ❌ (currently "hostelwifi")

**Fix:** Computer-um "Buildathon-13" connect pannunga!

