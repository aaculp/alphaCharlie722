/**
 * ErrorRateTracker
 * 
 * Tracks error rates for push notification system and alerts administrators
 * when error rate exceeds threshold.
 * 
 * Requirements: 12.6, 12.10
 */

import { PushNotificationError, ErrorSeverity } from '../errors/PushNotificationError';

/**
 * Error rate statistics
 */
export interface ErrorRateStats {
  totalAttempts: number;
  totalErrors: number;
  errorRate: number; // Percentage (0-100)
  criticalErrors: number;
  highSeverityErrors: number;
  mediumSeverityErrors: number;
  lowSeverityErrors: number;
  timeWindow: string; // ISO timestamp of window start
}

/**
 * Alert configuration
 */
export interface AlertConfig {
  errorRateThreshold: number; // Percentage (0-100)
  criticalErrorThreshold: number; // Number of critical errors
  timeWindowMinutes: number; // Time window for tracking
  alertCallback?: (stats: ErrorRateStats) => void;
}

/**
 * Error event for tracking
 */
interface ErrorEvent {
  timestamp: Date;
  error: PushNotificationError;
  operation: string;
}

/**
 * Default alert configuration
 */
const DEFAULT_ALERT_CONFIG: AlertConfig = {
  errorRateThreshold: 25, // Alert if error rate exceeds 25%
  criticalErrorThreshold: 5, // Alert if 5+ critical errors
  timeWindowMinutes: 60, // Track errors over 60 minute window
};

export class ErrorRateTracker {
  private static instance: ErrorRateTracker | null = null;
  private errorEvents: ErrorEvent[] = [];
  private totalAttempts: number = 0;
  private config: AlertConfig;
  private lastAlertTime: Date | null = null;
  private alertCooldownMinutes: number = 15; // Don't alert more than once per 15 minutes

  private constructor(config: Partial<AlertConfig> = {}) {
    this.config = { ...DEFAULT_ALERT_CONFIG, ...config };
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<AlertConfig>): ErrorRateTracker {
    if (!this.instance) {
      this.instance = new ErrorRateTracker(config);
    }
    return this.instance;
  }

  /**
   * Reset the singleton instance (useful for testing)
   */
  static resetInstance(): void {
    this.instance = null;
  }

  /**
   * Track a successful operation
   */
  trackSuccess(): void {
    this.totalAttempts++;
    this.cleanupOldEvents();
  }

  /**
   * Track an error
   * 
   * @param error - Push notification error
   * @param operation - Operation that failed
   */
  trackError(error: PushNotificationError, operation: string): void {
    this.totalAttempts++;
    
    const errorEvent: ErrorEvent = {
      timestamp: new Date(),
      error,
      operation,
    };
    
    this.errorEvents.push(errorEvent);
    this.cleanupOldEvents();
    
    // Check if we should alert
    this.checkAndAlert();
  }

  /**
   * Get current error rate statistics
   */
  getStats(): ErrorRateStats {
    this.cleanupOldEvents();
    
    const timeWindow = new Date();
    timeWindow.setMinutes(timeWindow.getMinutes() - this.config.timeWindowMinutes);
    
    const totalErrors = this.errorEvents.length;
    const errorRate = this.totalAttempts > 0 
      ? (totalErrors / this.totalAttempts) * 100 
      : 0;
    
    // Count errors by severity
    const criticalErrors = this.errorEvents.filter(
      e => e.error.severity === ErrorSeverity.CRITICAL
    ).length;
    
    const highSeverityErrors = this.errorEvents.filter(
      e => e.error.severity === ErrorSeverity.HIGH
    ).length;
    
    const mediumSeverityErrors = this.errorEvents.filter(
      e => e.error.severity === ErrorSeverity.MEDIUM
    ).length;
    
    const lowSeverityErrors = this.errorEvents.filter(
      e => e.error.severity === ErrorSeverity.LOW
    ).length;
    
    return {
      totalAttempts: this.totalAttempts,
      totalErrors,
      errorRate,
      criticalErrors,
      highSeverityErrors,
      mediumSeverityErrors,
      lowSeverityErrors,
      timeWindow: timeWindow.toISOString(),
    };
  }

  /**
   * Reset statistics
   */
  reset(): void {
    this.errorEvents = [];
    this.totalAttempts = 0;
    this.lastAlertTime = null;
  }

  /**
   * Update alert configuration
   */
  updateConfig(config: Partial<AlertConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): AlertConfig {
    return { ...this.config };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Remove error events outside the time window
   */
  private cleanupOldEvents(): void {
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - this.config.timeWindowMinutes);
    
    this.errorEvents = this.errorEvents.filter(
      event => event.timestamp > cutoffTime
    );
    
    // Also reset totalAttempts if no events in window
    if (this.errorEvents.length === 0) {
      this.totalAttempts = 0;
    }
  }

  /**
   * Check if alert should be triggered and send alert
   */
  private checkAndAlert(): void {
    // Check cooldown period
    if (this.lastAlertTime) {
      const minutesSinceLastAlert = 
        (new Date().getTime() - this.lastAlertTime.getTime()) / (1000 * 60);
      
      if (minutesSinceLastAlert < this.alertCooldownMinutes) {
        return; // Still in cooldown period
      }
    }
    
    const stats = this.getStats();
    
    // Check if error rate exceeds threshold
    const errorRateExceeded = stats.errorRate > this.config.errorRateThreshold;
    
    // Check if critical errors exceed threshold
    const criticalErrorsExceeded = 
      stats.criticalErrors >= this.config.criticalErrorThreshold;
    
    if (errorRateExceeded || criticalErrorsExceeded) {
      this.sendAlert(stats, errorRateExceeded, criticalErrorsExceeded);
      this.lastAlertTime = new Date();
    }
  }

  /**
   * Send alert to administrators
   * 
   * @param stats - Current error rate statistics
   * @param errorRateExceeded - Whether error rate threshold was exceeded
   * @param criticalErrorsExceeded - Whether critical error threshold was exceeded
   */
  private sendAlert(
    stats: ErrorRateStats,
    errorRateExceeded: boolean,
    criticalErrorsExceeded: boolean
  ): void {
    const reasons: string[] = [];
    
    if (errorRateExceeded) {
      reasons.push(
        `Error rate (${stats.errorRate.toFixed(1)}%) exceeds threshold (${this.config.errorRateThreshold}%)`
      );
    }
    
    if (criticalErrorsExceeded) {
      reasons.push(
        `Critical errors (${stats.criticalErrors}) exceed threshold (${this.config.criticalErrorThreshold})`
      );
    }
    
    const alertMessage = `
🚨 PUSH NOTIFICATION SYSTEM ALERT 🚨

${reasons.join('\n')}

Statistics (${this.config.timeWindowMinutes} minute window):
- Total Attempts: ${stats.totalAttempts}
- Total Errors: ${stats.totalErrors}
- Error Rate: ${stats.errorRate.toFixed(1)}%
- Critical Errors: ${stats.criticalErrors}
- High Severity Errors: ${stats.highSeverityErrors}
- Medium Severity Errors: ${stats.mediumSeverityErrors}
- Low Severity Errors: ${stats.lowSeverityErrors}

Time Window Start: ${stats.timeWindow}

Action Required: Investigate push notification system errors immediately.
    `.trim();
    
    // Log alert
    console.error(alertMessage);
    
    // Call custom alert callback if provided
    if (this.config.alertCallback) {
      try {
        this.config.alertCallback(stats);
      } catch (error) {
        console.error('Error calling alert callback:', error);
      }
    }
    
    // TODO: Send alert via monitoring service (e.g., PagerDuty, Slack, email)
    // Example:
    // await sendSlackAlert(alertMessage);
    // await sendEmailAlert('admin@example.com', 'Push Notification Alert', alertMessage);
  }
}

/**
 * Convenience function to track success
 */
export function trackSuccess(): void {
  ErrorRateTracker.getInstance().trackSuccess();
}

/**
 * Convenience function to track error
 */
export function trackError(error: PushNotificationError, operation: string): void {
  ErrorRateTracker.getInstance().trackError(error, operation);
}

/**
 * Convenience function to get stats
 */
export function getErrorStats(): ErrorRateStats {
  return ErrorRateTracker.getInstance().getStats();
}

/**
 * Convenience function to configure alerts
 */
export function configureAlerts(config: Partial<AlertConfig>): void {
  ErrorRateTracker.getInstance().updateConfig(config);
}
