# Error Handling Implementation

This document describes the comprehensive error handling implemented in the Edge Function.

## Overview

The Edge Function implements robust error handling to ensure graceful degradation and proper error reporting for all failure scenarios.

## Error Categories

### 1. Authentication Errors (401)
- **Missing JWT token**: Returns `UNAUTHORIZED` when Authorization header is missing
- **Invalid JWT token**: Returns `UNAUTHORIZED` when JWT is malformed or invalid
- **Expired JWT token**: Returns `UNAUTHORIZED` when JWT has expired

### 2. Validation Errors (400)
- **Missing offer ID**: Returns `INVALID_REQUEST` when offerId is not provided
- **Invalid offer ID format**: Returns `INVALID_REQUEST` when offerId is not a valid UUID
- **Invalid request body**: Returns `INVALID_REQUEST` when JSON parsing fails
- **Missing venue location**: Returns `INVALID_REQUEST` when venue lacks coordinates

### 3. Not Found Errors (404)
- **Offer not found**: Returns `OFFER_NOT_FOUND` when offer ID doesn't exist
- **Venue not found**: Returns `VENUE_NOT_FOUND` when venue doesn't exist

### 4. Rate Limit Errors (429)
- **Venue rate limit exceeded**: Returns `RATE_LIMIT_EXCEEDED` with details about current count and limit
- **FCM quota exceeded**: Returns `FCM_QUOTA_EXCEEDED` when Firebase quota is reached

### 5. Server Errors (500)
- **Firebase initialization failure**: Returns `FIREBASE_INIT_FAILED` when Firebase Admin SDK fails to initialize
- **Database errors**: Returns `DATABASE_ERROR` when database queries fail
- **Missing environment variables**: Returns `INTERNAL_ERROR` when required config is missing
- **Timeout errors**: Returns `INTERNAL_ERROR` when execution exceeds 30 seconds
- **Unexpected errors**: Returns `INTERNAL_ERROR` for any unhandled exceptions

## Key Features

### Timeout Handling (Requirement 7.6)
- **30-second timeout**: All requests are wrapped in a 30-second timeout
- **Graceful timeout**: Returns descriptive error when timeout is reached
- **Execution time logging**: Logs execution time for all requests
- **Warning threshold**: Logs warning when execution exceeds 25 seconds

### Database Retry Logic (Requirement 7.2)
- **Automatic retry**: Database operations are retried once on failure
- **500ms delay**: Waits 500ms before retry attempt
- **Retry logging**: Logs both initial failure and retry attempts
- **Operations covered**:
  - getOfferDetails
  - getVenueDetails
  - checkVenueRateLimit
  - getTargetedUsers
  - filterUsersByRateLimit
  - incrementVenueRateLimit
  - incrementUserRateLimits

### Comprehensive Error Logging (Requirement 7.7)
All errors are logged with structured context including:
- **Timestamp**: ISO 8601 timestamp
- **Offer ID**: When available
- **Venue ID**: When available
- **Error message**: Human-readable error description
- **Stack trace**: For Error objects
- **Execution time**: For timeout errors
- **Log levels**:
  - `[ERROR]`: Critical errors that prevent operation
  - `[WARN]`: Non-critical issues (rate limits, missing data)
  - `[INFO]`: Normal operation events

### Error Response Format
All error responses follow a consistent structure:
```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_CODE",
  "details": {
    // Optional additional context
  }
}
```

### FCM Quota Handling (Requirement 7.1)
- **Quota detection**: Identifies FCM quota exceeded errors
- **Threshold check**: Returns 429 if >50% of sends fail due to quota
- **Partial success**: Allows partial success if only some sends fail
- **Error categorization**: Categorizes all FCM errors appropriately

### Idempotency (Requirement 7.5)
- **Push already sent**: Returns success without re-sending if push_sent=true
- **Prevents duplicates**: Ensures offers are only pushed once
- **Dry-run bypass**: Allows dry-run even if already sent

### Non-Critical Error Handling
Some operations are logged but don't fail the request:
- **Marking offer as push_sent**: Logged but doesn't fail send
- **Incrementing rate limits**: Logged but doesn't fail send
- **Tracking analytics**: Logged but doesn't fail send

This ensures that notification delivery succeeds even if auxiliary operations fail.

## Testing

Error handling is tested through:
- **Unit tests**: Test individual error scenarios
- **Property-based tests**: Test error handling across many inputs
- **Integration tests**: Test end-to-end error flows

See `index.test.ts` for comprehensive test coverage.

## Requirements Validation

This implementation satisfies all requirements from task 13:
- ✅ 7.1: Handle FCM quota exceeded (429)
- ✅ 7.2: Retry database queries once on connection failure
- ✅ 7.3: Handle Firebase init errors (500)
- ✅ 7.4: Handle offer not found (404)
- ✅ 7.5: Handle push already sent (idempotency)
- ✅ 7.6: Add timeout handling (30 seconds)
- ✅ 7.7: Log all errors with context
