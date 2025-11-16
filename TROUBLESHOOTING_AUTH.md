# Authentication Troubleshooting Guide

## Common Issues and Solutions

### 1. Signup/Login Stuck on "Creating account..." or "Signing in..."

**Possible Causes:**
- Backend server is not running
- Backend server is running on different port
- CORS issues
- Database not initialized

**Solutions:**

#### Check if Backend is Running:
```bash
# In backend directory
cd backend
python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

#### Check Backend Health:
Open browser and go to: `http://localhost:8000/`
Should show: `{"message": "Smart Drug Detector API", "version": "1.0.0"}`

#### Initialize Database:
```bash
cd backend
python seed_admin.py
```

This will:
- Create database tables
- Create admin user (admin@example.com / Admin123!)

#### Check Browser Console:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Try signup/login again
4. Look for error messages

Common errors:
- `Network Error` or `ERR_CONNECTION_REFUSED` → Backend not running
- `CORS error` → Check backend CORS settings
- `401 Unauthorized` → Check JWT_SECRET_KEY in .env

### 2. "Cannot connect to server" Error

**Solution:**
1. Verify backend is running on port 8000
2. Check `.env` file exists in backend directory
3. Verify `JWT_SECRET_KEY` is set (minimum 32 characters)

### 3. "Email already registered" Error

**Solution:**
- The email is already in the database
- Try a different email or login with existing account

### 4. Login Works but Dashboard Shows "Loading..."

**Solution:**
- Check browser console for errors
- Verify token is stored: `localStorage.getItem('sdd_token')`
- Check if `/api/v1/auth/me` endpoint works

### 5. Quick Test Commands

```bash
# Test backend is accessible
curl http://localhost:8000/

# Test signup endpoint (should return 201)
curl -X POST http://localhost:8000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","full_name":"Test User","password":"Test1234!"}'

# Test login endpoint
curl -X POST http://localhost:8000/api/v1/auth/login-json \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}'
```

### 6. Check Environment Variables

Create/verify `.env` file in backend directory:
```env
OPENAI_API_KEY=your-key-here
DEVICE_API_KEY=your-device-key-here
JWT_SECRET_KEY=your-super-secret-jwt-key-minimum-32-characters-long
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
DATABASE_URL=sqlite:///./database.db
```

### 7. Reset Everything

If nothing works, reset the database:
```bash
cd backend
# Delete database
rm database.db  # Linux/Mac
del database.db  # Windows

# Recreate
python seed_admin.py

# Restart backend
python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000
```

## Still Having Issues?

1. Check backend logs for errors
2. Check browser console (F12) for frontend errors
3. Verify all dependencies are installed:
   ```bash
   cd backend
   pip install -r requirements.txt
   
   cd ../frontend
   npm install
   ```

