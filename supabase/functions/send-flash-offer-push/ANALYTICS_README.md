# Analytics Tracking Module

## Overview

The analytics module (`analytics.ts`) provides functions for tracking push notification analytics in the flash offer system. It implements requirements 6.1, 6.2, 6.3, and 6.5 from the design specification.

## Functions

### `trackPushSent(supabase, data)`

Tracks a successful push notification send operation.

**Parameters:**
- `supabase`: SupabaseClient with service role key
- `data`: PushAnalyticsData object containing:
  - `offerId`: UUID of the flash offer
  - `venueId`: UUID of the venue
  - `targetedCount`: Number of users targeted
  - `successCount`: Number of successful sends
  - `failureCount`: Number of failed sends
  - `errors`: Array of error objects with token and error message

**Behavior:**
- Stores analytics event in `flash_offer_analytics` table
- Records `push_sent` event type
- Uses `successCount` as the recipient count (Requirement 6.1, 6.3)
- Stores metadata including targeted count, failed count, and venue ID (Requirement 6.2)
- Logs failure reasons when errors exist (Requirement 6.5)
- Does not throw exceptions - analytics failures should not break the main flow

**Example:**
```typescript
await trackPushSent(supabase, {
  offerId: 'offer-123',
  venueId: 'venue-456',
  targetedCount: 100,
  successCount: 95,
  failureCount: 5,
  errors: [
    { token: 'token1', error: 'invalid-token' },
    { token: 'token2', error: 'quota-exceeded' },
  ],
});
```

### `trackPushFailed(supabase, offerId, venueId, errorCode, errorMessage)`

Tracks a failed push notification operation (e.g., rate limit exceeded, offer not found).

**Parameters:**
- `supabase`: SupabaseClient with service role key
- `offerId`: UUID of the flash offer
- `venueId`: UUID of the venue
- `errorCode`: Error code (e.g., 'RATE_LIMIT_EXCEEDED')
- `errorMessage`: Human-readable error message

**Behavior:**
- Stores analytics event in `flash_offer_analytics` table
- Records `push_failed` event type
- Sets recipient count to 0
- Stores error details in metadata
- Does not throw exceptions

**Example:**
```typescript
await trackPushFailed(
  supabase,
  'offer-123',
  'venue-456',
  'RATE_LIMIT_EXCEEDED',
  'Venue has exceeded daily offer limit'
);
```

## Database Schema

The analytics module writes to the `flash_offer_analytics` table:

```sql
CREATE TABLE flash_offer_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID REFERENCES flash_offers(id),
  event_type TEXT NOT NULL,
  recipient_count INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Requirements Mapping

- **Requirement 6.1**: Track the count of successful sends
  - Implemented by storing `successCount` as `recipient_count`

- **Requirement 6.2**: Record push_sent event in analytics service
  - Implemented by inserting record with `event_type: 'push_sent'`

- **Requirement 6.3**: Store the recipient count for each flash offer
  - Implemented by storing `recipient_count` field in analytics table

- **Requirement 6.5**: Log failure reasons for debugging
  - Implemented by logging errors array to console when failures occur

## Testing

Unit tests are provided in `analytics.test.ts`. Run with:

```bash
deno test --allow-env --allow-net analytics.test.ts
```

Tests cover:
- Correct data storage
- Success count tracking
- Zero success handling
- Database error handling
- Failure reason logging
- Metadata completeness

## Integration

The analytics module is integrated into the main Edge Function handler (`index.ts`):

```typescript
// After sending notifications
const { trackPushSent } = await import('./analytics.ts');
await trackPushSent(supabase, {
  offerId: offerId,
  venueId: offer.venue_id,
  targetedCount: rateLimitedUsers.length,
  successCount: fcmResult.successCount,
  failureCount: fcmResult.failureCount,
  errors: fcmResult.errors,
});
```

## Error Handling

The analytics module is designed to be resilient:
- Database errors are caught and logged, but not thrown
- Analytics failures do not break the main notification flow
- All errors are logged to console for debugging
- Functions return void and never throw exceptions

This ensures that analytics tracking issues do not prevent notifications from being sent.
