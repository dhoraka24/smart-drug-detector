import { useState, useEffect } from 'react';

// Dynamic import for syntax highlighter (works with Vite)
let SyntaxHighlighter = null;
let vscDarkPlus = null;

// Try to load syntax highlighter
import('react-syntax-highlighter').then(module => {
  SyntaxHighlighter = module.Prism;
  return import('react-syntax-highlighter/dist/esm/styles/prism');
}).then(styles => {
  vscDarkPlus = styles.vscDarkPlus;
}).catch(() => {
  console.warn('Syntax highlighter not available, using plain text');
});

// SVG Icons
const DownloadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const CopyIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const Hardware = () => {
  const [copied, setCopied] = useState(false);
  const [inoCode, setInoCode] = useState('');
  const [syntaxHighlighterReady, setSyntaxHighlighterReady] = useState(false);
  const [SyntaxHighlighterComponent, setSyntaxHighlighterComponent] = useState(null);
  const [codeStyle, setCodeStyle] = useState(null);

  // Load syntax highlighter dynamically
  useEffect(() => {
    Promise.all([
      import('react-syntax-highlighter'),
      import('react-syntax-highlighter/dist/esm/styles/prism')
    ]).then(([syntaxModule, stylesModule]) => {
      setSyntaxHighlighterComponent(() => syntaxModule.Prism);
      setCodeStyle(stylesModule.vscDarkPlus);
      setSyntaxHighlighterReady(true);
    }).catch(() => {
      console.warn('Syntax highlighter not available, using plain text');
      setSyntaxHighlighterReady(true);
    });
  }, []);

  // Load INO file content from backend
  useEffect(() => {
    fetch('http://localhost:8000/esp32/esp32_telemetry.ino')
      .then(res => res.text())
      .then(text => setInoCode(text))
      .catch(() => {
        // Fallback: show placeholder code
        setInoCode(`/*
 * Smart Drug Detector - ESP32 Telemetry Sender
 * 
 * See the actual file at: esp32/esp32_telemetry.ino
 * 
 * To use this code:
 * 1. Install ESP32 board support in Arduino IDE
 * 2. Install libraries: ArduinoJson, DHT sensor library, TinyGPS++
 * 3. Update WiFi credentials (ssid, password)
 * 4. Update backend_url with your server IP
 * 5. Update device_api_key from your .env file
 * 6. Upload to ESP32
 */`);
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

  const handleCopy = () => {
    navigator.clipboard.writeText(inoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Hardware & INO Upload</h1>
        <p className="text-gray-600 mt-1">ESP32 wiring diagram and Arduino code</p>
      </div>

      {/* Wiring Diagram */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Wiring Diagram</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* MQ3 Sensor */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">MQ3 Sensor (Alcohol/Drug Detection)</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded"></span>
                <span><strong>Vcc</strong> → ESP32 <strong>5V</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-black rounded"></span>
                <span><strong>GND</strong> → ESP32 <strong>GND</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-blue-500 rounded"></span>
                <span><strong>Aout</strong> → ESP32 <strong>GPIO34</strong> (ADC1_CH6)</span>
              </div>
            </div>
          </div>

          {/* MQ135 Sensor */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">MQ135 Sensor (Air Quality)</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded"></span>
                <span><strong>Vcc</strong> → ESP32 <strong>5V</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-black rounded"></span>
                <span><strong>GND</strong> → ESP32 <strong>GND</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded"></span>
                <span><strong>Aout</strong> → ESP32 <strong>GPIO35</strong> (ADC1_CH7)</span>
              </div>
            </div>
          </div>

          {/* DHT22 Sensor */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">DHT22 Sensor (Temperature/Humidity)</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded"></span>
                <span><strong>Vcc</strong> → ESP32 <strong>3.3V</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-black rounded"></span>
                <span><strong>GND</strong> → ESP32 <strong>GND</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-purple-500 rounded"></span>
                <span><strong>Data</strong> → ESP32 <strong>GPIO4</strong></span>
              </div>
            </div>
          </div>

          {/* GPS Module */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">GPS NEO-6M Module</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded"></span>
                <span><strong>Vcc</strong> → ESP32 <strong>5V</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-black rounded"></span>
                <span><strong>GND</strong> → ESP32 <strong>GND</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-yellow-500 rounded"></span>
                <span><strong>TX</strong> → ESP32 <strong>GPIO16</strong> (RX2)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-orange-500 rounded"></span>
                <span><strong>RX</strong> → ESP32 <strong>GPIO17</strong> (TX2)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Instructions */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Connection Instructions</h2>
        <div className="space-y-4">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
            <h3 className="font-semibold text-blue-900 mb-2">WiFi Configuration</h3>
            <p className="text-sm text-blue-800">
              Update the <code className="bg-blue-100 px-2 py-1 rounded">ssid</code> and <code className="bg-blue-100 px-2 py-1 rounded">password</code> variables in the INO file with your WiFi credentials.
            </p>
          </div>
          <div className="bg-green-50 border-l-4 border-green-500 p-4">
            <h3 className="font-semibold text-green-900 mb-2">Backend URL</h3>
            <p className="text-sm text-green-800">
              Set <code className="bg-green-100 px-2 py-1 rounded">backend_url</code> to your server's IP address (e.g., <code className="bg-green-100 px-2 py-1 rounded">http://192.168.1.100:8000/api/v1/telemetry</code>).
            </p>
          </div>
          <div className="bg-purple-50 border-l-4 border-purple-500 p-4">
            <h3 className="font-semibold text-purple-900 mb-2">API Key</h3>
            <p className="text-sm text-purple-800">
              Set <code className="bg-purple-100 px-2 py-1 rounded">device_api_key</code> to match your backend's <code className="bg-purple-100 px-2 py-1 rounded">DEVICE_API_KEY</code> from the .env file.
            </p>
          </div>
        </div>
      </div>

      {/* INO Code Viewer */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">ESP32 Telemetry Code (esp32_telemetry.ino)</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <DownloadIcon />
              Download INO
            </button>
          </div>
        </div>
        <div className="overflow-x-auto bg-gray-900">
          {syntaxHighlighterReady && SyntaxHighlighterComponent && codeStyle ? (
            <SyntaxHighlighterComponent
              language="cpp"
              style={codeStyle}
              customStyle={{ margin: 0, borderRadius: 0, padding: '1rem' }}
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
    </div>
  );
};

export default Hardware;
