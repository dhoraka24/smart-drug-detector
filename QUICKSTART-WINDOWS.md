# Quick Start Guide - Windows PowerShell

This guide provides step-by-step instructions for Windows users to get the Smart Drug Detector Dashboard running.

## Prerequisites Check

### 1. Check Python Installation

Open PowerShell and run:
```powershell
py --version
```

If you see a version number (e.g., `Python 3.14.0`), you're good!  
If not, install Python from [python.org](https://www.python.org/downloads/)

### 2. Check Node.js Installation

Run:
```powershell
node --version
```

If you see a version number, you're good!  
If not, install Node.js from [nodejs.org](https://nodejs.org/) (LTS version recommended)

## Setup Steps

### Step 1: Backend Setup

1. Open PowerShell in the project root directory (`C:\Users\dhora\smart-drug-detector`)

2. Run the setup script:
   ```powershell
   .\setup-backend.ps1
   ```

   This will:
   - Create a virtual environment
   - Install all Python dependencies
   - Verify the setup

3. If you get an execution policy error, run:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

### Step 2: Start Backend Server

Run:
```powershell
.\start-backend.ps1
```

Or manually:
```powershell
.\venv\Scripts\python.exe -m uvicorn backend.app:app --reload
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

**Keep this terminal window open!**

### Step 3: Frontend Setup (New PowerShell Window)

1. Open a **new** PowerShell window (keep the backend running)

2. Navigate to the project root:
   ```powershell
   cd C:\Users\dhora\smart-drug-detector
   ```

3. Run the frontend setup:
   ```powershell
   .\setup-frontend.ps1
   ```

   This will install all Node.js dependencies.

### Step 4: Start Frontend Server

```powershell
cd frontend
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

## Access the Application

- **Frontend Dashboard:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs

## Testing the API

Open a third PowerShell window and run:
```powershell
python test_api.py
```

This will submit sample telemetry data and create test alerts.

## Troubleshooting

### "Python was not found"
- Use `py` instead of `python` on Windows
- Or install Python from python.org

### "Execution Policy" Error
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### "npm is not recognized"
- Install Node.js from nodejs.org
- Restart PowerShell after installation

### Backend won't start
- Make sure you're in the project root directory
- Check that `venv` folder exists
- Try: `.\venv\Scripts\python.exe -m pip install -r backend\requirements.txt`

### Frontend won't start
- Make sure Node.js is installed: `node --version`
- Navigate to `frontend` directory first
- Try: `npm install` again

### Port already in use
- Backend (8000): Close other applications using port 8000
- Frontend (5173): Close other applications using port 5173
- Or change ports in `vite.config.js` and `uvicorn` command

## Common Commands Reference

```powershell
# Backend
.\venv\Scripts\python.exe -m uvicorn backend.app:app --reload

# Frontend
cd frontend
npm run dev

# Test API
python test_api.py

# Check if backend is running
curl http://localhost:8000
```

## Next Steps

1. Open the dashboard at http://localhost:5173
2. Submit test data using `test_api.py`
3. Configure device settings in the Settings page
4. View alerts and map visualizations

Enjoy your Smart Drug Detector Dashboard! 🚀

