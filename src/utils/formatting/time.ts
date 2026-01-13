/**
 * Time formatting utilities for check-in history
 * 
 * This module provides utilities for formatting timestamps, durations,
 * and visit counts in a user-friendly format.
 */

/**
 * Format a check-in timestamp as relative time or full date
 * 
 * Rules:
 * - Within 7 days: relative time (e.g., "2 hours ago", "Yesterday")
 * - Today: "Today at HH:MM AM/PM"
 * - Older than 7 days: full date (e.g., "Jan 5, 2026")
 * 
 * @param timestamp - ISO 8601 timestamp string
 * @returns Formatted time string
 */
export function formatCheckInTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Check if it's today
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `Today at ${displayHours}:${displayMinutes} ${ampm}`;
  }

  // Within 7 days: use relative time
  if (diffDays < 7) {
    if (diffMinutes < 60) {
      if (diffMinutes <= 1) {
        return 'Just now';
      }
      return `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      if (diffHours === 1) {
        return '1 hour ago';
      }
      return `${diffHours} hours ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else {
      return `${diffDays} days ago`;
    }
  }

  // Older than 7 days: use full date
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  
  return `${month} ${day}, ${year}`;
}

/**
 * Calculate and format duration between two timestamps
 * 
 * Rules:
 * - If endTime is null: "Currently checked in"
 * - Less than 1 hour: "Xm" (e.g., "45m")
 * - 1 hour or more: "Xh Ym" (e.g., "2h 30m")
 * 
 * @param startTime - ISO 8601 timestamp string for check-in
 * @param endTime - ISO 8601 timestamp string for check-out, or null if still checked in
 * @returns Formatted duration string
 */
export function formatDuration(startTime: string, endTime: string | null): string {
  if (endTime === null) {
    return 'Currently checked in';
  }

  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end.getTime() - start.getTime();
  const totalMinutes = Math.floor(diffMs / (1000 * 60));

  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

/**
 * Format visit count with ordinal suffix
 * 
 * Rules:
 * - Count of 1: "First visit"
 * - Count > 1: "Xth visit" with proper ordinal suffix (2nd, 3rd, 4th, etc.)
 * 
 * @param count - Number of visits
 * @returns Formatted visit count string
 */
export function formatVisitCount(count: number): string {
  if (count === 1) {
    return 'First visit';
  }

  // Determine ordinal suffix
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  let suffix = 'th';
  
  // Special cases for 11, 12, 13
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    suffix = 'th';
  } else if (lastDigit === 1) {
    suffix = 'st';
  } else if (lastDigit === 2) {
    suffix = 'nd';
  } else if (lastDigit === 3) {
    suffix = 'rd';
  }

  return `${count}${suffix} visit`;
}
