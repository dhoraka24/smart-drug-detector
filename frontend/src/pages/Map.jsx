import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
// Note: For clustering, install: npm install react-leaflet-cluster
// Alternative: use leaflet.markercluster directly with useEffect
import { fetchAlerts, exportAlertsCSV, getPreferences } from '../api';
import { toast } from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import useStore from '../store/useStore';

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Component to center map programmatically
function CenterMap({ center, zoom = 15 }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom, { animate: true, duration: 1 });
    }
  }, [center, zoom, map]);
  return null;
}

const Map = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { alerts: storeAlerts, loadAlerts, isLoading } = useStore();
  const [alerts, setAlerts] = useState([]);
  // Default: AMET University, Chennai
  const AMET_UNIVERSITY_LAT = 12.9012;
  const AMET_UNIVERSITY_LON = 80.2209;
  const [center, setCenter] = useState([AMET_UNIVERSITY_LAT, AMET_UNIVERSITY_LON]);
  const [loading, setLoading] = useState(false);
  const [showClusters, setShowClusters] = useState(true);
  const [defaultZoom, setDefaultZoom] = useState(13);
  const [newAlertIds, setNewAlertIds] = useState(new Set());
  const [isOffline, setIsOffline] = useState(false);
  const [preferOffline, setPreferOffline] = useState(false);
  const mapRef = useRef(null);

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await getPreferences();
      setShowClusters(prefs.show_clusters);
      setDefaultZoom(prefs.map_default_zoom);
      setPreferOffline(prefs.prefer_offline_map || false);
      // If prefer offline, set offline mode immediately
      if (prefs.prefer_offline_map) {
        setIsOffline(true);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const handleTileError = () => {
    if (!preferOffline) {
      setIsOffline(true);
      toast.info('Map is offline — showing cached view');
    }
  };

  useEffect(() => {
    // Check if we need to center on a specific location
    if (location.state?.centerLat && location.state?.centerLon) {
      // Use provided coordinates (could be actual GPS or AMET University fallback)
      setCenter([location.state.centerLat, location.state.centerLon]);
    } else {
      // Default to AMET University if no coordinates provided
      setCenter([AMET_UNIVERSITY_LAT, AMET_UNIVERSITY_LON]);
    }
    loadData();
  }, [location]);

  // Update alerts when store changes (for real-time updates from WebSocket)
  useEffect(() => {
    // When new alerts arrive via WebSocket, reload map data and mark for animation
    if (storeAlerts.length > 0) {
      const latestAlert = storeAlerts[0];
      // Check if latest alert has GPS coordinates
      if (latestAlert.lat && latestAlert.lon && latestAlert.lat !== 0 && latestAlert.lon !== 0) {
        // Mark as new for pulse animation
        setNewAlertIds(prev => new Set([...prev, latestAlert.id]));
        // Remove pulse after 6 seconds
        setTimeout(() => {
          setNewAlertIds(prev => {
            const next = new Set(prev);
            next.delete(latestAlert.id);
            return next;
          });
        }, 6000);
        // Reload map data to show new alert
        loadData(false); // Silent reload, no toast
      }
    }
  }, [storeAlerts.length]); // Trigger when alert count changes

  const loadData = async (showToast = false) => {
    try {
      setLoading(true);
      // Fetch all alerts (not just with GPS)
      const loadedAlerts = await fetchAlerts(500, false);
      // Filter alerts with GPS coordinates OR use AMET University as fallback
      const alertsWithCoords = loadedAlerts.map(alert => {
        // If alert has no GPS, use AMET University coordinates
        if (!alert.lat || !alert.lon || alert.lat === 0 || alert.lon === 0) {
          return {
            ...alert,
            lat: AMET_UNIVERSITY_LAT,
            lon: AMET_UNIVERSITY_LON,
            isFallback: true
          };
        }
        return alert;
      });
      setAlerts(alertsWithCoords);
      if (showToast) {
        toast.success(`Loaded ${alertsWithCoords.length} alerts`);
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
      if (showToast) {
        toast.error('Failed to load alerts');
      }
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleExportCSV = async () => {
    try {
      setLoading(true);
      await exportAlertsCSV(true, 1000);
      toast.success('CSV export started');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV');
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/login');
      } else if (error.response?.status === 403) {
        toast.error('You need admin rights to export data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewAlert = (alertId) => {
    navigate('/alerts', { state: { alertId } });
  };

  const getMarkerColor = (severity) => {
    switch (severity) {
      case 'SAFE':
        return '#10B981';
      case 'WARNING':
        return '#F59E0B';
      case 'HIGH':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const createCustomIcon = (severity, isNew = false) => {
    const color = getMarkerColor(severity);
    const pulseClass = isNew ? 'animate-pulse' : '';
    return L.divIcon({
      className: 'custom-marker',
      html: `<div class="${pulseClass}" style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4);"></div>`,
      iconSize: [24, 24],
    });
  };

  if ((isLoading || loading) && alerts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Alert Map</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Real-time GPS tracking of alert locations</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {alerts.length} alerts with location data
          </div>
          <button
            onClick={() => loadData(true)}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Loading...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </>
            )}
          </button>
          <button
            onClick={handleExportCSV}
            disabled={loading || alerts.length === 0}
            className="px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Map Container - Always show map for showcase */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="h-[600px] w-full rounded-lg overflow-hidden relative z-0">
            {isOffline || preferOffline ? (
              // Offline map view
              <div className="relative w-full h-full bg-gray-100 dark:bg-gray-900">
                <img 
                  src="/offline_map.jpg" 
                  alt="Offline map" 
                  className="w-full h-full object-cover opacity-50"
                  onError={(e) => {
                    // If image fails to load, show placeholder
                    e.target.style.display = 'none';
                    const placeholder = e.target.nextElementSibling;
                    if (placeholder) placeholder.style.display = 'flex';
                  }}
                />
                <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 flex items-center justify-center" style={{ display: 'none' }}>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">Offline Map View</p>
                  </div>
                </div>
                <div className="absolute top-4 left-4 bg-yellow-100 dark:bg-yellow-900 px-3 py-2 rounded shadow-lg z-20">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                    Offline map (cached view)
                  </p>
                </div>
                {/* Render markers on top of offline map */}
                <MapContainer
                  center={center}
                  zoom={defaultZoom}
                  style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0, zIndex: 5 }}
                  scrollWheelZoom={true}
                  zoomControl={false}
                  attributionControl={false}
                >
                  <CenterMap center={center} zoom={defaultZoom} />
                  {alerts.map((alert) => (
                    <Marker
                      key={alert.id}
                      position={[alert.lat, alert.lon]}
                      icon={createCustomIcon(alert.severity, newAlertIds.has(alert.id))}
                    >
                      <Popup>
                        <AlertPopupContent alert={alert} onViewAlert={handleViewAlert} onCenter={() => setCenter([alert.lat, alert.lon])} />
                      </Popup>
                    </Marker>
                  ))}
                  
                  {/* AMET University marker - always show when there are no alerts OR when center is AMET */}
                  {(alerts.length === 0 || (center[0] === AMET_UNIVERSITY_LAT && center[1] === AMET_UNIVERSITY_LON)) && (
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
              </div>
            ) : (
              // Online map view
              <MapContainer
                center={center}
                zoom={defaultZoom}
                style={{ height: '100%', width: '100%', zIndex: 0 }}
                scrollWheelZoom={true}
                ref={mapRef}
              >
                <CenterMap center={center} />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  eventHandlers={{
                    tileerror: handleTileError
                  }}
                />
                {/* Render all markers (clustering can be added later with leaflet.markercluster) */}
                {alerts.map((alert) => (
                  <Marker
                    key={alert.id}
                    position={[alert.lat, alert.lon]}
                    icon={createCustomIcon(alert.severity, newAlertIds.has(alert.id))}
                  >
                    <Popup>
                      <AlertPopupContent alert={alert} onViewAlert={handleViewAlert} onCenter={() => setCenter([alert.lat, alert.lon])} />
                    </Popup>
                  </Marker>
                ))}
                
                {/* AMET University marker - show when no alerts with GPS OR when viewing from "View on Map" */}
                {alerts.length === 0 && (
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
            )}
          
            {/* Show message when no alerts with GPS */}
            {alerts.length === 0 && (
              <div className="absolute top-4 left-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-md z-30 shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">No Alert Locations</h4>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                      The map is displayed for showcase. Alert markers will appear here once devices send GPS coordinates.
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      <strong>To enable GPS:</strong> Configure the ESP32 GPS module or set coordinates in INO file for testing.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      {/* Legend */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Legend</h2>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-green-500 border-2 border-white dark:border-gray-800 shadow-md"></div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">SAFE</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">MQ3 &lt; 700</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-yellow-500 border-2 border-white dark:border-gray-800 shadow-md"></div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">WARNING</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">700 ≤ MQ3 &lt; 1000</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-red-500 border-2 border-white dark:border-gray-800 shadow-md"></div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">HIGH</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">MQ3 ≥ 1000</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Alert Popup Content Component
const AlertPopupContent = ({ alert, onViewAlert, onCenter }) => {
  return (
    <div className="p-3 min-w-[250px]">
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`px-3 py-1 text-xs font-semibold rounded ${
            alert.severity === 'HIGH'
              ? 'bg-red-500 text-white'
              : alert.severity === 'WARNING'
              ? 'bg-yellow-500 text-white'
              : 'bg-green-500 text-white'
          }`}
        >
          {alert.severity}
        </span>
        <span className="text-xs text-gray-500">
          {new Date(alert.ts || alert.created_at).toLocaleString()}
        </span>
      </div>
      <h3 className="text-sm font-bold text-gray-900 mb-2">
        {alert.short_message}
      </h3>
      {alert.explanation && (
        <p className="text-xs text-gray-600 mb-3">{alert.explanation}</p>
      )}
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-700 mb-3">
        <div>
          <span className="font-medium">Device:</span> {alert.device_id}
        </div>
        <div>
          <span className="font-medium">MQ3:</span> {alert.mq3}
        </div>
        <div>
          <span className="font-medium">MQ135:</span> {alert.mq135}
        </div>
      </div>
      <div className="text-xs text-gray-500 mb-3">
        <div><strong>Lat:</strong> {alert.lat.toFixed(6)}</div>
        <div><strong>Lon:</strong> {alert.lon.toFixed(6)}</div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onViewAlert}
          className="flex-1 px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
        >
          View Alert
        </button>
        <button
          onClick={onCenter}
          className="flex-1 px-3 py-2 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors font-medium"
        >
          Center Map
        </button>
      </div>
    </div>
  );
};

export default Map;
