import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Filter, 
  MapPin, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  Search,
  Calendar,
  AlertCircle,
  Table,
  LayoutGrid,
  Download,
  X
} from 'lucide-react';
import { fetchAlerts, exportAlertsCSV } from '../api';
import AlertModal from '../components/AlertModal';
import AlertCard from '../components/AlertCard';
import useStore from '../store/useStore';
import { toast } from 'react-hot-toast';
import { formatToIST } from '../utils/timeFormat';

// AMET University, Chennai coordinates (fallback when GPS is not available)
const AMET_UNIVERSITY_LAT = 12.9012;
const AMET_UNIVERSITY_LON = 80.2209;
const AMET_UNIVERSITY_NAME = 'AMET University, Chennai';

// Helper function to get GPS coordinates with fallback
const getGPSCoordinates = (alert) => {
  if (alert.lat && alert.lon && alert.lat !== 0 && alert.lon !== 0) {
    return {
      lat: alert.lat,
      lon: alert.lon,
      isFallback: false
    };
  }
  return {
    lat: AMET_UNIVERSITY_LAT,
    lon: AMET_UNIVERSITY_LON,
    isFallback: true,
    location: AMET_UNIVERSITY_NAME
  };
};

const AlertsEnhanced = () => {
  const { alerts, loadAlerts } = useStore();
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [filters, setFilters] = useState({
    severity: 'all',
    deviceId: 'all',
    timeRange: 'all',
    search: '',
    hideSafe: true  // Hide SAFE alerts by default
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState('table');
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Apply filters when alerts or filters change (reset page to 1)
  useEffect(() => {
    applyFilters(true); // true = reset page to 1
  }, [alerts, filters]);

  const loadData = async (showToast = false) => {
    try {
      setLoading(true);
      await loadAlerts(100);
      setLoading(false);
      if (showToast) {
        toast.success('Alerts refreshed');
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
      setLoading(false);
      if (showToast) {
        toast.error('Failed to refresh alerts');
      }
    }
  };

  const applyFilters = (resetPage = false) => {
    let filtered = [...alerts];

    // Severity filter
    if (filters.severity !== 'all') {
      filtered = filtered.filter(a => a.severity === filters.severity);
    }

    // Device filter
    if (filters.deviceId !== 'all') {
      filtered = filtered.filter(a => a.device_id === filters.deviceId);
    }

    // Time range filter
    if (filters.timeRange !== 'all') {
      const now = new Date();
      const ranges = {
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
      };
      const rangeMs = ranges[filters.timeRange];
      if (rangeMs) {
        filtered = filtered.filter(a => {
          const alertTime = new Date(a.ts || a.created_at);
          return now - alertTime < rangeMs;
        });
      }
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(a =>
        a.short_message?.toLowerCase().includes(searchLower) ||
        a.device_id?.toLowerCase().includes(searchLower) ||
        a.explanation?.toLowerCase().includes(searchLower)
      );
    }

    // Hide SAFE alerts filter (default: true)
    if (filters.hideSafe) {
      filtered = filtered.filter(a => a.severity !== 'SAFE');
    }

    setFilteredAlerts(filtered);
    
    // Only reset page when filters change, not when page changes
    if (resetPage) {
      setCurrentPage(1);
    }
  };

  const handleViewOnMap = (alert) => {
    const gps = getGPSCoordinates(alert);
    navigate('/map', {
      state: {
        centerLat: gps.lat,
        centerLon: gps.lon,
      },
    });
    if (gps.isFallback) {
      toast.info(`Showing ${AMET_UNIVERSITY_NAME} (GPS not available)`);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportAlertsCSV(false, 1000);
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

  const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage);
  const paginatedAlerts = filteredAlerts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const uniqueDevices = [...new Set(alerts.map(a => a.device_id))];

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
              Alerts
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''} found
            </p>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
              className="px-4 py-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-xl transition-all text-gray-700 dark:text-gray-300 flex items-center gap-2"
            >
              {viewMode === 'table' ? <LayoutGrid className="w-5 h-5" /> : <Table className="w-5 h-5" />}
              {viewMode === 'table' ? 'Cards' : 'Table'}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExport}
              className="px-4 py-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-xl transition-all text-gray-700 dark:text-gray-300 flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Export
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => loadData(true)}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </motion.button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-slate-700"
        >
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search alerts..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Severity Filter */}
            <select
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
              className="px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            >
              <option value="all">All Severities</option>
              <option value="SAFE">SAFE</option>
              <option value="WARNING">WARNING</option>
              <option value="HIGH">HIGH</option>
            </select>

            {/* Device Filter */}
            <select
              value={filters.deviceId}
              onChange={(e) => setFilters({ ...filters, deviceId: e.target.value })}
              className="px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            >
              <option value="all">All Devices</option>
              {uniqueDevices.map(deviceId => (
                <option key={deviceId} value={deviceId}>{deviceId}</option>
              ))}
            </select>

            {/* Time Range Filter */}
            <select
              value={filters.timeRange}
              onChange={(e) => setFilters({ ...filters, timeRange: e.target.value })}
              className="px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            >
              <option value="all">All Time</option>
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>

            {/* Hide SAFE Filter */}
            <label className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600">
              <input
                type="checkbox"
                checked={filters.hideSafe}
                onChange={(e) => setFilters({ ...filters, hideSafe: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Hide SAFE</span>
            </label>
          </div>
        </motion.div>

        {/* Alerts Display */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {paginatedAlerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <AlertCard
                    alert={alert}
                    onClick={() => setSelectedAlert(alert)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Device
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      GPS
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {paginatedAlerts.map((alert) => (
                    <motion.tr
                      key={alert.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                      className="cursor-pointer"
                      onClick={() => setSelectedAlert(alert)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          alert.severity === 'SAFE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          alert.severity === 'WARNING' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                          'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                        }`}>
                          {alert.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {alert.short_message}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {alert.device_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {formatToIST(alert.ts || alert.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const gps = getGPSCoordinates(alert);
                          return (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-blue-500" />
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {gps.isFallback ? (
                                  <span title={AMET_UNIVERSITY_NAME}>
                                    {gps.lat.toFixed(4)}, {gps.lon.toFixed(4)}
                                    <span className="text-gray-400 ml-1">(AMET)</span>
                                  </span>
                                ) : (
                                  `${gps.lat.toFixed(4)}, ${gps.lon.toFixed(4)}`
                                )}
                              </span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewOnMap(alert);
                          }}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          View on Map
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-4 border border-gray-200 dark:border-slate-700"
          >
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAlerts.length)} of {filteredAlerts.length} alerts
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Alert Modal */}
        {selectedAlert && (
          <AlertModal
            alert={selectedAlert}
            onClose={() => setSelectedAlert(null)}
            onViewOnMap={() => {
              handleViewOnMap(selectedAlert);
              setSelectedAlert(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default AlertsEnhanced;

