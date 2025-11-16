import { useState, useEffect } from 'react';
import { fetchAbout } from '../api';

const About = () => {
  const [aboutData, setAboutData] = useState(null);

  useEffect(() => {
    loadAbout();
  }, []);

  const loadAbout = async () => {
    try {
      const data = await fetchAbout();
      setAboutData(data);
    } catch (error) {
      console.error('Error loading about data:', error);
    }
  };

  const handleDownloadSpec = () => {
    if (aboutData?.spec_pdf_url) {
      window.open(`http://localhost:8000${aboutData.spec_pdf_url}`, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {aboutData?.system_name || 'Smart Drug Detector'}
        </h1>
        
        <div className="prose max-w-none">
          <p className="text-gray-700 mb-4 text-lg">
            {aboutData?.description || 'A real-time drug vapor detection system using MQ3 and MQ135 sensors with AI-powered analysis.'}
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Features</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Real-time sensor data monitoring (MQ3, MQ135, Temperature, Humidity)</li>
            <li>AI-powered alert generation and analysis using OpenAI</li>
            <li>Interactive map visualization of alert locations with GPS support</li>
            <li>Configurable threshold settings for each device</li>
            <li>WebSocket-based real-time updates</li>
            <li>Duplicate detection and debounce logic for alert management</li>
            <li>Responsive dashboard with modern UI/UX</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">Technology Stack</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Frontend</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• React 18</li>
                <li>• Vite</li>
                <li>• TailwindCSS</li>
                <li>• React Router</li>
                <li>• Leaflet.js (Maps)</li>
              </ul>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Backend</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• FastAPI</li>
                <li>• SQLModel</li>
                <li>• SQLite</li>
                <li>• WebSocket</li>
                <li>• OpenAI API</li>
              </ul>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Hardware</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• ESP32 Microcontroller</li>
                <li>• MQ3 Gas Sensor</li>
                <li>• MQ135 Air Quality Sensor</li>
                <li>• DHT22 (Optional)</li>
                <li>• NEO-6M GPS (Optional)</li>
              </ul>
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">System Architecture</h2>
          <p className="text-gray-700 mb-4">
            The system consists of ESP32 IoT devices that collect sensor data and send it to
            the FastAPI backend via REST API with API key authentication. The backend processes the data,
            determines alert severity based on MQ3 thresholds (SAFE &lt; 350, WARNING 350-500, HIGH ≥ 500),
            and generates AI-powered summaries using OpenAI when alerts are triggered. The React frontend
            displays real-time updates via WebSocket connections and provides an intuitive interface for
            monitoring and configuration.
          </p>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">
                <strong>Version:</strong> {aboutData?.version || '1.0.0'}<br />
                <strong>Last Updated:</strong> 2025<br />
                <strong>License:</strong> MIT
              </p>
            </div>
            <button
              onClick={handleDownloadSpec}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Download Specification PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
