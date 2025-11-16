/**
 * Convert UTC timestamp to IST (Asia/Kolkata) and format it nicely
 * @param {string|Date} timestamp - UTC timestamp (ISO string or Date object)
 * @returns {string} Formatted date string in IST (e.g., "Nov 15, 2025 5:36 PM")
 */
export const formatToIST = (timestamp) => {
  if (!timestamp) return 'N/A';
  
  try {
    let date;
    
    if (typeof timestamp === 'string') {
      // If it ends with Z, it's UTC. Otherwise, treat as UTC
      const utcStr = timestamp.endsWith('Z') ? timestamp : timestamp + 'Z';
      date = new Date(utcStr);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    
    // Validate date
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    // Convert to IST and format nicely
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    console.error('Error formatting date:', e);
    // Fallback to simple format
    return formatToISTSimple(timestamp);
  }
};

/**
 * Format timestamp to IST using toLocaleString (simpler, no date-fns dependency)
 * @param {string|Date} timestamp - UTC timestamp
 * @returns {string} Formatted date string in IST
 */
export const formatToISTSimple = (timestamp) => {
  if (!timestamp) return 'N/A';
  
  try {
    let date;
    
    if (typeof timestamp === 'string') {
      const utcStr = timestamp.endsWith('Z') ? timestamp : timestamp + 'Z';
      date = new Date(utcStr);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }
    
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    // Convert to IST using toLocaleString
    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (e) {
    console.error('Error formatting date:', e);
    return 'Invalid date';
  }
};

