/**
 * useTheme Hook
 * 
 * Provides theme management with immediate UI updates and backend persistence
 * 
 * Features:
 * - Instant theme application (no page reload)
 * - Respects prefers-reduced-motion
 * - Persists to backend via API
 * - Falls back gracefully on API errors
 * 
 * Usage:
 * ```jsx
 * const { theme, setTheme, applyThemeInstantly } = useTheme();
 * 
 * // Toggle theme
 * setTheme(theme === 'light' ? 'dark' : 'light');
 * ```
 * 
 * Environment:
 * - Requires backend API endpoint: /api/v1/preferences
 * - Uses authenticated API calls from store/auth
 */

import { useState, useEffect, useCallback } from 'react';
import { getPreferences, updatePreferences } from '../api';
import { toast } from 'react-hot-toast';

/**
 * Check if user prefers reduced motion
 */
const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Apply theme to document root element
 * @param {string} theme - 'light' or 'dark'
 */
const applyThemeToDOM = (theme) => {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  
  // Store in localStorage as backup
  try {
    localStorage.setItem('theme', theme);
  } catch (e) {
    // Ignore localStorage errors
  }
};

/**
 * Get initial theme from localStorage or system preference
 */
const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'light';
  
  // Check localStorage first
  try {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch (e) {
    // Ignore localStorage errors
  }
  
  // Check system preference
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  
  return 'light';
};

export const useTheme = () => {
  const [theme, setThemeState] = useState(getInitialTheme());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load theme from backend on mount (only if authenticated to avoid flicker on login page)
  useEffect(() => {
    const loadTheme = async () => {
      try {
        // Check if user is authenticated before trying to load preferences
        const token = localStorage.getItem('token');
        if (!token) {
          // Not authenticated, use local theme only
          const localTheme = getInitialTheme();
          setThemeState(localTheme);
          applyThemeToDOM(localTheme);
          setIsLoading(false);
          return;
        }

        const prefs = await getPreferences();
        if (prefs.theme) {
          setThemeState(prefs.theme);
          applyThemeToDOM(prefs.theme);
        }
      } catch (error) {
        console.warn('Failed to load theme from backend, using local:', error);
        // Use local theme as fallback
        const localTheme = getInitialTheme();
        setThemeState(localTheme);
        applyThemeToDOM(localTheme);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  /**
   * Apply theme instantly to DOM (no API call)
   */
  const applyThemeInstantly = useCallback((newTheme) => {
    if (newTheme !== 'light' && newTheme !== 'dark') {
      console.warn(`Invalid theme: ${newTheme}, defaulting to light`);
      newTheme = 'light';
    }
    
    setThemeState(newTheme);
    applyThemeToDOM(newTheme);
  }, []);

  /**
   * Set theme and persist to backend
   */
  const setTheme = useCallback(async (newTheme) => {
    if (newTheme !== 'light' && newTheme !== 'dark') {
      console.warn(`Invalid theme: ${newTheme}, defaulting to light`);
      newTheme = 'light';
    }

    // Apply immediately (optimistic update)
    const previousTheme = theme;
    applyThemeInstantly(newTheme);

    // Persist to backend
    setIsSaving(true);
    try {
      await updatePreferences({ theme: newTheme });
      // Success - theme already applied
    } catch (error) {
      console.error('Failed to save theme:', error);
      
      // Revert on error
      applyThemeInstantly(previousTheme);
      
      toast.error('Failed to save theme preference');
      
      // Re-throw for caller to handle if needed
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [theme, applyThemeInstantly]);

  /**
   * Toggle between light and dark
   */
  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [theme, setTheme]);

  return {
    theme,
    setTheme,
    toggleTheme,
    applyThemeInstantly,
    isLoading,
    isSaving,
    prefersReducedMotion: prefersReducedMotion(),
  };
};

