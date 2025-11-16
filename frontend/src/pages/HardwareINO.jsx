import { useState, useEffect } from 'react';

// Dynamic import for syntax highlighter
let SyntaxHighlighter = null;
let vscDarkPlus = null;

// SVG Icons
const DownloadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const ChevronUpIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

const HardwareINO = () => {
  const [inoCode, setInoCode] = useState('');
  const [syntaxHighlighterReady, setSyntaxHighlighterReady] = useState(false);
  const [SyntaxHighlighterComponent, setSyntaxHighlighterComponent] = useState(null);
  const [codeStyle, setCodeStyle] = useState(null);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [showTesting, setShowTesting] = useState(false);

  // Load syntax highlighter
  useEffect(() => {
    Promise.all([
      import('react-syntax-highlighter'),
      import('react-syntax-highlighter/dist/esm/styles/prism')
    ]).then(([syntaxModule, stylesModule]) => {
      setSyntaxHighlighterComponent(() => syntaxModule.Prism);
      setCodeStyle(stylesModule.vscDarkPlus);
      setSyntaxHighlighterReady(true);
    }).catch(() => {
      setSyntaxHighlighterReady(true);
    });
  }, []);

  // Load INO file
  useEffect(() => {
    fetch('http://localhost:8000/esp32/esp32_telemetry.ino')
      .then(res => res.text())
      .then(text => setInoCode(text))
      .catch(() => {
        // Fallback code
        setInoCode(`/*
 * Smart Drug Detector - ESP32 Telemetry Sender
 * Production-ready code for ESP32 with MQ3, MQ135, DHT22, and GPS
 */
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <TinyGPS++.h>
#include <HardwareSerial.h>

// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Backend Configuration
const char* backend_url = "http://YOUR_SERVER_IP:8000/api/v1/telemetry";
const char* device_api_key = "YOUR_DEVICE_API_KEY";
const char* device_id = "esp32-drug-001";

// Sensor Pins
#define MQ3_PIN 34      // ADC1_CH6
#define MQ135_PIN 35   // ADC1_CH7
#define DHT_PIN 4
#define DHT_TYPE DHT22
#define GPS_RX_PIN 16
#define GPS_TX_PIN 17

DHT dht(DHT_PIN, DHT_TYPE);
HardwareSerial gpsSerial(2); // Use Serial2
TinyGPS++ gps;

const int num_samples = 10;
const int max_retries = 3;

void setup() {
  Serial.begin(115200);
  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  dht.begin();
  
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi connected!");
}

void loop() {
  int mq3 = readAverage(MQ3_PIN);
  int mq135 = readAverage(MQ135_PIN);
  float temp = dht.readTemperature();
  float humidity = dht.readHumidity();
  
  while (gpsSerial.available()) {
    gps.encode(gpsSerial.read());
  }
  
  String timestamp = getISO8601Timestamp();
  
  DynamicJsonDocument doc(1024);
  doc["device_id"] = device_id;
  doc["timestamp"] = timestamp;
  
  JsonObject sensors = doc.createNestedObject("sensors");
  sensors["mq3"] = mq3;
  sensors["mq135"] = mq135;
  if (!isnan(temp)) sensors["temp_c"] = temp;
  if (!isnan(humidity)) sensors["humidity_pct"] = humidity;
  
  if (gps.location.isValid()) {
    JsonObject gps_obj = doc.createNestedObject("gps");
    gps_obj["lat"] = gps.location.lat();
    gps_obj["lon"] = gps.location.lng();
    gps_obj["alt"] = gps.altitude.meters();
  }
  
  String payload;
  serializeJson(doc, payload);
  
  sendTelemetry(payload);
  delay(30000);
}

int readAverage(int pin) {
  long sum = 0;
  for (int i = 0; i < num_samples; i++) {
    sum += analogRead(pin);
    delay(10);
  }
  return sum / num_samples;
}

String getISO8601Timestamp() {
  // Implement NTP sync for accurate timestamps
  // For now, return formatted string
  return "2025-01-01T00:00:00+00:00";
}

bool sendTelemetry(String payload) {
  HTTPClient http;
  http.begin(backend_url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", device_api_key);
  
  int code = http.POST(payload);
  String response = http.getString();
  http.end();
  
  if (code == 200) {
    Serial.println("Success: " + response);
    return true;
  } else {
    Serial.println("Error " + String(code) + ": " + response);
    return false;
  }
}`);
      });
  }, []);

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([inoCode], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'esp32_telemetry.ino';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Hardware & INO (ESP32)</h1>
        <p className="text-gray-600 mt-1">
          Complete hardware setup guide and production-ready Arduino sketch for ESP32-based drug detection system
        </p>
      </div>

      {/* Description */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Purpose</h2>
        <p className="text-gray-700 leading-relaxed">
          This ESP32-based system continuously monitors air quality using MQ3 (alcohol/drug vapor) and MQ135 (general air quality) sensors.
          Optional DHT22 provides temperature/humidity data, while GPS NEO-6M enables location tracking for alerts.
          The device sends telemetry data to the backend API every 30 seconds for real-time monitoring and alert generation.
        </p>
      </div>

      {/* Parts List */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Required Components</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <span className="text-blue-600 font-semibold">1.</span>
            <div>
              <strong className="text-gray-900">ESP32 Development Board</strong>
              <p className="text-sm text-gray-600">ESP32-WROOM-32 or compatible</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-blue-600 font-semibold">2.</span>
            <div>
              <strong className="text-gray-900">MQ3 Gas Sensor</strong>
              <p className="text-sm text-gray-600">Alcohol/Drug vapor detection</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-blue-600 font-semibold">3.</span>
            <div>
              <strong className="text-gray-900">MQ135 Gas Sensor</strong>
              <p className="text-sm text-gray-600">Air quality monitoring</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-blue-600 font-semibold">4.</span>
            <div>
              <strong className="text-gray-900">DHT22 Sensor</strong>
              <p className="text-sm text-gray-600">Temperature & Humidity (optional)</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-blue-600 font-semibold">5.</span>
            <div>
              <strong className="text-gray-900">GPS NEO-6M Module</strong>
              <p className="text-sm text-gray-600">Location tracking (optional)</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-blue-600 font-semibold">6.</span>
            <div>
              <strong className="text-gray-900">Jumper Wires</strong>
              <p className="text-sm text-gray-600">Male-to-female, various lengths</p>
            </div>
          </div>
        </div>
      </div>

      {/* Wiring Table */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 overflow-x-auto">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Wiring Diagram</h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Component</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VCC</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GND</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Signal Pin</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-4 py-3 text-sm font-medium text-gray-900">MQ3</td>
              <td className="px-4 py-3 text-sm text-gray-700">5V</td>
              <td className="px-4 py-3 text-sm text-gray-700">GND</td>
              <td className="px-4 py-3 text-sm text-gray-700">GPIO34 (AOUT)</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm font-medium text-gray-900">MQ135</td>
              <td className="px-4 py-3 text-sm text-gray-700">5V</td>
              <td className="px-4 py-3 text-sm text-gray-700">GND</td>
              <td className="px-4 py-3 text-sm text-gray-700">GPIO35 (AOUT)</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm font-medium text-gray-900">DHT22</td>
              <td className="px-4 py-3 text-sm text-gray-700">3.3V</td>
              <td className="px-4 py-3 text-sm text-gray-700">GND</td>
              <td className="px-4 py-3 text-sm text-gray-700">GPIO4 (DATA)</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm font-medium text-gray-900">GPS NEO-6M</td>
              <td className="px-4 py-3 text-sm text-gray-700">5V</td>
              <td className="px-4 py-3 text-sm text-gray-700">GND</td>
              <td className="px-4 py-3 text-sm text-gray-700">GPIO16 (TX→RX2), GPIO17 (RX→TX2)</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* INO Code */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">ESP32 Telemetry Code (esp32_telemetry.ino)</h2>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <DownloadIcon />
            Download INO
          </button>
        </div>
        <div className="overflow-x-auto bg-gray-900">
          {syntaxHighlighterReady && SyntaxHighlighterComponent && codeStyle ? (
            <SyntaxHighlighterComponent
              language="cpp"
              style={codeStyle}
              customStyle={{ margin: 0, borderRadius: 0, padding: '1rem', fontSize: '0.875rem' }}
            >
              {inoCode || '// Loading INO file...'}
            </SyntaxHighlighterComponent>
          ) : (
            <pre className="p-4 text-sm text-gray-100 font-mono overflow-x-auto whitespace-pre-wrap">
              <code>{inoCode || '// Loading INO file...'}</code>
            </pre>
          )}
        </div>
      </div>

      {/* Duplicate Detection Note */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Duplicate Detection</h3>
        <p className="text-sm text-blue-800 mb-2">
          The backend uses <code className="bg-blue-100 px-1 rounded">(device_id, timestamp)</code> uniqueness to detect duplicates.
          If you send the same telemetry twice with identical device_id and timestamp, the backend will respond with:
        </p>
        <pre className="bg-blue-100 p-2 rounded text-xs overflow-x-auto">
{`{
  "status": "duplicate",
  "message": "Telemetry with same device_id and timestamp already exists.",
  "original_id": 123,
  "duplicate_id": 987
}`}
        </pre>
        <p className="text-sm text-blue-800 mt-2">
          Duplicates are stored separately and can be reviewed in the Duplicate Telemetry page.
        </p>
      </div>

      {/* Troubleshooting */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <button
          onClick={() => setShowTroubleshooting(!showTroubleshooting)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-xl font-semibold text-gray-900">Troubleshooting</h2>
          {showTroubleshooting ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </button>
        {showTroubleshooting && (
          <div className="px-6 pb-4 space-y-3 text-sm text-gray-700">
            <div>
              <strong className="text-gray-900">WiFi Connection Issues:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1 ml-2">
                <li>Check SSID and password are correct</li>
                <li>Ensure ESP32 is within WiFi range</li>
                <li>Check Serial Monitor for connection status</li>
              </ul>
            </div>
            <div>
              <strong className="text-gray-900">Sensor Reading Errors:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1 ml-2">
                <li>Verify wiring connections match the table above</li>
                <li>Check power supply (5V for MQ sensors, 3.3V for DHT22)</li>
                <li>MQ sensors need warm-up time (30-60 seconds)</li>
              </ul>
            </div>
            <div>
              <strong className="text-gray-900">HTTP POST Failures:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1 ml-2">
                <li>Verify backend_url is correct (use server IP, not localhost)</li>
                <li>Check device_api_key matches backend .env file</li>
                <li>Ensure backend server is running on port 8000</li>
                <li>Check firewall allows connections</li>
              </ul>
            </div>
            <div>
              <strong className="text-gray-900">GPS Not Working:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1 ml-2">
                <li>GPS needs clear view of sky for initial fix</li>
                <li>First fix can take 5-15 minutes</li>
                <li>Check Serial Monitor for GPS data</li>
                <li>Verify baud rate is 9600</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* How to Test */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <button
          onClick={() => setShowTesting(!showTesting)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-xl font-semibold text-gray-900">How to Test</h2>
          {showTesting ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </button>
        {showTesting && (
          <div className="px-6 pb-4 space-y-4 text-sm text-gray-700">
            <div>
              <strong className="text-gray-900">1. Serial Monitor:</strong>
              <p className="mt-1 ml-2">
                Open Arduino IDE Serial Monitor (115200 baud) to see:
              </p>
              <ul className="list-disc list-inside mt-1 space-y-1 ml-4">
                <li>WiFi connection status</li>
                <li>Sensor readings (MQ3, MQ135, temp, humidity)</li>
                <li>GPS coordinates (if available)</li>
                <li>HTTP POST requests and responses</li>
              </ul>
            </div>
            <div>
              <strong className="text-gray-900">2. Check HTTP Response:</strong>
              <p className="mt-1 ml-2">
                Look for responses in Serial Monitor:
              </p>
              <ul className="list-disc list-inside mt-1 space-y-1 ml-4">
                <li><code className="bg-gray-100 px-1 rounded">200 OK</code> - Success</li>
                <li><code className="bg-gray-100 px-1 rounded">{"{status: 'duplicate'}"}</code> - Duplicate detected</li>
                <li><code className="bg-gray-100 px-1 rounded">401</code> - Invalid API key</li>
                <li><code className="bg-gray-100 px-1 rounded">500</code> - Server error</li>
              </ul>
            </div>
            <div>
              <strong className="text-gray-900">3. Verify in Dashboard:</strong>
              <p className="mt-1 ml-2">
                Check the web dashboard to confirm:
              </p>
              <ul className="list-disc list-inside mt-1 space-y-1 ml-4">
                <li>Telemetry appears in Dashboard</li>
                <li>Alerts are generated for high MQ3 readings</li>
                <li>Map shows GPS locations (if GPS enabled)</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HardwareINO;

