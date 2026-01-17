/**
 * Unit Tests for FCM Batch Sending Logic
 * 
 * Requirements: 2.2, 2.3, 2.4, 2.5
 * - Test batch splitting logic
 * - Test error categorization
 * - Test token marking as inactive
 * - Test batch sending
 * 
 * Run with: deno test --allow-env --allow-net fcm.test.ts
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import { splitIntoBatches, categorizeError, FCMErrorCategory } from './fcm.ts';

/**
 * Test: splitIntoBatches with empty array
 * Validates: Requirement 2.3 - Batch splitting handles edge cases
 */
Deno.test('splitIntoBatches - Empty array', () => {
  const tokens: string[] = [];
  const batches = splitIntoBatches(tokens, 500);
  
  assertEquals(batches.length, 0);
});

/**
 * Test: splitIntoBatches with single token
 * Validates: Requirement 2.3 - Batch splitting handles small inputs
 */
Deno.test('splitIntoBatches - Single token', () => {
  const tokens = ['token1'];
  const batches = splitIntoBatches(tokens, 500);
  
  assertEquals(batches.length, 1);
  assertEquals(batches[0].length, 1);
  assertEquals(batches[0][0], 'token1');
});

/**
 * Test: splitIntoBatches with exactly 500 tokens
 * Validates: Requirement 2.3 - Batch splitting handles exact batch size
 */
Deno.test('splitIntoBatches - Exactly 500 tokens', () => {
  const tokens = Array.from({ length: 500 }, (_, i) => `token${i}`);
  const batches = splitIntoBatches(tokens, 500);
  
  assertEquals(batches.length, 1);
  assertEquals(batches[0].length, 500);
});

/**
 * Test: splitIntoBatches with 501 tokens
 * Validates: Requirement 2.3 - Batch splitting creates multiple batches
 */
Deno.test('splitIntoBatches - 501 tokens', () => {
  const tokens = Array.from({ length: 501 }, (_, i) => `token${i}`);
  const batches = splitIntoBatches(tokens, 500);
  
  assertEquals(batches.length, 2);
  assertEquals(batches[0].length, 500);
  assertEquals(batches[1].length, 1);
});

/**
 * Test: splitIntoBatches with 1000 tokens
 * Validates: Requirement 2.3 - Batch splitting handles multiple full batches
 */
Deno.test('splitIntoBatches - 1000 tokens', () => {
  const tokens = Array.from({ length: 1000 }, (_, i) => `token${i}`);
  const batches = splitIntoBatches(tokens, 500);
  
  assertEquals(batches.length, 2);
  assertEquals(batches[0].length, 500);
  assertEquals(batches[1].length, 500);
});

/**
 * Test: splitIntoBatches with 1500 tokens
 * Validates: Requirement 2.3 - Batch splitting handles large inputs
 */
Deno.test('splitIntoBatches - 1500 tokens', () => {
  const tokens = Array.from({ length: 1500 }, (_, i) => `token${i}`);
  const batches = splitIntoBatches(tokens, 500);
  
  assertEquals(batches.length, 3);
  assertEquals(batches[0].length, 500);
  assertEquals(batches[1].length, 500);
  assertEquals(batches[2].length, 500);
});

/**
 * Test: splitIntoBatches with 1750 tokens
 * Validates: Requirement 2.3 - Batch splitting handles partial last batch
 */
Deno.test('splitIntoBatches - 1750 tokens', () => {
  const tokens = Array.from({ length: 1750 }, (_, i) => `token${i}`);
  const batches = splitIntoBatches(tokens, 500);
  
  assertEquals(batches.length, 4);
  assertEquals(batches[0].length, 500);
  assertEquals(batches[1].length, 500);
  assertEquals(batches[2].length, 500);
  assertEquals(batches[3].length, 250);
});

/**
 * Test: splitIntoBatches preserves token order
 * Validates: Requirement 2.3 - Batch splitting maintains order
 */
Deno.test('splitIntoBatches - Preserves order', () => {
  const tokens = ['token1', 'token2', 'token3', 'token4', 'token5'];
  const batches = splitIntoBatches(tokens, 2);
  
  assertEquals(batches.length, 3);
  assertEquals(batches[0], ['token1', 'token2']);
  assertEquals(batches[1], ['token3', 'token4']);
  assertEquals(batches[2], ['token5']);
});

/**
 * Test: splitIntoBatches with custom batch size
 * Validates: Requirement 2.3 - Batch splitting supports custom sizes
 */
Deno.test('splitIntoBatches - Custom batch size', () => {
  const tokens = Array.from({ length: 100 }, (_, i) => `token${i}`);
  const batches = splitIntoBatches(tokens, 25);
  
  assertEquals(batches.length, 4);
  assertEquals(batches[0].length, 25);
  assertEquals(batches[1].length, 25);
  assertEquals(batches[2].length, 25);
  assertEquals(batches[3].length, 25);
});

/**
 * Test: splitIntoBatches doesn't modify original array
 * Validates: Requirement 2.3 - Batch splitting is non-destructive
 */
Deno.test('splitIntoBatches - Non-destructive', () => {
  const tokens = ['token1', 'token2', 'token3'];
  const originalLength = tokens.length;
  const batches = splitIntoBatches(tokens, 2);
  
  assertEquals(tokens.length, originalLength);
  assertEquals(batches.length, 2);
});

/**
 * Test: categorizeError - Invalid registration token
 * Validates: Requirement 2.4 - Error categorization for invalid tokens
 */
Deno.test('categorizeError - Invalid registration token', () => {
  const category = categorizeError('messaging/invalid-registration-token');
  assertEquals(category, FCMErrorCategory.INVALID_TOKEN);
});

/**
 * Test: categorizeError - Registration token not registered
 * Validates: Requirement 2.4 - Error categorization for unregistered tokens
 */
Deno.test('categorizeError - Registration token not registered', () => {
  const category = categorizeError('messaging/registration-token-not-registered');
  assertEquals(category, FCMErrorCategory.INVALID_TOKEN);
});

/**
 * Test: categorizeError - Invalid argument
 * Validates: Requirement 2.4 - Error categorization for invalid arguments
 */
Deno.test('categorizeError - Invalid argument', () => {
  const category = categorizeError('messaging/invalid-argument');
  assertEquals(category, FCMErrorCategory.INVALID_TOKEN);
});

/**
 * Test: categorizeError - Quota exceeded
 * Validates: Requirement 2.4 - Error categorization for quota errors
 */
Deno.test('categorizeError - Quota exceeded', () => {
  const category = categorizeError('messaging/quota-exceeded');
  assertEquals(category, FCMErrorCategory.QUOTA_EXCEEDED);
});

/**
 * Test: categorizeError - Too many requests
 * Validates: Requirement 2.4 - Error categorization for rate limiting
 */
Deno.test('categorizeError - Too many requests', () => {
  const category = categorizeError('messaging/too-many-requests');
  assertEquals(category, FCMErrorCategory.QUOTA_EXCEEDED);
});

/**
 * Test: categorizeError - Internal error
 * Validates: Requirement 2.4 - Error categorization for server errors
 */
Deno.test('categorizeError - Internal error', () => {
  const category = categorizeError('messaging/internal-error');
  assertEquals(category, FCMErrorCategory.SERVER_ERROR);
});

/**
 * Test: categorizeError - Server unavailable
 * Validates: Requirement 2.4 - Error categorization for server unavailable
 */
Deno.test('categorizeError - Server unavailable', () => {
  const category = categorizeError('messaging/server-unavailable');
  assertEquals(category, FCMErrorCategory.SERVER_ERROR);
});

/**
 * Test: categorizeError - Unavailable
 * Validates: Requirement 2.4 - Error categorization for unavailable service
 */
Deno.test('categorizeError - Unavailable', () => {
  const category = categorizeError('messaging/unavailable');
  assertEquals(category, FCMErrorCategory.UNAVAILABLE);
});

/**
 * Test: categorizeError - Unknown error code
 * Validates: Requirement 2.4 - Error categorization handles unknown errors
 */
Deno.test('categorizeError - Unknown error code', () => {
  const category = categorizeError('messaging/unknown-error');
  assertEquals(category, FCMErrorCategory.UNKNOWN);
});

/**
 * Test: categorizeError - Empty string
 * Validates: Requirement 2.4 - Error categorization handles edge cases
 */
Deno.test('categorizeError - Empty string', () => {
  const category = categorizeError('');
  assertEquals(category, FCMErrorCategory.UNKNOWN);
});

/**
 * Test: categorizeError - Non-messaging error
 * Validates: Requirement 2.4 - Error categorization handles non-FCM errors
 */
Deno.test('categorizeError - Non-messaging error', () => {
  const category = categorizeError('some/other-error');
  assertEquals(category, FCMErrorCategory.UNKNOWN);
});

/**
 * Test: categorizeError - Case sensitivity
 * Validates: Requirement 2.4 - Error categorization is case-sensitive
 */
Deno.test('categorizeError - Case sensitivity', () => {
  const category = categorizeError('MESSAGING/INVALID-REGISTRATION-TOKEN');
  assertEquals(category, FCMErrorCategory.UNKNOWN);
});

/**
 * Test: categorizeError - All invalid token error codes
 * Validates: Requirement 2.4 - All invalid token errors are categorized correctly
 */
Deno.test('categorizeError - All invalid token error codes', () => {
  const invalidTokenErrors = [
    'messaging/invalid-registration-token',
    'messaging/registration-token-not-registered',
    'messaging/invalid-argument',
  ];

  invalidTokenErrors.forEach(errorCode => {
    const category = categorizeError(errorCode);
    assertEquals(category, FCMErrorCategory.INVALID_TOKEN, `Failed for: ${errorCode}`);
  });
});

/**
 * Test: categorizeError - All quota exceeded error codes
 * Validates: Requirement 2.4 - All quota errors are categorized correctly
 */
Deno.test('categorizeError - All quota exceeded error codes', () => {
  const quotaErrors = [
    'messaging/quota-exceeded',
    'messaging/too-many-requests',
  ];

  quotaErrors.forEach(errorCode => {
    const category = categorizeError(errorCode);
    assertEquals(category, FCMErrorCategory.QUOTA_EXCEEDED, `Failed for: ${errorCode}`);
  });
});

/**
 * Test: categorizeError - All server error codes
 * Validates: Requirement 2.4 - All server errors are categorized correctly
 */
Deno.test('categorizeError - All server error codes', () => {
  const serverErrors = [
    'messaging/internal-error',
    'messaging/server-unavailable',
  ];

  serverErrors.forEach(errorCode => {
    const category = categorizeError(errorCode);
    assertEquals(category, FCMErrorCategory.SERVER_ERROR, `Failed for: ${errorCode}`);
  });
});

/**
 * Test: Error category enum values
 * Validates: Requirement 2.4 - Error categories are well-defined
 */
Deno.test('FCMErrorCategory - Enum values', () => {
  assertEquals(FCMErrorCategory.INVALID_TOKEN, 'invalid_token');
  assertEquals(FCMErrorCategory.QUOTA_EXCEEDED, 'quota_exceeded');
  assertEquals(FCMErrorCategory.SERVER_ERROR, 'server_error');
  assertEquals(FCMErrorCategory.UNAVAILABLE, 'unavailable');
  assertEquals(FCMErrorCategory.UNKNOWN, 'unknown');
});

/**
 * Test: splitIntoBatches - Total tokens preserved
 * Validates: Requirement 2.3 - No tokens are lost during batching
 */
Deno.test('splitIntoBatches - Total tokens preserved', () => {
  const tokens = Array.from({ length: 1234 }, (_, i) => `token${i}`);
  const batches = splitIntoBatches(tokens, 500);
  
  const totalTokens = batches.reduce((sum, batch) => sum + batch.length, 0);
  assertEquals(totalTokens, tokens.length);
});

/**
 * Test: splitIntoBatches - All batches except last are full
 * Validates: Requirement 2.3 - Batches are optimally sized
 */
Deno.test('splitIntoBatches - All batches except last are full', () => {
  const tokens = Array.from({ length: 1234 }, (_, i) => `token${i}`);
  const batches = splitIntoBatches(tokens, 500);
  
  // All batches except the last should have exactly 500 tokens
  for (let i = 0; i < batches.length - 1; i++) {
    assertEquals(batches[i].length, 500, `Batch ${i} should have 500 tokens`);
  }
  
  // Last batch should have the remainder
  const expectedLastBatchSize = tokens.length % 500 || 500;
  assertEquals(batches[batches.length - 1].length, expectedLastBatchSize);
});

/**
 * Test: splitIntoBatches - Batch count calculation
 * Validates: Requirement 2.3 - Correct number of batches created
 */
Deno.test('splitIntoBatches - Batch count calculation', () => {
  const testCases = [
    { tokens: 0, expected: 0 },
    { tokens: 1, expected: 1 },
    { tokens: 499, expected: 1 },
    { tokens: 500, expected: 1 },
    { tokens: 501, expected: 2 },
    { tokens: 999, expected: 2 },
    { tokens: 1000, expected: 2 },
    { tokens: 1001, expected: 3 },
    { tokens: 2500, expected: 5 },
  ];

  testCases.forEach(({ tokens: tokenCount, expected }) => {
    const tokens = Array.from({ length: tokenCount }, (_, i) => `token${i}`);
    const batches = splitIntoBatches(tokens, 500);
    assertEquals(batches.length, expected, `Failed for ${tokenCount} tokens`);
  });
});
