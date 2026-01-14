/**
 * Venue formatting utilities for spotlight features
 * 
 * This module provides utilities for calculating and formatting
 * venue signup information for the New Venues Spotlight feature.
 */

/**
 * Calculate the number of days since a venue signed up
 * 
 * @param signupDate - ISO 8601 timestamp string for venue signup
 * @returns Number of days since signup (0 for today, 1 for yesterday, etc.)
 */
export function calculateDaysSinceSignup(signupDate: string): number {
  const now = new Date();
  const signup = new Date(signupDate);
  const diffMs = now.getTime() - signup.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Format signup date as user-friendly text
 * 
 * Rules:
 * - 0 days: "Joined today"
 * - 1 day: "Joined yesterday"
 * - N days: "Joined N days ago"
 * 
 * @param days - Number of days since signup
 * @returns Formatted signup text
 */
export function formatSignupText(days: number): string {
  if (days === 0) {
    return 'Joined today';
  }
  if (days === 1) {
    return 'Joined yesterday';
  }
  return `Joined ${days} days ago`;
}

/**
 * Check if a venue is eligible for spotlight display
 * 
 * A venue is eligible if it signed up within the specified maximum days.
 * Default spotlight period is 30 days.
 * 
 * @param signupDate - ISO 8601 timestamp string for venue signup
 * @param maxDays - Maximum number of days for spotlight eligibility (default: 30)
 * @returns True if venue is eligible for spotlight, false otherwise
 */
export function isEligibleForSpotlight(signupDate: string, maxDays: number = 30): boolean {
  const days = calculateDaysSinceSignup(signupDate);
  return days >= 0 && days <= maxDays;
}
