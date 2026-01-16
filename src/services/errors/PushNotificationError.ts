/**
 * PushNotificationError
 * 
 * Comprehensive error handling for push notification system.
 * Categorizes errors and provides actionable error messages.
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.7
 */

/**
 * Error categories for push notifications
 */
export enum PushErrorCategory {
  // Token-related errors
  INVALID_TOKEN = 'INVALID_TOKEN',
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',
  TOKEN_NOT_FOUND = 'TOKEN_NOT_FOUND',
  
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  
  // FCM service errors
  FCM_UNAVAILABLE = 'FCM_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  
  // Permission errors
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  PERMISSION_NOT_GRANTED = 'PERMISSION_NOT_GRANTED',
  
  // Configuration errors
  INVALID_CONFIGURATION = 'INVALID_CONFIGURATION',
  MISSING_CREDENTIALS = 'MISSING_CREDENTIALS',
  
  // Payload errors
  INVALID_PAYLOAD = 'INVALID_PAYLOAD',
  PAYLOAD_TOO_LARGE = 'PAYLOAD_TOO_LARGE',
  
  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  
  // Unknown errors
  UNKNOWN = 'UNKNOWN',
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'LOW',       // Non-critical, can be ignored
  MEDIUM = 'MEDIUM', // Should be logged and monitored
  HIGH = 'HIGH',     // Requires attention
  CRITICAL = 'CRITICAL', // Requires immediate action
}

/**
 * Custom error class for push notifications
 */
export class PushNotificationError extends Error {
  public readonly category: PushErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly isRetryable: boolean;
  public readonly context: Record<string, any>;
  public readonly timestamp: Date;
  public readonly actionableMessage: string;

  constructor(
    message: string,
    category: PushErrorCategory,
    severity: ErrorSeverity,
    isRetryable: boolean,
    context: Record<string, any> = {}
  ) {
    super(message);
    this.name = 'PushNotificationError';
    this.category = category;
    this.severity = severity;
    this.isRetryable = isRetryable;
    this.context = context;
    this.timestamp = new Date();
    this.actionableMessage = this.generateActionableMessage();

    // Maintains proper stack trace for where our error was thrown
    // @ts-ignore - captureStackTrace is not in all environments
    if (typeof Error.captureStackTrace === 'function') {
      // @ts-ignore
      Error.captureStackTrace(this, PushNotificationError);
    }
  }

  /**
   * Generate actionable error message based on category
   */
  private generateActionableMessage(): string {
    switch (this.category) {
      case PushErrorCategory.INVALID_TOKEN:
        return 'Device token is invalid. The token will be removed from the database.';
      
      case PushErrorCategory.EXPIRED_TOKEN:
        return 'Device token has expired. Request a new token from FCM.';
      
      case PushErrorCategory.TOKEN_NOT_FOUND:
        return 'No device tokens found for user. User may need to re-login or enable push notifications.';
      
      case PushErrorCategory.NETWORK_ERROR:
        return 'Network error occurred. The notification will be retried automatically.';
      
      case PushErrorCategory.TIMEOUT:
        return 'Request timed out. The notification will be retried automatically.';
      
      case PushErrorCategory.CONNECTION_FAILED:
        return 'Failed to connect to FCM service. Check network connectivity.';
      
      case PushErrorCategory.FCM_UNAVAILABLE:
        return 'FCM service is temporarily unavailable. Notifications will be queued and retried.';
      
      case PushErrorCategory.RATE_LIMIT_EXCEEDED:
        return 'FCM rate limit exceeded. Notifications will be queued and sent after rate limit window.';
      
      case PushErrorCategory.QUOTA_EXCEEDED:
        return 'FCM quota exceeded. Contact administrator to increase quota.';
      
      case PushErrorCategory.PERMISSION_DENIED:
        return 'User has denied push notification permission. Direct user to enable in device settings.';
      
      case PushErrorCategory.PERMISSION_NOT_GRANTED:
        return 'Push notification permission not granted. Request permission from user.';
      
      case PushErrorCategory.INVALID_CONFIGURATION:
        return 'FCM configuration is invalid. Check Firebase setup and credentials.';
      
      case PushErrorCategory.MISSING_CREDENTIALS:
        return 'FCM credentials are missing. Ensure google-services.json (Android) or GoogleService-Info.plist (iOS) is configured.';
      
      case PushErrorCategory.INVALID_PAYLOAD:
        return 'Notification payload is invalid. Check payload structure and data types.';
      
      case PushErrorCategory.PAYLOAD_TOO_LARGE:
        return 'Notification payload exceeds size limit. Reduce payload size or remove large data.';
      
      case PushErrorCategory.DATABASE_ERROR:
        return 'Database error occurred. Check database connectivity and permissions.';
      
      case PushErrorCategory.UNKNOWN:
      default:
        return 'An unknown error occurred. Check logs for more details.';
    }
  }

  /**
   * Convert error to JSON for logging
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      category: this.category,
      severity: this.severity,
      isRetryable: this.isRetryable,
      actionableMessage: this.actionableMessage,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    };
  }

  /**
   * Create error from unknown error object
   */
  static fromError(
    error: unknown,
    context: Record<string, any> = {}
  ): PushNotificationError {
    // If already a PushNotificationError, return it
    if (error instanceof PushNotificationError) {
      return error;
    }

    // Extract error message
    const message = error instanceof Error ? error.message : String(error);
    
    // Categorize the error
    const { category, severity, isRetryable } = categorizeError(error);

    // Add original error to context
    const enrichedContext = {
      ...context,
      originalError: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : String(error),
    };

    return new PushNotificationError(
      message,
      category,
      severity,
      isRetryable,
      enrichedContext
    );
  }
}

/**
 * Categorize error based on error object
 */
function categorizeError(error: unknown): {
  category: PushErrorCategory;
  severity: ErrorSeverity;
  isRetryable: boolean;
} {
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  const errorCode = (error as any)?.code?.toLowerCase() || '';

  // Invalid token errors
  if (
    errorCode.includes('invalid-registration-token') ||
    errorCode.includes('registration-token-not-registered') ||
    errorMessage.includes('invalid token') ||
    errorMessage.includes('not registered')
  ) {
    return {
      category: PushErrorCategory.INVALID_TOKEN,
      severity: ErrorSeverity.MEDIUM,
      isRetryable: false,
    };
  }

  // Expired token errors
  if (
    errorMessage.includes('expired') ||
    errorMessage.includes('token expired')
  ) {
    return {
      category: PushErrorCategory.EXPIRED_TOKEN,
      severity: ErrorSeverity.MEDIUM,
      isRetryable: false,
    };
  }

  // Token not found
  if (
    errorMessage.includes('token not found') ||
    errorMessage.includes('no tokens')
  ) {
    return {
      category: PushErrorCategory.TOKEN_NOT_FOUND,
      severity: ErrorSeverity.LOW,
      isRetryable: false,
    };
  }

  // Network errors
  if (
    errorCode.includes('network-error') ||
    errorMessage.includes('network') ||
    errorMessage.includes('econnrefused') ||
    errorMessage.includes('enotfound')
  ) {
    return {
      category: PushErrorCategory.NETWORK_ERROR,
      severity: ErrorSeverity.MEDIUM,
      isRetryable: true,
    };
  }

  // Timeout errors
  if (
    errorMessage.includes('timeout') ||
    errorMessage.includes('etimedout')
  ) {
    return {
      category: PushErrorCategory.TIMEOUT,
      severity: ErrorSeverity.MEDIUM,
      isRetryable: true,
    };
  }

  // Connection failed
  if (
    errorMessage.includes('connection failed') ||
    errorMessage.includes('connection refused')
  ) {
    return {
      category: PushErrorCategory.CONNECTION_FAILED,
      severity: ErrorSeverity.HIGH,
      isRetryable: true,
    };
  }

  // FCM unavailable
  if (
    errorCode.includes('unavailable') ||
    errorCode.includes('service-unavailable') ||
    errorMessage.includes('fcm unavailable') ||
    errorMessage.includes('service unavailable')
  ) {
    return {
      category: PushErrorCategory.FCM_UNAVAILABLE,
      severity: ErrorSeverity.HIGH,
      isRetryable: true,
    };
  }

  // Rate limit exceeded
  if (
    errorCode.includes('too-many-requests') ||
    errorCode.includes('quota-exceeded') ||
    errorMessage.includes('rate limit') ||
    errorMessage.includes('too many requests')
  ) {
    return {
      category: PushErrorCategory.RATE_LIMIT_EXCEEDED,
      severity: ErrorSeverity.HIGH,
      isRetryable: true,
    };
  }

  // Quota exceeded
  if (
    errorMessage.includes('quota exceeded') ||
    errorMessage.includes('quota limit')
  ) {
    return {
      category: PushErrorCategory.QUOTA_EXCEEDED,
      severity: ErrorSeverity.CRITICAL,
      isRetryable: false,
    };
  }

  // Permission denied
  if (
    errorCode.includes('permission-denied') ||
    errorMessage.includes('permission denied')
  ) {
    return {
      category: PushErrorCategory.PERMISSION_DENIED,
      severity: ErrorSeverity.MEDIUM,
      isRetryable: false,
    };
  }

  // Permission not granted
  if (
    errorMessage.includes('permission not granted') ||
    errorMessage.includes('notifications not enabled')
  ) {
    return {
      category: PushErrorCategory.PERMISSION_NOT_GRANTED,
      severity: ErrorSeverity.LOW,
      isRetryable: false,
    };
  }

  // Invalid configuration
  if (
    errorMessage.includes('invalid configuration') ||
    errorMessage.includes('configuration error')
  ) {
    return {
      category: PushErrorCategory.INVALID_CONFIGURATION,
      severity: ErrorSeverity.CRITICAL,
      isRetryable: false,
    };
  }

  // Missing credentials
  if (
    errorMessage.includes('missing credentials') ||
    errorMessage.includes('credentials not found') ||
    errorMessage.includes('google-services.json') ||
    errorMessage.includes('googleservice-info.plist')
  ) {
    return {
      category: PushErrorCategory.MISSING_CREDENTIALS,
      severity: ErrorSeverity.CRITICAL,
      isRetryable: false,
    };
  }

  // Invalid payload
  if (
    errorMessage.includes('invalid payload') ||
    errorMessage.includes('invalid message')
  ) {
    return {
      category: PushErrorCategory.INVALID_PAYLOAD,
      severity: ErrorSeverity.MEDIUM,
      isRetryable: false,
    };
  }

  // Payload too large
  if (
    errorMessage.includes('payload too large') ||
    errorMessage.includes('message too large')
  ) {
    return {
      category: PushErrorCategory.PAYLOAD_TOO_LARGE,
      severity: ErrorSeverity.MEDIUM,
      isRetryable: false,
    };
  }

  // Database errors
  if (
    errorMessage.includes('database') ||
    errorMessage.includes('supabase') ||
    errorMessage.includes('postgres')
  ) {
    return {
      category: PushErrorCategory.DATABASE_ERROR,
      severity: ErrorSeverity.HIGH,
      isRetryable: true,
    };
  }

  // Unknown error
  return {
    category: PushErrorCategory.UNKNOWN,
    severity: ErrorSeverity.MEDIUM,
    isRetryable: true,
  };
}

/**
 * Error logger with context
 */
export class ErrorLogger {
  /**
   * Log error with full context
   */
  static logError(error: PushNotificationError): void {
    // Get environment safely for React Native
    let environment = 'development';
    try {
      // @ts-ignore - process may not be available in all environments
      if (typeof process !== 'undefined' && process.env?.NODE_ENV) {
        // @ts-ignore
        environment = process.env.NODE_ENV;
      }
    } catch {
      // Ignore errors accessing process
    }
    
    const logData = {
      ...error.toJSON(),
      environment,
    };

    // Log based on severity
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        console.error('🚨 CRITICAL ERROR:', logData);
        // TODO: Send alert to monitoring service
        break;
      
      case ErrorSeverity.HIGH:
        console.error('❌ HIGH SEVERITY ERROR:', logData);
        // TODO: Send to error tracking service
        break;
      
      case ErrorSeverity.MEDIUM:
        console.warn('⚠️ MEDIUM SEVERITY ERROR:', logData);
        break;
      
      case ErrorSeverity.LOW:
        console.log('ℹ️ LOW SEVERITY ERROR:', logData);
        break;
    }
  }

  /**
   * Log error with additional context
   */
  static logErrorWithContext(
    error: unknown,
    context: Record<string, any>
  ): void {
    const pushError = PushNotificationError.fromError(error, context);
    this.logError(pushError);
  }
}
