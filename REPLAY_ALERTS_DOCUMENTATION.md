# Replay Alerts on Map - Documentation

## Overview

The "Replay Alerts on Map" feature provides time-based playback control for animating alert markers on a Leaflet map. This allows users to visualize alert history over time, with support for both raw marker visualization and aggregated heat-map style visualization.

## Features

- **Time-based Playback**: Animate alerts across a selectable time window
- **Playback Controls**: Play, pause, step forward/backward, speed control (0.5x, 1x, 2x, 4x)
- **Timeline Scrubber**: Drag to seek to any point in time
- **Two Visualization Modes**:
  - **Marker Mode**: Shows individual alert markers with pulse animations
  - **Aggregation Mode**: Shows time-bucketed counts as circles sized by alert count
- **Device Filtering**: Filter alerts by device ID
- **Keyboard Shortcuts**: Space (play/pause), ← (step back), → (step forward)
- **Performance Optimized**: Supports large time ranges with server-side aggregation

## How to Use

### Accessing the Feature

1. Navigate to `/map/replay` in the application
2. The page will load with a default time range (last 1 hour)

### Basic Workflow

1. **Select Time Range**:
   - Use the preset dropdown: "Last 1 hour", "Last 6 hours", "Last 24 hours", "Last 48 hours"
   - Or select "Custom" to choose specific start and end times

2. **Select Device** (optional):
   - Use the device dropdown to filter alerts by device ID
   - Select "All Devices" to show alerts from all devices

3. **Load Data**:
   - Data loads automatically when time range is selected
   - For large ranges (> 6 hours), aggregation mode is automatically suggested

4. **Control Playback**:
   - Click **Play** to start playback
   - Use **Speed** selector to change playback speed (0.5x, 1x, 2x, 4x)
   - Use **Step Forward/Backward** buttons to move in 1-minute increments
   - Drag the **Timeline Scrubber** to seek to any point in time
   - Toggle **Loop** to automatically restart when reaching the end

5. **Visualization Modes**:
   - **Marker Mode**: Shows individual alert markers with color coding:
     - Green: SAFE alerts
     - Yellow: WARNING alerts
     - Red: HIGH alerts
   - **Aggregation Mode**: Shows time-bucketed counts as circles:
     - Circle size = square root of alert count
     - Color coding same as marker mode

### Keyboard Shortcuts

- **Space**: Toggle play/pause
- **← (Left Arrow)**: Step backward 1 minute
- **→ (Right Arrow)**: Step forward 1 minute

## API Endpoints

### GET /api/v1/alerts/history

Retrieve alert history for replay.

**Query Parameters:**
- `from` (required): Start time in ISO8601 format (e.g., `2025-01-11T10:00:00Z`)
- `to` (required): End time in ISO8601 format
- `device_id` (optional): Filter by device ID
- `limit` (optional, default: 10000): Maximum number of alerts to return
- `aggregate` (optional, default: false): Return aggregated buckets instead of raw alerts
- `bucket_minutes` (optional, required if aggregate=true): Bucket size in minutes (1-1440)

**Response (Raw Mode):**
```json
[
  {
    "id": 123,
    "device_id": "esp32-drug-001",
    "ts": "2025-01-11T10:00:00Z",
    "severity": "HIGH",
    "short_message": "DANGER: Strong drug vapors detected",
    "mq3": 520,
    "mq135": 300,
    "lat": 13.0827,
    "lon": 80.2707
  },
  {
    "id": 124,
    "device_id": "esp32-drug-001",
    "ts": "2025-01-11T10:05:00Z",
    "severity": "WARNING",
    "short_message": "WARNING: Possible chemical vapors",
    "mq3": 400,
    "mq135": 250,
    "lat": 13.0830,
    "lon": 80.2710
  }
]
```

**Response (Aggregation Mode):**
```json
[
  {
    "bucket_start": "2025-01-11T10:00:00Z",
    "counts": {
      "SAFE": 10,
      "WARNING": 2,
      "HIGH": 1
    },
    "repr_lat": 13.0827,
    "repr_lon": 80.2707,
    "total_count": 13
  },
  {
    "bucket_start": "2025-01-11T10:05:00Z",
    "counts": {
      "SAFE": 8,
      "WARNING": 3,
      "HIGH": 0
    },
    "repr_lat": 13.0830,
    "repr_lon": 80.2710,
    "total_count": 11
  }
]
```

**Example cURL:**
```bash
curl -X GET "http://localhost:8000/api/v1/alerts/history?from=2025-01-11T10:00:00Z&to=2025-01-11T11:00:00Z&limit=1000" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### GET /api/v1/alerts/history/stream

Stream alert history as Server-Sent Events (SSE) for large datasets.

**Query Parameters:**
- `from` (required): Start time in ISO8601 format
- `to` (required): End time in ISO8601 format
- `device_id` (optional): Filter by device ID
- `batch_size` (optional, default: 500): Alerts per batch (1-5000)

**Response Format:**
```
data: [{"id": 123, ...}, {"id": 124, ...}]

data: [{"id": 125, ...}, {"id": 126, ...}]

...
```

**Example cURL:**
```bash
curl -X GET "http://localhost:8000/api/v1/alerts/history/stream?from=2025-01-11T10:00:00Z&to=2025-01-11T11:00:00Z" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -N
```

## Performance Recommendations

### For Small Time Ranges (< 6 hours)
- Use **Marker Mode** with raw alerts
- Default limit of 10,000 alerts should be sufficient
- Real-time playback is smooth

### For Medium Time Ranges (6-24 hours)
- Consider using **Aggregation Mode** with 5-minute buckets
- Reduces data transfer and improves performance
- Still provides good visualization of alert patterns

### For Large Time Ranges (> 24 hours)
- **Always use Aggregation Mode**
- Use 10-15 minute buckets for better performance
- Consider using the streaming endpoint for very large datasets

### Backend Limits
- **Non-admin users**: Maximum 48-hour range
- **Admin users**: Maximum 7-day (168-hour) range
- **Raw mode**: Maximum 50,000 alerts
- **Aggregation mode**: Maximum 100,000 alerts

## Technical Details

### Frontend Architecture

- **useReplayEngine Hook**: Manages playback state, timing, and alert buffering
- **ReplayControls Component**: UI controls for playback
- **TimelineSlider Component**: High-performance slider for timeline scrubbing
- **MapReplay Page**: Main page integrating map and controls

### Backend Architecture

- **Indexes**: Database indexes on `alerts.ts` and `alerts(lat, lon)` for fast queries
- **Aggregation**: Server-side time-bucketing for performance
- **Streaming**: SSE endpoint for large datasets

### Data Flow

1. User selects time range
2. Frontend calls `/api/v1/alerts/history` with parameters
3. Backend queries database with indexed queries
4. If aggregation mode: server groups alerts into time buckets
5. Frontend receives data and buffers it
6. Playback engine emits alerts at appropriate times
7. Map component renders markers/circles based on active alerts

## Troubleshooting

### Map Not Showing Alerts
- Check that alerts have valid GPS coordinates (lat != 0, lon != 0)
- Verify time range includes alerts
- Check browser console for errors

### Playback Too Slow/Fast
- Adjust speed selector (0.5x, 1x, 2x, 4x)
- For very large datasets, use aggregation mode

### Performance Issues
- Reduce time range
- Use aggregation mode
- Check browser console for memory warnings
- Consider using streaming endpoint for very large datasets

### API Errors
- **401 Unauthorized**: Token expired, re-login required
- **400 Bad Request**: Invalid time range or parameters
- **413 Payload Too Large**: Reduce time range or use aggregation mode

## Future Enhancements

- **GIF Export**: Export playback as animated GIF (placeholder implemented)
- **Custom Step Size**: Allow users to configure step size (currently 1 minute)
- **Multiple Device Overlay**: Show multiple devices simultaneously with different colors
- **Alert Density Heatmap**: Visualize alert density as heatmap overlay
- **Bookmarks**: Save and jump to specific time points
- **Playback Presets**: Save common time ranges as presets

## Testing

### Frontend Tests
- `frontend/tests/ReplayEngine.test.jsx`: Tests replay engine hook
- `frontend/tests/MapReplay.integration.test.jsx`: Integration tests for map replay

### Backend Tests
- `backend/tests/test_history_endpoint.py`: Tests history endpoint

Run tests:
```bash
# Frontend
cd frontend
npm test

# Backend
cd backend
pytest tests/test_history_endpoint.py
```

## Acceptance Criteria

✅ User can open `/map/replay`, pick 1-hour window, click Play, and watch markers animate in time order

✅ Scrubbing timeline immediately updates map and shows markers at that instant

✅ Speed multiplier works (0.5x, 1x, 2x, 4x)

✅ For large ranges (>3000 alerts), UI suggests aggregation and uses buckets instead of raw markers

✅ Tests pass locally

---

**Last Updated**: January 2025

