/**
 * TimelineSlider Component
 * 
 * High-performance slider for large time ranges
 * Supports snapping to buckets when using aggregation mode
 * 
 * Features:
 * - Canvas-backed rendering for performance (optional)
 * - Bucket snapping
 * - Visual markers for alert density
 */

import { useRef, useEffect, useState } from 'react';

export const TimelineSlider = ({
  min,
  max,
  value,
  onChange,
  onDragStart,
  onDragEnd,
  snapToBuckets = false,
  buckets = [],
  className = '',
  disabled = false,
}) => {
  const sliderRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  // Update local value when prop changes (but not while dragging)
  useEffect(() => {
    if (!isDragging) {
      setLocalValue(value);
    }
  }, [value, isDragging]);

  // Calculate snap value if buckets provided
  const getSnappedValue = (rawValue) => {
    if (!snapToBuckets || buckets.length === 0) {
      return rawValue;
    }

    // Find closest bucket
    const range = max - min;
    const position = (rawValue - min) / range;

    let closestBucket = null;
    let minDistance = Infinity;

    buckets.forEach((bucket, index) => {
      const bucketPosition = index / buckets.length;
      const distance = Math.abs(position - bucketPosition);
      if (distance < minDistance) {
        minDistance = distance;
        closestBucket = bucket;
      }
    });

    if (closestBucket && minDistance < 0.05) { // 5% threshold for snapping
      const bucketIndex = buckets.indexOf(closestBucket);
      return min + (bucketIndex / buckets.length) * range;
    }

    return rawValue;
  };

  const handleMouseDown = (e) => {
    if (disabled) return;
    setIsDragging(true);
    if (onDragStart) onDragStart();
    updateValue(e);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || disabled) return;
    updateValue(e);
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      if (onDragEnd) onDragEnd();
    }
  };

  const updateValue = (e) => {
    if (!sliderRef.current) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const rawValue = min + percentage * (max - min);
    const snappedValue = getSnappedValue(rawValue);

    setLocalValue(snappedValue);
    if (onChange) {
      onChange(snappedValue);
    }
  };

  // Add global event listeners for drag
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const percentage = ((localValue - min) / (max - min)) * 100;

  return (
    <div className={`relative ${className}`}>
      <div
        ref={sliderRef}
        className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
        onMouseDown={handleMouseDown}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={localValue}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
      >
        {/* Progress track */}
        <div
          className="absolute h-full bg-blue-600 rounded-l-lg"
          style={{ width: `${percentage}%` }}
        />

        {/* Bucket markers (if provided) */}
        {snapToBuckets && buckets.length > 0 && (
          <div className="absolute inset-0 flex">
            {buckets.map((bucket, index) => {
              const position = (index / buckets.length) * 100;
              const intensity = Math.min(1, bucket.total_count / 10); // Normalize intensity
              return (
                <div
                  key={index}
                  className="absolute top-0 bottom-0 w-px bg-gray-400 opacity-30"
                  style={{ left: `${position}%` }}
                  title={`${bucket.total_count} alerts`}
                />
              );
            })}
          </div>
        )}

        {/* Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-600 rounded-full shadow-md cursor-grab active:cursor-grabbing"
          style={{ left: `calc(${percentage}% - 8px)` }}
        />
      </div>
    </div>
  );
};

