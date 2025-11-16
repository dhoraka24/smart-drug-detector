/**
 * AlertCard Component
 * 
 * Renders alert summary with accessible animations
 * 
 * Features:
 * - WARNING: subtle yellow pulse animation
 * - HIGH: red pulsing glow + small shake animation on appear
 * - Respects prefers-reduced-motion
 * - Accessible ARIA labels
 * 
 * Usage:
 * ```jsx
 * <AlertCard alert={alertData} />
 * ```
 * 
 * Props:
 * - alert: object - Alert data with severity, short_message, etc.
 * - className?: string - Additional CSS classes
 * - onClick?: function - Click handler
 * 
 * CSS Variables:
 * - --alert-glow-duration: 600ms (default)
 * 
 * Tests:
 * - Run: npm test -- AlertCard.test.jsx
 */

import { useEffect, useRef } from 'react';

/**
 * Check if user prefers reduced motion
 */
const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const AlertCard = ({ alert, className = '', onClick }) => {
  const cardRef = useRef(null);
  const isHigh = alert.severity === 'HIGH';
  const isWarning = alert.severity === 'WARNING';
  const reducedMotion = prefersReducedMotion();

  // Apply animation classes on mount
  useEffect(() => {
    if (!cardRef.current || reducedMotion) return;

    const card = cardRef.current;

    if (isHigh) {
      // Add shake animation for HIGH alerts
      card.classList.add('alert-shake');
      // Remove after animation completes
      const timeout = setTimeout(() => {
        card.classList.remove('alert-shake');
      }, 600);
      return () => clearTimeout(timeout);
    }
  }, [isHigh, reducedMotion]);

  const getSeverityStyles = () => {
    if (isHigh) {
      return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 alert-glow-red';
    } else if (isWarning) {
      return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 alert-pulse-yellow';
    } else {
      return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    }
  };

  const getSeverityBadge = () => {
    if (isHigh) {
      return 'bg-red-600 text-white';
    } else if (isWarning) {
      return 'bg-yellow-500 text-white';
    } else {
      return 'bg-green-600 text-white';
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown';
    try {
      return new Date(timestamp).toLocaleString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <div
      ref={cardRef}
      className={`
        relative p-4 rounded-lg border-2 transition-all duration-200
        ${getSeverityStyles()}
        ${onClick ? 'cursor-pointer hover:shadow-lg' : ''}
        ${className}
      `}
      onClick={onClick}
      role="article"
      aria-label={`${alert.severity} alert: ${alert.short_message}`}
      aria-live="polite"
    >
      {/* Severity badge */}
      <div className="flex items-center justify-between mb-2">
        <span
          className={`
            px-2 py-1 text-xs font-semibold rounded
            ${getSeverityBadge()}
          `}
        >
          {alert.severity}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {formatTime(alert.ts || alert.created_at)}
        </span>
      </div>

      {/* Message */}
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
        {alert.short_message}
      </p>

      {/* Device and sensor data */}
      <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
        {alert.device_id && (
          <span>
            <strong>Device:</strong> {alert.device_id}
          </span>
        )}
        {alert.mq3 !== undefined && (
          <span>
            <strong>MQ3:</strong> {alert.mq3}
          </span>
        )}
        {alert.mq135 !== undefined && (
          <span>
            <strong>MQ135:</strong> {alert.mq135}
          </span>
        )}
      </div>

      {/* CSS for animations - injected via style tag */}
      <style>{`
        :root {
          --alert-glow-duration: 600ms;
        }

        @media (prefers-reduced-motion: reduce) {
          .alert-glow-red,
          .alert-pulse-yellow,
          .alert-shake {
            animation: none !important;
          }
        }

        .alert-glow-red {
          animation: glowRed var(--alert-glow-duration) ease-in-out;
        }

        .alert-pulse-yellow {
          animation: pulseYellow 2s ease-in-out infinite;
        }

        .alert-shake {
          animation: shake 0.5s ease-in-out;
        }

        @keyframes glowRed {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
          }
          50% {
            box-shadow: 0 0 20px 5px rgba(239, 68, 68, 0.6);
          }
        }

        @keyframes pulseYellow {
          0%, 100% {
            opacity: 1;
            box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4);
          }
          50% {
            opacity: 0.95;
            box-shadow: 0 0 10px 2px rgba(245, 158, 11, 0.6);
          }
        }

        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          10%, 30%, 50%, 70%, 90% {
            transform: translateX(-2px);
          }
          20%, 40%, 60%, 80% {
            transform: translateX(2px);
          }
        }
      `}</style>
    </div>
  );
};

export default AlertCard;

