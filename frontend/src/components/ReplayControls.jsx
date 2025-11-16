/**
 * ReplayControls Component
 * 
 * Playback control panel with:
 * - Play/Pause button
 * - Step Back/Forward buttons
 * - Speed selector (0.5x, 1x, 2x, 4x)
 * - Timeline scrubber (drag)
 * - Start/End time pickers
 * - Loop toggle
 * - "Center on device" dropdown
 * 
 * Keyboard shortcuts:
 * - Space: Play/Pause
 * - ←: Step back
 * - →: Step forward
 */

import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

const SPEED_OPTIONS = [
  { value: 0.5, label: '0.5x' },
  { value: 1, label: '1x' },
  { value: 2, label: '2x' },
  { value: 4, label: '4x' },
];

const TIME_PRESETS = [
  { label: 'Last 1 hour', hours: 1 },
  { label: 'Last 6 hours', hours: 6 },
  { label: 'Last 24 hours', hours: 24 },
  { label: 'Last 48 hours', hours: 48 },
  { label: 'Custom', hours: null },
];

export const ReplayControls = ({
  isPlaying,
  onPlay,
  onPause,
  onStepBack,
  onStepForward,
  onSpeedChange,
  onSeek,
  onTimeRangeChange,
  onLoopToggle,
  onDeviceSelect,
  currentTime,
  startTime,
  endTime,
  speed,
  isLooping,
  progress,
  devices = [],
  selectedDevice = null,
  className = '',
}) => {
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [localStartTime, setLocalStartTime] = useState('');
  const [localEndTime, setLocalEndTime] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(TIME_PRESETS[0]);
  const containerRef = useRef(null);

  // Format time for display
  const formatTime = (date) => {
    if (!date) return '--:--:--';
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toISOString().slice(0, 16); // Format for datetime-local input
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          if (isPlaying) {
            onPause();
          } else {
            onPlay();
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onStepBack();
          break;
        case 'ArrowRight':
          e.preventDefault();
          onStepForward();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, onPlay, onPause, onStepBack, onStepForward]);

  // Handle preset selection
  const handlePresetSelect = (preset) => {
    setSelectedPreset(preset);
    if (preset.hours !== null) {
      const end = new Date();
      const start = new Date(end.getTime() - preset.hours * 60 * 60 * 1000);
      onTimeRangeChange(start, end);
      setShowTimePicker(false);
    } else {
      setShowTimePicker(true);
    }
  };

  // Handle custom time range
  const handleCustomTimeRange = () => {
    if (!localStartTime || !localEndTime) {
      toast.error('Please select both start and end times');
      return;
    }

    const start = new Date(localStartTime);
    const end = new Date(localEndTime);

    if (start >= end) {
      toast.error('Start time must be before end time');
      return;
    }

    onTimeRangeChange(start, end);
    setShowTimePicker(false);
    toast.success('Time range updated');
  };

  return (
    <div 
      ref={containerRef}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-card p-4 space-y-4 ${className}`}
      role="toolbar"
      aria-label="Replay controls"
    >
      {/* Top row: Time range and device selection */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Time range presets */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Time Range:
          </label>
          <select
            value={selectedPreset.label}
            onChange={(e) => {
              const preset = TIME_PRESETS.find(p => p.label === e.target.value);
              if (preset) handlePresetSelect(preset);
            }}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            aria-label="Time range preset"
          >
            {TIME_PRESETS.map(preset => (
              <option key={preset.label} value={preset.label}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>

        {/* Custom time picker */}
        {showTimePicker && (
          <div className="flex items-center gap-2">
            <input
              type="datetime-local"
              value={localStartTime || formatDate(startTime)}
              onChange={(e) => setLocalStartTime(e.target.value)}
              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              aria-label="Start time"
            />
            <span className="text-gray-500">to</span>
            <input
              type="datetime-local"
              value={localEndTime || formatDate(endTime)}
              onChange={(e) => setLocalEndTime(e.target.value)}
              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              aria-label="End time"
            />
            <button
              onClick={handleCustomTimeRange}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
            >
              Apply
            </button>
          </div>
        )}

        {/* Device selector */}
        {devices.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Device:
            </label>
            <select
              value={selectedDevice || ''}
              onChange={(e) => onDeviceSelect(e.target.value || null)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              aria-label="Select device"
            >
              <option value="">All Devices</option>
              {devices.map(device => (
                <option key={device} value={device}>
                  {device}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main controls row */}
      <div className="flex items-center gap-4">
        {/* Play/Pause button */}
        <button
          onClick={isPlaying ? onPause : onPlay}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        {/* Step buttons */}
        <button
          onClick={onStepBack}
          className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:outline-none transition-colors"
          aria-label="Step backward"
          title="Step backward (←)"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>

        <button
          onClick={onStepForward}
          className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:outline-none transition-colors"
          aria-label="Step forward"
          title="Step forward (→)"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Speed selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Speed:
          </label>
          <select
            value={speed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            aria-label="Playback speed"
          >
            {SPEED_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Loop toggle */}
        <button
          onClick={onLoopToggle}
          className={`px-3 py-2 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors ${
            isLooping
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
          aria-label={isLooping ? 'Disable loop' : 'Enable loop'}
          title="Toggle loop"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Timeline scrubber */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>{formatTime(startTime)}</span>
          <span className="font-medium">{formatTime(currentTime)}</span>
          <span>{formatTime(endTime)}</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={(e) => {
            const newProgress = parseFloat(e.target.value);
            if (startTime && endTime) {
              const totalDuration = endTime.getTime() - startTime.getTime();
              const newTime = new Date(startTime.getTime() + (totalDuration * newProgress / 100));
              onSeek(newTime);
            }
          }}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          aria-label="Timeline scrubber"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
          <span>Progress: {progress.toFixed(1)}%</span>
          <span className="text-gray-400">Press Space to play/pause, ← → to step</span>
        </div>
      </div>
    </div>
  );
};

