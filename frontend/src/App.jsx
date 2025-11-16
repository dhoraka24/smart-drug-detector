import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import SidebarEnhanced from './components/SidebarEnhanced';
import HeaderEnhanced from './components/HeaderEnhanced';
import ProtectedRoute from './components/ProtectedRoute';
import AnimatedPageTransition from './components/AnimatedPageTransition';
import Dashboard from './pages/Dashboard';
import AlertsEnhanced from './pages/AlertsEnhanced';
import MapEnhanced from './pages/MapEnhanced';
import Map from './pages/Map';
import MapReplay from './pages/MapReplay';
import Settings from './pages/Settings';
import Hardware from './pages/Hardware';
import HardwareINO from './pages/HardwareINO';
import Duplicates from './pages/Duplicates';
import DuplicateTelemetry from './pages/DuplicateTelemetry';
import ProfileSettings from './pages/ProfileSettings';
import Preferences from './pages/Preferences';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AlertModal from './components/AlertModal';
import useStore from './store/useStore';
import useAuthStore from './store/auth';
import { useTheme } from './hooks/useTheme';
import { toast } from 'react-hot-toast';

function AppContent() {
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [ws, setWs] = useState(null);
  const [modalAlert, setModalAlert] = useState(null);
  const [lastStatus, setLastStatus] = useState('SAFE'); // Track last status for change detection
  const { setWsConnected, addAlert, updateRealTimeData, realTimeStatus } = useStore();
  const { isAuthenticated, init } = useAuthStore();
  
  // Initialize theme on mount (only loads from backend if authenticated)
  // This prevents flicker on login page
  const { isLoading: themeLoading } = useTheme();

  // Initialize auth on mount
  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    // Only connect WebSocket if authenticated
    if (!isAuthenticated) {
      return;
    }

    // Initialize lastStatus from current realTimeStatus
    if (realTimeStatus && realTimeStatus.status) {
      setLastStatus(realTimeStatus.status);
    }

    // Connect to WebSocket
    const websocket = new WebSocket('ws://localhost:8000/ws/alerts');
    
    // Store WebSocket globally for ConnectedIndicator to access
    window.wsConnection = websocket;
    
    websocket.onopen = () => {
      console.log('WebSocket connected');
      setWsConnected(true);
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new_alert' && data.data) {
        // Updated format: data.data instead of data.alert
        const alert = data.data;
        addAlert(alert);
        
        // Show toast notification for all WARNING and HIGH alerts
        if (alert.severity === 'WARNING' || alert.severity === 'HIGH') {
          // Show toast notification with severity color
          const toastOptions = {
            duration: 5000,
            position: 'top-right',
            icon: alert.severity === 'HIGH' ? '🚨' : '⚠️',
          };
          
          if (alert.severity === 'HIGH') {
            toast.error(
              `🚨 HIGH ALERT: ${alert.short_message || 'Drug vapor detected!'}`,
              {
                ...toastOptions,
                style: {
                  background: '#ef4444',
                  color: '#fff',
                  fontWeight: 'bold',
                },
              }
            );
          } else {
            toast.warning(
              `⚠️ WARNING: ${alert.short_message || 'Elevated vapor levels detected'}`,
              {
                ...toastOptions,
                style: {
                  background: '#f59e0b',
                  color: '#fff',
                  fontWeight: 'bold',
                },
              }
            );
          }
          
          // Show notification/modal for WARNING and HIGH alerts where notified==True
          if (alert.notified) {
            setNotifications(prev => [...prev, alert]);
            setModalAlert(alert);
            
            // Show browser notification if permission granted
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`Alert: ${alert.severity}`, {
                body: alert.short_message,
                icon: '/vite.svg'
              });
            }
          }
        }
      } else if (data.type === 'ping') {
        // Handle ping messages for connection status
        // ConnectedIndicator will handle this via store
      } else if (data.type === 'telemetry') {
        // Calculate current status from MQ3
        // SAFE: mq3 < 700, WARNING: 700 ≤ mq3 < 1000, HIGH: mq3 ≥ 1000
        const mq3 = data.telemetry.mq3 || 0;
        const currentStatus = mq3 < 700 ? 'SAFE' : mq3 < 1000 ? 'WARNING' : 'HIGH';
        
        // Show toast notification when status changes (not on every update)
        if (currentStatus !== lastStatus) {
          if (currentStatus === 'HIGH') {
            toast.error(
              `🚨 Real-time Detection: HIGH ALERT - Drug vapor detected! (MQ3: ${mq3})`,
              {
                duration: 6000,
                position: 'top-right',
                style: {
                  background: '#ef4444',
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '14px',
                },
              }
            );
          } else if (currentStatus === 'WARNING') {
            toast.warning(
              `⚠️ Real-time Detection: WARNING - Elevated vapor levels (MQ3: ${mq3})`,
              {
                duration: 5000,
                position: 'top-right',
                style: {
                  background: '#f59e0b',
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '14px',
                },
              }
            );
          } else if (currentStatus === 'SAFE' && lastStatus !== 'SAFE') {
            // Only show SAFE notification when recovering from WARNING/HIGH
            toast.success(
              `✅ Status Changed: SAFE - Air quality normal (MQ3: ${mq3})`,
              {
                duration: 4000,
                position: 'top-right',
                style: {
                  background: '#10b981',
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '14px',
                },
              }
            );
          }
          
          setLastStatus(currentStatus);
        }
        
        // Update real-time data
        updateRealTimeData(data.telemetry);
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWsConnected(false);
      window.wsConnection = null;
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      setWsConnected(false);
      window.wsConnection = null;
      // Reconnect after 3 seconds if still authenticated
      if (isAuthenticated) {
        setTimeout(() => {
          setWs(null);
        }, 3000);
      }
    };

    setWs(websocket);

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      websocket.close();
      window.wsConnection = null;
    };
  }, [isAuthenticated, setWsConnected, addAlert, updateRealTimeData, realTimeStatus]);

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Don't show sidebar/header on auth pages
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900">
      <SidebarEnhanced />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        <HeaderEnhanced notifications={notifications} onRemoveNotification={removeNotification} />
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-900">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AnimatedPageTransition>
                      <Dashboard />
                    </AnimatedPageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/alerts"
                element={
                  <ProtectedRoute>
                    <AnimatedPageTransition>
                      <AlertsEnhanced />
                    </AnimatedPageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/map"
                element={
                  <ProtectedRoute>
                    <AnimatedPageTransition>
                      <MapEnhanced />
                    </AnimatedPageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/map/legacy"
                element={
                  <ProtectedRoute>
                    <AnimatedPageTransition>
                      <Map />
                    </AnimatedPageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/map/replay"
                element={
                  <ProtectedRoute>
                    <AnimatedPageTransition>
                      <MapReplay />
                    </AnimatedPageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <AnimatedPageTransition>
                      <Settings />
                    </AnimatedPageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hardware"
                element={
                  <ProtectedRoute>
                    <AnimatedPageTransition>
                      <HardwareINO />
                    </AnimatedPageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/duplicates"
                element={
                  <ProtectedRoute>
                    <AnimatedPageTransition>
                      <DuplicateTelemetry />
                    </AnimatedPageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <AnimatedPageTransition>
                      <ProfileSettings />
                    </AnimatedPageTransition>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/preferences"
                element={
                  <ProtectedRoute>
                    <AnimatedPageTransition>
                      <Preferences />
                    </AnimatedPageTransition>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
      
      {modalAlert && (
        <AlertModal alert={modalAlert} onClose={() => setModalAlert(null)} />
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
