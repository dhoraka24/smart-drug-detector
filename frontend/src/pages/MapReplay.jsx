/**
 * MapReplay Page Component
 * 
 * Time-based playback control for animating alert markers on a Leaflet map
 * 
 * Features:
 * - ReplayControls integration
 * - Animated marker appearance with pulse/scale effects
 * - Two visualization modes: Marker Mode and Aggregation Mode
 * - Timeline heat-layer visualization
 * - Export playback as GIF (placeholder)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import { useReplayEngine } from '../hooks/useReplayEngine';
import { ReplayControls } from '../components/ReplayControls';
import { toast } from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { fetchAlerts } from '../api';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Component to center map programmatically
function CenterMap({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 13);
    }
  }, [center, zoom, map]);
  return null;
}

const MapReplay = () => {
  const navigate = useNavigate();
  const [visualizationMode, setVisualizationMode] = useState('marker'); // 'marker' or 'aggregation'
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [mapCenter, setMapCenter] = useState([13.0827, 80.2707]); // Default: Chennai
  const [mapZoom, setMapZoom] = useState(13);
  const [markerRefs, setMarkerRefs] = useState(new Map());
  const mapRef = useRef(null);
  const markersLayerRef = useRef(null);

  // Initialize replay engine
  const replayEngine = useReplayEngine({
    onAlertsUpdate: (alerts) => {
      // Update map when alerts change
      updateMapMarkers(alerts);
    },
    onPlaybackComplete: () => {
      toast.success('Playback completed');
    },
  });

  // Load available devices
  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const alerts = await fetchAlerts(1000, false);
      const uniqueDevices = [...new Set(alerts.map(a => a.device_id))];
      setDevices(uniqueDevices);
    } catch (error) {
      console.error('Error loading devices:', error);
    }
  };

  // Handle time range change
  const handleTimeRangeChange = useCallback(async (start, end) => {
    try {
      // Check if range is large (> 3000 alerts expected)
      const hours = (end - start) / (1000 * 60 * 60);
      const useAggregation = hours > 6; // Use aggregation for > 6 hours

      if (useAggregation && visualizationMode === 'marker') {
        toast.info('Large time range detected. Switching to aggregation mode for better performance.');
        setVisualizationMode('aggregation');
      }

      await replayEngine.loadData(
        start,
        end,
        selectedDevice,
        useAggregation || visualizationMode === 'aggregation'
      );

      // Center map on first alert if available
      if (replayEngine.allAlerts.length > 0) {
        const firstAlert = replayEngine.allAlerts[0];
        if (firstAlert.lat && firstAlert.lon) {
          setMapCenter([firstAlert.lat, firstAlert.lon]);
        }
      }
    } catch (error) {
      console.error('Error loading time range:', error);
      toast.error('Failed to load alert history');
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  }, [selectedDevice, visualizationMode, replayEngine, navigate]);

  // Update map markers based on active alerts
  const updateMapMarkers = useCallback((alerts) => {
    if (!mapRef.current) return;

    // Remove old markers
    markerRefs.forEach((marker) => {
      if (marker && marker.remove) {
        marker.remove();
      }
    });

    const newMarkerRefs = new Map();

    // Add new markers with animation
    alerts.forEach((alert) => {
      if (alert.lat && alert.lon && alert.lat !== 0 && alert.lon !== 0) {
        const marker = L.marker([alert.lat, alert.lon], {
          icon: createCustomIcon(alert.severity, true), // New alerts get pulse animation
        });

        marker.bindPopup(createPopupContent(alert));
        marker.addTo(mapRef.current);

        // Remove pulse animation after 6 seconds
        setTimeout(() => {
          if (marker && marker.setIcon) {
            marker.setIcon(createCustomIcon(alert.severity, false));
          }
        }, 6000);

        newMarkerRefs.set(alert.id, marker);
      }
    });

    setMarkerRefs(newMarkerRefs);

    // Center map on latest alert if available
    if (alerts.length > 0) {
      const latest = alerts[alerts.length - 1];
      if (latest.lat && latest.lon) {
        setMapCenter([latest.lat, latest.lon]);
      }
    }
  }, [markerRefs]);

  // Create custom icon for markers
  const createCustomIcon = (severity, isNew = false) => {
    const colors = {
      SAFE: '#10B981',
      WARNING: '#F59E0B',
      HIGH: '#EF4444',
    };
    const color = colors[severity] || '#6B7280';

    const iconHtml = `
      <div style="
        background-color: ${color};
        width: ${isNew ? '28px' : '24px'};
        height: ${isNew ? '28px' : '24px'};
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        ${isNew ? 'animation: pulse 1s ease-in-out infinite;' : ''}
        transition: all 0.3s ease;
      "></div>
    `;

    return L.divIcon({
      className: 'custom-marker',
      html: iconHtml,
      iconSize: [isNew ? 28 : 24, isNew ? 28 : 24],
    });
  };

  // Create popup content for markers
  const createPopupContent = (alert) => {
    const time = new Date(alert.ts).toLocaleString();
    return `
      <div style="min-width: 200px;">
        <h3 style="font-weight: bold; margin-bottom: 8px;">${alert.severity} Alert</h3>
        <p style="margin: 4px 0;"><strong>Device:</strong> ${alert.device_id}</p>
        <p style="margin: 4px 0;"><strong>Time:</strong> ${time}</p>
        <p style="margin: 4px 0;"><strong>MQ3:</strong> ${alert.mq3}</p>
        <p style="margin: 4px 0;"><strong>MQ135:</strong> ${alert.mq135}</p>
        <p style="margin: 4px 0;"><strong>Message:</strong> ${alert.short_message}</p>
        <button 
          onclick="window.viewAlert(${alert.id})" 
          style="
            margin-top: 8px;
            padding: 6px 12px;
            background-color: #3B82F6;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          "
        >
          View Alert
        </button>
      </div>
    `;
  };

  // Expose viewAlert function globally for popup buttons
  useEffect(() => {
    window.viewAlert = (alertId) => {
      navigate('/alerts', { state: { alertId } });
    };
    return () => {
      delete window.viewAlert;
    };
  }, [navigate]);

  // Handle seek - center map on alerts at that time
  const handleSeek = useCallback((time) => {
    replayEngine.seek(time);
    
    // Find alerts at this time and center map
    const alertsAtTime = replayEngine.allAlerts.filter(alert => {
      const alertTime = new Date(alert.ts).getTime();
      const seekTime = time.getTime();
      return Math.abs(alertTime - seekTime) < 60000; // Within 1 minute
    });

    if (alertsAtTime.length > 0) {
      // Center on first alert or centroid
      const avgLat = alertsAtTime.reduce((sum, a) => sum + a.lat, 0) / alertsAtTime.length;
      const avgLon = alertsAtTime.reduce((sum, a) => sum + a.lon, 0) / alertsAtTime.length;
      setMapCenter([avgLat, avgLon]);
    }
  }, [replayEngine]);

  // Initialize with default time range (last 1 hour)
  useEffect(() => {
    const end = new Date();
    const start = new Date(end.getTime() - 60 * 60 * 1000); // 1 hour ago
    handleTimeRangeChange(start, end);
  }, []); // Only on mount

  // Render aggregation circles
  const renderAggregationCircles = () => {
    if (visualizationMode !== 'aggregation' || !replayEngine.activeAlerts.length) {
      return null;
    }

    // Group alerts by location and time bucket
    const buckets = new Map();
    replayEngine.activeAlerts.forEach(alert => {
      if (alert.isAggregated && alert.bucketCount) {
        const key = `${alert.lat.toFixed(4)}_${alert.lon.toFixed(4)}`;
        if (!buckets.has(key)) {
          buckets.set(key, {
            lat: alert.lat,
            lon: alert.lon,
            count: alert.bucketCount,
            severity: alert.severity,
          });
        }
      }
    });

    return Array.from(buckets.values()).map((bucket, index) => {
      const radius = Math.sqrt(bucket.count) * 100; // Scale radius by sqrt of count
      const color = bucket.severity === 'HIGH' ? '#EF4444' : 
                    bucket.severity === 'WARNING' ? '#F59E0B' : '#10B981';
      
      return (
        <Circle
          key={`bucket_${index}`}
          center={[bucket.lat, bucket.lon]}
          radius={radius}
          pathOptions={{
            color: color,
            fillColor: color,
            fillOpacity: 0.3,
            weight: 2,
          }}
        />
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Replay Alerts on Map</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Time-based playback of alert history with GPS visualization
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Visualization mode toggle */}
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setVisualizationMode('marker')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                visualizationMode === 'marker'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Marker Mode
            </button>
            <button
              onClick={() => setVisualizationMode('aggregation')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                visualizationMode === 'aggregation'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Aggregation Mode
            </button>
          </div>
          
          {/* Export GIF placeholder */}
          <button
            onClick={() => toast.info('GIF export feature coming soon')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Export GIF</span>
          </button>
        </div>
      </div>

      {/* Replay Controls */}
      <ReplayControls
        isPlaying={replayEngine.isPlaying}
        onPlay={() => replayEngine.setIsPlaying(true)}
        onPause={() => replayEngine.setIsPlaying(false)}
        onStepBack={() => replayEngine.stepBackward()}
        onStepForward={() => replayEngine.stepForward()}
        onSpeedChange={replayEngine.setPlaybackSpeed}
        onSeek={handleSeek}
        onTimeRangeChange={handleTimeRangeChange}
        onLoopToggle={replayEngine.toggleLoop}
        onDeviceSelect={setSelectedDevice}
        currentTime={replayEngine.currentTime}
        startTime={replayEngine.startTime}
        endTime={replayEngine.endTime}
        speed={replayEngine.speed}
        isLooping={replayEngine.isLooping}
        progress={replayEngine.progress}
        devices={devices}
        selectedDevice={selectedDevice}
      />

      {/* Map Container */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
        {replayEngine.isLoading ? (
          <div className="h-[600px] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading alert history...</p>
            </div>
          </div>
        ) : replayEngine.allAlerts.length === 0 ? (
          <div className="h-[600px] flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No Alert History</h3>
              <p className="text-gray-600 dark:text-gray-400">Select a time range to load alert history</p>
            </div>
          </div>
        ) : (
          <div className="h-[600px] w-full relative z-0">
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: '100%', width: '100%', zIndex: 0 }}
              scrollWheelZoom={true}
              ref={mapRef}
            >
              <CenterMap center={mapCenter} zoom={mapZoom} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Render markers in marker mode */}
              {visualizationMode === 'marker' && replayEngine.activeAlerts.map((alert) => {
                if (!alert.lat || !alert.lon || alert.lat === 0 || alert.lon === 0) return null;
                
                return (
                  <Marker
                    key={alert.id}
                    position={[alert.lat, alert.lon]}
                    icon={createCustomIcon(alert.severity, true)}
                  >
                    <Popup>
                      <div className="min-w-[200px]">
                        <h3 className="font-bold mb-2">{alert.severity} Alert</h3>
                        <p className="text-sm"><strong>Device:</strong> {alert.device_id}</p>
                        <p className="text-sm"><strong>Time:</strong> {new Date(alert.ts).toLocaleString()}</p>
                        <p className="text-sm"><strong>MQ3:</strong> {alert.mq3}</p>
                        <p className="text-sm"><strong>MQ135:</strong> {alert.mq135}</p>
                        <p className="text-sm"><strong>Message:</strong> {alert.short_message}</p>
                        <button
                          onClick={() => navigate('/alerts', { state: { alertId: alert.id } })}
                          className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          View Alert
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
              
              {/* Render aggregation circles in aggregation mode */}
              {visualizationMode === 'aggregation' && renderAggregationCircles()}
            </MapContainer>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-card p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Legend</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-700 dark:text-gray-300">SAFE</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
            <span className="text-sm text-gray-700 dark:text-gray-300">WARNING</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span className="text-sm text-gray-700 dark:text-gray-300">HIGH</span>
          </div>
          {visualizationMode === 'aggregation' && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500 opacity-30"></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">Circle size = alert count</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapReplay;

