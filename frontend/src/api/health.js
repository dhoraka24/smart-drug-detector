/**
 * Health API helpers
 * Used for connection status monitoring
 */
import api from '../api';

export const getHealthStatus = async () => {
  // Health endpoint doesn't require auth, so use fetch directly
  const response = await fetch('/api/v1/health/connected');
  if (!response.ok) {
    throw new Error('Failed to fetch health status');
  }
  return response.json();
};
