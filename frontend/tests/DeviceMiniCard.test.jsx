/**
 * Tests for DeviceMiniCard component
 * Tests rendering, data loading, and map centering
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { DeviceMiniCard } from '../components/DeviceMiniCard';
import { fetchTelemetry } from '../api';

jest.mock('../api');

describe('DeviceMiniCard', () => {
  const mockTelemetry = [
    {
      device_id: 'esp32-drug-001',
      mq3: 500,
      mq135: 400,
      ts: '2025-01-11T10:00:00Z',
      lat: 13.0827,
      lon: 80.2707,
    },
    {
      device_id: 'esp32-drug-001',
      mq3: 450,
      mq135: 350,
      ts: '2025-01-11T09:55:00Z',
      lat: 13.0827,
      lon: 80.2707,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders device card with device ID', async () => {
    fetchTelemetry.mockResolvedValue(mockTelemetry);
    
    render(<DeviceMiniCard deviceId="esp32-drug-001" />);
    
    await waitFor(() => {
      expect(screen.getByText('esp32-drug-001')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    fetchTelemetry.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<DeviceMiniCard deviceId="esp32-drug-001" />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays sensor values when loaded', async () => {
    fetchTelemetry.mockResolvedValue(mockTelemetry);
    
    render(<DeviceMiniCard deviceId="esp32-drug-001" />);
    
    await waitFor(() => {
      expect(screen.getByText(/MQ3: 500/i)).toBeInTheDocument();
      expect(screen.getByText(/MQ135: 400/i)).toBeInTheDocument();
    });
  });

  it('shows online status when device seen recently', async () => {
    const recentTelemetry = [{
      ...mockTelemetry[0],
      ts: new Date().toISOString(), // Just now
    }];
    fetchTelemetry.mockResolvedValue(recentTelemetry);
    
    render(<DeviceMiniCard deviceId="esp32-drug-001" />);
    
    await waitFor(() => {
      const statusDot = screen.getByLabelText(/online/i);
      expect(statusDot).toHaveClass('bg-green-500');
    });
  });

  it('calls onCenterMap when clicked with valid coordinates', async () => {
    const mockCenterMap = jest.fn();
    fetchTelemetry.mockResolvedValue(mockTelemetry);
    
    render(
      <DeviceMiniCard 
        deviceId="esp32-drug-001" 
        onCenterMap={mockCenterMap}
      />
    );
    
    await waitFor(() => {
      const card = screen.getByRole('button');
      fireEvent.click(card);
      expect(mockCenterMap).toHaveBeenCalledWith(13.0827, 80.2707);
    });
  });

  it('does not call onCenterMap when coordinates are missing', async () => {
    const mockCenterMap = jest.fn();
    const telemetryNoCoords = [{
      ...mockTelemetry[0],
      lat: null,
      lon: null,
    }];
    fetchTelemetry.mockResolvedValue(telemetryNoCoords);
    
    render(
      <DeviceMiniCard 
        deviceId="esp32-drug-001" 
        onCenterMap={mockCenterMap}
      />
    );
    
    await waitFor(() => {
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('tabIndex', '-1'); // Not clickable
    });
    
    expect(mockCenterMap).not.toHaveBeenCalled();
  });

  it('displays sparkline when data available', async () => {
    fetchTelemetry.mockResolvedValue(mockTelemetry);
    
    const { container } = render(<DeviceMiniCard deviceId="esp32-drug-001" />);
    
    await waitFor(() => {
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    fetchTelemetry.mockRejectedValue(new Error('Network error'));
    
    render(<DeviceMiniCard deviceId="esp32-drug-001" />);
    
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });
});

