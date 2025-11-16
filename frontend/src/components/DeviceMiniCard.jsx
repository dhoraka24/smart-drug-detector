/**
 * DeviceMiniCard Component
 * 
 * Shows device summary with quick metrics and sparkline
 * 
 * Features:
 * - Device ID, status dot (online/offline)
 * - Last MQ3, MQ135 values
 * - Last seen timestamp
 * - Sparkline of last 10 MQ3 values
 * - Click to center map on device
 * 
 * Usage:
 * ```jsx
 * <DeviceMiniCard 
 *   deviceId="esp32-drug-001"
 *   onCenterMap={(lat, lon) => navigate('/map', { state: { centerLat: lat, centerLon: lon } })}
 * />
 * ```
 * 
 * Props:
 * - deviceId: string - Device identifier
 * - onCenterMap?: function(lat, lon) - Callback when card is clicked
 * - className?: string - Additional CSS classes
 * 
 * Tests:
 * - Run: npm test -- DeviceMiniCard.test.jsx
 */

import { useState, useEffect } from 'react';
import { fetchTelemetry } from '../api';

/**
 * Simple sparkline component
 */
const Sparkline = ({ data, width = 100, height = 30, color = '#3B82F6' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-xs text-gray-400">No data</div>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1; // Avoid division by zero

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const DeviceMiniCard = ({ deviceId, onCenterMap, className = '' }) => {
  const [deviceData, setDeviceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sparklineData, setSparklineData] = useState([]);

  useEffect(() => {
    loadDeviceData();
  }, [deviceId]);

  const loadDeviceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch last 10 telemetry readings
      const telemetry = await fetchTelemetry(deviceId, 10);
      
      if (telemetry && telemetry.length > 0) {
        const latest = telemetry[0];
        setDeviceData({
          deviceId,
          lastMq3: latest.mq3,
          lastMq135: latest.mq135,
          lastSeen: latest.ts || latest.received_at,
          lat: latest.lat,
          lon: latest.lon,
        });

        // Extract MQ3 values for sparkline (reverse to show oldest to newest)
        const mq3Values = telemetry
          .slice()
          .reverse()
          .map(t => t.mq3)
          .filter(v => v != null);
        setSparklineData(mq3Values);
      } else {
        setDeviceData({
          deviceId,
          lastMq3: null,
          lastMq135: null,
          lastSeen: null,
          lat: null,
          lon: null,
        });
      }
    } catch (err) {
      console.error('Error loading device data:', err);
      setError(err.message);
      setDeviceData({
        deviceId,
        lastMq3: null,
        lastMq135: null,
        lastSeen: null,
        lat: null,
        lon: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    if (deviceData && deviceData.lat && deviceData.lon && onCenterMap) {
      onCenterMap(deviceData.lat, deviceData.lon);
    }
  };

  const isOnline = () => {
    if (!deviceData || !deviceData.lastSeen) return false;
    const lastSeen = new Date(deviceData.lastSeen);
    const now = new Date();
    const minutesAgo = (now - lastSeen) / (1000 * 60);
    return minutesAgo < 5; // Online if seen within last 5 minutes
  };

  const formatLastSeen = () => {
    if (!deviceData || !deviceData.lastSeen) return 'Never';
    const lastSeen = new Date(deviceData.lastSeen);
    const now = new Date();
    const minutesAgo = Math.floor((now - lastSeen) / (1000 * 60));
    
    if (minutesAgo < 1) return 'Just now';
    if (minutesAgo < 60) return `${minutesAgo}m ago`;
    const hoursAgo = Math.floor(minutesAgo / 60);
    if (hoursAgo < 24) return `${hoursAgo}h ago`;
    const daysAgo = Math.floor(hoursAgo / 24);
    return `${daysAgo}d ago`;
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-card p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const online = isOnline();

  return (
    <div
      className={`
        bg-white dark:bg-gray-800 rounded-lg shadow-card p-4
        transition-all duration-200 hover:shadow-card-hover
        ${onCenterMap && deviceData?.lat && deviceData?.lon ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={handleClick}
      role="button"
      tabIndex={onCenterMap && deviceData?.lat && deviceData?.lon ? 0 : -1}
      aria-label={`Device ${deviceId} - ${online ? 'Online' : 'Offline'}`}
    >
      {/* Header with device ID and status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`
              w-2 h-2 rounded-full
              ${online ? 'bg-green-500' : 'bg-gray-400'}
              animate-pulse
            `}
            aria-label={online ? 'Online' : 'Offline'}
          />
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {deviceId}
          </span>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {formatLastSeen()}
        </span>
      </div>

      {/* Sensor values */}
      <div className="flex items-center gap-4 mb-3">
        {deviceData?.lastMq3 !== null && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">MQ3:</span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {deviceData.lastMq3}
            </span>
          </div>
        )}
        {deviceData?.lastMq135 !== null && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">MQ135:</span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {deviceData.lastMq135}
            </span>
          </div>
        )}
      </div>

      {/* Sparkline */}
      <div className="mt-2">
        {sparklineData.length > 0 ? (
          <Sparkline data={sparklineData} color={online ? '#10B981' : '#6B7280'} />
        ) : (
          <div className="text-xs text-gray-400">No data</div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-2 text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  );
};

export default DeviceMiniCard;

