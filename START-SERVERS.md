# Quick Start - Starting the Servers

## ⚠️ Important: No Need to Activate Virtual Environment!

On Windows, you can use the Python executable directly without activating the venv.

## Start Backend Server

**Option 1: Direct Command (Recommended)**
```powershell
.\venv\Scripts\python.exe -m uvicorn backend.app:app --reload
```

**Option 2: Using Helper Script**
```powershell
.\start-backend.ps1
```

**Option 3: If you want to activate venv (requires execution policy fix)**
```powershell
# First, fix execution policy (run once):
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Then activate:
.\venv\Scripts\Activate.ps1

# Then run:
uvicorn backend.app:app --reload
```

## Start Frontend Server

Open a **new PowerShell window** (keep backend running):

```powershell
cd frontend
npm run dev
```

## Verify Servers Are Running

- **Backend:** Open http://localhost:8000 in browser (should show JSON response)
- **Frontend:** Open http://localhost:5173 in browser (should show dashboard)
- **API Docs:** http://localhost:8000/docs

## Test the API

In a third PowerShell window:
```powershell
python test_api.py
```

This will create test alerts that appear in the dashboard!

## Troubleshooting Execution Policy

If you get execution policy errors, you have two options:

1. **Fix execution policy** (one-time setup):
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

2. **Skip activation** (easier - just use direct path):
   ```powershell
   .\venv\Scripts\python.exe -m uvicorn backend.app:app --reload
   ```

The second option is recommended - no activation needed! ✅

