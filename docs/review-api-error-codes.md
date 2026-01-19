# Review API Error Codes

## Overview

This document provides a comprehensive reference for all error codes returned by the Review Service API. Each error includes the error code, HTTP status equivalent, description, and recommended client handling.

## Error Code Format

Error codes follow the format: `REVIEW_XXX` where XXX is a descriptive identifier.

## Error Categories

- [Validation Errors](#validation-errors) (400-level)
- [Authentication Errors](#authentication-errors) (401-level)
- [Authorization Errors](#authorization-errors) (403-level)
- [Not Found Errors](#not-found-errors) (404-level)
- [Conflict Errors](#conflict-errors) (409-level)
- [Rate Limit Errors](#rate-limit-errors) (429-level)
- [Content Moderation Errors](#content-moderation-errors) (422-level)
- [Server Errors](#server-errors) (500-level)

---

## Validation Errors

### REVIEW_INVALID_RATING

**HTTP Status:** 400 Bad Request

**Description:** Rating value is invalid (must be 1-5)

**Example:**
```json
{
  "error": "REVIEW_INVALID_RATING",
  "message": "Rating must be between 1 and 5",
  "details": {
    "provided": 0,
    "min": 1,
    "max": 5
  }
}
```

**Client Handling:**
- Validate rating on client side before submission
- Show error message: "Please select a rating between 1 and 5 stars"
- Highlight rating selector

---

### REVIEW_TEXT_TOO_LONG

**HTTP Status:** 400 Bad Request

**Description:** Review text exceeds 500 character limit

**Example:**
```json
{
  "error": "REVIEW_TEXT_TOO_LONG",
  "message": "Review text cannot exceed 500 characters",
  "details": {
    "provided": 523,
    "max": 500,
    "excess": 23
  }
}
```

**Client Handling:**
- Enforce character limit on client side
- Show character counter
- Prevent submission when limit exceeded
- Show error: "Review text is too long. Please shorten by 23 characters."

---

### REVIEW_TEXT_EMPTY

**HTTP Status:** 400 Bad Request

**Description:** Review text contains only whitespace

**Example:**
```json
{
  "error": "REVIEW_TEXT_EMPTY",
  "message": "Review text cannot be empty or contain only whitespace",
  "details": {
    "provided": "   \n\n   "
  }
}
```

**Client Handling:**
- Trim whitespace before submission
- Show error: "Please enter some text for your review"
- Focus text input field

---

### REVIEW_MISSING_RATING

**HTTP Status:** 400 Bad Request

**Description:** Rating is required but not provided

**Example:**
```json
{
  "error": "REVIEW_MISSING_RATING",
  "message": "Rating is required to submit a review"
}
```

**Client Handling:**
- Disable submit button until rating selected
- Show error: "Please select a star rating before submitting"
- Highlight rating selector

---

### REVIEW_INVALID_VENUE

**HTTP Status:** 400 Bad Request

**Description:** Venue ID is invalid or malformed

**Example:**
```json
{
  "error": "REVIEW_INVALID_VENUE",
  "message": "Invalid venue ID format",
  "details": {
    "provided": "not-a-uuid"
  }
}
```

**Client Handling:**
- Validate venue ID format before API call
- Show generic error: "Unable to submit review. Please try again."
- Log error for debugging

---

### RESPONSE_TEXT_TOO_LONG

**HTTP Status:** 400 Bad Request

**Description:** Venue owner response exceeds 300 character limit

**Example:**
```json
{
  "error": "RESPONSE_TEXT_TOO_LONG",
  "message": "Response text cannot exceed 300 characters",
  "details": {
    "provided": 315,
    "max": 300,
    "excess": 15
  }
}
```

**Client Handling:**
- Enforce 300 character limit on response input
- Show character counter
- Show error: "Response is too long. Please shorten by 15 characters."

---

## Authentication Errors

### REVIEW_NOT_AUTHENTICATED

**HTTP Status:** 401 Unauthorized

**Description:** User is not authenticated

**Example:**
```json
{
  "error": "REVIEW_NOT_AUTHENTICATED",
  "message": "You must be signed in to submit a review"
}
```

**Client Handling:**
- Redirect to login screen
- Preserve review draft in local storage
- Show message: "Please sign in to submit your review"
- Restore draft after successful login

---

### REVIEW_SESSION_EXPIRED

**HTTP Status:** 401 Unauthorized

**Description:** User session has expired

**Example:**
```json
{
  "error": "REVIEW_SESSION_EXPIRED",
  "message": "Your session has expired. Please sign in again."
}
```

**Client Handling:**
- Refresh authentication token
- Retry request with new token
- If refresh fails, redirect to login
- Preserve review draft

---

## Authorization Errors

### REVIEW_NOT_OWNER

**HTTP Status:** 403 Forbidden

**Description:** User attempting to edit/delete review they don't own

**Example:**
```json
{
  "error": "REVIEW_NOT_OWNER",
  "message": "You can only edit or delete your own reviews",
  "details": {
    "reviewId": "123e4567-e89b-12d3-a456-426614174000",
    "ownerId": "123e4567-e89b-12d3-a456-426614174001",
    "requesterId": "123e4567-e89b-12d3-a456-426614174002"
  }
}
```

**Client Handling:**
- Hide edit/delete buttons for reviews user doesn't own
- Show error: "You can only edit your own reviews"
- Refresh review list to ensure UI is in sync

---

### RESPONSE_NOT_VENUE_OWNER

**HTTP Status:** 403 Forbidden

**Description:** User attempting to respond to review but is not venue owner

**Example:**
```json
{
  "error": "RESPONSE_NOT_VENUE_OWNER",
  "message": "Only venue owners can respond to reviews",
  "details": {
    "venueId": "123e4567-e89b-12d3-a456-426614174000",
    "userId": "123e4567-e89b-12d3-a456-426614174001"
  }
}
```

**Client Handling:**
- Hide "Respond" button for non-venue-owners
- Show error: "Only the venue owner can respond to reviews"
- Verify user role before showing response UI

---

### HELPFUL_VOTE_OWN_REVIEW

**HTTP Status:** 403 Forbidden

**Description:** User attempting to vote helpful on their own review

**Example:**
```json
{
  "error": "HELPFUL_VOTE_OWN_REVIEW",
  "message": "You cannot mark your own review as helpful",
  "details": {
    "reviewId": "123e4567-e89b-12d3-a456-426614174000",
    "userId": "123e4567-e89b-12d3-a456-426614174001"
  }
}
```

**Client Handling:**
- Disable helpful button on user's own reviews
- Show tooltip: "You can't vote on your own review"
- Gray out helpful button

---

## Not Found Errors

### REVIEW_NOT_FOUND

**HTTP Status:** 404 Not Found

**Description:** Review with specified ID does not exist

**Example:**
```json
{
  "error": "REVIEW_NOT_FOUND",
  "message": "Review not found",
  "details": {
    "reviewId": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

**Client Handling:**
- Refresh review list
- Show message: "This review has been deleted"
- Remove review from local cache

---

### VENUE_NOT_FOUND

**HTTP Status:** 404 Not Found

**Description:** Venue with specified ID does not exist

**Example:**
```json
{
  "error": "VENUE_NOT_FOUND",
  "message": "Venue not found",
  "details": {
    "venueId": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

**Client Handling:**
- Show error: "This venue no longer exists"
- Navigate back to venue list
- Remove venue from local cache

---

### RESPONSE_NOT_FOUND

**HTTP Status:** 404 Not Found

**Description:** Venue response with specified ID does not exist

**Example:**
```json
{
  "error": "RESPONSE_NOT_FOUND",
  "message": "Venue response not found",
  "details": {
    "responseId": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

**Client Handling:**
- Refresh review to get latest data
- Show message: "Response has been deleted"
- Update UI to remove response

---

## Conflict Errors

### REVIEW_ALREADY_EXISTS

**HTTP Status:** 409 Conflict

**Description:** User has already reviewed this venue

**Example:**
```json
{
  "error": "REVIEW_ALREADY_EXISTS",
  "message": "You have already reviewed this venue",
  "details": {
    "venueId": "123e4567-e89b-12d3-a456-426614174000",
    "userId": "123e4567-e89b-12d3-a456-426614174001",
    "existingReviewId": "123e4567-e89b-12d3-a456-426614174002"
  }
}
```

**Client Handling:**
- Redirect to edit review flow
- Show message: "You've already reviewed this venue. Would you like to edit your review?"
- Provide "Edit Review" button
- Pre-populate form with existing review

---

### RESPONSE_ALREADY_EXISTS

**HTTP Status:** 409 Conflict

**Description:** Venue owner has already responded to this review

**Example:**
```json
{
  "error": "RESPONSE_ALREADY_EXISTS",
  "message": "You have already responded to this review",
  "details": {
    "reviewId": "123e4567-e89b-12d3-a456-426614174000",
    "existingResponseId": "123e4567-e89b-12d3-a456-426614174001"
  }
}
```

**Client Handling:**
- Redirect to edit response flow
- Show message: "You've already responded. Would you like to edit your response?"
- Provide "Edit Response" button
- Pre-populate form with existing response

---

### REPORT_ALREADY_EXISTS

**HTTP Status:** 409 Conflict

**Description:** User has already reported this review

**Example:**
```json
{
  "error": "REPORT_ALREADY_EXISTS",
  "message": "You have already reported this review",
  "details": {
    "reviewId": "123e4567-e89b-12d3-a456-426614174000",
    "userId": "123e4567-e89b-12d3-a456-426614174001"
  }
}
```

**Client Handling:**
- Disable report button
- Show message: "You've already reported this review. Our team will review it soon."
- Hide report option from menu

---

## Rate Limit Errors

### REVIEW_RATE_LIMIT_EXCEEDED

**HTTP Status:** 429 Too Many Requests

**Description:** User has exceeded review submission rate limit (5 per hour)

**Example:**
```json
{
  "error": "REVIEW_RATE_LIMIT_EXCEEDED",
  "message": "You have reached the review submission limit",
  "details": {
    "limit": 5,
    "window": "1 hour",
    "resetAt": "2026-01-12T15:30:00Z",
    "retryAfter": 1800
  }
}
```

**Client Handling:**
- Disable submit button
- Show countdown timer: "You can submit another review in 30 minutes"
- Calculate time remaining from `retryAfter` (seconds)
- Show message: "You've reached the review limit. Please try again later."

---

### HELPFUL_VOTE_RATE_LIMIT

**HTTP Status:** 429 Too Many Requests

**Description:** User has exceeded helpful vote rate limit

**Example:**
```json
{
  "error": "HELPFUL_VOTE_RATE_LIMIT",
  "message": "You are voting too quickly. Please slow down.",
  "details": {
    "retryAfter": 60
  }
}
```

**Client Handling:**
- Temporarily disable helpful buttons
- Show message: "Please wait a moment before voting again"
- Re-enable after `retryAfter` seconds

---

## Content Moderation Errors

### REVIEW_CONTENT_REJECTED

**HTTP Status:** 422 Unprocessable Entity

**Description:** Review contains severe inappropriate content (hate speech, threats)

**Example:**
```json
{
  "error": "REVIEW_CONTENT_REJECTED",
  "message": "Your review contains inappropriate content and cannot be submitted",
  "details": {
    "severity": "severe",
    "reason": "hate_speech",
    "guidelinesUrl": "https://example.com/community-guidelines"
  }
}
```

**Client Handling:**
- Clear review text
- Show error: "Your review violates our community guidelines and cannot be submitted"
- Provide link to community guidelines
- Suggest: "Please revise your review and try again"

---

### REVIEW_CONTENT_FILTERED

**HTTP Status:** 200 OK (Warning)

**Description:** Review contains mild profanity that was automatically censored

**Example:**
```json
{
  "success": true,
  "review": { /* review object */ },
  "warning": {
    "code": "REVIEW_CONTENT_FILTERED",
    "message": "Some words in your review were filtered",
    "details": {
      "severity": "mild",
      "filteredCount": 2
    }
  }
}
```

**Client Handling:**
- Submit succeeds but show info message
- Show: "Your review was submitted. Some words were automatically filtered."
- Display filtered review text
- Allow user to edit if desired

---

## Server Errors

### REVIEW_DATABASE_ERROR

**HTTP Status:** 500 Internal Server Error

**Description:** Database operation failed

**Example:**
```json
{
  "error": "REVIEW_DATABASE_ERROR",
  "message": "Unable to process your request. Please try again.",
  "details": {
    "requestId": "req_123456789"
  }
}
```

**Client Handling:**
- Show generic error: "Something went wrong. Please try again."
- Provide retry button
- Log error with requestId for support
- Preserve review draft for retry

---

### REVIEW_TRIGGER_ERROR

**HTTP Status:** 500 Internal Server Error

**Description:** Aggregate rating trigger failed to execute

**Example:**
```json
{
  "error": "REVIEW_TRIGGER_ERROR",
  "message": "Review was saved but rating update failed",
  "details": {
    "reviewId": "123e4567-e89b-12d3-a456-426614174000",
    "requestId": "req_123456789"
  }
}
```

**Client Handling:**
- Review was saved successfully
- Show warning: "Your review was submitted but ratings may take a moment to update"
- Refresh venue rating after delay
- Log error for monitoring

---

### MODERATION_SERVICE_ERROR

**HTTP Status:** 503 Service Unavailable

**Description:** Content moderation service is unavailable

**Example:**
```json
{
  "error": "MODERATION_SERVICE_ERROR",
  "message": "Content moderation is temporarily unavailable",
  "details": {
    "fallback": "basic_filter",
    "retryAfter": 300
  }
}
```

**Client Handling:**
- Review submission may proceed with basic filtering
- Show warning: "Content moderation is temporarily limited"
- Retry after `retryAfter` seconds
- Log error for monitoring

---

## Error Response Format

All errors follow this standard format:

```typescript
interface ErrorResponse {
  error: string;           // Error code (e.g., "REVIEW_INVALID_RATING")
  message: string;         // Human-readable error message
  details?: {              // Optional additional details
    [key: string]: any;
  };
  requestId?: string;      // Optional request ID for support
  timestamp?: string;      // Optional error timestamp
}
```

## Client Error Handling Best Practices

### 1. Validation Before Submission

Validate on client side to prevent unnecessary API calls:

```typescript
function validateReview(rating: number, text?: string): string | null {
  if (!rating || rating < 1 || rating > 5) {
    return 'Please select a rating between 1 and 5 stars';
  }
  
  if (text) {
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      return 'Review text cannot be empty';
    }
    if (trimmed.length > 500) {
      return `Review text is too long (${trimmed.length}/500 characters)`;
    }
  }
  
  return null; // Valid
}
```

### 2. Graceful Error Display

Show user-friendly error messages:

```typescript
function getErrorMessage(error: ErrorResponse): string {
  const messages: Record<string, string> = {
    REVIEW_INVALID_RATING: 'Please select a rating between 1 and 5 stars',
    REVIEW_TEXT_TOO_LONG: 'Your review is too long. Please shorten it.',
    REVIEW_NOT_AUTHENTICATED: 'Please sign in to submit a review',
    REVIEW_ALREADY_EXISTS: 'You\'ve already reviewed this venue',
    REVIEW_RATE_LIMIT_EXCEEDED: 'You\'ve reached the review limit. Please try again later.',
    REVIEW_CONTENT_REJECTED: 'Your review violates our community guidelines',
  };
  
  return messages[error.error] || 'Something went wrong. Please try again.';
}
```

### 3. Retry Logic

Implement exponential backoff for transient errors:

```typescript
async function submitReviewWithRetry(
  params: SubmitReviewParams,
  maxRetries = 3
): Promise<Review> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await ReviewService.submitReview(params);
    } catch (error) {
      lastError = error;
      
      // Don't retry validation or conflict errors
      if (error.error?.startsWith('REVIEW_INVALID') || 
          error.error?.includes('ALREADY_EXISTS')) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}
```

### 4. Draft Preservation

Save review drafts to prevent data loss:

```typescript
function saveReviewDraft(venueId: string, rating: number, text?: string) {
  const draft = { venueId, rating, text, timestamp: Date.now() };
  localStorage.setItem(`review_draft_${venueId}`, JSON.stringify(draft));
}

function loadReviewDraft(venueId: string): ReviewDraft | null {
  const stored = localStorage.getItem(`review_draft_${venueId}`);
  if (!stored) return null;
  
  const draft = JSON.parse(stored);
  
  // Expire drafts after 24 hours
  if (Date.now() - draft.timestamp > 24 * 60 * 60 * 1000) {
    localStorage.removeItem(`review_draft_${venueId}`);
    return null;
  }
  
  return draft;
}

function clearReviewDraft(venueId: string) {
  localStorage.removeItem(`review_draft_${venueId}`);
}
```

### 5. Rate Limit Handling

Track rate limit resets and show countdown:

```typescript
function handleRateLimitError(error: ErrorResponse) {
  const resetAt = new Date(error.details.resetAt);
  const now = new Date();
  const secondsRemaining = Math.floor((resetAt.getTime() - now.getTime()) / 1000);
  
  // Show countdown timer
  const timer = setInterval(() => {
    const remaining = Math.floor((resetAt.getTime() - Date.now()) / 1000);
    if (remaining <= 0) {
      clearInterval(timer);
      enableSubmitButton();
      showMessage('You can now submit reviews again');
    } else {
      updateCountdown(remaining);
    }
  }, 1000);
}
```

## Monitoring and Logging

### Client-Side Error Logging

Log errors for debugging and monitoring:

```typescript
function logReviewError(error: ErrorResponse, context: any) {
  // Log to analytics service
  analytics.track('review_error', {
    error_code: error.error,
    error_message: error.message,
    request_id: error.requestId,
    venue_id: context.venueId,
    user_id: context.userId,
    timestamp: new Date().toISOString(),
  });
  
  // Log to error tracking service (e.g., Sentry)
  Sentry.captureException(new Error(error.message), {
    tags: {
      error_code: error.error,
      request_id: error.requestId,
    },
    extra: {
      details: error.details,
      context,
    },
  });
}
```

### Server-Side Error Monitoring

Monitor error rates and alert on anomalies:

```sql
-- Query to check error rates
SELECT 
    error_code,
    COUNT(*) as error_count,
    COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as error_percentage
FROM error_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY error_code
ORDER BY error_count DESC;
```

Alert if:
- Error rate > 5% of total requests
- Specific error code > 1% of requests
- Server errors (5xx) > 0.1% of requests

---

**Last Updated:** January 12, 2026
