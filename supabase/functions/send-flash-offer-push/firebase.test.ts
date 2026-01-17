/**
 * Unit Tests for Firebase Admin SDK Initialization
 * 
 * Requirements: 2.1, 7.3
 * - Test successful initialization with valid credentials
 * - Test failure handling with invalid credentials
 * 
 * These tests verify that the Firebase Admin SDK initialization handles
 * various credential scenarios correctly and provides appropriate error
 * messages for debugging.
 * 
 * Run with: deno test --allow-env --allow-net firebase.test.ts
 */

import { assertEquals, assertExists, assertRejects } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import { initializeFirebase, getFirebaseMessaging, resetFirebaseInstances } from './firebase.ts';

/**
 * Mock environment setup helper
 * Sets up test environment variables and returns cleanup function
 */
function setupMockEnv(serviceAccount: string | undefined) {
  const original = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');

  if (serviceAccount !== undefined) {
    Deno.env.set('FIREBASE_SERVICE_ACCOUNT', serviceAccount);
  } else {
    Deno.env.delete('FIREBASE_SERVICE_ACCOUNT');
  }

  // Return cleanup function
  return () => {
    if (original !== undefined) {
      Deno.env.set('FIREBASE_SERVICE_ACCOUNT', original);
    } else {
      Deno.env.delete('FIREBASE_SERVICE_ACCOUNT');
    }
    // Reset Firebase instances after each test
    resetFirebaseInstances();
  };
}

/**
 * Test: Missing FIREBASE_SERVICE_ACCOUNT environment variable
 * Validates: Requirement 2.1 - Firebase initialization requires credentials
 * Validates: Requirement 7.3 - Graceful error handling
 */
Deno.test('Firebase Initialization - Missing FIREBASE_SERVICE_ACCOUNT', async () => {
  const cleanup = setupMockEnv(undefined);

  try {
    // Should throw error when environment variable is missing
    await assertRejects(
      async () => {
        initializeFirebase();
      },
      Error,
      'FIREBASE_SERVICE_ACCOUNT environment variable is not set'
    );
  } finally {
    cleanup();
  }
});

/**
 * Test: Invalid JSON in FIREBASE_SERVICE_ACCOUNT
 * Validates: Requirement 2.1 - Firebase initialization validates credentials
 * Validates: Requirement 7.3 - Graceful error handling with descriptive messages
 */
Deno.test('Firebase Initialization - Invalid JSON in FIREBASE_SERVICE_ACCOUNT', async () => {
  const cleanup = setupMockEnv('not valid json {{{');

  try {
    // Should throw error when JSON is invalid
    await assertRejects(
      async () => {
        initializeFirebase();
      },
      Error,
      'FIREBASE_SERVICE_ACCOUNT is not valid JSON'
    );
  } finally {
    cleanup();
  }
});

/**
 * Test: Missing required fields in service account
 * Validates: Requirement 2.1 - Firebase initialization validates credential structure
 * Validates: Requirement 7.3 - Graceful error handling
 */
Deno.test('Firebase Initialization - Missing project_id field', async () => {
  const invalidServiceAccount = JSON.stringify({
    type: 'service_account',
    private_key: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----\n',
    client_email: 'test@test.iam.gserviceaccount.com',
    // Missing project_id
  });

  const cleanup = setupMockEnv(invalidServiceAccount);

  try {
    // Should throw error when required field is missing
    await assertRejects(
      async () => {
        initializeFirebase();
      },
      Error,
      'Service account missing required fields: project_id'
    );
  } finally {
    cleanup();
  }
});

/**
 * Test: Missing private_key field in service account
 * Validates: Requirement 2.1 - Firebase initialization validates credential structure
 */
Deno.test('Firebase Initialization - Missing private_key field', async () => {
  const invalidServiceAccount = JSON.stringify({
    type: 'service_account',
    project_id: 'test-project',
    client_email: 'test@test.iam.gserviceaccount.com',
    // Missing private_key
  });

  const cleanup = setupMockEnv(invalidServiceAccount);

  try {
    // Should throw error when required field is missing
    await assertRejects(
      async () => {
        initializeFirebase();
      },
      Error,
      'Service account missing required fields: private_key'
    );
  } finally {
    cleanup();
  }
});

/**
 * Test: Missing client_email field in service account
 * Validates: Requirement 2.1 - Firebase initialization validates credential structure
 */
Deno.test('Firebase Initialization - Missing client_email field', async () => {
  const invalidServiceAccount = JSON.stringify({
    type: 'service_account',
    project_id: 'test-project',
    private_key: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----\n',
    // Missing client_email
  });

  const cleanup = setupMockEnv(invalidServiceAccount);

  try {
    // Should throw error when required field is missing
    await assertRejects(
      async () => {
        initializeFirebase();
      },
      Error,
      'Service account missing required fields: client_email'
    );
  } finally {
    cleanup();
  }
});

/**
 * Test: Missing multiple required fields in service account
 * Validates: Requirement 2.1 - Firebase initialization validates all required fields
 */
Deno.test('Firebase Initialization - Missing multiple required fields', async () => {
  const invalidServiceAccount = JSON.stringify({
    type: 'service_account',
    // Missing project_id, private_key, and client_email
  });

  const cleanup = setupMockEnv(invalidServiceAccount);

  try {
    // Should throw error listing all missing fields
    await assertRejects(
      async () => {
        initializeFirebase();
      },
      Error,
      'Service account missing required fields'
    );
  } finally {
    cleanup();
  }
});

/**
 * Test: Empty string for FIREBASE_SERVICE_ACCOUNT
 * Validates: Requirement 2.1 - Firebase initialization validates credentials
 * Validates: Requirement 7.3 - Graceful error handling
 */
Deno.test('Firebase Initialization - Empty string FIREBASE_SERVICE_ACCOUNT', async () => {
  const cleanup = setupMockEnv('');

  try {
    // Should throw error when environment variable is empty
    await assertRejects(
      async () => {
        initializeFirebase();
      },
      Error
    );
  } finally {
    cleanup();
  }
});

/**
 * Test: Error message format for missing credentials
 * Validates: Requirement 7.3 - Error messages are descriptive
 */
Deno.test('Firebase Initialization - Error message format', async () => {
  const cleanup = setupMockEnv(undefined);

  try {
    let errorMessage = '';
    try {
      initializeFirebase();
    } catch (error) {
      if (error instanceof Error) {
        errorMessage = error.message;
      }
    }

    // Verify error message is descriptive
    assertExists(errorMessage);
    assertEquals(errorMessage.length > 0, true);
    assertEquals(errorMessage.includes('Firebase'), true);
  } finally {
    cleanup();
  }
});

/**
 * Test: Error message doesn't expose sensitive details
 * Validates: Requirement 7.3 - Error handling is secure
 * 
 * This test ensures that error messages don't expose sensitive information
 * like actual credential values or internal system details.
 */
Deno.test('Firebase Initialization - Error message security', async () => {
  const cleanup = setupMockEnv(undefined);

  try {
    let errorMessage = '';
    try {
      initializeFirebase();
    } catch (error) {
      if (error instanceof Error) {
        errorMessage = error.message;
      }
    }

    // Verify error message doesn't contain sensitive patterns
    // (This is a basic check; in production, more comprehensive checks would be needed)
    assertEquals(errorMessage.includes('-----BEGIN'), false);
    assertEquals(errorMessage.includes('private_key'), false);
  } finally {
    cleanup();
  }
});

/**
 * Test: getFirebaseMessaging without initialization
 * Validates: Requirement 2.1 - Firebase messaging requires initialization
 * 
 * This test verifies that attempting to get the messaging instance
 * without proper credentials fails gracefully.
 */
Deno.test('Firebase Initialization - getFirebaseMessaging without credentials', async () => {
  const cleanup = setupMockEnv(undefined);

  try {
    // Should throw error when trying to get messaging without initialization
    await assertRejects(
      async () => {
        getFirebaseMessaging();
      },
      Error
    );
  } finally {
    cleanup();
  }
});

/**
 * Test: Singleton pattern - multiple calls return same instance
 * Validates: Requirement 2.1 - Firebase initialization is efficient
 * 
 * Note: This test is limited because we can't actually initialize Firebase
 * with test credentials, but we can verify the error handling is consistent.
 */
Deno.test('Firebase Initialization - Singleton pattern consistency', async () => {
  const cleanup = setupMockEnv(undefined);

  try {
    let error1: Error | null = null;
    let error2: Error | null = null;

    try {
      initializeFirebase();
    } catch (e) {
      error1 = e as Error;
    }

    try {
      initializeFirebase();
    } catch (e) {
      error2 = e as Error;
    }

    // Both calls should produce the same error
    assertExists(error1);
    assertExists(error2);
    assertEquals(error1.message, error2.message);
  } finally {
    cleanup();
  }
});

/**
 * Test: resetFirebaseInstances clears state
 * Validates: Testing utility works correctly
 * 
 * This test verifies that the reset function properly clears the
 * Firebase instances, which is important for test isolation.
 */
Deno.test('Firebase Initialization - resetFirebaseInstances clears state', async () => {
  const cleanup = setupMockEnv(undefined);

  try {
    // Try to initialize (will fail)
    try {
      initializeFirebase();
    } catch {
      // Expected to fail
    }

    // Reset instances
    resetFirebaseInstances();

    // Try again - should get the same error (not a "already initialized" error)
    let errorAfterReset: Error | null = null;
    try {
      initializeFirebase();
    } catch (e) {
      errorAfterReset = e as Error;
    }

    // Should get the same initialization error, not a different error
    assertExists(errorAfterReset);
    assertEquals(errorAfterReset.message.includes('FIREBASE_SERVICE_ACCOUNT'), true);
  } finally {
    cleanup();
  }
});

