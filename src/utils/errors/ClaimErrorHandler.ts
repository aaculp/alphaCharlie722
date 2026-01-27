/**
 * Claim Error Handler
 * 
 * Comprehensive error handling for claim-related operations.
 * Provides error classification, actionable guidance, and consistent messaging.
 * 
 * Features:
 * - Error classification (temporary vs permanent failures)
 * - Actionable guidance for rejection messages
 * - Expiration handling with appropriate messaging
 * - Consistent error message format across screens
 * - Error logging for debugging
 * 
 * Requirements: 9.2, 9.3, 9.4, 9.5
 * 
 * @module ClaimErrorHandler
 * @category Utils
 */

/**
 * Error classification types
 */
export type ErrorClassification = 'temporary' | 'permanent';

/**
 * Claim error types
 */
export type ClaimErrorType =
  | 'expired'
  | 'rejected'
  | 'connection_failed'
  | 'auth_failed'
  | 'subscription_failed'
  | 'sync_failed'
  | 'invalid_claim'
  | 'already_redeemed'
  | 'unknown';

/**
 * Structured error information
 */
export interface ClaimError {
  /** Type of error */
  type: ClaimErrorType;
  /** Error classification (temporary or permanent) */
  classification: ErrorClassification;
  /** User-friendly error title */
  title: string;
  /** Detailed error message */
  message: string;
  /** Actionable guidance for the user */
  actionableGuidance: string;
  /** Whether the error is retryable */
  retryable: boolean;
  /** Original error (for logging) */
  originalError?: any;
}

/**
 * Error message templates with actionable guidance
 * 
 * Requirement 9.2: Add actionable guidance to rejection messages
 * Requirement 9.5: Ensure error message consistency across screens
 */
const ERROR_TEMPLATES: Record<ClaimErrorType, {
  title: string;
  message: (details?: string) => string;
  actionableGuidance: string;
  classification: ErrorClassification;
  retryable: boolean;
}> = {
  expired: {
    title: 'Claim Expired',
    message: () => 'This claim has expired and can no longer be redeemed.',
    actionableGuidance: 'Check for new flash offers in the app.',
    classification: 'permanent',
    retryable: false,
  },
  rejected: {
    title: 'Claim Rejected',
    message: (reason) => reason 
      ? `Your claim was rejected: ${reason}` 
      : 'Your claim was rejected by the venue.',
    actionableGuidance: 'Contact the venue for assistance or try claiming a different offer.',
    classification: 'permanent',
    retryable: false,
  },
  connection_failed: {
    title: 'Connection Issue',
    message: () => 'Unable to connect to real-time updates. You can still view your claims.',
    actionableGuidance: 'Check your internet connection and tap to retry.',
    classification: 'temporary',
    retryable: true,
  },
  auth_failed: {
    title: 'Authentication Error',
    message: () => 'Your session has expired. Please log in again.',
    actionableGuidance: 'Log out and log back in to continue.',
    classification: 'temporary',
    retryable: false,
  },
  subscription_failed: {
    title: 'Update Error',
    message: () => 'Unable to load real-time updates.',
    actionableGuidance: 'Pull down to refresh manually.',
    classification: 'temporary',
    retryable: true,
  },
  sync_failed: {
    title: 'Sync Error',
    message: () => 'Unable to sync your claims.',
    actionableGuidance: 'Check your connection and try again.',
    classification: 'temporary',
    retryable: true,
  },
  invalid_claim: {
    title: 'Invalid Claim',
    message: () => 'This claim is not valid or has already been used.',
    actionableGuidance: 'Check your claims list for active offers.',
    classification: 'permanent',
    retryable: false,
  },
  already_redeemed: {
    title: 'Already Redeemed',
    message: () => 'This claim has already been redeemed.',
    actionableGuidance: 'Check your claims history for details.',
    classification: 'permanent',
    retryable: false,
  },
  unknown: {
    title: 'Unexpected Error',
    message: () => 'An unexpected error occurred.',
    actionableGuidance: 'Please try again or contact support if the problem persists.',
    classification: 'temporary',
    retryable: true,
  },
};

/**
 * Claim Error Handler
 * 
 * Provides comprehensive error handling for claim-related operations.
 * Classifies errors, provides actionable guidance, and ensures consistent messaging.
 * 
 * @example
 * ```typescript
 * // Handle a rejected claim
 * const error = ClaimErrorHandler.createError(
 *   'rejected',
 *   'Invalid claim code'
 * );
 * 
 * console.log(error.title); // "Claim Rejected"
 * console.log(error.message); // "Your claim was rejected: Invalid claim code"
 * console.log(error.actionableGuidance); // "Contact the venue for assistance..."
 * console.log(error.classification); // "permanent"
 * console.log(error.retryable); // false
 * 
 * // Handle an expired claim
 * const expiredError = ClaimErrorHandler.createError('expired');
 * console.log(expiredError.message); // "This claim has expired..."
 * ```
 */
export class ClaimErrorHandler {
  /**
   * Create a structured error with classification and actionable guidance
   * 
   * Requirements:
   * - 9.2: Add actionable guidance to rejection messages
   * - 9.3: Implement expiration handling with appropriate messaging
   * - 9.4: Distinguish between temporary and permanent failures
   * - 9.5: Ensure error message consistency across screens
   * 
   * @param type - Type of error
   * @param details - Optional details (e.g., rejection reason)
   * @param originalError - Original error for logging
   * @returns Structured error information
   * 
   * @example
   * ```typescript
   * // Rejected claim with reason
   * const error = ClaimErrorHandler.createError(
   *   'rejected',
   *   'Claim code not found'
   * );
   * 
   * // Expired claim
   * const expiredError = ClaimErrorHandler.createError('expired');
   * 
   * // Connection failure
   * const connError = ClaimErrorHandler.createError(
   *   'connection_failed',
   *   undefined,
   *   originalNetworkError
   * );
   * ```
   */
  static createError(
    type: ClaimErrorType,
    details?: string,
    originalError?: any
  ): ClaimError {
    const template = ERROR_TEMPLATES[type];
    
    const error: ClaimError = {
      type,
      classification: template.classification,
      title: template.title,
      message: template.message(details),
      actionableGuidance: template.actionableGuidance,
      retryable: template.retryable,
      originalError,
    };

    // Log error for debugging (Requirement 9.5: Add error logging)
    this.logError(error);
    
    return error;
  }

  /**
   * Classify an error as temporary or permanent
   * 
   * Requirement 9.4: Distinguish between temporary and permanent failures
   * 
   * @param error - Error to classify
   * @returns Error classification
   * 
   * @example
   * ```typescript
   * const classification = ClaimErrorHandler.classifyError(networkError);
   * 
   * if (classification === 'temporary') {
   *   showRetryButton();
   * } else {
   *   showContactSupport();
   * }
   * ```
   */
  static classifyError(error: any): ErrorClassification {
    // Check if it's a ClaimError with classification
    if (error && typeof error === 'object' && 'classification' in error) {
      return error.classification;
    }
    
    // Check for network errors (temporary)
    if (this.isNetworkError(error)) {
      return 'temporary';
    }
    
    // Check for auth errors (temporary - can re-login)
    if (this.isAuthError(error)) {
      return 'temporary';
    }
    
    // Check for validation errors (permanent)
    if (this.isValidationError(error)) {
      return 'permanent';
    }
    
    // Default to temporary (safer to allow retry)
    return 'temporary';
  }

  /**
   * Check if an error is a network error
   * 
   * @param error - Error to check
   * @returns True if network error
   * @private
   */
  private static isNetworkError(error: any): boolean {
    if (!error) return false;
    
    const networkErrorMessages = [
      'network request failed',
      'network error',
      'failed to fetch',
      'timeout',
      'connection',
      'econnrefused',
      'enotfound',
      'etimedout',
    ];
    
    const errorMessage = (error.message || '').toLowerCase();
    return networkErrorMessages.some(msg => errorMessage.includes(msg));
  }

  /**
   * Check if an error is an authentication error
   * 
   * @param error - Error to check
   * @returns True if auth error
   * @private
   */
  private static isAuthError(error: any): boolean {
    if (!error) return false;
    
    const statusCode = error.statusCode || error.status;
    if (statusCode === 401 || statusCode === 403) {
      return true;
    }
    
    const errorMessage = (error.message || '').toLowerCase();
    return errorMessage.includes('auth') || errorMessage.includes('unauthorized');
  }

  /**
   * Check if an error is a validation error
   * 
   * @param error - Error to check
   * @returns True if validation error
   * @private
   */
  private static isValidationError(error: any): boolean {
    if (!error) return false;
    
    const statusCode = error.statusCode || error.status;
    if (statusCode === 400 || statusCode === 422) {
      return true;
    }
    
    const errorMessage = (error.message || '').toLowerCase();
    return errorMessage.includes('invalid') || errorMessage.includes('validation');
  }

  /**
   * Log error for debugging
   * 
   * Requirement 9.5: Add error logging for debugging
   * 
   * @param error - Error to log
   * @private
   */
  private static logError(error: ClaimError): void {
    console.error('🚨 Claim Error:', {
      type: error.type,
      classification: error.classification,
      title: error.title,
      message: error.message,
      actionableGuidance: error.actionableGuidance,
      retryable: error.retryable,
      originalError: error.originalError,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Format error for display in UI
   * 
   * Requirement 9.5: Ensure error message consistency across screens
   * 
   * @param error - Error to format
   * @returns Formatted error object for UI display
   * 
   * @example
   * ```typescript
   * const error = ClaimErrorHandler.createError('rejected', 'Invalid code');
   * const formatted = ClaimErrorHandler.formatForDisplay(error);
   * 
   * // Display in UI
   * <ErrorCard
   *   title={formatted.title}
   *   message={formatted.message}
   *   action={formatted.action}
   * />
   * ```
   */
  static formatForDisplay(error: ClaimError): {
    title: string;
    message: string;
    action: string;
    retryable: boolean;
    classification: ErrorClassification;
  } {
    return {
      title: error.title,
      message: error.message,
      action: error.actionableGuidance,
      retryable: error.retryable,
      classification: error.classification,
    };
  }

  /**
   * Handle claim status-based errors
   * 
   * Converts claim status to appropriate error type.
   * 
   * @param status - Claim status
   * @param rejectionReason - Optional rejection reason
   * @returns ClaimError or null if status is not an error
   * 
   * @example
   * ```typescript
   * // Handle expired claim
   * const error = ClaimErrorHandler.handleClaimStatus('expired');
   * if (error) {
   *   showErrorMessage(error.message);
   * }
   * 
   * // Handle rejected claim with reason
   * const rejectedError = ClaimErrorHandler.handleClaimStatus(
   *   'rejected',
   *   'Claim code not found'
   * );
   * ```
   */
  static handleClaimStatus(
    status: string,
    rejectionReason?: string
  ): ClaimError | null {
    switch (status) {
      case 'expired':
        return this.createError('expired');
      
      case 'rejected':
        return this.createError('rejected', rejectionReason);
      
      case 'redeemed':
        // Already redeemed is not necessarily an error, but can be treated as one
        return this.createError('already_redeemed');
      
      case 'active':
      case 'pending':
        // These are not error states
        return null;
      
      default:
        // Unknown status - include status in message for debugging
        return this.createError('unknown', undefined, { unknownStatus: status });
    }
  }
}

/**
 * Get actionable guidance for a rejection reason
 * 
 * Requirement 9.2: Add actionable guidance to rejection messages
 * 
 * @param reason - Rejection reason
 * @returns Actionable guidance text
 * 
 * @example
 * ```typescript
 * const guidance = getActionableGuidance('Invalid claim code');
 * // Returns: "Contact the venue for assistance or try claiming a different offer."
 * ```
 */
export function getActionableGuidance(reason?: string): string {
  // Check for specific rejection reasons and provide tailored guidance
  if (!reason) {
    return ERROR_TEMPLATES.rejected.actionableGuidance;
  }
  
  const lowerReason = reason.toLowerCase();
  
  if (lowerReason.includes('expired') || lowerReason.includes('time')) {
    return 'This offer has expired. Check for new flash offers in the app.';
  }
  
  if (lowerReason.includes('invalid') || lowerReason.includes('not found')) {
    return 'Verify your claim code and try again, or contact the venue for assistance.';
  }
  
  if (lowerReason.includes('already') || lowerReason.includes('used')) {
    return 'This claim has already been used. Check your claims history for details.';
  }
  
  if (lowerReason.includes('limit') || lowerReason.includes('maximum')) {
    return 'You have reached the claim limit for this offer. Try a different offer.';
  }
  
  // Default guidance
  return ERROR_TEMPLATES.rejected.actionableGuidance;
}

/**
 * Format expiration message with time information
 * 
 * Requirement 9.3: Implement expiration handling with appropriate messaging
 * 
 * @param expiresAt - Expiration timestamp
 * @returns Formatted expiration message
 * 
 * @example
 * ```typescript
 * const message = formatExpirationMessage('2024-01-15T10:00:00Z');
 * // Returns: "This claim expired on Jan 15, 2024 at 10:00 AM"
 * ```
 */
export function formatExpirationMessage(expiresAt?: string): string {
  if (!expiresAt) {
    return 'This claim has expired and can no longer be redeemed.';
  }
  
  try {
    const date = new Date(expiresAt);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'This claim has expired and can no longer be redeemed.';
    }
    
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const formattedTime = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    
    return `This claim expired on ${formattedDate} at ${formattedTime}.`;
  } catch (error) {
    return 'This claim has expired and can no longer be redeemed.';
  }
}
