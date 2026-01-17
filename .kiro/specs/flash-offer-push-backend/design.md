# Design Document: Flash Offer Push Notification Backend

## Overview

This design document specifies the implementation of a Supabase Edge Function that sends real push notifications for flash offers using Firebase Cloud Messaging (FCM). The system replaces the current simulated notification sending with actual FCM delivery while maintaining the existing client-side targeting logic and user experience.

The solution uses Supabase Edge Functions (Deno-based serverless) to host the backend logic, Firebase Admin SDK for FCM integration, and proper security controls including RLS policies and rate limiting.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Native App                          │
│  ┌────────────────────┐         ┌─────────────────────────────┐ │
│  │ FlashOfferCreation │────────▶│ FlashOfferNotification      │ │
│  │ Modal              │         │ Service                     │ │
│  └────────────────────┘         └──────────┬──────────────────┘ │
│                                             │                     │
│                                             ▼                     │
│                                  ┌──────────────────────┐        │
│                                  │ FCMService           │        │
│                                  │ .sendViaEdgeFunction()│       │
│                                  └──────────┬───────────┘        │
└─────────────────────────────────────────────┼───────────────────┘
                                              │ HTTPS + JWT
                                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase Edge Function                        │
│                  /send-flash-offer-push                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 1. Authenticate JWT                                       │   │
│  │ 2. Validate rate limits                                   │   │
│  │ 3. Query offer details (service role)                     │   │
│  │ 4. Get targeted users (location + preferences)            │   │
│  │ 5. Filter by notification preferences & quiet hours       │   │
│  │ 6. Batch device tokens (500 per batch)                    │   │
│  │ 7. Send via Firebase Admin SDK                            │   │
│  │ 8. Mark invalid tokens inactive                           │   │
│  │ 9. Update offer.push_sent = true                          │   │
│  │ 10. Track analytics                                        │   │
│  │ 11. Return success/failure counts                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                              │
                                              ▼
                        ┌─────────────────────────────────┐
                        │ Firebase Cloud Messaging (FCM)  │
                        │ - Multicast API                 │
                        │ - High priority delivery        │
                        │ - Platform-specific payloads    │
                        └─────────────────────────────────┘
                                              │
                                              ▼
                                    ┌──────────────────┐
                                    │ User Devices     │
                                    │ (Android/iOS)    │
                                    └──────────────────┘
```

### Component Interaction Flow

1. **Venue Owner Creates Offer**: User creates flash offer in app with "Send Push Notification" enabled
2. **Client Calls Edge Function**: `FCMService.sendViaEdgeFunction(offerId)` makes HTTPS request with JWT
3. **Edge Function Authenticates**: Validates Supabase JWT token
4. **Rate Limit Check**: Verifies venue hasn't exceeded daily offer limit
5. **Query Database**: Uses service role key to fetch offer, venue, and user data
6. **Target Users**: Applies location-based targeting and preference filtering
7. **Batch Tokens**: Groups device tokens into batches of 500 (FCM limit)
8. **Send via FCM**: Uses Firebase Admin SDK multicast API
9. **Handle Responses**: Marks invalid tokens inactive, tracks analytics
10. **Return Results**: Sends success/failure counts back to client

## Components and Interfaces

### 1. Supabase Edge Function

**File**: `supabase/functions/send-flash-offer-push/index.ts`

**Responsibilities**:
- Authenticate incoming requests
- Enforce rate limits
- Query database with service role privileges
- Apply user targeting and preference filtering
- Send FCM notifications via Firebase Admin SDK
- Track analytics and update database
- Handle errors gracefully

**Interface**:
```typescript
// Request
POST /send-flash-offer-push
Headers:
  Authorization: Bearer <supabase_jwt_token>
Body:
  {
    offerId: string;
    dryRun?: boolean;  // Optional: validate without sending
  }

// Response (Success)
Status: 200
Body:
  {
    success: true,
    targetedUserCount: number,
    sentCount: number,
    failedCount: number,
    errors: Array<{ token: string, error: string }>
  }

// Response (Error)
Status: 400 | 404 | 429 | 500
Body:
  {
    success: false,
    error: string,
    code: string  // e.g., "RATE_LIMIT_EXCEEDED", "OFFER_NOT_FOUND"
  }
```

### 2. FCMService Updates

**File**: `src/services/FCMService.ts`

**New Method**:
```typescript
class FCMService {
  /**
   * Send push notification via Supabase Edge Function
   * Replaces the simulated backend with real FCM delivery
   */
  static async sendViaEdgeFunction(
    offerId: string
  ): Promise<{
    success: boolean;
    targetedUserCount: number;
    sentCount: number;
    failedCount: number;
    errors: Array<{ token: string; error: string }>;
  }>;
}
```

### 3. Database Schema Updates

**New Table**: `notification_preferences`
```sql
CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  flash_offers_enabled BOOLEAN DEFAULT true,
  quiet_hours_start TIME,  -- e.g., '22:00:00'
  quiet_hours_end TIME,    -- e.g., '08:00:00'
  timezone TEXT DEFAULT 'UTC',  -- IANA timezone, e.g., 'America/New_York'
  max_distance_miles DECIMAL(5,2),  -- NULL = no limit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_prefs_user ON notification_preferences(user_id);
```

**New Table**: `flash_offer_rate_limits`
```sql
CREATE TABLE flash_offer_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  limit_type TEXT NOT NULL,  -- 'venue_send' or 'user_receive'
  count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT check_limit_type CHECK (limit_type IN ('venue_send', 'user_receive')),
  CONSTRAINT check_venue_or_user CHECK (
    (venue_id IS NOT NULL AND user_id IS NULL) OR
    (venue_id IS NULL AND user_id IS NOT NULL)
  )
);

CREATE INDEX idx_rate_limits_venue ON flash_offer_rate_limits(venue_id, limit_type, expires_at);
CREATE INDEX idx_rate_limits_user ON flash_offer_rate_limits(user_id, limit_type, expires_at);
CREATE INDEX idx_rate_limits_expires ON flash_offer_rate_limits(expires_at);

-- Auto-cleanup expired rate limits
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM flash_offer_rate_limits WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

**RLS Policy Updates**: `device_tokens` table
```sql
-- Remove permissive testing policy
DROP POLICY IF EXISTS "Allow reading device tokens for push notifications (TESTING)" ON device_tokens;

-- Restore secure policies
CREATE POLICY "Users can manage own device tokens"
ON device_tokens
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Note: Edge Function uses service role key to bypass RLS
```

### 4. User Settings Screen

**File**: `src/screens/settings/NotificationSettingsScreen.tsx`

**New Screen** for managing notification preferences:
- Toggle: Flash Offer Notifications (on/off)
- Time Picker: Quiet Hours Start
- Time Picker: Quiet Hours End
- Dropdown: Timezone
- Slider: Maximum Distance (1-50 miles, or "No Limit")

## Data Models

### NotificationPreferences
```typescript
interface NotificationPreferences {
  user_id: string;
  flash_offers_enabled: boolean;
  quiet_hours_start: string | null;  // HH:MM:SS format
  quiet_hours_end: string | null;
  timezone: string;  // IANA timezone
  max_distance_miles: number | null;
  created_at: string;
  updated_at: string;
}
```

### RateLimit
```typescript
interface RateLimit {
  id: string;
  venue_id: string | null;
  user_id: string | null;
  limit_type: 'venue_send' | 'user_receive';
  count: number;
  window_start: string;
  expires_at: string;
  created_at: string;
}
```

### EdgeFunctionRequest
```typescript
interface EdgeFunctionRequest {
  offerId: string;
  dryRun?: boolean;
}
```

### EdgeFunctionResponse
```typescript
interface EdgeFunctionResponse {
  success: boolean;
  targetedUserCount: number;
  sentCount: number;
  failedCount: number;
  errors: Array<{
    token: string;
    error: string;
  }>;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: JWT Authentication Required
*For any* request to the Edge Function without a valid Supabase JWT token, the request should be rejected with a 401 Unauthorized error.
**Validates: Requirements 1.2**

### Property 2: Targeting Logic Consistency
*For any* venue location, radius, and set of users, the Edge Function's targeting logic should return the same set of targeted users as the client-side targeting logic.
**Validates: Requirements 1.4**

### Property 3: Response Format Accuracy
*For any* set of FCM send results, the Edge Function response should contain accurate success and failure counts that sum to the total number of targeted users.
**Validates: Requirements 1.6**

### Property 4: Push Sent Flag Update
*For any* flash offer that completes processing (successfully or with errors), the offer's push_sent flag should be set to true in the database.
**Validates: Requirements 1.7**

### Property 5: Error Messages Are Descriptive
*For any* error condition encountered by the Edge Function, the error response should contain a non-empty, descriptive error message.
**Validates: Requirements 1.8**

### Property 6: FCM Batch Size Limit
*For any* number of device tokens N, the Edge Function should split them into batches where each batch contains at most 500 tokens.
**Validates: Requirements 2.3**

### Property 7: FCM Error Categorization
*For any* FCM error response, the Edge Function should categorize it into one of the known error types (invalid_token, quota_exceeded, server_error, etc.).
**Validates: Requirements 2.4**

### Property 8: Invalid Token Deactivation
*For any* device token that FCM reports as invalid, the Edge Function should mark that token as inactive (is_active = false) in the database.
**Validates: Requirements 2.5**

### Property 9: Notification Payload Completeness
*For any* flash offer, the FCM notification payload should contain all required fields: title, body, data.offer_id, data.venue_id, data.type, android.channelId, and apns.payload.aps.
**Validates: Requirements 2.6**

### Property 10: High Priority Notifications
*For any* flash offer notification, the FCM message priority should be set to "high" for both Android and iOS platforms.
**Validates: Requirements 2.7**

### Property 11: No Credential Exposure
*For any* Edge Function response or log output, Firebase service account credentials and Supabase service role keys should not be present in the content.
**Validates: Requirements 3.4**

### Property 12: JWT Token Inclusion
*For any* call from FCMService to the Edge Function, the request headers should include the user's Supabase JWT token in the Authorization header.
**Validates: Requirements 4.2**

### Property 13: Offer ID Parameter Inclusion
*For any* call from FCMService to the Edge Function, the request body should include the offer ID.
**Validates: Requirements 4.3**

### Property 14: Response Parsing Accuracy
*For any* valid Edge Function response, the FCMService should correctly parse and return the success/failure counts.
**Validates: Requirements 4.4**

### Property 15: Client Token Access Restriction
*For any* user attempting to query device_tokens table for tokens belonging to other users, the query should fail with an RLS policy violation.
**Validates: Requirements 5.3**

### Property 16: User Own Token Access
*For any* user querying their own device tokens, the query should succeed and return only their tokens.
**Validates: Requirements 5.4**

### Property 17: Success Count Tracking
*For any* set of FCM send results, the Edge Function should track and return an accurate count of successful sends.
**Validates: Requirements 6.1**

### Property 18: Analytics Event Recording
*For any* completed push notification send, the Edge Function should create an analytics event with the offer ID and recipient count.
**Validates: Requirements 6.2**

### Property 19: Recipient Count Storage
*For any* flash offer with push notifications sent, the analytics database should store the count of users who received the notification.
**Validates: Requirements 6.3**

### Property 20: Failure Reason Logging
*For any* FCM send failure, the Edge Function should log an entry containing the failure reason and affected token.
**Validates: Requirements 6.5**

### Property 21: Idempotent Push Sending
*For any* flash offer with push_sent = true, calling the Edge Function again should return success without sending any notifications.
**Validates: Requirements 7.5**

### Property 22: Batch Request Minimization
*For any* number of device tokens N, the Edge Function should make ceiling(N / 500) FCM API calls, minimizing the total number of requests.
**Validates: Requirements 9.2**

### Property 23: Venue Rate Limit Checking
*For any* venue creating a flash offer, the Edge Function should query the database to count how many offers that venue has sent in the last 24 hours.
**Validates: Requirements 11.1**

### Property 24: Venue Rate Limit Enforcement
*For any* venue that has sent offers equal to or exceeding their tier's daily limit in the last 24 hours, the Edge Function should reject the new offer with a RATE_LIMIT_EXCEEDED error.
**Validates: Requirements 11.2**

### Property 25: User Notification Rate Checking
*For any* user being targeted for a notification, the Edge Function should check how many flash offer notifications that user has received in the last 24 hours.
**Validates: Requirements 11.3**

### Property 26: User Notification Rate Limit Exclusion
*For any* user who has received 10 or more flash offer notifications in the last 24 hours, the Edge Function should exclude that user from the targeted user list.
**Validates: Requirements 11.4**

### Property 27: Rate Limit Violation Logging
*For any* rate limit violation (venue or user), the Edge Function should create a log entry with the violation details.
**Validates: Requirements 11.5**

### Property 28: Rate Limit Counter Expiration
*For any* rate limit counter in the database, it should automatically expire and be eligible for deletion after 24 hours from creation.
**Validates: Requirements 11.6**

### Property 29: Tier-Based Rate Limits
*For any* venue with a specific subscription tier, the Edge Function should apply the correct daily offer limit: free=3, core=5, pro=10, revenue=unlimited.
**Validates: Requirements 11.8**

### Property 30: Default Preferences Creation
*For any* new user account created, the system should automatically create notification preferences with flash_offers_enabled = true.
**Validates: Requirements 12.2**

### Property 31: Disabled Notification Exclusion
*For any* user with flash_offers_enabled = false in their preferences, the Edge Function should exclude that user from the targeted user list.
**Validates: Requirements 12.4**

### Property 32: OS Permission Respect
*For any* user whose device has notification permissions disabled at the OS level, the Edge Function should exclude that user from the targeted user list.
**Validates: Requirements 12.5**

### Property 33: Immediate Preference Effect
*For any* user who disables flash offer notifications, subsequent Edge Function calls should immediately exclude that user from targeting.
**Validates: Requirements 12.6**

### Property 34: Quiet Hours Exclusion
*For any* user with quiet hours configured, if the current time in their timezone falls within their quiet hours range, the Edge Function should exclude that user from the targeted user list.
**Validates: Requirements 12.8**

### Property 35: Timezone-Aware Quiet Hours
*For any* user with quiet hours configured, the Edge Function should evaluate whether the user is in quiet hours using the user's local timezone, not UTC.
**Validates: Requirements 12.9**

## Error Handling

### Error Categories

1. **Authentication Errors** (401)
   - Missing JWT token
   - Invalid JWT token
   - Expired JWT token

2. **Validation Errors** (400)
   - Missing offer ID
   - Invalid offer ID format
   - Invalid request body

3. **Not Found Errors** (404)
   - Offer not found
   - Venue not found

4. **Rate Limit Errors** (429)
   - Venue daily limit exceeded
   - User notification limit exceeded
   - FCM quota exceeded

5. **Server Errors** (500)
   - Firebase Admin SDK initialization failure
   - Database connection failure
   - Missing environment variables

### Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: string;  // Human-readable error message
  code: string;   // Machine-readable error code
  details?: any;  // Optional additional context
}
```

### Error Codes

- `UNAUTHORIZED`: Missing or invalid JWT
- `INVALID_REQUEST`: Malformed request body
- `OFFER_NOT_FOUND`: Offer ID doesn't exist
- `VENUE_NOT_FOUND`: Venue doesn't exist
- `RATE_LIMIT_EXCEEDED`: Daily limit reached
- `PUSH_ALREADY_SENT`: Offer already has push_sent = true
- `FIREBASE_INIT_FAILED`: Firebase Admin SDK initialization error
- `DATABASE_ERROR`: Database query failure
- `FCM_QUOTA_EXCEEDED`: Firebase quota limit reached
- `INTERNAL_ERROR`: Unexpected server error

### Retry Logic

**Client-Side Retries** (FCMService):
- Retry once after 2 seconds for network errors
- Do not retry for 4xx errors (client errors)
- Do not retry for RATE_LIMIT_EXCEEDED
- Do retry for 500 errors (server errors)

**Edge Function Retries**:
- Retry database queries once on connection failure
- Do not retry FCM sends (FCM handles retries internally)
- Log all retry attempts

## Testing Strategy

### Unit Tests

**Edge Function Unit Tests**:
- Test JWT authentication with valid/invalid tokens
- Test rate limit checking logic
- Test user targeting and filtering
- Test FCM payload construction
- Test batch splitting logic
- Test error handling for each error type
- Test idempotency (calling twice with same offer)

**FCMService Unit Tests**:
- Test Edge Function endpoint calling
- Test JWT token inclusion
- Test retry logic
- Test response parsing
- Test error handling

**Database Tests**:
- Test RLS policies on device_tokens
- Test notification_preferences CRUD operations
- Test rate_limit counter creation and expiration
- Test quiet hours timezone handling

### Property-Based Tests

Each correctness property listed above should be implemented as a property-based test using a testing library appropriate for the language:
- **Edge Function (TypeScript/Deno)**: Use `fast-check` library
- **React Native (TypeScript)**: Use `fast-check` library
- **Database (SQL)**: Use pgTAP or manual test scripts

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with: `Feature: flash-offer-push-backend, Property N: [property title]`

**Example Property Test**:
```typescript
// Property 6: FCM Batch Size Limit
import fc from 'fast-check';

test('Property 6: FCM Batch Size Limit', () => {
  fc.assert(
    fc.property(
      fc.array(fc.string(), { minLength: 0, maxLength: 2000 }), // Random array of tokens
      (tokens) => {
        const batches = splitIntoBatches(tokens, 500);
        
        // All batches except possibly the last should have exactly 500 items
        for (let i = 0; i < batches.length - 1; i++) {
          expect(batches[i].length).toBe(500);
        }
        
        // Last batch should have remaining items (1-500)
        if (batches.length > 0) {
          expect(batches[batches.length - 1].length).toBeLessThanOrEqual(500);
          expect(batches[batches.length - 1].length).toBeGreaterThan(0);
        }
        
        // Total items should equal input
        const totalItems = batches.reduce((sum, batch) => sum + batch.length, 0);
        expect(totalItems).toBe(tokens.length);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Tests

**End-to-End Flow**:
1. Create test venue owner account
2. Create test customer accounts with various preferences
3. Create flash offer via app
4. Verify Edge Function is called
5. Verify FCM messages are sent
6. Verify notifications appear on test devices
7. Verify analytics are tracked
8. Verify rate limits are enforced

**Test Scenarios**:
- Happy path: All users receive notifications
- Rate limit: Venue exceeds daily limit
- User preferences: Some users have notifications disabled
- Quiet hours: Some users are in quiet hours
- Invalid tokens: Some device tokens are invalid
- Idempotency: Calling Edge Function twice for same offer
- Concurrent offers: Multiple venues create offers simultaneously

### Local Testing

**Supabase CLI**:
```bash
# Start local Supabase
supabase start

# Deploy Edge Function locally
supabase functions deploy send-flash-offer-push --no-verify-jwt

# Test Edge Function
curl -X POST http://localhost:54321/functions/v1/send-flash-offer-push \
  -H "Authorization: Bearer <test_jwt>" \
  -H "Content-Type: application/json" \
  -d '{"offerId": "test-offer-id", "dryRun": true}'
```

**Dry-Run Mode**:
- Set `dryRun: true` in request body
- Edge Function validates all logic without sending FCM messages
- Returns what would have been sent
- Useful for testing targeting and filtering logic

## Deployment

### Prerequisites

1. **Firebase Service Account**:
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Download JSON file
   - Store entire JSON as Supabase secret

2. **Supabase Service Role Key**:
   - Go to Supabase Dashboard → Project Settings → API
   - Copy "service_role" key (not anon key!)
   - Store as Supabase secret

### Configuration

**Supabase Secrets**:
```bash
# Set Firebase service account (entire JSON as string)
supabase secrets set FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'

# Set Supabase service role key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY='eyJhbGc...'

# Set Supabase URL
supabase secrets set SUPABASE_URL='https://your-project.supabase.co'
```

### Deployment Steps

1. **Install Supabase CLI**:
```bash
npm install -g supabase
```

2. **Login to Supabase**:
```bash
supabase login
```

3. **Link Project**:
```bash
supabase link --project-ref your-project-ref
```

4. **Deploy Edge Function**:
```bash
supabase functions deploy send-flash-offer-push
```

5. **Verify Deployment**:
```bash
# Test with dry-run
curl -X POST https://your-project.supabase.co/functions/v1/send-flash-offer-push \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"offerId": "test-id", "dryRun": true}'
```

6. **Deploy Database Migrations**:
```bash
# Create migration for new tables
supabase migration new add_notification_preferences_and_rate_limits

# Apply migrations
supabase db push
```

7. **Update RLS Policies**:
```bash
# Run SQL to update device_tokens policies
supabase db execute -f database/migrations/xxx_update_device_tokens_rls.sql
```

8. **Deploy App Updates**:
```bash
# Update FCMService to use Edge Function
# Deploy to app stores or OTA update
```

### Rollback Plan

If issues occur after deployment:

1. **Revert Edge Function**:
```bash
# Deploy previous version
git checkout <previous-commit>
supabase functions deploy send-flash-offer-push
```

2. **Revert Database Changes**:
```bash
# Rollback migration
supabase db reset --version <previous-version>
```

3. **Revert App Changes**:
```bash
# Deploy previous app version
# Or toggle feature flag to use simulated backend
```

### Monitoring

**Edge Function Logs**:
```bash
# View real-time logs
supabase functions logs send-flash-offer-push --tail

# View recent logs
supabase functions logs send-flash-offer-push --limit 100
```

**Metrics to Monitor**:
- Edge Function invocation count
- Edge Function error rate
- Edge Function execution time (p50, p95, p99)
- FCM send success rate
- Rate limit violation count
- Invalid token count

**Alerts**:
- Edge Function error rate > 5%
- Edge Function execution time > 25 seconds
- FCM send failure rate > 10%
- Rate limit violations > 100/hour

## Performance Considerations

### Optimization Strategies

1. **Database Query Optimization**:
   - Use indexes on frequently queried columns
   - Batch database operations where possible
   - Use connection pooling (built into Supabase)

2. **FCM Batching**:
   - Group tokens into batches of 500
   - Send batches in parallel (up to 10 concurrent)
   - Use multicast API instead of individual sends

3. **Caching**:
   - Cache venue subscription tier for rate limit checks
   - Cache user preferences for 5 minutes
   - Use in-memory cache for repeated queries within same request

4. **Timeout Management**:
   - Set 30-second timeout for Edge Function
   - Set 5-second timeout for individual FCM batches
   - Set 3-second timeout for database queries

### Scalability Limits

**Current Design**:
- Max 1000 users per offer: ~2 seconds
- Max 5000 users per offer: ~10 seconds
- Max 10000 users per offer: ~20 seconds

**If Scaling Beyond 10K Users**:
- Consider async job queue (e.g., Supabase Queue or external service)
- Split large sends into multiple Edge Function invocations
- Implement progressive notification sending (send to closest users first)

## Security Considerations

### Authentication & Authorization

- All Edge Function requests require valid Supabase JWT
- JWT must belong to venue owner creating the offer
- Service role key never exposed to client
- Firebase service account credentials stored in secrets

### Data Privacy

- Device tokens never exposed to clients
- User preferences are private (RLS enforced)
- Rate limit data is not exposed to clients
- Logs do not contain PII or credentials

### Rate Limiting

- Prevents venue spam (tier-based limits)
- Prevents user notification fatigue (10/day max)
- Prevents abuse of Edge Function (Supabase built-in limits)

### Input Validation

- Validate offer ID format (UUID)
- Validate JWT signature and expiration
- Sanitize all user inputs
- Validate FCM token format before sending

## Future Enhancements

### Phase 2 Features

1. **Scheduled Notifications**:
   - Allow venues to schedule offers for future delivery
   - Use Supabase cron jobs or external scheduler

2. **A/B Testing**:
   - Send different notification variants to user segments
   - Track which variants have higher claim rates

3. **Notification Templates**:
   - Pre-defined templates for common offer types
   - Emoji and formatting suggestions

4. **Advanced Targeting**:
   - Target by user demographics (age, gender)
   - Target by past behavior (frequent visitors, high spenders)
   - Target by device type (iOS vs Android)

5. **Delivery Optimization**:
   - Send at optimal times based on user activity patterns
   - Throttle sends to avoid overwhelming users

6. **Rich Notifications**:
   - Include images in notifications
   - Add action buttons (Claim Now, View Details)
   - Support notification categories

### Performance Improvements

1. **Async Processing**:
   - Move FCM sending to background job queue
   - Return immediately to client, process asynchronously

2. **Caching Layer**:
   - Cache user preferences in Redis
   - Cache venue data in Redis
   - Reduce database queries

3. **Database Optimization**:
   - Use PostGIS for efficient distance calculations
   - Materialize frequently queried data
   - Partition large tables by date

## Conclusion

This design provides a complete, production-ready solution for sending real push notifications for flash offers. The system is secure, scalable, and maintainable, with proper error handling, rate limiting, and user preference controls.

The implementation follows best practices for serverless architecture, uses industry-standard tools (Firebase Admin SDK, Supabase Edge Functions), and includes comprehensive testing strategies to ensure correctness.

Next steps: Review this design, then proceed to create the implementation task list.
