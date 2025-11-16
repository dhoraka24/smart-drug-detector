# Backend Server Start Pannunga (Windows PowerShell) 🚀

## Method 1: Direct Python from venv (Easiest) ✅

**Project root-la irundhu:**
```powershell
cd C:\Users\dhora\smart-drug-detector
.\venv\Scripts\python.exe -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

**Or:**
```powershell
cd C:\Users\dhora\smart-drug-detector
venv\Scripts\python.exe -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

---

## Method 2: Activate venv first (PowerShell)

**Project root-la irundhu:**
```powershell
cd C:\Users\dhora\smart-drug-detector
.\venv\Scripts\Activate.ps1
python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

**Note:** PowerShell execution policy issue iruntha:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## Method 3: Use run_server.bat (Windows)

**Project root-la irundhu:**
```cmd
cd C:\Users\dhora\smart-drug-detector
backend\run_server.bat
```

---

## ⚠️ Important Points:

1. **Project root-la run pannunga** - `backend` folder-la illa!
   - ✅ Correct: `C:\Users\dhora\smart-drug-detector\`
   - ❌ Wrong: `C:\Users\dhora\smart-drug-detector\backend\`

2. **Command format:**
   ```powershell
   python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
   ```
   - `backend.app:app` - intha format use pannanum (project root-la irundha)

3. **Virtual environment:**
   - Direct Python use pannunga: `.\venv\Scripts\python.exe`
   - Or activate pannunga: `.\venv\Scripts\Activate.ps1`

---

## Quick Start (Copy & Paste):

```powershell
cd C:\Users\dhora\smart-drug-detector
.\venv\Scripts\python.exe -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

**That's it!** Server start aagum! 🎉

---

## Verify Server Running:

Browser-la open pannunga:
```
http://localhost:8000/
```

Should show:
```json
{"message":"Smart Drug Detector API","version":"1.0.0"}
```

---

## Stop Server:

Press `Ctrl+C` in the terminal.

