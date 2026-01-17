/**
 * Security Module
 * 
 * This module provides security utilities for the Edge Function:
 * - Credential exposure prevention
 * - Input sanitization
 * - UUID validation
 * 
 * Requirement 3.4: Validate no credentials in logs/responses, sanitize inputs, validate UUID format
 */

/**
 * List of sensitive keywords that should never appear in logs or responses
 */
const SENSITIVE_KEYWORDS = [
  'private_key',
  'service_account',
  'client_email',
  'client_id',
  'auth_uri',
  'token_uri',
  'auth_provider',
  'client_x509',
  'FIREBASE_SERVICE_ACCOUNT',
  'SUPABASE_SERVICE_ROLE_KEY',
  'Bearer ',
  'eyJ', // JWT token prefix
  'password',
  'secret',
  'api_key',
  'apikey',
];

/**
 * Sanitize a string by removing or redacting sensitive information
 * 
 * This function scans for sensitive keywords and redacts them to prevent
 * credential exposure in logs or responses.
 * 
 * @param input - String to sanitize
 * @returns Sanitized string with sensitive data redacted
 */
export function sanitizeString(input: string): string {
  let sanitized = input;
  
  // Redact JWT tokens (Bearer tokens)
  sanitized = sanitized.replace(/Bearer\s+[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/gi, 'Bearer [REDACTED]');
  
  // Redact standalone JWT tokens
  sanitized = sanitized.replace(/eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/g, '[JWT_REDACTED]');
  
  // Redact private keys
  sanitized = sanitized.replace(/"private_key"\s*:\s*"[^"]+"/gi, '"private_key": "[REDACTED]"');
  
  // Redact service account emails
  sanitized = sanitized.replace(/"client_email"\s*:\s*"[^"]+"/gi, '"client_email": "[REDACTED]"');
  
  // Redact any remaining sensitive keywords
  SENSITIVE_KEYWORDS.forEach(keyword => {
    const regex = new RegExp(keyword, 'gi');
    if (regex.test(sanitized)) {
      sanitized = sanitized.replace(regex, '[REDACTED]');
    }
  });
  
  return sanitized;
}

/**
 * Sanitize an object by removing or redacting sensitive fields
 * 
 * This function recursively scans an object for sensitive data and redacts it.
 * 
 * @param obj - Object to sanitize
 * @returns Sanitized object with sensitive data redacted
 */
export function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    
    // Redact sensitive fields entirely
    if (
      lowerKey.includes('password') ||
      lowerKey.includes('secret') ||
      lowerKey.includes('private_key') ||
      lowerKey.includes('service_account') ||
      lowerKey.includes('api_key') ||
      lowerKey.includes('apikey') ||
      lowerKey.includes('token') && lowerKey !== 'device_token' // Allow device_token but not auth tokens
    ) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Validate that a string does not contain credentials
 * 
 * This function checks if a string contains any sensitive information
 * that should not be exposed in logs or responses.
 * 
 * @param input - String to validate
 * @returns true if string is safe (no credentials), false if credentials detected
 */
export function validateNoCredentials(input: string): boolean {
  // Check for JWT tokens
  if (/eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/.test(input)) {
    return false;
  }
  
  // Check for Bearer tokens
  if (/Bearer\s+[A-Za-z0-9\-_]+/i.test(input)) {
    return false;
  }
  
  // Check for private keys (PEM format)
  if (/-----BEGIN PRIVATE KEY-----/.test(input)) {
    return false;
  }
  
  // Check for service account JSON structure
  if (/"private_key"\s*:\s*"[^"]+"/i.test(input)) {
    return false;
  }
  
  // Check for sensitive keywords
  const lowerInput = input.toLowerCase();
  const dangerousKeywords = [
    'private_key',
    'service_account',
    'client_email',
    'auth_uri',
    'token_uri',
  ];
  
  for (const keyword of dangerousKeywords) {
    if (lowerInput.includes(keyword)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Validate UUID format
 * 
 * This function validates that a string is a valid UUID v4 format.
 * 
 * Requirement 3.4: Validate offer ID format (UUID)
 * 
 * @param uuid - String to validate as UUID
 * @returns true if valid UUID, false otherwise
 */
export function isValidUUID(uuid: string): boolean {
  if (typeof uuid !== 'string') {
    return false;
  }
  
  // UUID v4 regex pattern
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  return uuidRegex.test(uuid);
}

/**
 * Sanitize user input string
 * 
 * This function sanitizes user input to prevent injection attacks and
 * ensure data integrity.
 * 
 * Requirement 3.4: Sanitize all user inputs
 * 
 * @param input - User input string
 * @param maxLength - Maximum allowed length (default: 1000)
 * @returns Sanitized string
 */
export function sanitizeUserInput(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Trim whitespace
  let sanitized = input.trim();
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  // Remove control characters (except newlines and tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  
  return sanitized;
}

/**
 * Validate and sanitize offer ID
 * 
 * This function validates that an offer ID is a valid UUID and sanitizes it.
 * 
 * @param offerId - Offer ID to validate
 * @returns Object with validation result and sanitized ID
 */
export function validateOfferId(offerId: any): {
  valid: boolean;
  sanitized: string | null;
  error: string | null;
} {
  // Check if offerId is provided
  if (!offerId) {
    return {
      valid: false,
      sanitized: null,
      error: 'Offer ID is required',
    };
  }
  
  // Check if offerId is a string
  if (typeof offerId !== 'string') {
    return {
      valid: false,
      sanitized: null,
      error: 'Offer ID must be a string',
    };
  }
  
  // Sanitize the input
  const sanitized = sanitizeUserInput(offerId, 100);
  
  // Validate UUID format
  if (!isValidUUID(sanitized)) {
    return {
      valid: false,
      sanitized: null,
      error: 'Invalid offer ID format. Expected UUID.',
    };
  }
  
  return {
    valid: true,
    sanitized,
    error: null,
  };
}

/**
 * Create a safe logger that automatically sanitizes output
 * 
 * This function wraps console logging methods to automatically sanitize
 * any output before logging, preventing credential exposure.
 * 
 * @returns Safe logger object with sanitized logging methods
 */
export function createSafeLogger() {
  return {
    log: (...args: any[]) => {
      const sanitizedArgs = args.map(arg => 
        typeof arg === 'object' ? sanitizeObject(arg) : sanitizeString(String(arg))
      );
      console.log(...sanitizedArgs);
    },
    
    error: (...args: any[]) => {
      const sanitizedArgs = args.map(arg => 
        typeof arg === 'object' ? sanitizeObject(arg) : sanitizeString(String(arg))
      );
      console.error(...sanitizedArgs);
    },
    
    warn: (...args: any[]) => {
      const sanitizedArgs = args.map(arg => 
        typeof arg === 'object' ? sanitizeObject(arg) : sanitizeString(String(arg))
      );
      console.warn(...sanitizedArgs);
    },
    
    info: (...args: any[]) => {
      const sanitizedArgs = args.map(arg => 
        typeof arg === 'object' ? sanitizeObject(arg) : sanitizeString(String(arg))
      );
      console.info(...sanitizedArgs);
    },
  };
}

/**
 * Validate response body for credential exposure
 * 
 * This function validates that a response body does not contain any
 * sensitive credentials before sending it to the client.
 * 
 * @param body - Response body to validate
 * @returns Object with validation result and sanitized body
 */
export function validateResponseBody(body: any): {
  safe: boolean;
  sanitized: any;
  violations: string[];
} {
  const violations: string[] = [];
  
  // Convert body to string for validation
  const bodyString = JSON.stringify(body);
  
  // Check for credentials
  if (!validateNoCredentials(bodyString)) {
    violations.push('Response contains credentials');
  }
  
  // Check for sensitive keywords
  SENSITIVE_KEYWORDS.forEach(keyword => {
    if (bodyString.toLowerCase().includes(keyword.toLowerCase())) {
      violations.push(`Response contains sensitive keyword: ${keyword}`);
    }
  });
  
  // Sanitize the body
  const sanitized = sanitizeObject(body);
  
  return {
    safe: violations.length === 0,
    sanitized,
    violations,
  };
}
