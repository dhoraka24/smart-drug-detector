import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Play, Pause, SkipBack, SkipForward, Download, RefreshCw, MapPin } from 'lucide-react';
import { fetchAlerts, exportAlertsCSV, getPreferences, fetchTelemetry } from '../api';
import { toast } from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import useStore from '../store/useStore';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons by severity
const createCustomIcon = (severity) => {
  const colors = {
    SAFE: '#10B981',
    WARNING: '#F59E0B',
    HIGH: '#EF4444',
  };
  
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 24px;
      height: 24px;
      background-color: ${colors[severity] || colors.SAFE};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

function CenterMap({ center, zoom = 15 }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom, { animate: true, duration: 1 });
    }
  }, [center, zoom, map]);
  return null;
}

const MapEnhanced = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { alerts: storeAlerts, loadAlerts } = useStore();
  const [alerts, setAlerts] = useState([]);
  // Default: AMET University, Chennai
  const AMET_UNIVERSITY_LAT = 12.9012;
  const AMET_UNIVERSITY_LON = 80.2209;
  const [center, setCenter] = useState([AMET_UNIVERSITY_LAT, AMET_UNIVERSITY_LON]);
  const [loading, setLoading] = useState(false);
  const [defaultZoom, setDefaultZoom] = useState(15);
  const [isOffline, setIsOffline] = useState(false);
  const [preferOffline, setPreferOffline] = useState(false);
  
  // Replay mode state
  const [replayMode, setReplayMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const [replaySpeed, setReplaySpeed] = useState(1000); // ms per frame
  const replayIntervalRef = useRef(null);
  const [deviceTrails, setDeviceTrails] = useState({}); // { deviceId: [[lat, lon], ...] }

  useEffect(() => {
    loadPreferences();
    loadData();
    loadDeviceTrails();
  }, []);

  useEffect(() => {
    if (location.state?.centerLat && location.state?.centerLon) {
      // Use provided coordinates (could be actual GPS or AMET University fallback)
      setCenter([location.state.centerLat, location.state.centerLon]);
    } else {
      // Default to AMET University if no coordinates provided
      setCenter([AMET_UNIVERSITY_LAT, AMET_UNIVERSITY_LON]);
    }
  }, [location]);

  const loadPreferences = async () => {
    try {
      const prefs = await getPreferences();
      setDefaultZoom(prefs.map_default_zoom);
      setPreferOffline(prefs.prefer_offline_map || false);
      if (prefs.prefer_offline_map) {
        setIsOffline(true);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const loadData = async (showToast = false) => {
    setLoading(true);
    try {
      const data = await fetchAlerts(100, true); // lat_only = true
      const alertsWithGPS = data.filter(a => a.lat && a.lon && a.lat !== 0 && a.lon !== 0);
      setAlerts(alertsWithGPS);
      
      // Auto-center map on alerts if they exist
      if (alertsWithGPS.length > 0) {
        // Calculate center of all alerts
        const avgLat = alertsWithGPS.reduce((sum, a) => sum + a.lat, 0) / alertsWithGPS.length;
        const avgLon = alertsWithGPS.reduce((sum, a) => sum + a.lon, 0) / alertsWithGPS.length;
        setCenter([avgLat, avgLon]);
      }
      
      if (showToast) {
        toast.success(`Loaded ${alertsWithGPS.length} alerts with GPS`);
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
      if (showToast) {
        toast.error('Failed to load alerts');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadDeviceTrails = async () => {
    try {
      const telemetry = await fetchTelemetry(null, 100);
      const trails = {};
      
      telemetry.forEach(t => {
        if (t.lat && t.lon && t.lat !== 0 && t.lon !== 0) {
          if (!trails[t.device_id]) {
            trails[t.device_id] = [];
          }
          trails[t.device_id].push([t.lat, t.lon]);
        }
      });

      // Keep only last 10 points per device
      Object.keys(trails).forEach(deviceId => {
        trails[deviceId] = trails[deviceId].slice(0, 10);
      });

      setDeviceTrails(trails);
    } catch (error) {
      console.error('Error loading trails:', error);
    }
  };

  const handleTileError = () => {
    if (!preferOffline) {
      setIsOffline(true);
      toast.info('Map is offline — showing cached view');
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportAlertsCSV(true, 1000);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `alerts_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Alerts exported successfully');
    } catch (error) {
      toast.error('Failed to export alerts');
    }
  };

  // Replay controls
  const sortedAlerts = [...alerts].sort((a, b) => 
    new Date(a.ts || a.created_at) - new Date(b.ts || b.created_at)
  );
  const replayAlerts = replayMode ? sortedAlerts.slice(0, replayIndex + 1) : alerts;

  const startReplay = () => {
    if (sortedAlerts.length === 0) {
      toast.error('No alerts to replay');
      return;
    }
    if (replayIndex >= sortedAlerts.length - 1) {
      setReplayIndex(0);
    }
    setIsPlaying(true);
    replayIntervalRef.current = setInterval(() => {
      setReplayIndex(prev => {
        if (prev >= sortedAlerts.length - 1) {
          setIsPlaying(false);
          if (replayIntervalRef.current) {
            clearInterval(replayIntervalRef.current);
          }
          toast.success('Replay completed');
          return prev;
        }
        return prev + 1;
      });
    }, replaySpeed);
  };

  const stopReplay = () => {
    setIsPlaying(false);
    if (replayIntervalRef.current) {
      clearInterval(replayIntervalRef.current);
    }
  };

  const resetReplay = () => {
    stopReplay();
    setReplayIndex(0);
  };

  const nextFrame = () => {
    if (replayIndex < sortedAlerts.length - 1) {
      setReplayIndex(prev => prev + 1);
    }
  };

  const prevFrame = () => {
    if (replayIndex > 0) {
      setReplayIndex(prev => prev - 1);
    }
  };

  useEffect(() => {
    return () => {
      if (replayIntervalRef.current) {
        clearInterval(replayIntervalRef.current);
      }
    };
  }, []);

  // Auto-center map when replay index changes
  useEffect(() => {
    if (replayMode && sortedAlerts.length > 0 && replayIndex >= 0) {
      const currentAlert = sortedAlerts[replayIndex];
      if (currentAlert && currentAlert.lat && currentAlert.lon) {
        setCenter([currentAlert.lat, currentAlert.lon]);
      }
    }
  }, [replayIndex, replayMode, sortedAlerts]);

  return (
    <div className="w-full min-h-screen bg-gray-100 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Map Container - Medium Size */}
        <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden" style={{ height: '600px' }}>
          <MapContainer
            center={center}
            zoom={defaultZoom}
            style={{ height: '100%', width: '100%', zIndex: 0 }}
            zoomControl={true}
            scrollWheelZoom={true}
          >
        <CenterMap center={center} zoom={defaultZoom} />
        
        {!isOffline && !preferOffline ? (
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            errorTileUrl=""
            maxZoom={19}
            minZoom={1}
          />
        ) : (
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 flex items-center justify-center z-[1000] pointer-events-none">
            <div className="text-center p-8 bg-white/90 dark:bg-slate-800/90 rounded-2xl shadow-xl">
              <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Offline Map View
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Cached view - Map tiles unavailable
              </p>
            </div>
          </div>
        )}

        {/* Device Trails */}
        {Object.entries(deviceTrails).map(([deviceId, trail]) => (
          trail.length > 1 && (
            <Polyline
              key={deviceId}
              positions={trail}
              pathOptions={{
                color: '#3b82f6',
                weight: 2,
                opacity: 0.6,
              }}
            />
          )
        ))}

        {/* Alert Markers */}
        {replayAlerts.map((alert) => {
          if (!alert.lat || !alert.lon || alert.lat === 0 || alert.lon === 0) return null;
          
          return (
            <Marker
              key={alert.id}
              position={[alert.lat, alert.lon]}
              icon={createCustomIcon(alert.severity)}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold text-sm mb-1">{alert.severity} Alert</h3>
                  <p className="text-xs text-gray-600 mb-2">{alert.short_message}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(alert.ts || alert.created_at).toLocaleString()}
                  </p>
                  <button
                    onClick={() => navigate('/alerts', { state: { alertId: alert.id } })}
                    className="mt-2 text-xs text-blue-600 hover:underline"
                  >
                    View Details →
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
        
        {/* AMET University marker when center is AMET (fallback location) */}
        {center[0] === AMET_UNIVERSITY_LAT && center[1] === AMET_UNIVERSITY_LON && (
          <Marker
            position={[AMET_UNIVERSITY_LAT, AMET_UNIVERSITY_LON]}
            icon={L.divIcon({
              className: 'amet-university-marker',
              html: `<div style="
                background-color: #3B82F6;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                border: 4px solid white;
                box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
              ">📍</div>`,
              iconSize: [32, 32],
              iconAnchor: [16, 16],
            })}
          >
            <Popup>
              <div className="p-3 min-w-[200px]">
                <h3 className="font-bold text-lg mb-2 text-blue-600">📍 AMET University</h3>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Location:</strong> AMET University, Chennai
                </p>
                <p className="text-xs text-gray-500 mb-2">
                  <strong>Coordinates:</strong> {AMET_UNIVERSITY_LAT}, {AMET_UNIVERSITY_LON}
                </p>
                <p className="text-xs text-gray-500 italic">
                  Fallback location shown when GPS coordinates are not available.
                </p>
              </div>
            </Popup>
          </Marker>
        )}
          </MapContainer>

          {/* Info Banner */}
          {alerts.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-4 left-4 z-[1000] bg-blue-500/90 backdrop-blur-lg text-white px-6 py-3 rounded-xl shadow-lg"
            >
              <p className="text-sm font-medium">
                No alerts with GPS data. Map shown for demonstration.
              </p>
            </motion.div>
          )}
        </div>

        {/* Controls Panel - Below Map */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-4 shadow-lg">
        {/* Replay Controls */}
        {replayMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-2 bg-gray-50 dark:bg-slate-700 rounded-lg p-2 border border-gray-200 dark:border-slate-600"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Replay Mode
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-600 px-2 py-1 rounded">
                  {replayIndex + 1} / {sortedAlerts.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={resetReplay}
                  className="p-2 rounded-lg bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors"
                  title="Reset to start"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={prevFrame}
                  disabled={replayIndex === 0}
                  className="p-2 rounded-lg bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Previous frame"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={isPlaying ? stopReplay : startReplay}
                  disabled={sortedAlerts.length === 0}
                  className="p-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <button
                  onClick={nextFrame}
                  disabled={replayIndex >= sortedAlerts.length - 1}
                  className="p-2 rounded-lg bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Next frame"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs text-gray-600 dark:text-gray-400">Speed:</label>
              <input
                type="range"
                min="100"
                max="3000"
                step="100"
                value={replaySpeed}
                onChange={(e) => setReplaySpeed(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[60px]">
                {replaySpeed}ms
              </span>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-row gap-3 items-center justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (!replayMode && sortedAlerts.length === 0) {
                toast.error('No alerts to replay');
                return;
              }
              setReplayMode(!replayMode);
              if (!replayMode) {
                setReplayIndex(0);
              } else {
                stopReplay();
              }
            }}
            className={`px-6 py-2.5 rounded-xl font-semibold shadow-lg transition-all ${
              replayMode
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600 border border-gray-300 dark:border-slate-600'
            }`}
          >
            {replayMode ? 'Exit Replay' : 'Replay Mode'}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => loadData(true)}
            disabled={loading}
            className="px-6 py-2.5 bg-white dark:bg-slate-700 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all text-gray-700 dark:text-gray-300 flex items-center gap-2 border border-gray-300 dark:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExport}
            className="px-6 py-2.5 bg-white dark:bg-slate-700 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all text-gray-700 dark:text-gray-300 flex items-center gap-2 border border-gray-300 dark:border-slate-600"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </motion.button>
        </div>
      </div>
      </div>
    </div>
  );
};

export default MapEnhanced;

