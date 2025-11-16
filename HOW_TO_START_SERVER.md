# How to Start the Backend Server

## ⚠️ IMPORTANT: Always Run from Project Root

The server **MUST** be run from the **project root** directory (`C:\Users\dhora\smart-drug-detector`), NOT from the `backend` directory.

## Method 1: Use the Batch File (Easiest) ✅

**From project root:**
```bash
start_backend.bat
```

**Or from backend directory:**
```bash
cd backend
run_server.bat
```

Both will automatically navigate to the correct directory.

## Method 2: Manual Command

1. **Make sure you're in project root:**
   ```bash
   cd C:\Users\dhora\smart-drug-detector
   ```

2. **Verify you're in the right place:**
   ```bash
   dir backend\app.py
   ```
   Should show the file exists.

3. **Start the server:**
   ```bash
   python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
   ```

## Method 3: One-liner from Anywhere

```bash
cd C:\Users\dhora\smart-drug-detector && python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

## Success Indicators

When the server starts correctly, you should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

## Common Error

**Error:** `ModuleNotFoundError: No module named 'backend'`

**Cause:** Running from the wrong directory (e.g., from `backend` folder)

**Solution:** 
- Use `start_backend.bat` from project root, OR
- Use `cd ..` to go to project root first, OR
- Use `run_server.bat` from backend directory

## Quick Check

Before starting, verify your current directory:
```bash
# Should show: C:\Users\dhora\smart-drug-detector
echo %CD%

# Should exist:
dir backend\app.py
```

If `backend\app.py` doesn't exist, you're in the wrong directory!

