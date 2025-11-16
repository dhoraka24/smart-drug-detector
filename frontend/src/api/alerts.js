/**
 * Alerts API helpers
 * Extended with export and lat_only filtering
 */
import { api } from '../store/auth';

export const fetchAlerts = async (limit = 50, latOnly = false) => {
  const url = latOnly 
    ? `/api/v1/alerts?limit=${limit}&lat_only=true`
    : `/api/v1/alerts?limit=${limit}`;
  const response = await api.get(url);
  return response.data;
};

export const exportAlertsCSV = async (latOnly = true, limit = 1000) => {
  const response = await api.get(
    `/api/v1/alerts/export?lat_only=${latOnly}&limit=${limit}`,
    { responseType: 'blob' }
  );
  
  // Create download link
  const blob = new Blob([response.data], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `alerts_gps_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
  
  return response.data;
};

