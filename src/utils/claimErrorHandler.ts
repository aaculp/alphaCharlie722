/**
 * Claim Error Handler
 * 
 * Handles errors from claim operations and provides user-friendly messages
 * with actionable guidance. Categorizes errors into eligibility, network,
 * timeout, race condition, and unknown types.
 * 
 * @module claimErrorHandler
 * @category Utils
 */

import { NetworkErrorHandler } from './errors/NetworkErrorHandler';

/**
 * Error action types that determine how the UI should respond
 */
export type ErrorAction = 'retry' | 'dismiss' | 'navigate' | 'check_claims';

/**
 * Error severity levels for UI styling
 */
export type ErrorSeverity = 'error' | 'warning' | 'info';

/**
 * Categorized error types for claim operations
 */
export type ClaimErrorType = 
  | 'eligibility'
  | 'network'
  | 'timeout'
  | 'race_condition'
  | 'unknown';

/**
 * Structured error response with user-friendly message and action guidance
 */
export interface ClaimErrorResponse {
  /** Error type category */
  type: ClaimErrorType;
  /** User-friendly error message */
  message: string;
  /** Recommended action for the user */
  action: ErrorAction;
  /** Error severity level */
  severity: ErrorSeverity;
  /** Optional navigation target for 'navigate' action */
  navigationTarget?: string;
  /** Original error for debugging */
  originalError?: Error;
}

/**
 * Eligibility error codes from ClaimService
 * Order matters - more specific patterns should come first
 */
const ELIGIBILITY_ERROR_PATTERNS: Array<{ pattern: string; message: string; key: string }> = [
  { pattern: 'checked in', message: 'You must check in at the venue to claim this offer', key: 'not_checked_in' },
  { pattern: 'already claimed', message: "You've already claimed this offer. View your claim in My Claims.", key: 'already_claimed' },
  { pattern: 'not currently active', message: 'This offer is not currently available', key: 'not_active' },
  { pattern: 'not active', message: 'This offer is not currently available', key: 'not_active' },
  { pattern: 'expired', message: 'This offer has expired', key: 'expired' },
];

/**
 * Handle claim operation errors and return structured error response
 * 
 * Categorizes errors into specific types and provides appropriate user messages
 * and action guidance. Handles eligibility errors, network errors, timeouts,
 * race conditions, and unknown errors.
 * 
 * @param error - The error thrown from the claim operation
 * @returns Structured error response with message and action guidance
 * 
 * @example
 * ```typescript
 * try {
 *   await claimOffer(offerId, userId);
 * } catch (error) {
 *   const errorResponse = handleClaimError(error);
 *   
 *   // Display error message
 *   showErrorMessage(errorResponse.message);
 *   
 *   // Show appropriate action button
 *   if (errorResponse.action === 'retry') {
 *     showRetryButton();
 *   } else if (errorResponse.action === 'navigate') {
 *     showNavigateButton(errorResponse.navigationTarget);
 *   }
 * }
 * ```
 */
export function handleClaimError(error: any): ClaimErrorResponse {
  const errorMessage = (error?.message || '').toLowerCase();

  // 1. Check for timeout errors first (before network check, as timeout can be network-related)
  if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    return {
      type: 'timeout',
      message: 'Request timed out. Your claim may still be processing. Check My Claims or try again.',
      action: 'check_claims',
      severity: 'warning',
      originalError: error,
    };
  }

  // 2. Check for race condition errors (before eligibility check for maximum claims)
  if (
    errorMessage.includes('race condition') ||
    (errorMessage.includes('maximum claims') && errorMessage.includes('concurrent'))
  ) {
    return {
      type: 'race_condition',
      message: 'This offer was just claimed by someone else and is now full',
      action: 'dismiss',
      severity: 'warning',
      originalError: error,
    };
  }

  // 3. Check for maximum claims (offer full) - specific eligibility error
  if (errorMessage.includes('maximum claims') || errorMessage.includes('reached its maximum')) {
    return {
      type: 'eligibility',
      message: 'This offer has been fully claimed. Check back for new offers!',
      action: 'dismiss',
      severity: 'warning',
      originalError: error,
    };
  }

  // 4. Check for other eligibility errors (order matters - more specific first)
  for (const { pattern, message, key } of ELIGIBILITY_ERROR_PATTERNS) {
    if (errorMessage.includes(pattern)) {
      // Special case: not checked in should navigate to check-in
      if (key === 'not_checked_in') {
        return {
          type: 'eligibility',
          message,
          action: 'navigate',
          severity: 'warning',
          navigationTarget: 'check_in',
          originalError: error,
        };
      }

      // Already claimed should allow viewing the claim
      if (key === 'already_claimed') {
        return {
          type: 'eligibility',
          message,
          action: 'navigate',
          severity: 'info',
          navigationTarget: 'my_claims',
          originalError: error,
        };
      }

      // Other eligibility errors are just dismissible
      return {
        type: 'eligibility',
        message,
        action: 'dismiss',
        severity: 'warning',
        originalError: error,
      };
    }
  }

  // 5. Check for network errors
  if (NetworkErrorHandler.isNetworkError(error)) {
    return {
      type: 'network',
      message: 'Unable to connect. Check your internet connection and try again.',
      action: 'retry',
      severity: 'error',
      originalError: error,
    };
  }

  // 6. Unknown error - provide generic retry message
  return {
    type: 'unknown',
    message: 'Something went wrong. Please try again.',
    action: 'retry',
    severity: 'error',
    originalError: error,
  };
}

/**
 * Get a user-friendly error message for a specific error type
 * 
 * @param errorType - The type of error
 * @returns User-friendly error message
 */
export function getErrorMessage(errorType: ClaimErrorType): string {
  switch (errorType) {
    case 'eligibility':
      return 'You are not eligible to claim this offer';
    case 'network':
      return 'Unable to connect. Check your internet connection and try again.';
    case 'timeout':
      return 'Request timed out. Your claim may still be processing.';
    case 'race_condition':
      return 'This offer was just claimed by someone else and is now full';
    case 'unknown':
      return 'Something went wrong. Please try again.';
  }
}

/**
 * Check if an error is retryable
 * 
 * @param errorResponse - The structured error response
 * @returns True if the error can be retried
 */
export function isRetryableError(errorResponse: ClaimErrorResponse): boolean {
  return errorResponse.action === 'retry';
}

/**
 * Check if an error requires navigation
 * 
 * @param errorResponse - The structured error response
 * @returns True if the error requires navigation to another screen
 */
export function requiresNavigation(errorResponse: ClaimErrorResponse): boolean {
  return errorResponse.action === 'navigate';
}
