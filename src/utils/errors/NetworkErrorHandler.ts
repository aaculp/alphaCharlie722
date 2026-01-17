/**
 * NetworkErrorHandler
 * 
 * Handles network errors with retry logic and offline caching
 * Provides user-friendly error messages and recovery options
 */

export interface NetworkError extends Error {
  isNetworkError: boolean;
  statusCode?: number;
  retryable: boolean;
}

export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

export class NetworkErrorHandler {
  /**
   * Check if an error is a network error
   */
  static isNetworkError(error: any): boolean {
    if (!error) return false;

    // Check for common network error indicators
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
   * Check if an error is retryable
   */
  static isRetryable(error: any): boolean {
    // Network errors are generally retryable
    if (this.isNetworkError(error)) {
      return true;
    }

    // Check for retryable HTTP status codes
    const statusCode = error.statusCode || error.status;
    if (statusCode) {
      // 408 Request Timeout, 429 Too Many Requests, 500+ Server Errors
      return statusCode === 408 || statusCode === 429 || statusCode >= 500;
    }

    return false;
  }

  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: any): string {
    if (this.isNetworkError(error)) {
      return 'Unable to connect. Please check your internet connection and try again.';
    }

    const statusCode = error.statusCode || error.status;
    if (statusCode) {
      switch (statusCode) {
        case 400:
          return 'Invalid request. Please check your input and try again.';
        case 401:
          return 'You need to be logged in to perform this action.';
        case 403:
          return 'You do not have permission to perform this action.';
        case 404:
          return 'The requested resource was not found.';
        case 408:
          return 'Request timed out. Please try again.';
        case 429:
          return 'Too many requests. Please wait a moment and try again.';
        case 500:
        case 502:
        case 503:
        case 504:
          return 'Server error. Please try again later.';
        default:
          return 'An error occurred. Please try again.';
      }
    }

    // Return the original error message if available
    return error.message || 'An unexpected error occurred.';
  }

  /**
   * Execute a function with retry logic
   */
  static async withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      backoffMultiplier = 2,
      onRetry,
    } = options;

    let lastError: Error;
    let currentDelay = retryDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // Don't retry if it's not a retryable error
        if (!this.isRetryable(error)) {
          throw this.enhanceError(error);
        }

        // Don't retry if we've exhausted all attempts
        if (attempt === maxRetries) {
          throw this.enhanceError(error);
        }

        // Call onRetry callback if provided
        if (onRetry) {
          onRetry(attempt + 1, lastError);
        }

        // Wait before retrying with exponential backoff
        await this.delay(currentDelay);
        currentDelay *= backoffMultiplier;
      }
    }

    throw this.enhanceError(lastError!);
  }

  /**
   * Enhance error with additional metadata
   */
  private static enhanceError(error: any): NetworkError {
    const enhanced = error as NetworkError;
    enhanced.isNetworkError = this.isNetworkError(error);
    enhanced.retryable = this.isRetryable(error);
    return enhanced;
  }

  /**
   * Delay helper for retry logic
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a network error with metadata
   */
  static createNetworkError(
    message: string,
    statusCode?: number,
    retryable: boolean = true
  ): NetworkError {
    const error = new Error(message) as NetworkError;
    error.isNetworkError = true;
    error.statusCode = statusCode;
    error.retryable = retryable;
    return error;
  }
}
