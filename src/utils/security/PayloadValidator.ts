/**
 * PayloadValidator
 * 
 * Validates notification payloads to ensure they are properly formatted
 * and don't contain malicious or misleading content.
 * 
 * Requirements: 15.6
 */

import type { NotificationPayload } from '../../services/FCMService';
import type { SocialNotificationPayload } from '../../services/PushNotificationService';

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validation rules for notification content
 */
const VALIDATION_RULES = {
  // Maximum lengths
  MAX_TITLE_LENGTH: 100,
  MAX_BODY_LENGTH: 500,
  MAX_DATA_KEY_LENGTH: 50,
  MAX_DATA_VALUE_LENGTH: 1000,
  
  // Prohibited patterns (case-insensitive)
  PROHIBITED_PATTERNS: [
    /\b(click here|act now|limited time|urgent|winner|congratulations)\b/i,
    /<script[^>]*>.*?<\/script>/gi, // Script tags
    /<iframe[^>]*>.*?<\/iframe>/gi, // Iframe tags
    /javascript:/gi, // JavaScript protocol
    /on\w+\s*=/gi, // Event handlers (onclick, onload, etc.)
  ],
  
  // Required fields
  REQUIRED_FIELDS: ['title', 'body', 'data'],
  REQUIRED_DATA_FIELDS: ['type', 'navigationTarget'],
};

export class PayloadValidator {
  /**
   * Validate a social notification payload
   * 
   * @param payload - Social notification payload to validate
   * @returns Validation result with errors if any
   */
  static validateSocialPayload(payload: SocialNotificationPayload): ValidationResult {
    const errors: string[] = [];

    // Check required fields
    if (!payload.title || typeof payload.title !== 'string') {
      errors.push('Title is required and must be a string');
    }

    if (!payload.body || typeof payload.body !== 'string') {
      errors.push('Body is required and must be a string');
    }

    if (!payload.data || typeof payload.data !== 'object') {
      errors.push('Data is required and must be an object');
    }

    // Validate title
    if (payload.title) {
      if (payload.title.length > VALIDATION_RULES.MAX_TITLE_LENGTH) {
        errors.push(`Title exceeds maximum length of ${VALIDATION_RULES.MAX_TITLE_LENGTH} characters`);
      }

      if (this.containsProhibitedContent(payload.title)) {
        errors.push('Title contains prohibited or misleading content');
      }
    }

    // Validate body
    if (payload.body) {
      if (payload.body.length > VALIDATION_RULES.MAX_BODY_LENGTH) {
        errors.push(`Body exceeds maximum length of ${VALIDATION_RULES.MAX_BODY_LENGTH} characters`);
      }

      if (this.containsProhibitedContent(payload.body)) {
        errors.push('Body contains prohibited or misleading content');
      }
    }

    // Validate data object
    if (payload.data) {
      // Check required data fields
      if (!payload.data.type) {
        errors.push('Data.type is required');
      }

      if (!payload.data.navigationTarget) {
        errors.push('Data.navigationTarget is required');
      }

      // Validate data field lengths
      Object.entries(payload.data).forEach(([key, value]) => {
        if (key.length > VALIDATION_RULES.MAX_DATA_KEY_LENGTH) {
          errors.push(`Data key "${key}" exceeds maximum length of ${VALIDATION_RULES.MAX_DATA_KEY_LENGTH} characters`);
        }

        if (value && typeof value === 'string' && value.length > VALIDATION_RULES.MAX_DATA_VALUE_LENGTH) {
          errors.push(`Data value for "${key}" exceeds maximum length of ${VALIDATION_RULES.MAX_DATA_VALUE_LENGTH} characters`);
        }
      });
    }

    // Validate image URL if present
    if (payload.imageUrl) {
      if (!this.isValidUrl(payload.imageUrl)) {
        errors.push('Image URL is not a valid HTTPS URL');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate an FCM notification payload
   * 
   * @param payload - FCM notification payload to validate
   * @returns Validation result with errors if any
   */
  static validateFCMPayload(payload: NotificationPayload): ValidationResult {
    const errors: string[] = [];

    // Validate notification object
    if (!payload.notification || typeof payload.notification !== 'object') {
      errors.push('Notification object is required');
    } else {
      if (!payload.notification.title || typeof payload.notification.title !== 'string') {
        errors.push('Notification title is required and must be a string');
      }

      if (!payload.notification.body || typeof payload.notification.body !== 'string') {
        errors.push('Notification body is required and must be a string');
      }

      if (payload.notification.title && payload.notification.title.length > VALIDATION_RULES.MAX_TITLE_LENGTH) {
        errors.push(`Notification title exceeds maximum length of ${VALIDATION_RULES.MAX_TITLE_LENGTH} characters`);
      }

      if (payload.notification.body && payload.notification.body.length > VALIDATION_RULES.MAX_BODY_LENGTH) {
        errors.push(`Notification body exceeds maximum length of ${VALIDATION_RULES.MAX_BODY_LENGTH} characters`);
      }

      if (payload.notification.title && this.containsProhibitedContent(payload.notification.title)) {
        errors.push('Notification title contains prohibited or misleading content');
      }

      if (payload.notification.body && this.containsProhibitedContent(payload.notification.body)) {
        errors.push('Notification body contains prohibited or misleading content');
      }

      if (payload.notification.imageUrl && !this.isValidUrl(payload.notification.imageUrl)) {
        errors.push('Notification image URL is not a valid HTTPS URL');
      }
    }

    // Validate data object
    if (!payload.data || typeof payload.data !== 'object') {
      errors.push('Data object is required');
    } else {
      // Validate data field lengths
      Object.entries(payload.data).forEach(([key, value]) => {
        if (key.length > VALIDATION_RULES.MAX_DATA_KEY_LENGTH) {
          errors.push(`Data key "${key}" exceeds maximum length of ${VALIDATION_RULES.MAX_DATA_KEY_LENGTH} characters`);
        }

        if (value && value.length > VALIDATION_RULES.MAX_DATA_VALUE_LENGTH) {
          errors.push(`Data value for "${key}" exceeds maximum length of ${VALIDATION_RULES.MAX_DATA_VALUE_LENGTH} characters`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Sanitize a string by removing potentially dangerous content
   * 
   * @param input - String to sanitize
   * @returns Sanitized string
   */
  static sanitizeString(input: string): string {
    if (!input) return '';

    // Remove HTML tags
    let sanitized = input.replace(/<[^>]*>/g, '');

    // Remove JavaScript protocol
    sanitized = sanitized.replace(/javascript:/gi, '');

    // Remove event handlers
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');

    // Trim whitespace
    sanitized = sanitized.trim();

    return sanitized;
  }

  /**
   * Check if content contains prohibited patterns
   * 
   * @param content - Content to check
   * @returns True if content contains prohibited patterns
   */
  private static containsProhibitedContent(content: string): boolean {
    return VALIDATION_RULES.PROHIBITED_PATTERNS.some(pattern => pattern.test(content));
  }

  /**
   * Validate if a string is a valid HTTPS URL
   * 
   * @param url - URL to validate
   * @returns True if URL is valid and uses HTTPS
   */
  private static isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }
}
