# 🚀 Next Steps - Smart Drug Detector Setup

## ✅ Step 1: Backend Server (DONE!)
Backend server is running on `http://localhost:8000`

---

## 📱 Step 2: Start Frontend Server

**Open a NEW PowerShell window** (keep backend running):

```powershell
cd C:\Users\dhora\smart-drug-detector\frontend
npm run dev
```

**Wait for:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

---

## 🌐 Step 3: Open Website

**Open browser and go to:**
```
http://localhost:5173
```

**You should see:**
- Login page
- Sign up option
- Beautiful UI

---

## 🔐 Step 4: Login or Sign Up

### Option A: Create New Account
1. Click "Sign Up"
2. Enter:
   - Full Name
   - Email
   - Password (min 8 characters)
3. Click "Create Account"
4. Login with your credentials

### Option B: Use Admin Account (if exists)
- Email: `admin@example.com`
- Password: `Admin123!`

---

## ✅ Step 5: Verify Dashboard

After login, you should see:
- ✅ Dashboard with status cards
- ✅ Real-time data (if ESP32 connected)
- ✅ Map page
- ✅ Alerts page
- ✅ Settings page

---

## 🔌 Step 6: Connect ESP32 (Optional)

If you want to connect hardware:

### Quick Steps:
1. **Get your computer's IP address:**
   ```powershell
   ipconfig | findstr /i "IPv4"
   ```
   Example: `192.168.1.100`

2. **Update ESP32 code:**
   - Open: `esp32\esp32_telemetry\esp32_telemetry.ino`
   - Find: `const char* serverUrl = "http://YOUR_IP:8000/api/v1/telemetry";`
   - Replace `YOUR_IP` with your IP (e.g., `192.168.1.100`)
   - Find: `const char* apiKey = "YOUR_DEVICE_API_KEY";`
   - Get API key from: `backend\.env` file (look for `DEVICE_API_KEY`)

3. **Upload to ESP32:**
   - Open Arduino IDE
   - Select: Tools → Board → ESP32 Dev Module
   - Select: Tools → Port → (your ESP32 port)
   - Click Upload

4. **Verify connection:**
   - Open Serial Monitor (115200 baud)
   - Should see: "Connected to WiFi" and "Data sent successfully"
   - Check dashboard - should show real-time data!

---

## 📋 Complete Setup Checklist

- [x] Backend server running (http://localhost:8000)
- [ ] Frontend server running (http://localhost:5173)
- [ ] Website opens in browser
- [ ] Can login/signup
- [ ] Dashboard shows data
- [ ] (Optional) ESP32 connected and sending data

---

## 🆘 Troubleshooting

### Frontend won't start?
```powershell
cd frontend
npm install
npm run dev
```

### Can't login?
- Check backend is running
- Check browser console for errors
- Try creating new account

### ESP32 not connecting?
- Check WiFi credentials in ESP32 code
- Check IP address is correct
- Check API key matches `.env` file
- Check Serial Monitor for errors

---

## 📚 More Help

- **ESP32 Setup:** See `ESP32_QUICK_SETUP.md`
- **Backend Issues:** See `QUICK_FIX_BACKEND.md`
- **Technical Stack:** See `PPT_TECHNICAL_STACK.txt`

---

## 🎉 You're Ready!

Once frontend is running, you can:
- View real-time dashboard
- See alerts on map
- Configure device settings
- Export data
- And more!

**Happy detecting! 🚀**

