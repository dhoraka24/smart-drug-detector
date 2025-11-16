# 🔧 Fix: "Cannot connect to server" Error

## ❌ Problem
Login page-la "Cannot connect to server" error kanum.

## ✅ Solution Steps

### Step 1: Verify Backend is Running

**Check backend terminal:**
- Should see: `INFO: Uvicorn running on http://0.0.0.0:8000`
- Should see: `INFO: Application startup complete.`

**If not running:**
```powershell
cd C:\Users\dhora\smart-drug-detector
.\venv\Scripts\python.exe -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

---

### Step 2: Test Backend in Browser

**Open browser and go to:**
```
http://localhost:8000
```

**Should see:**
```json
{"message":"Smart Drug Detector API","version":"1.0.0"}
```

**If error:**
- Backend not running properly
- Port conflict
- Firewall blocking

---

### Step 3: Check for Multiple Backend Processes

**Multiple processes running-a check pannunga:**
```powershell
netstat -ano | findstr :8000
```

**If multiple processes kanum:**
1. All backend processes stop pannunga (Ctrl+C in each terminal)
2. Only one backend start pannunga

---

### Step 4: Verify Frontend Configuration

**Frontend code-la:**
- `frontend/src/store/auth.js` - Line 4: `const API_BASE_URL = 'http://localhost:8000';`
- This is correct ✅

**No changes needed!**

---

### Step 5: Check Browser Console

1. **Login page-la F12 press pannunga**
2. **Console tab open pannunga**
3. **Errors check pannunga:**
   - Network errors?
   - CORS errors?
   - Connection refused?

---

## 🛠️ Quick Fixes

### Fix 1: Restart Backend

1. **All backend terminals-la Ctrl+C press pannunga**
2. **Wait 5 seconds**
3. **New terminal-la start pannunga:**
   ```powershell
   cd C:\Users\dhora\smart-drug-detector
   .\venv\Scripts\python.exe -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
   ```

---

### Fix 2: Check Port Conflict

**If port 8000 already use aagirukka:**
```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill specific process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

---

### Fix 3: Check Firewall

**Windows Firewall backend port 8000 block pannirukka?**

1. **Windows Security → Firewall → Advanced settings**
2. **Inbound Rules check pannunga**
3. **Port 8000 allow pannunga**

---

### Fix 4: Clear Browser Cache

1. **Ctrl+Shift+Delete**
2. **Clear cache and cookies**
3. **Hard refresh: Ctrl+F5**

---

## ✅ Success Indicators

**Backend Terminal:**
- ✅ `INFO: Uvicorn running on http://0.0.0.0:8000`
- ✅ `INFO: Application startup complete.`
- ✅ No errors

**Browser (`http://localhost:8000`):**
- ✅ JSON response: `{"message":"Smart Drug Detector API","version":"1.0.0"}`

**Login Page:**
- ✅ No "Cannot connect to server" error
- ✅ Can login successfully

---

## 🎯 Most Common Issues

1. **Backend not running:**
   - Start backend from project root
   - Verify it's running

2. **Multiple backend processes:**
   - Stop all, start only one

3. **Port conflict:**
   - Kill other processes using port 8000

4. **Firewall:**
   - Allow port 8000 in firewall

---

## 📞 Next Steps

1. **Backend terminal check pannunga** - running-a?
2. **Browser-la `http://localhost:8000` test pannunga** - JSON response varum-a?
3. **Login page refresh pannunga** (Ctrl+F5)
4. **Browser console check pannunga** - errors kanum-a?

**Results share pannunga!**

