import { assertEquals, assertExists } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import { trackPushSent, trackPushFailed } from './analytics.ts';
import type { PushAnalyticsData } from './analytics.ts';

/**
 * Unit Tests for Analytics Tracking
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.5
 * - Test that success counts are tracked correctly
 * - Test that analytics events are recorded
 * - Test that recipient counts are stored
 * - Test that failure reasons are logged
 * 
 * Run with: deno test --allow-env --allow-net analytics.test.ts
 */

/**
 * Mock Supabase client for testing
 */
function createMockSupabase() {
  const insertedRecords: any[] = [];
  
  return {
    from: (table: string) => ({
      insert: (data: any) => {
        insertedRecords.push({ table, data });
        return { error: null };
      },
    }),
    _getInsertedRecords: () => insertedRecords,
  };
}

/**
 * Test: trackPushSent stores analytics with correct data
 * Validates: Requirements 6.1, 6.2, 6.3
 */
Deno.test('trackPushSent - Stores analytics with correct data', async () => {
  const mockSupabase = createMockSupabase() as any;
  
  const analyticsData: PushAnalyticsData = {
    offerId: 'offer-123',
    venueId: 'venue-456',
    targetedCount: 100,
    successCount: 95,
    failureCount: 5,
    errors: [
      { token: 'token1', error: 'invalid-token' },
      { token: 'token2', error: 'quota-exceeded' },
    ],
  };

  await trackPushSent(mockSupabase, analyticsData);

  const records = mockSupabase._getInsertedRecords();
  assertEquals(records.length, 1);
  
  const record = records[0];
  assertEquals(record.table, 'flash_offer_analytics');
  assertEquals(record.data.offer_id, 'offer-123');
  assertEquals(record.data.event_type, 'push_sent');
  assertEquals(record.data.recipient_count, 95); // Should be successCount
  
  // Verify metadata
  assertExists(record.data.metadata);
  assertEquals(record.data.metadata.targeted_count, 100);
  assertEquals(record.data.metadata.failed_count, 5);
  assertEquals(record.data.metadata.venue_id, 'venue-456');
  
  // Verify timestamp
  assertExists(record.data.created_at);
});

/**
 * Test: trackPushSent uses success count as recipient count
 * Validates: Requirement 6.1, 6.3
 */
Deno.test('trackPushSent - Uses success count as recipient count', async () => {
  const mockSupabase = createMockSupabase() as any;
  
  const analyticsData: PushAnalyticsData = {
    offerId: 'offer-789',
    venueId: 'venue-012',
    targetedCount: 50,
    successCount: 48,
    failureCount: 2,
    errors: [],
  };

  await trackPushSent(mockSupabase, analyticsData);

  const records = mockSupabase._getInsertedRecords();
  const record = records[0];
  
  // Recipient count should equal success count
  assertEquals(record.data.recipient_count, 48);
});

/**
 * Test: trackPushSent handles zero successes
 * Validates: Requirement 6.1, 6.3
 */
Deno.test('trackPushSent - Handles zero successes', async () => {
  const mockSupabase = createMockSupabase() as any;
  
  const analyticsData: PushAnalyticsData = {
    offerId: 'offer-999',
    venueId: 'venue-888',
    targetedCount: 10,
    successCount: 0,
    failureCount: 10,
    errors: [
      { token: 'token1', error: 'invalid-token' },
      { token: 'token2', error: 'invalid-token' },
    ],
  };

  await trackPushSent(mockSupabase, analyticsData);

  const records = mockSupabase._getInsertedRecords();
  const record = records[0];
  
  // Should still record analytics even with zero successes
  assertEquals(record.data.recipient_count, 0);
  assertEquals(record.data.metadata.failed_count, 10);
});

/**
 * Test: trackPushSent handles database errors gracefully
 * Validates: Requirement 6.2 - Don't break main flow on analytics failure
 */
Deno.test('trackPushSent - Handles database errors gracefully', async () => {
  const mockSupabase = {
    from: () => ({
      insert: () => ({
        error: { message: 'Database connection failed' },
      }),
    }),
  } as any;
  
  const analyticsData: PushAnalyticsData = {
    offerId: 'offer-123',
    venueId: 'venue-456',
    targetedCount: 100,
    successCount: 95,
    failureCount: 5,
    errors: [],
  };

  // Should not throw even if database insert fails
  await trackPushSent(mockSupabase, analyticsData);
  
  // Test passes if no exception is thrown
  assertEquals(true, true);
});

/**
 * Test: trackPushSent logs failure reasons when errors exist
 * Validates: Requirement 6.5
 */
Deno.test('trackPushSent - Logs failure reasons', async () => {
  const mockSupabase = createMockSupabase() as any;
  
  const analyticsData: PushAnalyticsData = {
    offerId: 'offer-123',
    venueId: 'venue-456',
    targetedCount: 100,
    successCount: 97,
    failureCount: 3,
    errors: [
      { token: 'token1', error: 'invalid-token' },
      { token: 'token2', error: 'quota-exceeded' },
      { token: 'token3', error: 'server-error' },
    ],
  };

  // Capture console.log output
  const originalLog = console.log;
  let logOutput = '';
  console.log = (...args: any[]) => {
    logOutput += args.join(' ') + '\n';
  };

  await trackPushSent(mockSupabase, analyticsData);

  // Restore console.log
  console.log = originalLog;

  // Verify that errors were logged
  assertEquals(logOutput.includes('Failed notifications'), true);
  assertEquals(logOutput.includes('offer-123'), true);
  assertEquals(logOutput.includes('invalid-token'), true);
  assertEquals(logOutput.includes('quota-exceeded'), true);
  assertEquals(logOutput.includes('server-error'), true);
});

/**
 * Test: trackPushSent doesn't log when no errors
 * Validates: Requirement 6.5 - Only log failures when they exist
 */
Deno.test('trackPushSent - No failure logging when no errors', async () => {
  const mockSupabase = createMockSupabase() as any;
  
  const analyticsData: PushAnalyticsData = {
    offerId: 'offer-123',
    venueId: 'venue-456',
    targetedCount: 100,
    successCount: 100,
    failureCount: 0,
    errors: [],
  };

  // Capture console.log output
  const originalLog = console.log;
  let logOutput = '';
  console.log = (...args: any[]) => {
    logOutput += args.join(' ') + '\n';
  };

  await trackPushSent(mockSupabase, analyticsData);

  // Restore console.log
  console.log = originalLog;

  // Verify that "Failed notifications" was NOT logged
  assertEquals(logOutput.includes('Failed notifications'), false);
});

/**
 * Test: trackPushFailed stores failure analytics
 * Validates: Requirement 6.2, 6.5
 */
Deno.test('trackPushFailed - Stores failure analytics', async () => {
  const mockSupabase = createMockSupabase() as any;
  
  await trackPushFailed(
    mockSupabase,
    'offer-123',
    'venue-456',
    'RATE_LIMIT_EXCEEDED',
    'Venue has exceeded daily offer limit'
  );

  const records = mockSupabase._getInsertedRecords();
  assertEquals(records.length, 1);
  
  const record = records[0];
  assertEquals(record.table, 'flash_offer_analytics');
  assertEquals(record.data.offer_id, 'offer-123');
  assertEquals(record.data.event_type, 'push_failed');
  assertEquals(record.data.recipient_count, 0);
  
  // Verify metadata contains error details
  assertExists(record.data.metadata);
  assertEquals(record.data.metadata.error_code, 'RATE_LIMIT_EXCEEDED');
  assertEquals(record.data.metadata.error_message, 'Venue has exceeded daily offer limit');
  assertEquals(record.data.metadata.venue_id, 'venue-456');
});

/**
 * Test: trackPushFailed handles database errors gracefully
 * Validates: Don't break main flow on analytics failure
 */
Deno.test('trackPushFailed - Handles database errors gracefully', async () => {
  const mockSupabase = {
    from: () => ({
      insert: () => ({
        error: { message: 'Database connection failed' },
      }),
    }),
  } as any;
  
  // Should not throw even if database insert fails
  await trackPushFailed(
    mockSupabase,
    'offer-123',
    'venue-456',
    'OFFER_NOT_FOUND',
    'Flash offer not found'
  );
  
  // Test passes if no exception is thrown
  assertEquals(true, true);
});

/**
 * Test: Analytics data includes all required metadata fields
 * Validates: Requirement 6.3 - Store comprehensive analytics
 */
Deno.test('trackPushSent - Includes all metadata fields', async () => {
  const mockSupabase = createMockSupabase() as any;
  
  const analyticsData: PushAnalyticsData = {
    offerId: 'offer-abc',
    venueId: 'venue-xyz',
    targetedCount: 250,
    successCount: 240,
    failureCount: 10,
    errors: [],
  };

  await trackPushSent(mockSupabase, analyticsData);

  const records = mockSupabase._getInsertedRecords();
  const record = records[0];
  
  // Verify all metadata fields are present
  const metadata = record.data.metadata;
  assertExists(metadata.targeted_count);
  assertExists(metadata.failed_count);
  assertExists(metadata.venue_id);
  
  // Verify values
  assertEquals(metadata.targeted_count, 250);
  assertEquals(metadata.failed_count, 10);
  assertEquals(metadata.venue_id, 'venue-xyz');
});
