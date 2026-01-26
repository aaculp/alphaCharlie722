/**
 * Timezone Detection Utility
 * 
 * Provides functions for detecting and working with device timezones.
 * Uses the JavaScript Intl API for reliable, cross-platform timezone detection.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 6.2
 */

/**
 * Mapping of IANA timezone identifiers to friendly, human-readable names.
 * Covers major timezones across US, Europe, Asia, and other regions.
 */
const TIMEZONE_FRIENDLY_NAMES: Record<string, string> = {
  // UTC
  'UTC': 'UTC',
  
  // US Timezones
  'America/New_York': 'Eastern Time (ET)',
  'America/Chicago': 'Central Time (CT)',
  'America/Denver': 'Mountain Time (MT)',
  'America/Los_Angeles': 'Pacific Time (PT)',
  'America/Anchorage': 'Alaska Time (AKT)',
  'Pacific/Honolulu': 'Hawaii Time (HT)',
  
  // European Timezones
  'Europe/London': 'London (GMT)',
  'Europe/Paris': 'Paris (CET)',
  'Europe/Berlin': 'Berlin (CET)',
  'Europe/Rome': 'Rome (CET)',
  'Europe/Madrid': 'Madrid (CET)',
  'Europe/Amsterdam': 'Amsterdam (CET)',
  'Europe/Brussels': 'Brussels (CET)',
  'Europe/Vienna': 'Vienna (CET)',
  'Europe/Stockholm': 'Stockholm (CET)',
  'Europe/Copenhagen': 'Copenhagen (CET)',
  'Europe/Oslo': 'Oslo (CET)',
  'Europe/Helsinki': 'Helsinki (EET)',
  'Europe/Athens': 'Athens (EET)',
  'Europe/Istanbul': 'Istanbul (TRT)',
  'Europe/Moscow': 'Moscow (MSK)',
  
  // Asian Timezones
  'Asia/Tokyo': 'Tokyo (JST)',
  'Asia/Seoul': 'Seoul (KST)',
  'Asia/Shanghai': 'Shanghai (CST)',
  'Asia/Hong_Kong': 'Hong Kong (HKT)',
  'Asia/Singapore': 'Singapore (SGT)',
  'Asia/Bangkok': 'Bangkok (ICT)',
  'Asia/Dubai': 'Dubai (GST)',
  'Asia/Kolkata': 'India (IST)',
  'Asia/Jakarta': 'Jakarta (WIB)',
  'Asia/Manila': 'Manila (PHT)',
  
  // Australian Timezones
  'Australia/Sydney': 'Sydney (AEDT)',
  'Australia/Melbourne': 'Melbourne (AEDT)',
  'Australia/Brisbane': 'Brisbane (AEST)',
  'Australia/Perth': 'Perth (AWST)',
  
  // Other Americas
  'America/Toronto': 'Toronto (ET)',
  'America/Vancouver': 'Vancouver (PT)',
  'America/Mexico_City': 'Mexico City (CST)',
  'America/Sao_Paulo': 'São Paulo (BRT)',
  'America/Buenos_Aires': 'Buenos Aires (ART)',
  
  // Middle East
  'Asia/Jerusalem': 'Jerusalem (IST)',
  'Asia/Riyadh': 'Riyadh (AST)',
  
  // Africa
  'Africa/Cairo': 'Cairo (EET)',
  'Africa/Johannesburg': 'Johannesburg (SAST)',
  'Africa/Lagos': 'Lagos (WAT)',
  
  // Pacific
  'Pacific/Auckland': 'Auckland (NZDT)',
  'Pacific/Fiji': 'Fiji (FJT)',
};

/**
 * Detects the device timezone using the Intl API.
 * 
 * This function uses `Intl.DateTimeFormat().resolvedOptions().timeZone` to detect
 * the timezone configured on the user's device. The result is validated to ensure
 * it's in IANA format (e.g., 'America/New_York', 'Europe/London').
 * 
 * The function is designed to never throw exceptions and always return a valid
 * timezone string. If detection fails for any reason, it falls back to 'UTC'.
 * 
 * @returns {string} IANA timezone string (e.g., 'America/New_York') or 'UTC' on failure
 * 
 * @example
 * ```typescript
 * // Successful detection
 * const timezone = getDeviceTimezone();
 * console.log(timezone); // 'America/New_York'
 * 
 * // Use in notification preferences
 * const preferences = {
 *   timezone: getDeviceTimezone(),
 *   quietHoursStart: '22:00',
 *   quietHoursEnd: '08:00'
 * };
 * ```
 * 
 * @example
 * ```typescript
 * // Detection failure (returns 'UTC')
 * // This happens when:
 * // - Intl API is unavailable
 * // - Timezone format is invalid
 * // - Any unexpected error occurs
 * const timezone = getDeviceTimezone();
 * console.log(timezone); // 'UTC'
 * ```
 */
export function getDeviceTimezone(): string {
  try {
    // Attempt to detect timezone using Intl API
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Validate that we got a non-empty string
    if (!detectedTimezone || typeof detectedTimezone !== 'string') {
      console.warn('Timezone detection returned invalid value:', detectedTimezone);
      return 'UTC';
    }
    
    // Validate IANA format (should contain '/' or be 'UTC')
    // Valid examples: 'America/New_York', 'Europe/London', 'Asia/Tokyo', 'UTC'
    // Invalid examples: 'EST', 'PST', '', undefined
    const isValidIANAFormat = detectedTimezone === 'UTC' || detectedTimezone.includes('/');
    
    if (!isValidIANAFormat) {
      console.warn('Timezone detection returned non-IANA format:', detectedTimezone);
      return 'UTC';
    }
    
    // Log successful detection for monitoring
    console.log('Timezone detected successfully:', detectedTimezone);
    
    return detectedTimezone;
  } catch (error) {
    // Log error with details for debugging
    console.error('Timezone detection failed:', error);
    
    // Log stack trace if available
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
    
    // Always return UTC as safe fallback
    return 'UTC';
  }
}

/**
 * Converts an IANA timezone identifier to a friendly, human-readable name.
 * 
 * This function takes an IANA timezone string (e.g., 'America/New_York') and
 * returns a more user-friendly name (e.g., 'Eastern Time (ET)'). This is useful
 * for displaying timezones in the UI where technical IANA names might be confusing
 * to users.
 * 
 * The function includes mappings for major timezones across:
 * - United States (Eastern, Central, Mountain, Pacific, Alaska, Hawaii)
 * - Europe (London, Paris, Berlin, Rome, etc.)
 * - Asia (Tokyo, Seoul, Shanghai, Hong Kong, Singapore, etc.)
 * - Australia (Sydney, Melbourne, Brisbane, Perth)
 * - Other regions (Middle East, Africa, Pacific, Americas)
 * 
 * If the provided timezone is not in the mapping, the function returns the
 * original IANA format as a fallback. This ensures the function always returns
 * a valid string that can be displayed to users.
 * 
 * @param {string} ianaTimezone - IANA timezone identifier (e.g., 'America/New_York')
 * @returns {string} Friendly timezone name or original IANA format if not mapped
 * 
 * @example
 * ```typescript
 * // Common US timezones
 * getFriendlyTimezoneName('America/New_York');     // 'Eastern Time (ET)'
 * getFriendlyTimezoneName('America/Los_Angeles');  // 'Pacific Time (PT)'
 * getFriendlyTimezoneName('America/Chicago');      // 'Central Time (CT)'
 * ```
 * 
 * @example
 * ```typescript
 * // European timezones
 * getFriendlyTimezoneName('Europe/London');  // 'London (GMT)'
 * getFriendlyTimezoneName('Europe/Paris');   // 'Paris (CET)'
 * ```
 * 
 * @example
 * ```typescript
 * // Asian timezones
 * getFriendlyTimezoneName('Asia/Tokyo');      // 'Tokyo (JST)'
 * getFriendlyTimezoneName('Asia/Singapore');  // 'Singapore (SGT)'
 * ```
 * 
 * @example
 * ```typescript
 * // Unknown timezone (fallback to IANA format)
 * getFriendlyTimezoneName('America/Obscure_City');  // 'America/Obscure_City'
 * ```
 * 
 * @example
 * ```typescript
 * // Use in UI display
 * const deviceTz = getDeviceTimezone();
 * const friendlyName = getFriendlyTimezoneName(deviceTz);
 * console.log(`Your timezone: ${friendlyName}`);
 * // Output: "Your timezone: Eastern Time (ET)"
 * ```
 */
export function getFriendlyTimezoneName(ianaTimezone: string): string {
  // Look up the timezone in our mapping
  const friendlyName = TIMEZONE_FRIENDLY_NAMES[ianaTimezone];
  
  // Return the friendly name if found, otherwise return the original IANA format
  // This ensures we always return a valid string that can be displayed
  return friendlyName || ianaTimezone;
}
