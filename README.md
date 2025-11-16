# Smart Drug Detector

A complete IoT-based drug vapor detection system with ESP32 sensors, FastAPI backend, and React frontend dashboard. **Now with secure user authentication and role-based access control.**

## Overview

Smart Drug Detector receives telemetry from ESP32 devices equipped with MQ3 and MQ135 gas sensors. The system determines severity based on MQ3 readings only, calls OpenAI for detailed analysis when alerts are triggered, stores data in SQLite, and presents a professional web dashboard with real-time alerts and map visualization.

## Features

- **Secure Authentication**: JWT-based authentication with role-based access control (Admin/User)
- **User Management**: User registration, login, and profile management
- **Real-time Monitoring**: MQ3 and MQ135 sensor readings with temperature and humidity
- **AI-Powered Analysis**: OpenAI integration for detailed alert explanations
- **Duplicate Detection**: Prevents duplicate telemetry entries
- **Debounce Logic**: Prevents alert spam within configurable time windows
- **Interactive Map**: Leaflet-based map with color-coded alert markers
- **WebSocket Updates**: Real-time alert notifications
- **GPS Support**: Optional GPS tracking for alert locations
- **Protected Endpoints**: Admin-only access for device settings and sensitive operations

## System Architecture

```
ESP32 Device → HTTP POST (Device API Key) → FastAPI Backend → SQLite Database
                                      ↓
                              OpenAI API (for alerts)
                                      ↓
                              WebSocket → React Frontend (JWT Auth)
```

## Prerequisites

- Python 3.11+
- Node.js 18+
- ESP32 development board
- MQ3 and MQ135 gas sensors
- Optional: DHT22 (temperature/humidity), NEO-6M GPS module

## Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Create a `.env` file in the backend directory (copy from `.env.example`):
```bash
# Copy the example file
cp ../.env.example .env
```

6. Edit `.env` and set your configuration:
```env
OPENAI_API_KEY=your-openai-api-key-here
DEVICE_API_KEY=your-device-api-key-here
JWT_SECRET_KEY=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
DATABASE_URL=sqlite:///./database.db
```

**⚠️ IMPORTANT**: 
- Generate a strong `JWT_SECRET_KEY` (minimum 32 characters, use a random string generator)
- Keep your `.env` file secure and never commit it to version control

7. Create database tables and seed admin user:
```bash
python seed_admin.py
```

This will create:
- Database tables (users, telemetry, alerts, device_settings)
- Default admin user:
  - Email: `admin@example.com`
  - Password: `Admin123!`
  - **⚠️ Change this password immediately after first login!**

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

### Start Backend

1. Activate your virtual environment (if not already active):
```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
```

2. Run the FastAPI server (from project root, not backend directory):
```bash
# From project root directory
cd ..
python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000

# Or use the helper script (Windows)
cd backend
run_server.bat

# Or (Linux/Mac)
cd backend
bash run_server.sh
```

The API will be available at `http://localhost:8000`

### Start Frontend

1. In a new terminal, navigate to the frontend directory:
```bash
cd frontend
```

2. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Authentication & User Management

### Default Admin Account

After running `seed_admin.py`, you can log in with:
- **Email**: `admin@example.com`
- **Password**: `Admin123!`

**⚠️ SECURITY WARNING**: Change this password immediately after first login!

### User Registration

1. Navigate to `/signup` in the frontend
2. Fill in:
   - Full Name
   - Email (must be valid format)
   - Password (minimum 8 characters)
   - Confirm Password
3. New users are created with "user" role by default
4. Admin users must be created via the seed script or database

### Authentication Flow

1. **Login**: Users authenticate with email/password, receive JWT token
2. **Token Storage**: Token stored in `localStorage` (key: `sdd_token`)
3. **Protected Routes**: Dashboard, Alerts, Map, Settings require authentication
4. **Admin Routes**: Device settings updates require admin role
5. **Auto-logout**: Expired tokens automatically log out user

### API Authentication

- **User Endpoints**: Require valid JWT token in `Authorization: Bearer <token>` header
- **Device Endpoints**: ESP32 uses `x-api-key` header (separate from user auth)
- **Public Endpoints**: `/api/v1/about` is publicly accessible

### Security Features

- **Password Hashing**: Bcrypt with passlib
- **JWT Tokens**: Secure token-based authentication
- **Rate Limiting**: Login attempts limited (5 attempts per 15 minutes per IP)
- **Password Policy**: Minimum 8 characters enforced
- **Email Validation**: Email format validation on signup
- **Role-Based Access**: Admin-only endpoints protected

### Production Security Notes

⚠️ **For Production Deployment**:

1. **Token Storage**: Current implementation uses `localStorage` for simplicity. For enhanced security:
   - Consider using HttpOnly cookies (requires CSRF protection)
   - Implement token refresh mechanism
   - Use secure, same-site cookie attributes

2. **JWT Secret**: 
   - Use a strong, randomly generated secret (minimum 32 characters)
   - Never commit secrets to version control
   - Rotate secrets periodically

3. **HTTPS**: Always use HTTPS in production to protect tokens in transit

4. **Rate Limiting**: Current rate limiting is in-memory. For production:
   - Use Redis or similar for distributed rate limiting
   - Implement more sophisticated rate limiting strategies

5. **Password Policy**: Consider adding:
   - Complexity requirements (uppercase, lowercase, numbers, symbols)
   - Password history to prevent reuse
   - Account lockout after failed attempts

## API Endpoints

### Authentication Endpoints

- `POST /api/v1/auth/signup` - Register new user (public)
- `POST /api/v1/auth/login-json` - Login with JSON (public)
- `POST /api/v1/auth/login` - Login with OAuth2 form (public)
- `GET /api/v1/auth/me` - Get current user info (protected)
- `POST /api/v1/auth/logout` - Logout (protected, client-side token removal)

### Telemetry Endpoints

- `POST /api/v1/telemetry` - Submit telemetry (Device API Key required)
- `GET /api/v1/telemetry` - Get telemetry data (JWT required)

### Alert Endpoints

- `GET /api/v1/alerts` - Get alerts (JWT required)

### Device Settings Endpoints

- `GET /api/v1/device-settings/{device_id}` - Get settings (JWT required)
- `POST /api/v1/device-settings/{device_id}` - Update settings (Admin JWT required)

### WebSocket

- `ws://localhost:8000/ws/alerts` - Real-time alert updates (JWT recommended)

## Testing

### Backend Tests

Run pytest tests:
```bash
cd backend
pytest
```

Test coverage includes:
- User signup and login
- JWT token validation
- Protected route access
- Admin role verification
- Password hashing

### Manual Testing

1. **Test Login Flow**:
   - Navigate to `/login`
   - Login with admin credentials
   - Verify redirect to dashboard
   - Check token in localStorage

2. **Test Protected Routes**:
   - Logout
   - Try accessing `/` or `/alerts`
   - Should redirect to `/login`

3. **Test Admin Access**:
   - Login as regular user (create via signup)
   - Try updating device settings
   - Should see "Access Denied" message

## ESP32 Setup

See `ESP32_SETUP_GUIDE.md` for detailed hardware setup instructions.

The ESP32 uses the `x-api-key` header for authentication (separate from user JWT tokens).

## Project Structure

```
smart-drug-detector/
├── backend/
│   ├── auth.py              # JWT and password utilities
│   ├── routers/
│   │   ├── auth.py          # Authentication routes
│   │   └── __init__.py
│   ├── models.py            # SQLModel database models
│   ├── schemas.py           # Pydantic schemas
│   ├── app.py               # FastAPI application
│   ├── database.py          # Database connection
│   ├── utils.py             # Utility functions
│   ├── openai_client.py     # OpenAI integration
│   ├── seed_admin.py        # Admin user creation script
│   ├── tests/
│   │   └── test_auth.py     # Authentication tests
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── store/
│   │   │   ├── auth.js      # Auth state (Zustand)
│   │   │   └── useStore.js  # App state
│   │   ├── pages/
│   │   │   ├── Login.jsx    # Login page
│   │   │   ├── Signup.jsx   # Signup page
│   │   │   └── ...
│   │   ├── components/
│   │   │   └── ProtectedRoute.jsx  # Route guard
│   │   └── api.js           # API client (with auth)
│   └── package.json
├── esp32/
│   └── esp32_telemetry.ino
├── .env.example
└── README.md
```

## Troubleshooting

### Authentication Issues

1. **"Could not validate credentials"**:
   - Check if token exists in localStorage
   - Verify token hasn't expired
   - Check backend JWT_SECRET_KEY matches

2. **"Too many login attempts"**:
   - Wait 15 minutes or restart backend to clear rate limit

3. **Token not being sent**:
   - Check browser console for errors
   - Verify `Authorization` header in Network tab
   - Ensure `api.js` is using the authenticated axios instance

### Database Issues

1. **Admin user not created**:
   - Run `python backend/seed_admin.py` manually
   - Check database file exists: `backend/database.db`

2. **Migration errors**:
   - Delete `database.db` and rerun seed script
   - Ensure all models are imported in `app.py`

## License

This project is for educational and research purposes.

## Support

For issues and questions, please check the documentation files:
- `ESP32_SETUP_GUIDE.md` - Hardware setup
- `HOW_IT_WORKS.md` - System flow explanation
- `QUICK_START_ESP32.md` - Quick reference

---

**⚠️ Security Reminder**: Always change default passwords, use strong JWT secrets, and follow production security best practices when deploying to production environments.
