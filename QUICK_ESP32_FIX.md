# ⚡ Quick ESP32 Fix - Power Supply Issue

## 🔍 Problem
ESP32 laptop power supply-la connect pannumbodhu dashboard connect agala, data telemetry sent agala.

---

## ✅ Immediate Fix (3 Steps)

### Step 1: Power Supply Change
**❌ Don't use:** Laptop USB port (power insufficient)
**✅ Use instead:** 
- Phone charger (5V, 2A) - **Best option**
- USB power adapter
- External 5V power supply

**Connect to ESP32 USB port**

---

### Step 2: Check Serial Monitor
**Arduino IDE-la Serial Monitor open pannunga (115200 baud)**

**Look for:**
```
WiFi connected!
IP: 10.249.151.103
```

**If "WiFi failed" kanum:**
- WiFi SSID and password check pannunga
- Laptop and ESP32 same network-la irukkanum

---

### Step 3: Check Backend
**Backend server running-a?**
```powershell
# Check backend terminal
INFO: Application startup complete.
```

**If not running:**
```powershell
.\venv\Scripts\python.exe -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

---

## 🔧 Common Issues

### Issue 1: No Serial Output
**Problem:** Serial Monitor-la nothing kanum
**Fix:** 
- External power supply use pannunga (5V, 2A)
- USB cable check pannunga

### Issue 2: WiFi Not Connecting
**Problem:** "WiFi failed" kanum
**Fix:**
- ESP32 code-la WiFi SSID: `"Galaxy A23 5G FD99"`
- Password: `"12345678"`
- Laptop same WiFi-la connect pannunga

### Issue 3: HTTP 500 Error
**Problem:** `HTTP Response code: 500`
**Fix:**
- Backend server restart pannunga
- Check `backend/.env` file exists
- Check `DEVICE_API_KEY=esp32-secure-key-2024`

### Issue 4: HTTP 401 Error
**Problem:** `HTTP Response code: 401`
**Fix:**
- ESP32 code-la `DEVICE_API_KEY = "esp32-secure-key-2024"`
- Backend `.env` file-la same key irukkanum

---

## 📋 Quick Checklist

- [ ] **External power supply** connected (5V, 2A) - NOT laptop USB
- [ ] **Serial Monitor** open (115200 baud)
- [ ] **WiFi connected** message kanum
- [ ] **Backend server** running
- [ ] **Backend .env** file has DEVICE_API_KEY
- [ ] **ESP32 and laptop** same WiFi network-la

---

## 🚀 Test Steps

1. **ESP32 power on** (external supply)
2. **Serial Monitor open** - check WiFi connection
3. **Backend terminal watch** - POST requests kanum-a?
4. **Dashboard open** - `http://localhost:5173` - data kanum-a?

---

## 💡 Most Common Fix

**90% cases-la problem:**
- **Laptop USB power insufficient** → Use external power supply (5V, 2A)

**Ippo external power supply use pannunga, Serial Monitor output share pannunga!**

