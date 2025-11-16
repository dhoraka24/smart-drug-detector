/**
 * Preferences page
 * Allows users to customize UI preferences
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPreferences, updatePreferences } from '../api';
import { toast } from 'react-hot-toast';

const Preferences = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    theme: 'light',
    map_default_zoom: 12,
    show_clusters: true,
    notify_on_warning: true,
    prefer_offline_map: false
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const data = await getPreferences();
      setPreferences(data);
      // Apply theme immediately
      applyTheme(data.theme);
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/login');
      } else {
        toast.error('Failed to load preferences');
      }
    } finally {
      setLoading(false);
    }
  };

  const applyTheme = (theme) => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updated = await updatePreferences(preferences);
      setPreferences(updated);
      applyTheme(updated.theme);
      toast.success('Preferences saved successfully');
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/login');
      } else {
        toast.error('Failed to save preferences');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    const updated = { ...preferences, [field]: value };
    setPreferences(updated);
    // Apply theme change immediately
    if (field === 'theme') {
      applyTheme(value);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Preferences</h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Theme */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Theme
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => handleChange('theme', 'light')}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    preferences.theme === 'light'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  Light
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('theme', 'dark')}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    preferences.theme === 'dark'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  Dark
                </button>
              </div>
            </div>

            {/* Map Default Zoom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Default Map Zoom: {preferences.map_default_zoom}
              </label>
              <input
                type="range"
                min="5"
                max="18"
                value={preferences.map_default_zoom}
                onChange={(e) => handleChange('map_default_zoom', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>5 (World)</span>
                <span>18 (Street)</span>
              </div>
            </div>

            {/* Show Clusters */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Show Map Clusters
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Group nearby markers on the map
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleChange('show_clusters', !preferences.show_clusters)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.show_clusters ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.show_clusters ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Notify on Warning */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notify on Warning Alerts
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Show notifications for WARNING severity alerts
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleChange('notify_on_warning', !preferences.notify_on_warning)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.notify_on_warning ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.notify_on_warning ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Prefer Offline Map */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Prefer Offline Map
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Use cached offline map tiles even when online (for testing)
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleChange('prefer_offline_map', !preferences.prefer_offline_map)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.prefer_offline_map ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.prefer_offline_map ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Preferences;

