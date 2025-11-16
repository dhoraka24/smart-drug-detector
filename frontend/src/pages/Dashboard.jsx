import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { 
  Activity, 
  Thermometer, 
  Droplets, 
  Clock, 
  MapPin, 
  Wifi, 
  WifiOff,
  TrendingUp,
  Brain,
  AlertCircle,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import useStore from '../store/useStore';
import DeviceMiniCard from '../components/DeviceMiniCard';
import SeverityCard from '../components/SeverityCard';
import { fetchTelemetry, fetchAlerts } from '../api';
import { toast } from 'react-hot-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { realTimeStatus, latestTelemetry, loadTelemetry, updateRealTimeData, wsConnected } = useStore();
  const [chartData, setChartData] = useState(null);
  const [devices, setDevices] = useState([]);
  const [latestAlert, setLatestAlert] = useState(null);
  const [aiInsight, setAiInsight] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initLoad = async () => {
      setLoading(true);
      try {
        await Promise.all([
          loadData(),
          loadDevices(),
          loadLatestAlert()
        ]);
      } catch (error) {
        console.error('Error initializing dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initLoad();
    const interval = setInterval(() => {
      loadData();
      loadLatestAlert();
    }, 3000); // Poll every 3 seconds for real-time updates
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      // Always fetch fresh telemetry (limit 1 to get only latest)
      const telemetry = await loadTelemetry(null, 1);
      if (telemetry && telemetry.length > 0) {
        const latest = telemetry[0];
        
        // Update chart with more data for trends
        const allTelemetry = await loadTelemetry(null, 100);
        if (allTelemetry && allTelemetry.length > 0) {
          updateChartData(allTelemetry);
        }
        
        // Always update realTimeStatus with ABSOLUTE LATEST telemetry
        // This ensures dashboard shows the most current data from ESP32
        console.log('📊 Latest telemetry:', {
          mq3: latest.mq3,
          mq135: latest.mq135,
          temp_c: latest.temp_c,
          humidity_pct: latest.humidity_pct,
          timestamp: latest.ts || latest.received_at
        });
        
        updateRealTimeData({
          mq3: latest.mq3 || 0,
          mq135: latest.mq135 || 0,
          temp_c: latest.temp_c,
          humidity_pct: latest.humidity_pct
        });
      } else {
        console.log('⚠️ No telemetry data available');
      }
    } catch (error) {
      console.error('❌ Error loading data:', error);
      toast.error('Failed to load dashboard data');
    }
  };

  const loadDevices = async () => {
    try {
      const telemetry = await fetchTelemetry(null, 100);
      if (telemetry && telemetry.length > 0) {
        const uniqueDevices = [...new Set(telemetry.map(t => t.device_id))];
        setDevices(uniqueDevices);
      } else {
        console.log('No devices found');
        setDevices([]);
      }
    } catch (error) {
      console.error('Error loading devices:', error);
      setDevices([]);
    }
  };

  const loadLatestAlert = async () => {
    try {
      const alerts = await fetchAlerts(1);
      if (alerts && alerts.length > 0) {
        const alert = alerts[0];
        // Only use alert if it's recent (within last 10 minutes)
        const alertTime = new Date(alert.ts || alert.created_at);
        const now = new Date();
        const minutesAgo = (now - alertTime) / (1000 * 60);
        
        // Only set as latest alert if it's recent (within 10 minutes)
        if (minutesAgo <= 10) {
          setLatestAlert(alert);
          setAiInsight({
            explanation: alert.explanation,
            recommendedAction: alert.recommended_action,
            confidence: alert.confidence
          });
        } else {
          // Alert is old, clear it
          setLatestAlert(null);
          setAiInsight(null);
        }
      } else {
        setLatestAlert(null);
        setAiInsight(null);
      }
    } catch (error) {
      console.error('Error loading alert:', error);
      setLatestAlert(null);
      setAiInsight(null);
    }
  };

  const updateChartData = (telemetry) => {
    const recent = telemetry.slice(0, 10).reverse();
    setChartData({
      labels: recent.map((_, i) => `${i * 5}m ago`),
      datasets: [
        {
          label: 'MQ3',
          data: recent.map(t => t.mq3 || 0),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true,
        },
        {
          label: 'MQ135',
          data: recent.map(t => t.mq135 || 0),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Temp (°C)',
          data: recent.map(t => (t.temp_c || 0) * 10),
          borderColor: 'rgb(245, 158, 11)',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          tension: 0.4,
          fill: true,
        },
      ],
    });
  };

  const getSeverity = () => {
    // Always use CURRENT realTimeStatus MQ3 value (updated from latest telemetry)
    // This matches what ESP32 OLED shows
    // realTimeStatus is updated every 3 seconds with latest telemetry
    const mq3 = realTimeStatus.mq3 || 0;
    
    // Calculate severity from MQ3 (same logic as backend)
    // SAFE: mq3 < 700
    // WARNING: 700 ≤ mq3 < 1000
    // HIGH/DANGER: mq3 ≥ 1000
    if (mq3 < 700) return 'SAFE';
    if (mq3 < 1000) return 'WARNING';
    return 'HIGH';
  };

  const getStatusMessage = () => {
    const severity = getSeverity();
    const mq3 = realTimeStatus.mq3 || latestTelemetry?.mq3 || 0;
    const mq135 = realTimeStatus.mq135 || latestTelemetry?.mq135 || 0;
    const temp = realTimeStatus.temp || latestTelemetry?.temp_c || null;
    const humidity = realTimeStatus.humidity || latestTelemetry?.humidity_pct || null;
    
    switch (severity) {
      case 'HIGH':
        return {
          title: 'DANGER: Drug vapor detected',
          description: `High concentration detected! MQ3: ${mq3}, MQ135: ${mq135}${temp ? `, Temp: ${temp}°C` : ''}${humidity ? `, Humidity: ${humidity}%` : ''}. Immediate attention required.`,
          color: 'red'
        };
      case 'WARNING':
        return {
          title: 'Warning: Elevated vapors',
          description: `Moderate levels detected. MQ3: ${mq3}, MQ135: ${mq135}${temp ? `, Temp: ${temp}°C` : ''}${humidity ? `, Humidity: ${humidity}%` : ''}. Investigation recommended.`,
          color: 'amber'
        };
      default:
        return {
          title: 'SAFE: No drug vapor detected',
          description: `Air quality normal. MQ3: ${mq3}, MQ135: ${mq135}${temp ? `, Temp: ${temp}°C` : ''}${humidity ? `, Humidity: ${humidity}%` : ''}. All readings within safe limits.`,
          color: 'green'
        };
    }
  };

  const severity = getSeverity();
  const statusMessage = getStatusMessage();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Real-time monitoring and insights
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Connection status removed */}
          </div>
        </motion.div>

        {/* Status Message Card */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border-2 p-6 shadow-lg ${
            severity === 'HIGH' 
              ? 'border-red-500/50 bg-gradient-to-br from-red-500/10 to-red-600/5' 
              : severity === 'WARNING'
              ? 'border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-amber-600/5'
              : 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5'
          } dark:bg-slate-800/50`}
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${
              severity === 'HIGH' ? 'bg-red-500/20' 
              : severity === 'WARNING' ? 'bg-amber-500/20'
              : 'bg-emerald-500/20'
            }`}>
              {severity === 'HIGH' ? (
                <AlertCircle className={`w-8 h-8 ${severity === 'HIGH' ? 'text-red-400' : ''}`} />
              ) : severity === 'WARNING' ? (
                <AlertTriangle className="w-8 h-8 text-amber-400" />
              ) : (
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              )}
            </div>
            <div className="flex-1">
              <h2 className={`text-2xl font-bold mb-1 ${
                severity === 'HIGH' ? 'text-red-400'
                : severity === 'WARNING' ? 'text-amber-400'
                : 'text-emerald-400'
              }`}>
                {statusMessage.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {statusMessage.description}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Severity Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SeverityCard
            severity={severity}
            value={realTimeStatus.mq3 || latestTelemetry?.mq3 || 0}
            label="MQ3 Reading"
            lastUpdate={realTimeStatus.lastUpdate}
            deviceId={latestTelemetry?.device_id}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-blue-600/5 backdrop-blur-sm p-6 shadow-lg dark:bg-slate-800/50"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-500/20">
                <Activity className="w-6 h-6 text-blue-400" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-400 mb-1">
                  {realTimeStatus.mq135 || latestTelemetry?.mq135 || 0}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  MQ135
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Air Quality Sensor
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-purple-600/5 backdrop-blur-sm p-6 shadow-lg dark:bg-slate-800/50"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-purple-500/20">
                <Thermometer className="w-6 h-6 text-purple-400" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-purple-400 mb-1">
                  {(realTimeStatus.temp !== null && realTimeStatus.temp !== undefined) 
                    ? `${realTimeStatus.temp}°C` 
                    : (latestTelemetry?.temp_c !== null && latestTelemetry?.temp_c !== undefined)
                    ? `${latestTelemetry.temp_c}°C`
                    : 'N/A'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Temperature
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="text-gray-600 dark:text-gray-400">
                Humidity: {(realTimeStatus.humidity !== null && realTimeStatus.humidity !== undefined && realTimeStatus.humidity !== 0)
                  ? `${realTimeStatus.humidity}%`
                  : (latestTelemetry?.humidity_pct !== null && latestTelemetry?.humidity_pct !== undefined && latestTelemetry.humidity_pct !== 0)
                  ? `${latestTelemetry.humidity_pct}%`
                  : 'N/A'}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trend Graph */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-lg"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Sensor Trends
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Last 10 readings
              </span>
            </div>
            {chartData ? (
              <div className="h-64">
                <Line
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                        labels: {
                          color: '#9CA3AF',
                        },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: { color: '#9CA3AF' },
                        grid: { color: 'rgba(156, 163, 175, 0.1)' },
                      },
                      x: {
                        ticks: { color: '#9CA3AF' },
                        grid: { color: 'rgba(156, 163, 175, 0.1)' },
                      },
                    },
                  }}
                />
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                <p>No chart data available</p>
                <p className="text-sm mt-2">Waiting for telemetry data from ESP32...</p>
                <button 
                  onClick={loadData}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Refresh Data
                </button>
              </div>
            )}
          </motion.div>

          {/* AI Insights Box */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-6 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-indigo-500/20">
                <Brain className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                AI Insights
              </h2>
            </div>
            {latestAlert && latestAlert.severity ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Latest Alert Analysis
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <strong>Status:</strong> {latestAlert.severity}
                  </p>
                  {latestAlert.explanation && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {latestAlert.explanation}
                    </p>
                  )}
                  {latestAlert.recommended_action && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1">
                        Recommended Action:
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-400">
                        {latestAlert.recommended_action}
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Confidence: {latestAlert.confidence || 'medium'}
                  </p>
                </div>
              </div>
            ) : aiInsight ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Analysis
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {aiInsight.explanation || 'No analysis available'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Recommended Action
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {aiInsight.recommendedAction || 'Continue monitoring'}
                  </p>
                </div>
                {aiInsight.confidence && (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Confidence
                      </span>
                      <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        {aiInsight.confidence}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                No insights available. Waiting for alert data...
              </div>
            )}
          </motion.div>
        </div>

        {/* Device Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Connected Devices
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {devices.length > 0 ? (
              devices.map((deviceId, index) => (
                <motion.div
                  key={deviceId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                >
                  <DeviceMiniCard deviceId={deviceId} />
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                No devices connected
              </div>
            )}
          </div>
        </motion.div>

        {/* Status Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatusIndicator
            icon={latestTelemetry?.lat ? MapPin : AlertCircle}
            label="GPS Lock"
            value={latestTelemetry?.lat ? 'Locked' : 'No Signal'}
            status={latestTelemetry?.lat ? 'success' : 'warning'}
          />
          <StatusIndicator
            icon={Clock}
            label="Last Update"
            value={realTimeStatus.lastUpdate 
              ? new Date(realTimeStatus.lastUpdate).toLocaleTimeString()
              : 'Never'}
            status="info"
          />
          <StatusIndicator
            icon={Activity}
            label="Device Health"
            value="Active"
            status="success"
          />
        </div>
      </div>
    </div>
  );
};

const StatusIndicator = ({ icon: Icon, label, value, status }) => {
  const statusColors = {
    success: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
    warning: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
    error: 'text-rose-400 bg-rose-500/20 border-rose-500/30',
    info: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`rounded-xl border-2 ${statusColors[status]} p-4 backdrop-blur-sm`}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-6 h-6" />
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {label}
          </div>
          <div className="text-sm font-semibold mt-1">{value}</div>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
