# Setup Instructions for New Features

## 📦 Required NPM Packages

Install the following packages in the frontend:

```bash
cd frontend
npm install react-hot-toast react-leaflet-cluster
```

## 🗄️ Database Migration

Run the migration script to create the `user_preferences` table and add the telemetry index:

```bash
cd backend
python db_migrations/add_user_preferences.py
```

## ✅ Features Implemented

### Backend:
- ✅ Profile endpoints (GET/PUT /api/v1/profile)
- ✅ Preferences endpoints (GET/PUT /api/v1/preferences)
- ✅ Health endpoint (GET /api/v1/health/connected)
- ✅ Alerts with GPS filtering (GET /api/v1/alerts?lat_only=true)
- ✅ CSV export endpoint (GET /api/v1/alerts/export) - Admin only
- ✅ WebSocket ping every 15 seconds
- ✅ Structured logging for GPS alerts
- ✅ Updated alert broadcast format

### Frontend:
- ✅ Profile Settings page with validation
- ✅ Preferences page with instant theme switching
- ✅ Connected Indicator in header
- ✅ Map with clustering, export, refresh
- ✅ Toast notifications (react-hot-toast)
- ✅ Error handling with auto-redirect on 401
- ✅ Loading states and skeleton loaders

## 🔧 Configuration Notes

1. **react-leaflet-cluster** - Used for marker clustering on map
2. **react-hot-toast** - Toast notification system
3. **UserPreferences table** - Stores per-user preferences (theme, map settings, notifications)
4. **Telemetry index** - Added index on (lat, lon) for faster geospatial queries

## 🧪 Testing

Run backend tests:
```bash
cd backend
pytest tests/test_profile.py
pytest tests/test_alerts_map.py
pytest tests/test_ws_ping.py
```

## 🚀 Next Steps

1. Install npm packages: `npm install react-hot-toast react-leaflet-cluster`
2. Run migration: `python backend/db_migrations/add_user_preferences.py`
3. Restart backend server
4. Restart frontend dev server
5. Test all features

