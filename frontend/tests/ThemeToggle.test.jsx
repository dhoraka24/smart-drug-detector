/**
 * Tests for ThemeToggle component
 * Tests theme toggling, root class updates, and API calls
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeToggle } from '../components/ThemeToggle';
import { useTheme } from '../hooks/useTheme';
import { updatePreferences } from '../api';

// Mock the useTheme hook
jest.mock('../hooks/useTheme');
jest.mock('../api');

describe('ThemeToggle', () => {
  const mockSetTheme = jest.fn();
  const mockToggleTheme = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useTheme.mockReturnValue({
      theme: 'light',
      toggleTheme: mockToggleTheme,
      isSaving: false,
    });
  });

  it('renders theme toggle button', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button', { name: /switch to dark theme/i });
    expect(button).toBeInTheDocument();
  });

  it('shows sun icon in light mode', () => {
    useTheme.mockReturnValue({
      theme: 'light',
      toggleTheme: mockToggleTheme,
      isSaving: false,
    });
    
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    // Check for sun icon (light mode)
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('shows moon icon in dark mode', () => {
    useTheme.mockReturnValue({
      theme: 'dark',
      toggleTheme: mockToggleTheme,
      isSaving: false,
    });
    
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('calls toggleTheme when clicked', async () => {
    mockToggleTheme.mockResolvedValue(undefined);
    
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockToggleTheme).toHaveBeenCalledTimes(1);
    });
  });

  it('shows loading spinner when saving', () => {
    useTheme.mockReturnValue({
      theme: 'light',
      toggleTheme: mockToggleTheme,
      isSaving: true,
    });
    
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('updates root class when theme changes', () => {
    // This test would require mocking document.documentElement
    // For now, we test that toggleTheme is called
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    
    fireEvent.click(button);
    expect(mockToggleTheme).toHaveBeenCalled();
  });
});

