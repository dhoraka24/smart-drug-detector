# SmartDrug Detection System - Enterprise Edition

## 🎯 Project Overview

A fully professional, enterprise-grade IoT drug detection system with ESP32 sensors, FastAPI backend, and React dashboard. Built with production-quality code, comprehensive error handling, and professional UI/UX matching Cisco Meraki and Bosch IoT standards.

## ✅ Completed Implementation

### Frontend (React + Vite + TailwindCSS)

#### **Pages Built:**

1. **Dashboard** ✅
   - 4 status cards (MQ3, MQ135, Environment, Uptime)
   - Live Chart.js charts (MQ3, MQ135, Temp, Humidity)
   - Latest reading widget
   - Real-time status indicator
   - Professional card layout

2. **Alerts Page** ✅
   - Full table with all alert data
   - Filters: Severity, Device ID, Time Range
   - Pagination (10 per page)
   - "View on Map" button
   - Debounced alert indicators

3. **Map Page** ✅
   - Leaflet.js interactive map
   - Color-coded markers (Green/Yellow/Red)
   - Detailed popups with sensor data
   - "Center Map" functionality
   - Legend with threshold explanations

4. **Device Settings** ✅
   - Device ID selector
   - Threshold sliders (MQ3 Safe/Warning/Danger)
   - Debounce minutes slider
   - Feature toggles (Drug Detection, Gas Detection, DHT22, GPS)
   - Professional toggle switches

5. **Hardware & INO Upload** ✅
   - Wiring diagrams for all sensors
   - Connection instructions
   - INO code viewer with syntax highlighting
   - Copy to clipboard
   - Download INO file button
   - Backend endpoint to serve INO file

6. **Duplicate Telemetry** ✅
   - Groups duplicates by (device_id, timestamp)
   - Visual highlighting (green for original, red for duplicates)
   - Full sensor data display
   - "DUPLICATE DETECTED" badges

#### **Components:**

- **Sidebar**: Professional gradient design with icons
- **Header**: Search, notifications, profile dropdown, connection status
- **AlertModal**: Detailed alert view

#### **State Management:**

- **Zustand Store**: Centralized state for alerts, telemetry, real-time status
- WebSocket connection status
- Real-time data updates

### Backend (FastAPI)

#### **Endpoints:**

- ✅ `POST /api/v1/telemetry` - Accept ESP32 telemetry with API key auth
- ✅ `GET /api/v1/alerts?limit=50` - Get latest alerts
- ✅ `GET /api/v1/telemetry?device_id=...&limit=...` - Get telemetry
- ✅ `POST /api/v1/device-settings/{device_id}` - Update settings
- ✅ `GET /api/v1/device-settings/{device_id}` - Get settings
- ✅ `GET /api/v1/about` - System information
- ✅ `WebSocket /ws/alerts` - Real-time alert streaming
- ✅ `GET /esp32/esp32_telemetry.ino` - Serve INO file

#### **Features:**

- ✅ MQ3-only severity logic (SAFE < 350, WARNING 350-500, HIGH ≥ 500)
- ✅ Duplicate detection (device_id + timestamp)
- ✅ Debounce logic (configurable minutes)
- ✅ OpenAI integration with exact prompt template
- ✅ Fallback alert on OpenAI failure
- ✅ Database constraints for duplicate prevention
- ✅ Error handling and validation

### ESP32 Sketch

- ✅ Complete Arduino code
- ✅ MQ3, MQ135, DHT22, GPS support
- ✅ WiFi connection
- ✅ HTTP POST with retry logic
- ✅ ISO8601 timestamp generation
- ✅ Wiring comments

## 🎨 Design Features

- **Professional UI**: Cisco Meraki / Bosch IoT style
- **Gradient Sidebar**: Dark theme with gradient highlights
- **High-Contrast Cards**: White cards with soft shadows
- **Enterprise Typography**: Clean, readable fonts
- **Smooth Animations**: Transitions and hover effects
- **Responsive Design**: Works on all screen sizes

## 📦 Dependencies

### Frontend
```json
{
  "react": "^18.2.0",
  "react-router-dom": "^6.20.0",
  "zustand": "^4.4.7",
  "chart.js": "^4.4.1",
  "react-chartjs-2": "^5.2.0",
  "leaflet": "^1.9.4",
  "react-leaflet": "^4.2.1",
  "react-syntax-highlighter": "^15.5.0",
  "axios": "^1.6.2"
}
```

### Backend
```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlmodel>=0.0.16
openai>=1.12.0
python-multipart==0.0.6
websockets==12.0
python-dotenv>=1.0.0
```

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
# Create .env file with:
# OPENAI_API_KEY=...
# OPENAI_MODEL=gpt-3.5-turbo
# DEVICE_API_KEY=...
# DEBOUNCE_MINUTES=5
uvicorn app:app --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. ESP32 Setup
1. Open `esp32/esp32_telemetry.ino` in Arduino IDE
2. Install ESP32 board support
3. Install libraries: ArduinoJson, DHT, TinyGPS++
4. Update WiFi credentials and backend URL
5. Upload to ESP32

## 📊 System Flow

```
ESP32 → Read Sensors → POST /api/v1/telemetry
                          ↓
                    Check Duplicate
                          ↓
                    Determine Severity (MQ3-only)
                          ↓
                    If WARNING/HIGH → Call OpenAI
                          ↓
                    Check Debounce
                          ↓
                    Create Alert → WebSocket Broadcast
                          ↓
                    Frontend Updates in Real-time
```

## 🎯 Key Features

1. **Real-time Detection**: WebSocket streaming
2. **AI Analysis**: OpenAI-powered alert explanations
3. **GPS Tracking**: Map visualization
4. **Duplicate Prevention**: Multi-level protection
5. **Professional UI**: Enterprise-grade design
6. **Live Charts**: Chart.js integration
7. **Advanced Filtering**: Multi-criteria alerts
8. **State Management**: Zustand store

## 📁 Project Structure

```
smart-drug-detector/
├── backend/
│   ├── app.py              # FastAPI application
│   ├── models.py           # Database models
│   ├── schemas.py          # Pydantic schemas
│   ├── utils.py            # Business logic
│   ├── openai_client.py    # OpenAI integration
│   ├── database.py         # DB setup
│   ├── tests/              # Test files
│   └── static/             # Static files
├── frontend/
│   ├── src/
│   │   ├── pages/          # All 6 pages
│   │   ├── components/     # Reusable components
│   │   ├── store/          # Zustand store
│   │   └── api.js          # API client
│   └── package.json
├── esp32/
│   └── esp32_telemetry.ino # Arduino sketch
└── README.md
```

## ✨ Production Ready

- ✅ Error handling
- ✅ Input validation
- ✅ Security (API keys)
- ✅ Database constraints
- ✅ Professional UI/UX
- ✅ Real-time updates
- ✅ Comprehensive documentation

**The system is fully functional and ready for deployment!** 🚀

