# ⚡ Quick Fix: Backend Server Start

## ❌ Problem
```
ModuleNotFoundError: No module named 'backend'
```

## ✅ Solution

**Always run from PROJECT ROOT, not from backend folder!**

### Correct Method:

```powershell
# Step 1: Go to project root
cd C:\Users\dhora\smart-drug-detector

# Step 2: Run server (choose one method)
```

**Method 1: Direct Python (Easiest)**
```powershell
.\venv\Scripts\python.exe -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

**Method 2: Use Batch File**
```powershell
backend\run_server.bat
```

**Method 3: Activate venv first**
```powershell
.\venv\Scripts\Activate.ps1
python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

---

## 📍 How to Know You're in the Right Place

**✅ Correct Location (Project Root):**
```
C:\Users\dhora\smart-drug-detector\
```
- You should see: `backend\`, `frontend\`, `esp32\` folders
- You should see: `README.md`, `package.json` (in frontend)

**❌ Wrong Location (Backend Folder):**
```
C:\Users\dhora\smart-drug-detector\backend\
```
- You see: `app.py`, `models.py` directly (not in a folder)

---

## 🎯 One-Liner (Copy & Paste)

```powershell
cd C:\Users\dhora\smart-drug-detector && .\venv\Scripts\python.exe -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

---

## ✅ Success Message

When server starts correctly, you'll see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

Then open: http://localhost:8000

---

## 🛑 Stop Server

Press `Ctrl+C` in the terminal.

