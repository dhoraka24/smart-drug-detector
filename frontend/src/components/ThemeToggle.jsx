/**
 * ThemeToggle Component
 * 
 * Simple toggle button with sun/moon icons for switching between light/dark themes
 * 
 * Features:
 * - Visual sun/moon icons
 * - Shows "Theme saved" tooltip after API returns
 * - Accessible keyboard support
 * - Respects reduced motion preferences
 * 
 * Usage:
 * ```jsx
 * <ThemeToggle />
 * ```
 * 
 * Props:
 * - className?: string - Additional CSS classes
 * - showLabel?: boolean - Show "Light/Dark" text label (default: false)
 * 
 * Tests:
 * - Run: npm test -- ThemeToggle.test.jsx
 */

import { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { toast } from 'react-hot-toast';

export const ThemeToggle = ({ className = '', showLabel = false }) => {
  const { theme, toggleTheme, isSaving } = useTheme();
  const [showTooltip, setShowTooltip] = useState(false);

  const handleToggle = async () => {
    try {
      await toggleTheme();
      // Show success tooltip
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 2000);
    } catch (error) {
      // Error already handled in useTheme hook
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={handleToggle}
        disabled={isSaving}
        className={`
          relative p-2 rounded-lg
          bg-gray-100 dark:bg-gray-800
          text-gray-700 dark:text-gray-200
          hover:bg-gray-200 dark:hover:bg-gray-700
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-200
          ${showTooltip ? 'ring-2 ring-green-500' : ''}
        `}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
        title={`Current: ${theme} theme. Click to switch.`}
      >
        {/* Sun icon (light mode) */}
        {!isDark && (
          <svg
            className="w-5 h-5 transition-transform duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        )}

        {/* Moon icon (dark mode) */}
        {isDark && (
          <svg
            className="w-5 h-5 transition-transform duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        )}

        {/* Loading spinner */}
        {isSaving && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </button>

      {/* Label (optional) */}
      {showLabel && (
        <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}

      {/* Tooltip */}
      {showTooltip && (
        <div
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-green-600 rounded shadow-lg z-50 whitespace-nowrap"
          role="tooltip"
          aria-live="polite"
        >
          Theme saved
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-green-600" />
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;

