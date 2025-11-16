/**
 * ConnectedIndicator component
 * Shows connection status based on WebSocket and health endpoint
 */
import { useState, useEffect } from 'react';
import { getHealthStatus } from '../api/health';
import useStore from '../store/useStore';

const ConnectedIndicator = () => {
  const wsConnected = useStore((state) => state.wsConnected);
  const [lastPingTime, setLastPingTime] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [status, setStatus] = useState('offline'); // 'connected', 'degraded', 'offline'

  // Listen for WebSocket ping messages
  useEffect(() => {
    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ping') {
          setLastPingTime(new Date());
        }
      } catch (e) {
        // Not a ping message
      }
    };

    // Get WebSocket from window (set by App.jsx)
    const ws = window.wsConnection;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.addEventListener('message', handleMessage);
      return () => {
        if (ws) {
          ws.removeEventListener('message', handleMessage);
        }
      };
    }
    
    // If WebSocket not available, check again when wsConnected changes
    const checkInterval = setInterval(() => {
      const wsCheck = window.wsConnection;
      if (wsCheck && wsCheck.readyState === WebSocket.OPEN) {
        wsCheck.addEventListener('message', handleMessage);
        clearInterval(checkInterval);
      }
    }, 1000);
    
    return () => {
      clearInterval(checkInterval);
      if (ws) {
        ws.removeEventListener('message', handleMessage);
      }
    };
  }, [wsConnected]);

  // Poll health endpoint
  useEffect(() => {
    const pollHealth = async () => {
      try {
        const health = await getHealthStatus();
        setHealthData(health);
      } catch (error) {
        setHealthData(null);
      }
    };

    pollHealth();
    const interval = setInterval(pollHealth, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Determine status
  useEffect(() => {
    const now = new Date();
    const pingAge = lastPingTime ? (now - lastPingTime) / 1000 : Infinity;
    const telemetryAge = healthData?.last_telemetry_received_at
      ? (now - new Date(healthData.last_telemetry_received_at)) / 1000
      : Infinity;

    // If WS connected and last ping was < 25 seconds ago → Connected
    if (wsConnected && pingAge < 25) {
      setStatus('connected');
    } 
    // If WS disconnected but backend received telemetry < 1 minute ago → Degraded
    else if (healthData && telemetryAge < 60) {
      setStatus('degraded');
    } 
    // Otherwise → Offline
    else {
      setStatus('offline');
    }
  }, [wsConnected, lastPingTime, healthData]);

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          color: 'green',
          text: 'Connected',
          tooltip: 'Realtime connected',
          icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )
        };
      case 'degraded':
        return {
          color: 'orange',
          text: 'Degraded',
          tooltip: 'Backend reachable but realtime offline',
          icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )
        };
      default:
        return {
          color: 'red',
          text: 'Offline',
          tooltip: 'No backend connection',
          icon: (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )
        };
    }
  };

  const config = getStatusConfig();
  const wsClients = healthData?.ws_clients || 0;

  // Use conditional classes (Tailwind doesn't support dynamic class names)
  const bgClasses = {
    'connected': 'bg-green-50 border-green-200',
    'degraded': 'bg-orange-50 border-orange-200',
    'offline': 'bg-red-50 border-red-200'
  }[status] || 'bg-gray-50 border-gray-200';

  const textClasses = {
    'connected': 'text-green-600',
    'degraded': 'text-orange-600',
    'offline': 'text-red-600'
  }[status] || 'text-gray-600';

  const textDarkClasses = {
    'connected': 'text-green-700',
    'degraded': 'text-orange-700',
    'offline': 'text-red-700'
  }[status] || 'text-gray-700';

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${bgClasses}`}
      title={`${config.tooltip}. WS clients: ${wsClients}. Last telemetry: ${
        healthData?.last_telemetry_received_at
          ? new Date(healthData.last_telemetry_received_at).toLocaleTimeString()
          : 'Never'
      }`}
    >
      <span className={textClasses}>{config.icon}</span>
      <span className={`text-sm font-medium ${textDarkClasses}`}>
        {config.text}
      </span>
      {wsClients > 0 && (
        <span className={`text-xs ${textClasses}`}>
          ({wsClients})
        </span>
      )}
    </div>
  );
};

export default ConnectedIndicator;

