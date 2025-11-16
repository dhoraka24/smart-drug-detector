# Quick Start Guide

## Start Backend Server

**IMPORTANT:** Always run from the **project root** directory, NOT from the `backend` directory.

### Option 1: Use the batch file (Easiest)
```bash
# From project root
start_backend.bat
```

### Option 2: Manual command
```bash
# Make sure you're in project root
cd C:\Users\dhora\smart-drug-detector

# Then run:
python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

### Option 3: From backend directory
```bash
cd backend
cd ..
python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

## Start Frontend

```bash
cd frontend
npm run dev
```

## Login Credentials

- **Email:** admin@example.com
- **Password:** Admin123!

## Common Issues

### "ModuleNotFoundError: No module named 'backend'"
- **Solution:** You're running from the wrong directory. Go to project root first.

### "Cannot connect to server"
- **Solution:** Make sure backend is running on port 8000

### Database not initialized
```bash
cd backend
python seed_admin.py
```

