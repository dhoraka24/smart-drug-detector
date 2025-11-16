# 🚀 Frontend Start Guide (Tamil/English)

## Frontend Start Pannurathu (How to Start Frontend)

### Method 1: Batch File Use Pannunga (Easiest!)

**Project root la irundhu:**
```bash
START_FRONTEND.bat
```

Illa manually:
```bash
cd frontend
npm run dev
```

### Method 2: Manual Steps

1. **Frontend folder ku poi:**
   ```bash
   cd C:\Users\dhora\smart-drug-detector\frontend
   ```

2. **Dependencies install pannunga (first time only):**
   ```bash
   npm install
   ```

3. **Frontend start pannunga:**
   ```bash
   npm run dev
   ```

### Success Message

Server start aagumbodhu, intha message varum:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Browser la Open Pannunga

Open your browser and go to:
```
http://localhost:5173
```

### Login Credentials

- **Email:** admin@example.com
- **Password:** Admin123!

## Common Issues

### "npm: command not found"
- Node.js install pannunga: https://nodejs.org/

### "Port 5173 already in use"
- Another server already running
- Kill that process or use different port: `npm run dev -- --port 5174`

### "Cannot connect to server"
- Backend server start pannunga first (port 8000)
- Check: http://localhost:8000/

## Quick Checklist

- [ ] Backend server running (port 8000) ✅
- [ ] Frontend folder la iruken ✅
- [ ] `npm install` panniten (first time) ✅
- [ ] `npm run dev` run panniten ✅
- [ ] Browser la http://localhost:5173 open panniten ✅

## Both Servers Run Pannurathu

**Terminal 1 - Backend:**
```bash
cd C:\Users\dhora\smart-drug-detector
START_SERVER.bat
```

**Terminal 2 - Frontend:**
```bash
cd C:\Users\dhora\smart-drug-detector
START_FRONTEND.bat
```

Illa manually:
```bash
# Terminal 1
cd C:\Users\dhora\smart-drug-detector
python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 (new window)
cd C:\Users\dhora\smart-drug-detector\frontend
npm run dev
```

