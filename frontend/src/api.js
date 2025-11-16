import { api } from './store/auth';

// All API calls now use the authenticated axios instance from auth store
// The token is automatically included in requests via interceptor

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
  return response.data;
};

export const fetchTelemetry = async (deviceId = null, limit = 100) => {
  const url = deviceId 
    ? `/api/v1/telemetry?device_id=${deviceId}&limit=${limit}`
    : `/api/v1/telemetry?limit=${limit}`;
  const response = await api.get(url);
  return response.data;
};

export const fetchDeviceSettings = async (deviceId) => {
  const response = await api.get(`/api/v1/device-settings/${deviceId}`);
  return response.data;
};

export const updateDeviceSettings = async (deviceId, settings) => {
  const response = await api.post(`/api/v1/device-settings/${deviceId}`, settings);
  return response.data;
};

export const fetchAbout = async () => {
  const response = await api.get('/api/v1/about');
  return response.data;
};

// Duplicate Telemetry APIs
export const fetchDuplicates = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.device_id) queryParams.append('device_id', params.device_id);
  if (params.from_ts) queryParams.append('from_ts', params.from_ts);
  if (params.to_ts) queryParams.append('to_ts', params.to_ts);
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.offset) queryParams.append('offset', params.offset.toString());
  
  const response = await api.get(`/api/v1/duplicates?${queryParams}`);
  return response.data;
};

export const getDuplicateDetail = async (duplicateId) => {
  const response = await api.get(`/api/v1/duplicates/${duplicateId}`);
  return response.data;
};

export const mergeDuplicates = async (originalId, duplicateIds) => {
  const response = await api.post('/api/v1/duplicates/merge', {
    original_id: originalId,
    duplicate_ids: duplicateIds,
  });
  return response.data;
};

export const ignoreDuplicates = async (ids) => {
  const response = await api.post('/api/v1/duplicates/ignore', { ids });
  return response.data;
};

// Profile APIs
export const getProfile = async () => {
  const response = await api.get('/api/v1/profile');
  return response.data;
};

export const updateProfile = async (profileData) => {
  const response = await api.put('/api/v1/profile', profileData);
  return response.data;
};

export const changePassword = async (currentPassword, newPassword) => {
  const response = await api.post('/api/v1/profile/change-password', {
    current_password: currentPassword,
    new_password: newPassword
  });
  return response.data;
};

// Preferences APIs
export const getPreferences = async () => {
  const response = await api.get('/api/v1/preferences');
  return response.data;
};

export const updatePreferences = async (preferences) => {
  const response = await api.put('/api/v1/preferences', preferences);
  return response.data;
};

// Alert History APIs for replay
export const fetchAlertHistory = async (params) => {
  const queryParams = new URLSearchParams();
  queryParams.append('from', params.from);
  queryParams.append('to', params.to);
  if (params.device_id) queryParams.append('device_id', params.device_id);
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.aggregate) queryParams.append('aggregate', 'true');
  if (params.bucket_minutes) queryParams.append('bucket_minutes', params.bucket_minutes.toString());
  
  const response = await api.get(`/api/v1/alerts/history?${queryParams}`);
  return response.data;
};

export default api;
