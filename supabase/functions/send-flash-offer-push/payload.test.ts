import { assertEquals, assertExists } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import { buildNotificationPayload } from './payload.ts';
import type { FlashOffer } from './types.ts';

/**
 * Unit Tests for FCM Notification Payload Builder
 * 
 * Requirements: 2.6, 2.7
 * - Test that payload includes all required fields
 * - Test that priority is set to high
 * 
 * Run with: deno test --allow-env --allow-net payload.test.ts
 */

/**
 * Test: Basic payload structure
 * Validates: Requirement 2.6 - Include proper notification payload
 */
Deno.test('buildNotificationPayload - Basic payload structure', () => {
  const mockOffer: FlashOffer = {
    id: 'offer-123',
    venue_id: 'venue-456',
    title: 'Happy Hour Special',
    description: 'Get 25% off all drinks during happy hour!',
    discount_percentage: 25,
    max_claims: 50,
    current_claims: 0,
    expires_at: '2024-12-31T23:59:59Z',
    push_sent: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const venueName = 'The Local Pub';
  const payload = buildNotificationPayload(mockOffer, venueName);

  // Verify notification fields exist
  assertExists(payload.notification);
  assertExists(payload.notification.title);
  assertExists(payload.notification.body);
  
  // Verify data fields exist
  assertExists(payload.data);
  assertEquals(payload.data.offer_id, 'offer-123');
  assertEquals(payload.data.venue_id, 'venue-456');
  assertEquals(payload.data.type, 'flash_offer');
  
  // Verify Android fields exist
  assertExists(payload.android);
  assertEquals(payload.android.priority, 'high'); // Requirement 2.7
  assertEquals(payload.android.channelId, 'flash_offers');
  
  // Verify iOS fields exist
  assertExists(payload.apns);
  assertExists(payload.apns.payload);
  assertExists(payload.apns.payload.aps);
  assertEquals(payload.apns.payload.aps['content-available'], 1);
  assertEquals(payload.apns.payload.aps.sound, 'default');
});

/**
 * Test: Title includes discount percentage and venue name
 * Validates: Requirement 2.6 - Notification content is descriptive
 */
Deno.test('buildNotificationPayload - Title format', () => {
  const mockOffer: FlashOffer = {
    id: 'offer-123',
    venue_id: 'venue-456',
    title: 'Special Offer',
    description: 'Limited time deal',
    discount_percentage: 30,
    max_claims: 100,
    current_claims: 0,
    expires_at: '2024-12-31T23:59:59Z',
    push_sent: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const venueName = 'Coffee Shop';
  const payload = buildNotificationPayload(mockOffer, venueName);

  // Title should include discount percentage and venue name
  assertEquals(payload.notification.title.includes('30%'), true);
  assertEquals(payload.notification.title.includes('Coffee Shop'), true);
  assertEquals(payload.notification.title.includes('🔥'), true);
});

/**
 * Test: Body uses offer description
 * Validates: Requirement 2.6 - Notification body contains offer details
 */
Deno.test('buildNotificationPayload - Body content', () => {
  const mockOffer: FlashOffer = {
    id: 'offer-123',
    venue_id: 'venue-456',
    title: 'Special Offer',
    description: 'Buy one get one free on all appetizers!',
    discount_percentage: 50,
    max_claims: 100,
    current_claims: 0,
    expires_at: '2024-12-31T23:59:59Z',
    push_sent: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const venueName = 'Restaurant';
  const payload = buildNotificationPayload(mockOffer, venueName);

  // Body should use the offer description
  assertEquals(payload.notification.body, 'Buy one get one free on all appetizers!');
});

/**
 * Test: Body fallback when description is empty
 * Validates: Requirement 2.6 - Notification always has body content
 */
Deno.test('buildNotificationPayload - Body fallback for empty description', () => {
  const mockOffer: FlashOffer = {
    id: 'offer-123',
    venue_id: 'venue-456',
    title: 'Special Offer',
    description: '',
    discount_percentage: 20,
    max_claims: 100,
    current_claims: 0,
    expires_at: '2024-12-31T23:59:59Z',
    push_sent: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const venueName = 'Restaurant';
  const payload = buildNotificationPayload(mockOffer, venueName);

  // Body should have fallback text
  assertExists(payload.notification.body);
  assertEquals(payload.notification.body.length > 0, true);
  assertEquals(payload.notification.body.includes('20%'), true);
});

/**
 * Test: High priority is set for all notifications
 * Validates: Requirement 2.7 - Set high priority for flash offer notifications
 */
Deno.test('buildNotificationPayload - High priority', () => {
  const mockOffer: FlashOffer = {
    id: 'offer-123',
    venue_id: 'venue-456',
    title: 'Special Offer',
    description: 'Limited time deal',
    discount_percentage: 15,
    max_claims: 100,
    current_claims: 0,
    expires_at: '2024-12-31T23:59:59Z',
    push_sent: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const venueName = 'Venue';
  const payload = buildNotificationPayload(mockOffer, venueName);

  // Android priority must be 'high'
  assertEquals(payload.android.priority, 'high');
});

/**
 * Test: Channel ID matches expected value
 * Validates: Requirement 2.6 - Platform-specific options are correct
 */
Deno.test('buildNotificationPayload - Android channel ID', () => {
  const mockOffer: FlashOffer = {
    id: 'offer-123',
    venue_id: 'venue-456',
    title: 'Special Offer',
    description: 'Limited time deal',
    discount_percentage: 15,
    max_claims: 100,
    current_claims: 0,
    expires_at: '2024-12-31T23:59:59Z',
    push_sent: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const venueName = 'Venue';
  const payload = buildNotificationPayload(mockOffer, venueName);

  // Channel ID must match the flash_offers channel
  assertEquals(payload.android.channelId, 'flash_offers');
});

/**
 * Test: iOS APNs configuration
 * Validates: Requirement 2.6 - iOS-specific options are correct
 */
Deno.test('buildNotificationPayload - iOS APNs configuration', () => {
  const mockOffer: FlashOffer = {
    id: 'offer-123',
    venue_id: 'venue-456',
    title: 'Special Offer',
    description: 'Limited time deal',
    discount_percentage: 15,
    max_claims: 100,
    current_claims: 0,
    expires_at: '2024-12-31T23:59:59Z',
    push_sent: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const venueName = 'Venue';
  const payload = buildNotificationPayload(mockOffer, venueName);

  // Verify APNs configuration
  assertEquals(payload.apns.payload.aps['content-available'], 1);
  assertEquals(payload.apns.payload.aps.sound, 'default');
});

/**
 * Test: Data payload contains all required fields
 * Validates: Requirement 2.6 - Data payload is complete
 */
Deno.test('buildNotificationPayload - Data payload completeness', () => {
  const mockOffer: FlashOffer = {
    id: 'offer-abc-123',
    venue_id: 'venue-xyz-456',
    title: 'Special Offer',
    description: 'Limited time deal',
    discount_percentage: 15,
    max_claims: 100,
    current_claims: 0,
    expires_at: '2024-12-31T23:59:59Z',
    push_sent: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const venueName = 'Venue';
  const payload = buildNotificationPayload(mockOffer, venueName);

  // Verify all data fields are present and correct
  assertEquals(payload.data.offer_id, 'offer-abc-123');
  assertEquals(payload.data.venue_id, 'venue-xyz-456');
  assertEquals(payload.data.type, 'flash_offer');
  
  // Verify data fields are strings (required by FCM)
  assertEquals(typeof payload.data.offer_id, 'string');
  assertEquals(typeof payload.data.venue_id, 'string');
  assertEquals(typeof payload.data.type, 'string');
});
