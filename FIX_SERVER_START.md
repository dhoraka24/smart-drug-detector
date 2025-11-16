# 🔧 How to Fix "ModuleNotFoundError: No module named 'backend'"

## ❌ The Problem

You're running the server from the **wrong directory**!

**Wrong:** Running from `backend` folder
```
C:\Users\dhora\smart-drug-detector\backend> python -m uvicorn backend.app:app ...
```

**Correct:** Running from **project root**
```
C:\Users\dhora\smart-drug-detector> python -m uvicorn backend.app:app ...
```

## ✅ Solution 1: Use START_SERVER.bat (Easiest!)

1. **Go to project root:**
   ```bash
   cd C:\Users\dhora\smart-drug-detector
   ```

2. **Double-click `START_SERVER.bat`** or run:
   ```bash
   START_SERVER.bat
   ```

This will automatically:
- Check you're in the right directory
- Start the server correctly
- Show clear error messages if something's wrong

## ✅ Solution 2: Manual Fix

1. **Open PowerShell**

2. **Navigate to project root:**
   ```bash
   cd C:\Users\dhora\smart-drug-detector
   ```

3. **Verify you're in the right place:**
   ```bash
   # Should show backend\app.py exists
   dir backend\app.py
   ```

4. **Start the server:**
   ```bash
   python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
   ```

## ✅ Solution 3: One-Liner

From **anywhere**, run:
```bash
cd C:\Users\dhora\smart-drug-detector && python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

## 🎯 How to Know You're in the Right Place

**Project root should contain:**
- ✅ `backend` folder
- ✅ `frontend` folder  
- ✅ `esp32` folder
- ✅ `START_SERVER.bat` file
- ✅ `README.md` file

**You're in the WRONG place if you see:**
- ❌ `app.py` directly (you're inside `backend` folder)
- ❌ `models.py` directly (you're inside `backend` folder)

## 📝 Quick Checklist

- [ ] I'm in `C:\Users\dhora\smart-drug-detector` (project root)
- [ ] I can see `backend\app.py` exists
- [ ] I'm using `START_SERVER.bat` OR running from project root
- [ ] Server shows: `INFO: Uvicorn running on http://0.0.0.0:8000`

## 🚀 After Server Starts

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

Then test:
- Backend: http://localhost:8000/
- Frontend: http://localhost:5173/

