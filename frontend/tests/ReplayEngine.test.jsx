/**
 * Tests for useReplayEngine hook
 * Tests play/pause/seek behavior and map alert updates
 */

import { renderHook, act } from '@testing-library/react';
import { useReplayEngine } from '../hooks/useReplayEngine';
import { fetchAlertHistory } from '../api';

// Mock API
jest.mock('../api', () => ({
  fetchAlertHistory: jest.fn(),
}));

describe('useReplayEngine', () => {
  const mockAlerts = [
    {
      id: 1,
      device_id: 'esp32-drug-001',
      ts: '2025-01-11T10:00:00Z',
      severity: 'HIGH',
      short_message: 'Test alert 1',
      mq3: 500,
      mq135: 400,
      lat: 13.0827,
      lon: 80.2707,
    },
    {
      id: 2,
      device_id: 'esp32-drug-001',
      ts: '2025-01-11T10:05:00Z',
      severity: 'WARNING',
      short_message: 'Test alert 2',
      mq3: 400,
      mq135: 300,
      lat: 13.0830,
      lon: 80.2710,
    },
    {
      id: 3,
      device_id: 'esp32-drug-001',
      ts: '2025-01-11T10:10:00Z',
      severity: 'SAFE',
      short_message: 'Test alert 3',
      mq3: 300,
      mq135: 200,
      lat: 13.0835,
      lon: 80.2715,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should load alert history data', async () => {
    fetchAlertHistory.mockResolvedValue(mockAlerts);

    const { result } = renderHook(() => useReplayEngine());

    const start = new Date('2025-01-11T10:00:00Z');
    const end = new Date('2025-01-11T11:00:00Z');

    await act(async () => {
      await result.current.loadData(start, end);
    });

    expect(fetchAlertHistory).toHaveBeenCalledWith({
      from: start.toISOString(),
      to: end.toISOString(),
      limit: 10000,
    });

    expect(result.current.allAlerts).toHaveLength(3);
    expect(result.current.startTime).toEqual(start);
    expect(result.current.endTime).toEqual(end);
    expect(result.current.currentTime).toEqual(start);
  });

  it('should handle play and pause', async () => {
    fetchAlertHistory.mockResolvedValue(mockAlerts);

    const { result } = renderHook(() => useReplayEngine());

    const start = new Date('2025-01-11T10:00:00Z');
    const end = new Date('2025-01-11T11:00:00Z');

    await act(async () => {
      await result.current.loadData(start, end);
    });

    expect(result.current.isPlaying).toBe(false);

    act(() => {
      result.current.setIsPlaying(true);
    });

    expect(result.current.isPlaying).toBe(true);

    act(() => {
      result.current.setIsPlaying(false);
    });

    expect(result.current.isPlaying).toBe(false);
  });

  it('should handle seek operation', async () => {
    fetchAlertHistory.mockResolvedValue(mockAlerts);

    const { result } = renderHook(() => useReplayEngine());

    const start = new Date('2025-01-11T10:00:00Z');
    const end = new Date('2025-01-11T11:00:00Z');

    await act(async () => {
      await result.current.loadData(start, end);
    });

    const seekTime = new Date('2025-01-11T10:05:00Z');

    act(() => {
      result.current.seek(seekTime);
    });

    expect(result.current.currentTime.getTime()).toBeCloseTo(seekTime.getTime(), -3);
  });

  it('should handle step forward and backward', async () => {
    fetchAlertHistory.mockResolvedValue(mockAlerts);

    const { result } = renderHook(() => useReplayEngine());

    const start = new Date('2025-01-11T10:00:00Z');
    const end = new Date('2025-01-11T11:00:00Z');

    await act(async () => {
      await result.current.loadData(start, end);
    });

    const initialTime = result.current.currentTime.getTime();

    act(() => {
      result.current.stepForward(1); // Step forward 1 minute
    });

    expect(result.current.currentTime.getTime()).toBeGreaterThan(initialTime);

    act(() => {
      result.current.stepBackward(1); // Step backward 1 minute
    });

    expect(result.current.currentTime.getTime()).toBeCloseTo(initialTime, -3);
  });

  it('should calculate active alerts for current time', async () => {
    fetchAlertHistory.mockResolvedValue(mockAlerts);

    const onAlertsUpdate = jest.fn();
    const { result } = renderHook(() =>
      useReplayEngine({ onAlertsUpdate })
    );

    const start = new Date('2025-01-11T10:00:00Z');
    const end = new Date('2025-01-11T11:00:00Z');

    await act(async () => {
      await result.current.loadData(start, end);
    });

    // Seek to time when alert 2 should be active
    const seekTime = new Date('2025-01-11T10:05:00Z');

    act(() => {
      result.current.seek(seekTime);
    });

    // Should have called onAlertsUpdate with alerts at that time
    expect(onAlertsUpdate).toHaveBeenCalled();
  });

  it('should handle speed changes', async () => {
    fetchAlertHistory.mockResolvedValue(mockAlerts);

    const { result } = renderHook(() => useReplayEngine());

    const start = new Date('2025-01-11T10:00:00Z');
    const end = new Date('2025-01-11T11:00:00Z');

    await act(async () => {
      await result.current.loadData(start, end);
    });

    expect(result.current.speed).toBe(1.0);

    act(() => {
      result.current.setPlaybackSpeed(2.0);
    });

    expect(result.current.speed).toBe(2.0);
  });

  it('should handle loop toggle', async () => {
    fetchAlertHistory.mockResolvedValue(mockAlerts);

    const { result } = renderHook(() => useReplayEngine());

    expect(result.current.isLooping).toBe(false);

    act(() => {
      result.current.toggleLoop();
    });

    expect(result.current.isLooping).toBe(true);

    act(() => {
      result.current.toggleLoop();
    });

    expect(result.current.isLooping).toBe(false);
  });

  it('should reset playback to start', async () => {
    fetchAlertHistory.mockResolvedValue(mockAlerts);

    const { result } = renderHook(() => useReplayEngine());

    const start = new Date('2025-01-11T10:00:00Z');
    const end = new Date('2025-01-11T11:00:00Z');

    await act(async () => {
      await result.current.loadData(start, end);
    });

    // Seek to middle
    const middleTime = new Date('2025-01-11T10:30:00Z');
    act(() => {
      result.current.seek(middleTime);
    });

    // Reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.currentTime.getTime()).toBeCloseTo(start.getTime(), -3);
    expect(result.current.isPlaying).toBe(false);
  });
});

