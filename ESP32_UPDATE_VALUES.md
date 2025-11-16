# 🔧 ESP32 Code - Update Values

## ✅ Step 1: IP Address (DONE!)
Updated to: `172.16.17.139`

---

## ⚠️ Step 2: DEVICE_API_KEY Setup

### Option A: If .env file already exists

1. Open: `backend/.env`
2. Find: `DEVICE_API_KEY=...`
3. Copy the value
4. Open: `esp32/esp32_telemetry/esp32_telemetry.ino`
5. Find line 83:
   ```cpp
   const String DEVICE_API_KEY = "REPLACE_WITH_DEVICE_API_KEY";
   ```
6. Replace with your actual key:
   ```cpp
   const String DEVICE_API_KEY = "your-actual-key-from-env";
   ```

### Option B: If .env file doesn't exist

1. Create: `backend/.env` file
2. Add:
   ```
   DEVICE_API_KEY=esp32-secure-key-2024
   JWT_SECRET_KEY=your-jwt-secret-min-32-chars
   OPENAI_API_KEY=your-openai-key-if-needed
   DATABASE_URL=sqlite:///./database.db
   ```
3. Use the same key in ESP32 code (line 83)

---

## 📝 Complete ESP32 Code Values

**Line 75:**
```cpp
const String BACKEND_URL = "http://172.16.17.139:8000/api/v1/telemetry";
```

**Line 83:**
```cpp
const String DEVICE_API_KEY = "your-device-api-key-here";
```

**Line 61-63: WiFi Credentials (already set):**
```cpp
const char* WIFI_SSID = "DHORAKANATARAJ 3283";
const char* WIFI_PASS = "4}847Nh6";
```

---

## ✅ After Updating

1. Save the file
2. Upload to ESP32 via Arduino IDE
3. Open Serial Monitor (115200 baud)
4. Should see:
   - "Connected to WiFi"
   - "Data sent successfully"
   - Check dashboard for real-time data!

---

## 🎯 Quick Checklist

- [x] IP Address: `172.16.17.139`
- [ ] DEVICE_API_KEY: (update from .env)
- [ ] WiFi SSID: (already set)
- [ ] WiFi Password: (already set)
- [ ] Upload to ESP32
- [ ] Verify in Serial Monitor
- [ ] Check dashboard for data

---

## ⚠️ Important Notes

1. **ESP32 same WiFi-la irukkanum:**
   - ESP32: "DHORAKANATARAJ 3283" network-la connect aaganum
   - Computer: Same network-la irukkanum (hostelwifi)

2. **Backend running-a irukkanum:**
   - Backend server `http://0.0.0.0:8000` la run aaganum
   - ESP32 connect pannumbodhu backend ready-a irukkanum

3. **API Key Match:**
   - ESP32 code-la `DEVICE_API_KEY` = Backend `.env` la `DEVICE_API_KEY`
   - Exact match venum!

---

## 🆘 Troubleshooting

**ESP32 can't connect?**
- Check WiFi credentials
- Check ESP32 same network-la irukka
- Check Serial Monitor for errors

**"Invalid API key" error?**
- Verify DEVICE_API_KEY matches in both places
- Check backend .env file exists
- Restart backend server after updating .env

**No data in dashboard?**
- Check Serial Monitor - "Data sent successfully" kanum
- Check backend terminal - requests varanum
- Check browser console for errors

