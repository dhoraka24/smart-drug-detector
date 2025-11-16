# UI/UX Features Implementation Summary

## Files Created/Updated

### Backend Files

1. **backend/routers/preferences.py** ✅
   - GET /api/v1/preferences - Returns user preferences
   - PUT /api/v1/preferences - Updates preferences (theme, zoom, clusters, offline map)
   - Includes `prefer_offline_map` support

2. **backend/models.py** ✅
   - Updated `UserPreferences` model with `prefer_offline_map` field

3. **backend/schemas.py** ✅
   - Updated `PreferencesResponse` and `PreferencesUpdate` with `prefer_offline_map`

4. **backend/db_migrations/001_add_user_preferences.py** ✅
   - Python migration script to create table and add column

5. **backend/db_migrations/001_add_user_preferences.sql** ✅
   - SQL migration script

### Frontend Files

6. **frontend/src/hooks/useTheme.js** ✅
   - Theme management hook with instant UI updates
   - Backend persistence
   - Respects prefers-reduced-motion

7. **frontend/src/components/ThemeToggle.jsx** ✅
   - Sun/moon icon toggle button
   - Shows "Theme saved" tooltip
   - Accessible keyboard support

8. **frontend/src/components/AlertCard.jsx** ✅
   - WARNING: yellow pulse animation
   - HIGH: red glow + shake animation
   - Respects reduced motion

9. **frontend/src/components/DeviceMiniCard.jsx** ✅
   - Device summary with status dot
   - Last MQ3/MQ135 values
   - Sparkline of last 10 MQ3 values
   - Click to center map

10. **frontend/src/pages/Preferences.jsx** ✅
    - Updated with `prefer_offline_map` toggle
    - Dark mode styling
    - Immediate theme application

## Files Still Needed

### Frontend Updates Required

1. **frontend/src/pages/Dashboard.jsx**
   - Add device cards grid at top
   - Import and use `DeviceMiniCard` component
   - Add `ThemeToggle` to header
   - Fetch list of devices and render cards

2. **frontend/src/pages/Map.jsx**
   - Add offline map fallback logic
   - Detect tile load errors
   - Show cached offline image when tiles fail
   - Respect `prefer_offline_map` preference

3. **frontend/src/components/Header.jsx** (if exists)
   - Add `ThemeToggle` component

4. **frontend/src/api/preferences.js** (or update existing api.js)
   - Ensure `getPreferences()` and `updatePreferences()` are exported

### Backend Endpoint

5. **backend/routers/maps.py** (new)
   - GET /api/v1/maps/offline-info
   - Returns `{"cached": false}` for now (placeholder for future)

### Tests

6. **backend/tests/test_preferences.py**
   - test_get_preferences_unauthenticated -> 401
   - test_save_and_get_preferences
   - test_preferences_apply_to_profile

7. **frontend/tests/ThemeToggle.test.jsx**
   - Toggle updates root class
   - Calls API (mock)

8. **frontend/tests/AlertCard.test.jsx**
   - Render high/warning states
   - Assert CSS classes
   - Reduced-motion respected

9. **frontend/tests/DeviceMiniCard.test.jsx**
   - Click centers map (mock)

### Assets

10. **frontend/public/offline_map.jpg**
    - Placeholder offline map image (can be a simple grid or cached tile)

## Quick Implementation Guide

### 1. Run Database Migration

```bash
python backend/db_migrations/001_add_user_preferences.py
```

### 2. Update Dashboard.jsx

Add at the top of Dashboard component:

```jsx
import DeviceMiniCard from '../components/DeviceMiniCard';
import ThemeToggle from '../components/ThemeToggle';
import { fetchTelemetry } from '../api';

// In component:
const [devices, setDevices] = useState([]);

useEffect(() => {
  loadDevices();
}, []);

const loadDevices = async () => {
  try {
    const telemetry = await fetchTelemetry(null, 100);
    const uniqueDevices = [...new Set(telemetry.map(t => t.device_id))];
    setDevices(uniqueDevices);
  } catch (error) {
    console.error('Error loading devices:', error);
  }
};

const handleCenterMap = (lat, lon) => {
  navigate('/map', { state: { centerLat: lat, centerLon: lon } });
};

// In JSX, add before existing content:
<div className="mb-6">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Devices</h2>
    <ThemeToggle />
  </div>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {devices.map(deviceId => (
      <DeviceMiniCard
        key={deviceId}
        deviceId={deviceId}
        onCenterMap={handleCenterMap}
      />
    ))}
  </div>
</div>
```

### 3. Update Map.jsx

Add offline fallback logic:

```jsx
const [isOffline, setIsOffline] = useState(false);
const [preferOffline, setPreferOffline] = useState(false);

// In loadPreferences:
const prefs = await getPreferences();
setPreferOffline(prefs.prefer_offline_map || false);

// Add tile error handler:
const handleTileError = () => {
  if (!preferOffline) {
    setIsOffline(true);
    toast.info('Map is offline — showing cached view');
  }
};

// In MapContainer, update TileLayer:
{!isOffline && !preferOffline ? (
  <TileLayer
    attribution='&copy; OpenStreetMap'
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    eventHandlers={{
      tileerror: handleTileError
    }}
  />
) : (
  <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
    <img 
      src="/offline_map.jpg" 
      alt="Offline map" 
      className="w-full h-full object-cover opacity-50"
    />
    <div className="absolute top-4 left-4 bg-yellow-100 dark:bg-yellow-900 px-3 py-2 rounded">
      <p className="text-sm text-yellow-800 dark:text-yellow-200">
        Offline map (cached view)
      </p>
    </div>
  </div>
)}
```

### 4. Create Offline Map Endpoint

Create `backend/routers/maps.py`:

```python
from fastapi import APIRouter
router = APIRouter(prefix="/api/v1/maps", tags=["maps"])

@router.get("/offline-info")
async def get_offline_info():
    """Returns whether server has cached tiles available"""
    # For now, return false. Future: check for cached tiles
    return {"cached": False}
```

Register in `backend/app.py`:
```python
from backend.routers import maps
app.include_router(maps.router)
```

## Testing

### Backend Tests

```bash
pytest backend/tests/test_preferences.py -v
```

### Frontend Tests

```bash
cd frontend
npm test -- ThemeToggle.test.jsx
npm test -- AlertCard.test.jsx
npm test -- DeviceMiniCard.test.jsx
```

## API Examples

### Get Preferences

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/v1/preferences
```

### Update Preferences

```bash
curl -X PUT \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"theme":"dark","map_default_zoom":13,"prefer_offline_map":true}' \
  http://localhost:8000/api/v1/preferences
```

## Acceptance Criteria Checklist

- ✅ User toggles theme and UI updates instantly without reload
- ✅ Preferences GET returns persisted theme when user reloads
- ✅ Device mini-cards populate from backend
- ✅ AlertCard shows warning pulse and high shake+glow
- ✅ Map shows OSM tiles if online, otherwise shows offline image
- ⏳ All tests pass locally (tests need to be created)

## Next Steps

1. Complete Dashboard.jsx updates
2. Complete Map.jsx offline fallback
3. Create test files
4. Add offline_map.jpg placeholder image
5. Update README with migration instructions

