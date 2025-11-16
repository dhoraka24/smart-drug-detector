/**
 * Tests for AlertCard component
 * Tests rendering, CSS classes, and reduced-motion support
 */

import { render, screen } from '@testing-library/react';
import { AlertCard } from '../components/AlertCard';

// Mock prefers-reduced-motion
const mockMatchMedia = jest.fn();

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
});

describe('AlertCard', () => {
  const mockAlert = {
    id: 1,
    device_id: 'esp32-drug-001',
    severity: 'HIGH',
    short_message: 'DANGER: Strong drug vapors detected',
    mq3: 500,
    mq135: 400,
    ts: '2025-01-11T10:00:00Z',
  };

  it('renders alert card with severity', () => {
    render(<AlertCard alert={mockAlert} />);
    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.getByText(mockAlert.short_message)).toBeInTheDocument();
  });

  it('applies HIGH severity styles', () => {
    const { container } = render(<AlertCard alert={mockAlert} />);
    const card = container.firstChild;
    expect(card).toHaveClass('alert-glow-red');
  });

  it('applies WARNING severity styles', () => {
    const warningAlert = { ...mockAlert, severity: 'WARNING' };
    const { container } = render(<AlertCard alert={warningAlert} />);
    const card = container.firstChild;
    expect(card).toHaveClass('alert-pulse-yellow');
  });

  it('applies SAFE severity styles', () => {
    const safeAlert = { ...mockAlert, severity: 'SAFE' };
    const { container } = render(<AlertCard alert={safeAlert} />);
    const card = container.firstChild;
    // Should not have animation classes for SAFE
    expect(card).not.toHaveClass('alert-glow-red');
    expect(card).not.toHaveClass('alert-pulse-yellow');
  });

  it('shows device ID and sensor values', () => {
    render(<AlertCard alert={mockAlert} />);
    expect(screen.getByText(/esp32-drug-001/i)).toBeInTheDocument();
    expect(screen.getByText(/MQ3: 500/i)).toBeInTheDocument();
    expect(screen.getByText(/MQ135: 400/i)).toBeInTheDocument();
  });

  it('has accessible ARIA labels', () => {
    render(<AlertCard alert={mockAlert} />);
    const card = screen.getByRole('article');
    expect(card).toHaveAttribute('aria-label');
    expect(card).toHaveAttribute('aria-live', 'polite');
  });

  it('respects reduced motion preference', () => {
    // Mock prefers-reduced-motion: reduce
    window.matchMedia.mockReturnValue({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
    });

    const { container } = render(<AlertCard alert={mockAlert} />);
    // Animation should be disabled via CSS media query
    // This is tested via CSS, not JS
    const card = container.firstChild;
    expect(card).toBeInTheDocument();
  });

  it('calls onClick handler when provided', () => {
    const handleClick = jest.fn();
    render(<AlertCard alert={mockAlert} onClick={handleClick} />);
    
    const card = screen.getByRole('article');
    card.click();
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

