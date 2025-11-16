/**
 * Replay Engine Hook
 * 
 * Encapsulates replay logic: loading data (REST or stream), buffering,
 * tick loop for play speed, handling pause/play/seek, exposing currentTime and activeAlerts
 * 
 * Features:
 * - Supports both raw alert list and streaming endpoint
 * - Buffers alerts for smooth playback
 * - Handles play/pause/seek operations
 * - Exposes current time and active alerts for map rendering
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchAlertHistory } from '../api';

const DEFAULT_SPEED = 1.0; // 1x speed
const DEFAULT_STEP_MINUTES = 1; // 1 minute step
const TICK_INTERVAL_MS = 1000; // Base tick interval (1 second)

export const useReplayEngine = (options = {}) => {
  const {
    dataSource = 'rest', // 'rest' or 'stream'
    onAlertsUpdate = () => {},
    onPlaybackComplete = () => {},
  } = options;

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [speed, setSpeed] = useState(DEFAULT_SPEED);
  const [isLooping, setIsLooping] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [allAlerts, setAllAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  // Refs
  const tickIntervalRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastTickTimeRef = useRef(null);
  const playbackStartTimeRef = useRef(null);

  /**
   * Load alert history data
   */
  const loadData = useCallback(async (from, to, deviceId = null, useAggregation = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = {
        from: from.toISOString(),
        to: to.toISOString(),
        limit: useAggregation ? 10000 : 10000, // Max limit
      };
      
      if (deviceId) {
        params.device_id = deviceId;
      }
      
      if (useAggregation) {
        params.aggregate = true;
        params.bucket_minutes = 5; // 5-minute buckets
      }
      
      const data = await fetchAlertHistory(params);
      
      if (useAggregation) {
        // Convert aggregation buckets to alert-like format for visualization
        const alerts = [];
        data.forEach(bucket => {
          // Create representative alerts for each severity in bucket
          Object.entries(bucket.counts).forEach(([severity, count]) => {
            for (let i = 0; i < count; i++) {
              alerts.push({
                id: `bucket_${bucket.bucket_start}_${severity}_${i}`,
                device_id: deviceId || 'aggregated',
                ts: bucket.bucket_start,
                severity: severity,
                short_message: `${severity} alert (aggregated)`,
                mq3: 0,
                mq135: 0,
                lat: bucket.repr_lat,
                lon: bucket.repr_lon,
                isAggregated: true,
                bucketCount: count,
              });
            }
          });
        });
        setAllAlerts(alerts);
      } else {
        // Raw alerts
        setAllAlerts(data);
      }
      
      setStartTime(new Date(from));
      setEndTime(new Date(to));
      setCurrentTime(new Date(from));
      
      return data;
    } catch (err) {
      setError(err.message || 'Failed to load alert history');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Calculate active alerts for current time window
   */
  const calculateActiveAlerts = useCallback((time, windowMs = 1000) => {
    if (!allAlerts.length || !time) return [];
    
    const timeMs = time.getTime();
    const windowStart = timeMs - windowMs;
    const windowEnd = timeMs;
    
    return allAlerts.filter(alert => {
      const alertTime = new Date(alert.ts).getTime();
      return alertTime >= windowStart && alertTime <= windowEnd;
    });
  }, [allAlerts]);

  /**
   * Playback tick function
   */
  const tick = useCallback(() => {
    if (!isPlaying || !currentTime || !endTime) return;
    
    const now = Date.now();
    const deltaMs = (now - lastTickTimeRef.current) * speed;
    
    const newTime = new Date(currentTime.getTime() + deltaMs);
    
    // Check if we've reached the end
    if (newTime >= endTime) {
      if (isLooping) {
        // Loop: reset to start
        setCurrentTime(startTime);
        playbackStartTimeRef.current = now;
      } else {
        // Stop playback
        setIsPlaying(false);
        onPlaybackComplete();
        return;
      }
    } else {
      setCurrentTime(newTime);
    }
    
    // Calculate progress
    const totalDuration = endTime.getTime() - startTime.getTime();
    const elapsed = newTime.getTime() - startTime.getTime();
    setProgress((elapsed / totalDuration) * 100);
    
    // Calculate active alerts
    const active = calculateActiveAlerts(newTime, 1000 * speed);
    setActiveAlerts(active);
    onAlertsUpdate(active);
    
    lastTickTimeRef.current = now;
    
    // Schedule next tick
    animationFrameRef.current = requestAnimationFrame(tick);
  }, [isPlaying, currentTime, startTime, endTime, speed, isLooping, calculateActiveAlerts, onAlertsUpdate, onPlaybackComplete]);

  /**
   * Start playback
   */
  const play = useCallback(() => {
    if (!currentTime || !endTime) return;
    
    setIsPlaying(true);
    lastTickTimeRef.current = Date.now();
    playbackStartTimeRef.current = Date.now();
    animationFrameRef.current = requestAnimationFrame(tick);
  }, [currentTime, endTime, tick]);

  /**
   * Pause playback
   */
  const pause = useCallback(() => {
    setIsPlaying(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  /**
   * Seek to specific time
   */
  const seek = useCallback((time) => {
    const seekTime = new Date(time);
    
    // Clamp to valid range
    if (seekTime < startTime) {
      setCurrentTime(startTime);
    } else if (seekTime > endTime) {
      setCurrentTime(endTime);
    } else {
      setCurrentTime(seekTime);
    }
    
    // Update progress
    if (startTime && endTime) {
      const totalDuration = endTime.getTime() - startTime.getTime();
      const elapsed = seekTime.getTime() - startTime.getTime();
      setProgress((elapsed / totalDuration) * 100);
    }
    
    // Calculate active alerts at seek time
    const active = calculateActiveAlerts(seekTime, 1000);
    setActiveAlerts(active);
    onAlertsUpdate(active);
    
    // Pause if playing
    if (isPlaying) {
      pause();
    }
  }, [startTime, endTime, calculateActiveAlerts, onAlertsUpdate, isPlaying, pause]);

  /**
   * Step forward
   */
  const stepForward = useCallback((stepMinutes = DEFAULT_STEP_MINUTES) => {
    if (!currentTime || !endTime) return;
    
    const stepMs = stepMinutes * 60 * 1000;
    const newTime = new Date(Math.min(currentTime.getTime() + stepMs, endTime.getTime()));
    seek(newTime);
  }, [currentTime, endTime, seek]);

  /**
   * Step backward
   */
  const stepBackward = useCallback((stepMinutes = DEFAULT_STEP_MINUTES) => {
    if (!currentTime || !startTime) return;
    
    const stepMs = stepMinutes * 60 * 1000;
    const newTime = new Date(Math.max(currentTime.getTime() - stepMs, startTime.getTime()));
    seek(newTime);
  }, [currentTime, startTime, seek]);

  /**
   * Set playback speed
   */
  const setPlaybackSpeed = useCallback((newSpeed) => {
    setSpeed(newSpeed);
  }, []);

  /**
   * Toggle loop
   */
  const toggleLoop = useCallback(() => {
    setIsLooping(prev => !prev);
  }, []);

  /**
   * Reset playback
   */
  const reset = useCallback(() => {
    pause();
    if (startTime) {
      setCurrentTime(startTime);
      setProgress(0);
      setActiveAlerts([]);
    }
  }, [startTime, pause]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
      }
    };
  }, []);

  // Handle play/pause state changes
  useEffect(() => {
    if (isPlaying) {
      play();
    } else {
      pause();
    }
  }, [isPlaying, play, pause]);

  return {
    // State
    isPlaying,
    currentTime,
    startTime,
    endTime,
    speed,
    isLooping,
    activeAlerts,
    allAlerts,
    isLoading,
    error,
    progress,
    
    // Actions
    loadData,
    play,
    pause,
    seek,
    stepForward,
    stepBackward,
    setPlaybackSpeed,
    toggleLoop,
    reset,
    setIsPlaying,
  };
};

