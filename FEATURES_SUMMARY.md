# New Features Summary

## ✅ Features Implemented

### 1. Hardware & INO Documentation Page
- **File:** `frontend/src/pages/HardwareINO.jsx`
- **Route:** `/hardware`
- **Features:**
  - Complete parts list (ESP32, MQ3, MQ135, DHT22, GPS, wires)
  - Detailed wiring table with exact pin mappings
  - Full production-ready INO code with syntax highlighting
  - Download INO file button
  - Collapsible Troubleshooting section
  - Collapsible "How to Test" section
  - Duplicate detection explanation with example JSON response

### 2. Duplicate Telemetry Management System
- **Frontend:** `frontend/src/pages/DuplicateTelemetry.jsx`
- **Backend:** `backend/routers/duplicates.py`
- **Database:** `TelemetryDuplicate` model in `backend/models.py`
- **Route:** `/duplicates`

**Features:**
- View all duplicate telemetry entries
- Filter by device_id, date range
- Server-side pagination
- Expandable rows showing duplicate payloads
- Admin-only Merge and Ignore actions
- Empty state UI
- Real-time updates

## 📁 Files Created/Modified

### Backend Files

1. **`backend/models.py`** - Added `TelemetryDuplicate` model
2. **`backend/routers/duplicates.py`** - New router with 4 endpoints
3. **`backend/app.py`** - Updated telemetry endpoint to handle duplicates
4. **`backend/tests/test_duplicates.py`** - Comprehensive tests
5. **`backend/seed_duplicates.py`** - Optional seed script for testing

### Frontend Files

1. **`frontend/src/pages/HardwareINO.jsx`** - New hardware documentation page
2. **`frontend/src/pages/DuplicateTelemetry.jsx`** - New duplicate management page
3. **`frontend/src/App.jsx`** - Updated routes
4. **`frontend/src/api.js`** - Added duplicate API functions

### Documentation

1. **`API_ENDPOINTS.md`** - Complete API reference

## 🔌 API Endpoints

### Duplicate Management

- `GET /api/v1/duplicates` - List duplicates (with filters & pagination)
- `GET /api/v1/duplicates/{id}` - Get duplicate detail
- `POST /api/v1/duplicates/merge` - Merge duplicates (Admin only)
- `POST /api/v1/duplicates/ignore` - Ignore duplicates (Admin only)

### Updated

- `POST /api/v1/telemetry` - Now stores duplicates and returns duplicate response

## 🗄️ Database Schema

### New Table: `telemetry_duplicates`

```sql
- id (PK)
- original_telemetry_id (FK -> telemetry.id)
- device_id (indexed)
- timestamp (indexed)
- payload_json (TEXT)
- received_at (indexed)
- is_merged (bool, indexed)
- is_ignored (bool, indexed)
```

## 🧪 Testing

Run tests:
```bash
cd backend
pytest tests/test_duplicates.py -v
```

## 🚀 Usage

### View Duplicates
1. Navigate to `/duplicates` in frontend
2. Use filters to find specific duplicates
3. Click "Show All" to expand and see duplicate payloads

### Merge Duplicates (Admin)
1. Find duplicate group
2. Click "Merge" button
3. Confirms and merges duplicates into original

### Ignore Duplicates (Admin)
1. Select duplicates
2. Click "Ignore" button
3. Marks duplicates as ignored (hidden from list)

### Seed Test Data
```bash
cd backend
python seed_duplicates.py
```

## 📝 Notes

- Duplicates are detected based on `(device_id, timestamp)` uniqueness
- Original telemetry is preserved, duplicates are stored separately
- Duplicates do NOT trigger alerts or OpenAI calls
- Merge/Ignore actions are admin-only for security
- All endpoints require JWT authentication (except telemetry POST which uses device API key)

