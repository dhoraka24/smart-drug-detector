import { create } from 'zustand';
import { fetchAlerts, fetchTelemetry } from '../api';

const useStore = create((set, get) => ({
  // State
  alerts: [],
  telemetry: [],
  latestTelemetry: null,
  selectedDevice: 'esp32-drug-001',
  isLoading: false,
  error: null,
  wsConnected: false,
  
  // Real-time status
  realTimeStatus: {
    mq3: 0,
    mq135: 0,
    temp: null,
    humidity: null,
    status: 'SAFE',
    lastUpdate: null
  },
  
  // Actions
  setSelectedDevice: (deviceId) => set({ selectedDevice: deviceId }),
  
  setRealTimeStatus: (status) => set({ realTimeStatus: status }),
  
  setWsConnected: (connected) => set({ wsConnected: connected }),
  
  loadAlerts: async (limit = 50) => {
    set({ isLoading: true, error: null });
    try {
      const alerts = await fetchAlerts(limit);
      set({ alerts, isLoading: false });
      return alerts;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
  
  loadTelemetry: async (deviceId = null, limit = 100) => {
    set({ isLoading: true, error: null });
    try {
      const telemetry = await fetchTelemetry(deviceId, limit);
      const latest = telemetry.length > 0 ? telemetry[0] : null;
      set({ telemetry, latestTelemetry: latest, isLoading: false });
      return telemetry;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
  
  addAlert: (alert) => set((state) => ({
    alerts: [alert, ...state.alerts].slice(0, 50)
  })),
  
  updateRealTimeData: (data) => {
    const status = {
      mq3: data.mq3 || 0,
      mq135: data.mq135 || 0,
      temp: data.temp_c || null,
      humidity: data.humidity_pct || null,
      // SAFE: mq3 < 700, WARNING: 700 ≤ mq3 < 1000, HIGH: mq3 ≥ 1000
      status: data.mq3 < 700 ? 'SAFE' : data.mq3 < 1000 ? 'WARNING' : 'HIGH',
      lastUpdate: new Date()
    };
    set({ realTimeStatus: status, latestTelemetry: data });
  }
}));

export default useStore;

