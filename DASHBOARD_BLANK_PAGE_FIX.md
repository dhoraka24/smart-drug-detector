# 🔧 Dashboard Blank Page Fix

## Problem
Dashboard-la completely blank white page kanuthu - nothing rendering.

---

## ✅ Step 1: Browser Console Check

**Browser-la:**
1. **F12** press pannunga (Developer Tools)
2. **Console** tab open pannunga
3. **Red errors** check pannunga

**Common errors:**
- `Cannot find module 'date-fns-tz'` → Package install aagala
- `Cannot read property 'X' of undefined` → Component error
- `Failed to fetch` → Backend connection issue

---

## ✅ Step 2: Frontend Server Check

**Terminal-la check pannunga:**
```powershell
# Frontend server running-a?
# Should see:
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

**If not running:**
```powershell
cd frontend
npm run dev
```

---

## ✅ Step 3: Install Missing Package

**If `date-fns-tz` error kanum:**
```powershell
cd frontend
npm install date-fns-tz
```

---

## ✅ Step 4: Clear Cache & Restart

1. **Browser cache clear:**
   - `CTRL + SHIFT + DELETE`
   - Clear cache and cookies

2. **Frontend server restart:**
   - Terminal-la `CTRL + C` (stop)
   - `npm run dev` (start)

3. **Hard refresh:**
   - Browser-la `CTRL + SHIFT + R`

---

## ✅ Step 5: Check Network Tab

**Browser-la:**
1. **F12** press
2. **Network** tab open
3. **Page refresh** pannunga
4. **Failed requests** (red) check pannunga

**Common issues:**
- `localhost:8000` requests fail → Backend not running
- `404` errors → Missing files
- `CORS` errors → Backend CORS issue

---

## 🔍 Quick Debug Steps

### Check 1: Frontend Server
```powershell
# Terminal-la check
cd frontend
npm run dev
```

### Check 2: Backend Server
```powershell
# Backend terminal-la check
# Should see:
INFO: Application startup complete.
```

### Check 3: Browser Console
- **F12** → **Console** tab
- **Errors** check pannunga
- **Exact error message** copy pannunga

---

## 💡 Most Common Fixes

### Fix 1: Package Not Installed
```powershell
cd frontend
npm install date-fns-tz
npm run dev
```

### Fix 2: Backend Not Running
```powershell
# Backend terminal-la
.\venv\Scripts\python.exe -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

### Fix 3: Port Already in Use
```powershell
# Check if port 5173 is in use
netstat -ano | findstr :5173

# Kill process if needed
taskkill /PID <process_id> /F
```

---

## 📋 Checklist

- [ ] Browser console-la errors check panniten
- [ ] Frontend server running (localhost:5173)
- [ ] Backend server running (localhost:8000)
- [ ] `date-fns-tz` package installed
- [ ] Browser cache cleared
- [ ] Hard refresh panniten (CTRL + SHIFT + R)

---

## 🚨 If Still Blank

**Browser console-la exact error message share pannunga:**
1. **F12** press
2. **Console** tab-la **red error** select pannunga
3. **Copy** pannunga
4. **Share** pannunga

**Ippo exact error kanum - fix pannalam!**

