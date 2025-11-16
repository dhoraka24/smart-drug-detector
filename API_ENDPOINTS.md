# API Endpoints Reference

## Authentication Endpoints

- `POST /api/v1/auth/signup` - Register new user (public)
- `POST /api/v1/auth/login-json` - Login with JSON (public)
- `GET /api/v1/auth/me` - Get current user info (JWT required)
- `POST /api/v1/auth/logout` - Logout (JWT required)

## Telemetry Endpoints

- `POST /api/v1/telemetry` - Submit telemetry (Device API Key required)
  - **Response (duplicate):**
    ```json
    {
      "status": "duplicate",
      "message": "Telemetry with same device_id and timestamp already exists.",
      "original_id": 123,
      "duplicate_id": 987
    }
    ```
- `GET /api/v1/telemetry` - Get telemetry data (JWT required)

## Alert Endpoints

- `GET /api/v1/alerts` - Get alerts (JWT required)

## Device Settings Endpoints

- `GET /api/v1/device-settings/{device_id}` - Get settings (JWT required)
- `POST /api/v1/device-settings/{device_id}` - Update settings (Admin JWT required)

## Duplicate Telemetry Endpoints

- `GET /api/v1/duplicates` - Get duplicate telemetry entries (JWT required)
  - **Query params:**
    - `device_id` (optional) - Filter by device ID
    - `from_ts` (optional) - Start timestamp (ISO8601)
    - `to_ts` (optional) - End timestamp (ISO8601)
    - `limit` (default: 50) - Results per page
    - `offset` (default: 0) - Pagination offset
  - **Response:**
    ```json
    {
      "total": 100,
      "limit": 50,
      "offset": 0,
      "duplicates": [
        {
          "original_telemetry": {
            "id": 123,
            "device_id": "esp32-001",
            "ts": "2025-01-01T10:00:00",
            "mq3": 300,
            "mq135": 200,
            "temp_c": 25.0,
            "humidity_pct": 50.0,
            "received_at": "2025-01-01T10:00:00"
          },
          "device_id": "esp32-001",
          "timestamp": "2025-01-01T10:00:00",
          "duplicate_count": 3,
          "sample_duplicates": [
            {
              "id": 987,
              "payload_json": {...},
              "received_at": "2025-01-01T10:00:30"
            }
          ]
        }
      ]
    }
    ```

- `GET /api/v1/duplicates/{duplicate_id}` - Get duplicate detail (JWT required)

- `POST /api/v1/duplicates/merge` - Merge duplicates (Admin JWT required)
  - **Body:**
    ```json
    {
      "original_id": 123,
      "duplicate_ids": [987, 988, 989]
    }
    ```
  - **Response:**
    ```json
    {
      "message": "Successfully merged 3 duplicate(s)",
      "original_id": 123,
      "merged_count": 3
    }
    ```

- `POST /api/v1/duplicates/ignore` - Ignore duplicates (Admin JWT required)
  - **Body:**
    ```json
    {
      "ids": [987, 988, 989]
    }
    ```
  - **Response:**
    ```json
    {
      "message": "Successfully ignored 3 duplicate(s)",
      "ignored_count": 3
    }
    ```

## Public Endpoints

- `GET /` - API info
- `GET /api/v1/about` - System information
- `GET /esp32/esp32_telemetry.ino` - ESP32 INO file

## WebSocket

- `ws://localhost:8000/ws/alerts` - Real-time alert updates

