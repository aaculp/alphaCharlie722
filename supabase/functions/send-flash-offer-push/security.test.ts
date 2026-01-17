/**
 * Security Module Tests
 * 
 * Tests for security utilities including:
 * - Credential exposure prevention
 * - Input sanitization
 * - UUID validation
 * 
 * Requirement 3.4: Validate no credentials in logs/responses, sanitize inputs, validate UUID format
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import {
  sanitizeString,
  sanitizeObject,
  validateNoCredentials,
  isValidUUID,
  sanitizeUserInput,
  validateOfferId,
  validateResponseBody,
} from './security.ts';

/**
 * Test: Sanitize JWT tokens in strings
 * Validates: Requirement 3.4 - No credentials in logs/responses
 */
Deno.test('Security - Sanitize JWT tokens in strings', () => {
  const input = 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
  const sanitized = sanitizeString(input);
  
  assertEquals(sanitized.includes('eyJ'), false);
  assertEquals(sanitized.includes('Bearer [REDACTED]'), true);
});

/**
 * Test: Sanitize private keys in strings
 * Validates: Requirement 3.4 - No credentials in logs/responses
 */
Deno.test('Security - Sanitize private keys in strings', () => {
  const input = '{"private_key": "-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7"}';
  const sanitized = sanitizeString(input);
  
  assertEquals(sanitized.includes('BEGIN PRIVATE KEY'), false);
  assertEquals(sanitized.includes('[REDACTED]'), true);
});

/**
 * Test: Sanitize service account emails
 * Validates: Requirement 3.4 - No credentials in logs/responses
 */
Deno.test('Security - Sanitize service account emails', () => {
  const input = '{"client_email": "firebase-adminsdk@project.iam.gserviceaccount.com"}';
  const sanitized = sanitizeString(input);
  
  assertEquals(sanitized.includes('firebase-adminsdk'), false);
  assertEquals(sanitized.includes('[REDACTED]'), true);
});

/**
 * Test: Sanitize objects with sensitive fields
 * Validates: Requirement 3.4 - No credentials in logs/responses
 */
Deno.test('Security - Sanitize objects with sensitive fields', () => {
  const input = {
    user_id: '123',
    password: 'secret123',
    api_key: 'sk_test_123456',
    device_token: 'valid_device_token', // Should NOT be redacted
    data: {
      private_key: 'sensitive_key',
    },
  };
  
  const sanitized = sanitizeObject(input);
  
  assertEquals(sanitized.user_id, '123');
  assertEquals(sanitized.password, '[REDACTED]');
  assertEquals(sanitized.api_key, '[REDACTED]');
  assertEquals(sanitized.device_token, 'valid_device_token'); // Device tokens are allowed
  assertEquals(sanitized.data.private_key, '[REDACTED]');
});

/**
 * Test: Sanitize nested objects
 * Validates: Requirement 3.4 - No credentials in logs/responses
 */
Deno.test('Security - Sanitize nested objects', () => {
  const input = {
    level1: {
      level2: {
        level3: {
          secret: 'very_secret',
          safe_data: 'public_info',
        },
      },
    },
  };
  
  const sanitized = sanitizeObject(input);
  
  assertEquals(sanitized.level1.level2.level3.secret, '[REDACTED]');
  assertEquals(sanitized.level1.level2.level3.safe_data, 'public_info');
});

/**
 * Test: Sanitize arrays
 * Validates: Requirement 3.4 - No credentials in logs/responses
 */
Deno.test('Security - Sanitize arrays', () => {
  const input = [
    { id: '1', token: 'secret_token_1' },
    { id: '2', token: 'secret_token_2' },
  ];
  
  const sanitized = sanitizeObject(input);
  
  assertEquals(sanitized[0].id, '1');
  assertEquals(sanitized[0].token, '[REDACTED]');
  assertEquals(sanitized[1].id, '2');
  assertEquals(sanitized[1].token, '[REDACTED]');
});

/**
 * Test: Validate no credentials - JWT detection
 * Validates: Requirement 3.4 - No credentials in logs/responses
 */
Deno.test('Security - Validate no credentials detects JWT', () => {
  const withJWT = 'User token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
  const withoutJWT = 'User ID: 12345';
  
  assertEquals(validateNoCredentials(withJWT), false);
  assertEquals(validateNoCredentials(withoutJWT), true);
});

/**
 * Test: Validate no credentials - Bearer token detection
 * Validates: Requirement 3.4 - No credentials in logs/responses
 */
Deno.test('Security - Validate no credentials detects Bearer token', () => {
  const withBearer = 'Authorization: Bearer abc123xyz';
  const withoutBearer = 'Authorization: None';
  
  assertEquals(validateNoCredentials(withBearer), false);
  assertEquals(validateNoCredentials(withoutBearer), true);
});

/**
 * Test: Validate no credentials - Private key detection
 * Validates: Requirement 3.4 - No credentials in logs/responses
 */
Deno.test('Security - Validate no credentials detects private key', () => {
  const withPrivateKey = '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASC';
  const withoutPrivateKey = 'Public information';
  
  assertEquals(validateNoCredentials(withPrivateKey), false);
  assertEquals(validateNoCredentials(withoutPrivateKey), true);
});

/**
 * Test: Validate no credentials - Service account detection
 * Validates: Requirement 3.4 - No credentials in logs/responses
 */
Deno.test('Security - Validate no credentials detects service account', () => {
  const withServiceAccount = '{"private_key": "secret", "client_email": "test@example.com"}';
  const withoutServiceAccount = '{"user_id": "123", "name": "Test User"}';
  
  assertEquals(validateNoCredentials(withServiceAccount), false);
  assertEquals(validateNoCredentials(withoutServiceAccount), true);
});

/**
 * Test: Valid UUID v4 format
 * Validates: Requirement 3.4 - Validate offer ID format (UUID)
 */
Deno.test('Security - Valid UUID v4 format', () => {
  const validUUIDs = [
    '550e8400-e29b-41d4-a716-446655440000',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  ];
  
  validUUIDs.forEach(uuid => {
    assertEquals(isValidUUID(uuid), true, `Should accept valid UUID: ${uuid}`);
  });
});

/**
 * Test: Invalid UUID formats
 * Validates: Requirement 3.4 - Validate offer ID format (UUID)
 */
Deno.test('Security - Invalid UUID formats', () => {
  const invalidUUIDs = [
    'not-a-uuid',
    '12345',
    '550e8400-e29b-41d4-a716', // Too short
    '550e8400-e29b-41d4-a716-446655440000-extra', // Too long
    '550e8400e29b41d4a716446655440000', // Missing hyphens
    'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', // Invalid characters
    '', // Empty string
    null, // Null
    undefined, // Undefined
  ];
  
  invalidUUIDs.forEach(uuid => {
    assertEquals(isValidUUID(uuid as any), false, `Should reject invalid UUID: ${uuid}`);
  });
});

/**
 * Test: Sanitize user input - Trim whitespace
 * Validates: Requirement 3.4 - Sanitize all user inputs
 */
Deno.test('Security - Sanitize user input trims whitespace', () => {
  const input = '  test input  ';
  const sanitized = sanitizeUserInput(input);
  
  assertEquals(sanitized, 'test input');
});

/**
 * Test: Sanitize user input - Limit length
 * Validates: Requirement 3.4 - Sanitize all user inputs
 */
Deno.test('Security - Sanitize user input limits length', () => {
  const input = 'a'.repeat(2000);
  const sanitized = sanitizeUserInput(input, 100);
  
  assertEquals(sanitized.length, 100);
});

/**
 * Test: Sanitize user input - Remove null bytes
 * Validates: Requirement 3.4 - Sanitize all user inputs
 */
Deno.test('Security - Sanitize user input removes null bytes', () => {
  const input = 'test\0input';
  const sanitized = sanitizeUserInput(input);
  
  assertEquals(sanitized.includes('\0'), false);
  assertEquals(sanitized, 'testinput');
});

/**
 * Test: Sanitize user input - Remove control characters
 * Validates: Requirement 3.4 - Sanitize all user inputs
 */
Deno.test('Security - Sanitize user input removes control characters', () => {
  const input = 'test\x01\x02\x03input';
  const sanitized = sanitizeUserInput(input);
  
  assertEquals(sanitized, 'testinput');
});

/**
 * Test: Sanitize user input - Handle non-string input
 * Validates: Requirement 3.4 - Sanitize all user inputs
 */
Deno.test('Security - Sanitize user input handles non-string', () => {
  const sanitized1 = sanitizeUserInput(null as any);
  const sanitized2 = sanitizeUserInput(undefined as any);
  const sanitized3 = sanitizeUserInput(123 as any);
  
  assertEquals(sanitized1, '');
  assertEquals(sanitized2, '');
  assertEquals(sanitized3, '');
});

/**
 * Test: Validate offer ID - Valid UUID
 * Validates: Requirement 3.4 - Validate offer ID format (UUID)
 */
Deno.test('Security - Validate offer ID accepts valid UUID', () => {
  const offerId = '550e8400-e29b-41d4-a716-446655440000';
  const result = validateOfferId(offerId);
  
  assertEquals(result.valid, true);
  assertEquals(result.sanitized, offerId);
  assertEquals(result.error, null);
});

/**
 * Test: Validate offer ID - Invalid UUID
 * Validates: Requirement 3.4 - Validate offer ID format (UUID)
 */
Deno.test('Security - Validate offer ID rejects invalid UUID', () => {
  const offerId = 'not-a-uuid';
  const result = validateOfferId(offerId);
  
  assertEquals(result.valid, false);
  assertEquals(result.sanitized, null);
  assertExists(result.error);
  assertEquals(result.error!.includes('Invalid offer ID format'), true);
});

/**
 * Test: Validate offer ID - Missing offer ID
 * Validates: Requirement 3.4 - Validate offer ID format (UUID)
 */
Deno.test('Security - Validate offer ID rejects missing ID', () => {
  const result1 = validateOfferId(null);
  const result2 = validateOfferId(undefined);
  const result3 = validateOfferId('');
  
  assertEquals(result1.valid, false);
  assertEquals(result2.valid, false);
  assertEquals(result3.valid, false);
});

/**
 * Test: Validate offer ID - Non-string input
 * Validates: Requirement 3.4 - Validate offer ID format (UUID)
 */
Deno.test('Security - Validate offer ID rejects non-string', () => {
  const result1 = validateOfferId(123);
  const result2 = validateOfferId({ id: '123' });
  const result3 = validateOfferId(['123']);
  
  assertEquals(result1.valid, false);
  assertEquals(result2.valid, false);
  assertEquals(result3.valid, false);
});

/**
 * Test: Validate offer ID - Sanitizes input
 * Validates: Requirement 3.4 - Sanitize all user inputs
 */
Deno.test('Security - Validate offer ID sanitizes input', () => {
  const offerId = '  550e8400-e29b-41d4-a716-446655440000  ';
  const result = validateOfferId(offerId);
  
  assertEquals(result.valid, true);
  assertEquals(result.sanitized, '550e8400-e29b-41d4-a716-446655440000');
});

/**
 * Test: Validate response body - Safe response
 * Validates: Requirement 3.4 - No credentials in responses
 */
Deno.test('Security - Validate response body accepts safe response', () => {
  const body = {
    success: true,
    targetedUserCount: 10,
    sentCount: 10,
    failedCount: 0,
    errors: [],
  };
  
  const result = validateResponseBody(body);
  
  assertEquals(result.safe, true);
  assertEquals(result.violations.length, 0);
});

/**
 * Test: Validate response body - Detects JWT in response
 * Validates: Requirement 3.4 - No credentials in responses
 */
Deno.test('Security - Validate response body detects JWT', () => {
  const body = {
    success: true,
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U',
  };
  
  const result = validateResponseBody(body);
  
  assertEquals(result.safe, false);
  assertEquals(result.violations.length > 0, true);
});

/**
 * Test: Validate response body - Detects private key in response
 * Validates: Requirement 3.4 - No credentials in responses
 */
Deno.test('Security - Validate response body detects private key', () => {
  const body = {
    success: true,
    config: {
      private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASC',
    },
  };
  
  const result = validateResponseBody(body);
  
  assertEquals(result.safe, false);
  assertEquals(result.violations.length > 0, true);
});

/**
 * Test: Validate response body - Sanitizes unsafe response
 * Validates: Requirement 3.4 - No credentials in responses
 */
Deno.test('Security - Validate response body sanitizes unsafe response', () => {
  const body = {
    success: true,
    password: 'secret123',
    data: 'public info',
  };
  
  const result = validateResponseBody(body);
  
  assertEquals(result.safe, false);
  assertEquals(result.sanitized.password, '[REDACTED]');
  assertEquals(result.sanitized.data, 'public info');
});

/**
 * Test: Validate response body - Handles nested credentials
 * Validates: Requirement 3.4 - No credentials in responses
 */
Deno.test('Security - Validate response body handles nested credentials', () => {
  const body = {
    success: true,
    user: {
      id: '123',
      credentials: {
        api_key: 'sk_test_123',
      },
    },
  };
  
  const result = validateResponseBody(body);
  
  assertEquals(result.safe, false);
  assertEquals(result.sanitized.user.credentials.api_key, '[REDACTED]');
});

console.log('All security tests completed');
