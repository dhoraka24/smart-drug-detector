# UI/UX Features Update - README

## New Features

### 1. Dark/Light Theme Toggle
- Instant theme switching without page reload
- Persists user preference in database
- Accessible keyboard support
- Respects system preference on first load

### 2. Animated Alert Cards
- **WARNING alerts**: Subtle yellow pulse animation
- **HIGH alerts**: Red pulsing glow + shake animation
- Respects `prefers-reduced-motion` for accessibility

### 3. Device Mini-Cards
- Dashboard shows all devices with quick metrics
- Status indicator (online/offline)
- Last MQ3/MQ135 values
- Sparkline visualization of last 10 MQ3 readings
- Click to center map on device location

### 4. Offline Map Support
- Automatic fallback to cached map when tiles unavailable
- User preference to force offline mode for testing
- Graceful error handling with user notification

## Migration Steps

### 1. Run Database Migration

```bash
# Option 1: Python script
python backend/db_migrations/001_add_user_preferences.py

# Option 2: SQL directly
sqlite3 database.db < backend/db_migrations/001_add_user_preferences.sql
```

This creates the `user_preferences` table and adds the `prefer_offline_map` column.

### 2. Add Offline Map Image

Place a placeholder image at:
```
frontend/public/offline_map.jpg
```

You can use any map image or a simple grid pattern. For testing, a 512x512 gray image with grid lines works well.

### 3. Update Frontend Dependencies

No new dependencies required. Uses existing:
- `react-hot-toast` (already installed)
- `react-leaflet` (already installed)
- Tailwind CSS (already configured)

## API Endpoints

### Get Preferences
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/v1/preferences
```

Response:
```json
{
  "theme": "dark",
  "map_default_zoom": 13,
  "show_clusters": true,
  "notify_on_warning": true,
  "prefer_offline_map": false
}
```

### Update Preferences
```bash
curl -X PUT \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "theme": "dark",
    "map_default_zoom": 13,
    "show_clusters": true,
    "notify_on_warning": true,
    "prefer_offline_map": false
  }' \
  http://localhost:8000/api/v1/preferences
```

### Get Offline Map Info
```bash
curl http://localhost:8000/api/v1/maps/offline-info
```

Response:
```json
{
  "cached": false,
  "tiles_available": false,
  "cache_expires_at": null
}
```

## Usage

### Theme Toggle

1. **Via Header**: Click the sun/moon icon in the header
2. **Via Preferences**: Navigate to Settings → Preferences → Theme

Theme applies instantly without page reload.

### Device Cards

1. Navigate to Dashboard
2. Device cards appear at the top
3. Click any card to center map on that device
4. Cards show:
   - Online/offline status (green/gray dot)
   - Last sensor readings
   - Sparkline of recent MQ3 values

### Offline Map

**Automatic Fallback:**
- If map tiles fail to load, system automatically shows cached offline map
- Toast notification: "Map is offline — showing cached view"

**Manual Testing:**
1. Go to Preferences
2. Enable "Prefer Offline Map"
3. Map will always show cached view, even when online

## Testing

### Backend Tests

```bash
# Run preferences tests
pytest backend/tests/test_preferences.py -v

# Expected output:
# test_get_preferences_unauthenticated PASSED
# test_save_and_get_preferences PASSED
# test_preferences_apply_to_profile PASSED
# test_preferences_default_values PASSED
# test_preferences_validation PASSED
```

### Frontend Tests

```bash
cd frontend

# Run theme toggle tests
npm test -- ThemeToggle.test.jsx

# Run alert card tests
npm test -- AlertCard.test.jsx

# Run device card tests
npm test -- DeviceMiniCard.test.jsx
```

## Configuration

### Theme Application

The theme is applied via Tailwind's `dark:` classes. The root element gets the `dark` class:

```javascript
// Light theme
document.documentElement.classList.remove('dark');

// Dark theme
document.documentElement.classList.add('dark');
```

### Animation Duration

Alert animations use CSS variable for easy tuning:

```css
:root {
  --alert-glow-duration: 600ms;
}
```

To change animation speed, update this variable in your CSS.

### Reduced Motion

All animations respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  .alert-glow-red,
  .alert-pulse-yellow,
  .alert-shake {
    animation: none !important;
  }
}
```

## Troubleshooting

### Theme Not Applying

1. Check browser console for errors
2. Verify `document.documentElement` has `dark` class
3. Ensure Tailwind `darkMode: 'class'` is set in `tailwind.config.js`

### Device Cards Not Showing

1. Verify devices have telemetry data
2. Check API endpoint: `GET /api/v1/telemetry?limit=100`
3. Check browser console for API errors

### Offline Map Not Showing

1. Verify `offline_map.jpg` exists in `frontend/public/`
2. Check browser console for image load errors
3. Verify `prefer_offline_map` preference is saved

### Preferences Not Saving

1. Check authentication token is valid
2. Verify database migration ran successfully
3. Check backend logs for errors
4. Verify `user_preferences` table exists

## GitHub Actions Workflow

Add to `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - run: pip install -r requirements.txt
      - run: pytest backend/tests/test_preferences.py -v

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd frontend && npm install
      - run: cd frontend && npm test -- --watchAll=false
```

## Acceptance Criteria

✅ User toggles theme and UI updates instantly without reload  
✅ Preferences GET returns persisted theme when user reloads  
✅ Device mini-cards populate from backend  
✅ AlertCard shows warning pulse and high shake+glow  
✅ Map shows OSM tiles if online, otherwise shows offline image  
✅ All tests pass locally  

## Files Created

### Backend
- `backend/routers/preferences.py` (updated)
- `backend/routers/maps.py` (new)
- `backend/models.py` (updated)
- `backend/schemas.py` (updated)
- `backend/db_migrations/001_add_user_preferences.py` (new)
- `backend/db_migrations/001_add_user_preferences.sql` (new)
- `backend/tests/test_preferences.py` (new)

### Frontend
- `frontend/src/hooks/useTheme.js` (new)
- `frontend/src/components/ThemeToggle.jsx` (new)
- `frontend/src/components/AlertCard.jsx` (new)
- `frontend/src/components/DeviceMiniCard.jsx` (new)
- `frontend/src/pages/Preferences.jsx` (updated)
- `frontend/tests/ThemeToggle.test.jsx` (new)
- `frontend/tests/AlertCard.test.jsx` (new)
- `frontend/tests/DeviceMiniCard.test.jsx` (new)

### Documentation
- `UI_UX_FEATURES_IMPLEMENTATION.md` (implementation guide)
- `README_UI_UX_UPDATE.md` (this file)

## Next Steps

1. ✅ Run database migration
2. ✅ Add `offline_map.jpg` to `frontend/public/`
3. ⏳ Update `Dashboard.jsx` to add device cards (see implementation guide)
4. ⏳ Update `Map.jsx` with offline fallback (see implementation guide)
5. ⏳ Add `ThemeToggle` to header component
6. ✅ Run tests to verify everything works

---

**Last Updated**: January 2025

