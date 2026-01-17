# Rate Limit Error Handling UI Implementation

## Overview

Implemented comprehensive rate limit error handling in the Flash Offer creation UI to provide clear, actionable feedback to venue owners when they exceed their daily offer limits.

## Implementation Details

### 1. Enhanced Error Response Types

**File: `src/services/api/flashOfferNotifications.ts`**
- Added `errorCode` and `errorDetails` fields to `FlashOfferPushResult` interface
- Propagates rate limit details (currentCount, limit, resetsAt) from Edge Function

**File: `src/services/FCMService.ts`**
- Updated `sendViaEdgeFunction` return type to include error metadata
- Extracts rate limit details from Edge Function response
- Properly maps error codes and details for client consumption

### 2. User-Friendly Error Messages

**File: `src/components/venue/FlashOfferCreationModal.tsx`**

Implemented intelligent rate limit error handling that:

1. **Detects Rate Limit Errors**: Checks for `RATE_LIMIT_EXCEEDED` error code
2. **Displays Clear Information**:
   - Current usage vs. limit (e.g., "3/3 sent")
   - Subscription tier information
   - Time until reset (calculated from `resetsAt`)
3. **Provides Upgrade Suggestions**:
   - Free tier → suggests Core (5 offers/day)
   - Core tier → suggests Pro (10 offers/day)
   - Pro/Revenue tier → no upgrade suggestion
4. **Prevents Confusion**: Doesn't show success message when rate limited

### 3. Example Error Messages

**Free Tier (3/day limit reached):**
```
You've reached your daily limit of 3 flash offers (3/3 sent).

Your FREE plan allows 3 offers per 24 hours.

You can send your next offer in approximately 5 hours.

💡 Upgrade to CORE to send up to 5 offers per day!
```

**Core Tier (5/day limit reached):**
```
You've reached your daily limit of 5 flash offers (5/5 sent).

Your CORE plan allows 5 offers per 24 hours.

You can send your next offer in approximately 2 hours.

💡 Upgrade to PRO to send up to 10 offers per day!
```

**Pro Tier (10/day limit reached):**
```
You've reached your daily limit of 10 flash offers (10/10 sent).

Your PRO plan allows 10 offers per 24 hours.

You can send your next offer in approximately 1 hour.
```

## Testing

**File: `src/components/venue/__tests__/FlashOfferCreationModal.rateLimit.test.tsx`**

Comprehensive test suite covering:
- ✅ Free tier rate limit display with upgrade suggestion
- ✅ Core tier rate limit display with upgrade suggestion
- ✅ Pro tier rate limit display without upgrade suggestion
- ✅ Success message suppression when rate limited

All tests passing (4/4).

## Requirements Satisfied

**Requirement 11.7**: "WHEN a venue is rate limited, THE Client SHALL display a clear message explaining the limit and when they can send again"

✅ **Clear message**: Shows current count, limit, and tier
✅ **When they can send again**: Calculates and displays hours until reset
✅ **Tier-specific limits**: Displays limits based on subscription tier

## User Experience Benefits

1. **Transparency**: Users understand exactly why they're blocked
2. **Actionable**: Shows when they can try again
3. **Monetization**: Encourages upgrades with specific benefit callouts
4. **Professional**: Polished error messages maintain app quality

## Technical Notes

- Error handling is non-blocking: rate limit errors don't crash the app
- Time calculations are timezone-aware (uses ISO timestamps from server)
- Graceful degradation: if reset time parsing fails, still shows useful message
- Type-safe: All error details are properly typed in TypeScript
