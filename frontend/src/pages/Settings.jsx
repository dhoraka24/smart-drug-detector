import { useState, useEffect } from 'react';
import { fetchDeviceSettings, updateDeviceSettings } from '../api';
import useStore from '../store/useStore';

// SVG Icons
const SaveIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const Settings = () => {
  const { selectedDevice, setSelectedDevice } = useStore();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [toggles, setToggles] = useState({
    enableDrugDetection: true,
    enableHarmfulGasDetection: true,
    enableDHT22: true,
    enableGPS: true
  });

  useEffect(() => {
    loadSettings();
  }, [selectedDevice]);

  const loadSettings = async () => {
    try {
      const data = await fetchDeviceSettings(selectedDevice);
      setSettings(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading settings:', error);
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings({
      ...settings,
      [field]: field.includes('bool') ? value === 'true' : parseFloat(value) || parseInt(value),
    });
  };

  const handleToggle = (key) => {
    setToggles(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await updateDeviceSettings(selectedDevice, {
        mq3_safe: settings.mq3_safe,
        mq3_warning: settings.mq3_warning,
        mq3_danger: settings.mq3_danger,
        debounce_minutes: settings.debounce_minutes,
        notify_on_warning: settings.notify_on_warning,
      });
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Error saving settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading settings...</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Error loading settings</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Device Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Configure sensor thresholds and device behavior</p>
        </div>
        <button
          onClick={loadSettings}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <RefreshIcon />
          Reload
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
        {/* Device ID Selector */}
        <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Device ID
            </label>
          <input
            type="text"
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="esp32-drug-001"
          />
        </div>
        
        {message && (
          <div
            className={`mb-4 p-3 rounded-lg ${
              message.includes('Error')
                ? 'bg-red-50 text-red-700'
                : 'bg-green-50 text-green-700'
            }`}
          >
            {message}
          </div>
        )}

        <div className="space-y-8">
          {/* Note about MQ3 logic */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> The severity logic uses MQ3-only thresholds (SAFE &lt; 700, WARNING 700-1000, HIGH ≥ 1000).
              These settings are stored but the default MQ3 logic remains in effect.
            </p>
          </div>

          {/* MQ3 Sensor Thresholds */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">MQ3 Sensor Thresholds</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Safe Threshold: {settings.mq3_safe}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="10"
                  value={settings.mq3_safe}
                  onChange={(e) => handleChange('mq3_safe', e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Stored value (default logic: SAFE if mq3 &lt; 700)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warning Threshold: {settings.mq3_warning}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="10"
                  value={settings.mq3_warning}
                  onChange={(e) => handleChange('mq3_warning', e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Stored value (default logic: WARNING if 700 ≤ mq3 &lt; 1000)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Danger Threshold: {settings.mq3_danger}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="10"
                  value={settings.mq3_danger}
                  onChange={(e) => handleChange('mq3_danger', e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Stored value (default logic: HIGH if mq3 ≥ 1000)
                </p>
              </div>
            </div>
          </div>

          {/* Debounce Settings */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Debounce Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Debounce Minutes: {settings.debounce_minutes}
                </label>
                <input
                  type="range"
                  min="1"
                  max="60"
                  step="1"
                  value={settings.debounce_minutes}
                  onChange={(e) => handleChange('debounce_minutes', e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Time window (in minutes) to prevent duplicate HIGH alerts
                </p>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.notify_on_warning}
                    onChange={(e) => handleChange('notify_on_warning', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Notify on WARNING alerts
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Feature Toggles - Informational Only */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Feature Toggles</h2>
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                Informational
              </span>
            </div>
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Note:</strong> These toggles are for display only. Sensor features are controlled by the ESP32 hardware configuration.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Enable Drug Detection</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">MQ3 sensor for alcohol/drug vapor detection</p>
                </div>
                <button
                  onClick={() => handleToggle('enableDrugDetection')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    toggles.enableDrugDetection ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      toggles.enableDrugDetection ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Enable Harmful Gas Detection</p>
                  <p className="text-sm text-gray-500">MQ135 sensor for air quality monitoring</p>
                </div>
                <button
                  onClick={() => handleToggle('enableHarmfulGasDetection')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    toggles.enableHarmfulGasDetection ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      toggles.enableHarmfulGasDetection ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Enable DHT22</p>
                  <p className="text-sm text-gray-500">Temperature and humidity sensor</p>
                </div>
                <button
                  onClick={() => handleToggle('enableDHT22')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    toggles.enableDHT22 ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      toggles.enableDHT22 ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Enable GPS</p>
                  <p className="text-sm text-gray-500">Location tracking for alerts</p>
                </div>
                <button
                  onClick={() => handleToggle('enableGPS')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    toggles.enableGPS ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      toggles.enableGPS ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SaveIcon />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
