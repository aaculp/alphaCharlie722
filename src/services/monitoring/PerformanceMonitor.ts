/**
 * PerformanceMonitor
 * 
 * Monitors push notification delivery performance including latency and success rate.
 * Tracks metrics and alerts on performance degradation.
 * 
 * Requirements: 14.5, 14.6, 14.9
 */

/**
 * Performance metrics for a time window
 */
export interface PerformanceMetrics {
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  successRate: number; // Percentage (0-100)
  averageLatencyMs: number;
  p50LatencyMs: number; // Median
  p95LatencyMs: number;
  p99LatencyMs: number;
  maxLatencyMs: number;
  minLatencyMs: number;
  timeWindow: string; // ISO timestamp of window start
}

/**
 * Performance alert configuration
 */
export interface PerformanceAlertConfig {
  successRateThreshold: number; // Percentage (0-100)
  latencyThresholdMs: number; // Milliseconds
  timeWindowMinutes: number; // Time window for tracking
  alertCallback?: (metrics: PerformanceMetrics, reason: string) => void;
}

/**
 * Delivery event for tracking
 */
interface DeliveryEvent {
  timestamp: Date;
  success: boolean;
  latencyMs: number;
  userId: string;
  notificationType: string;
}

/**
 * Default alert configuration
 */
const DEFAULT_ALERT_CONFIG: PerformanceAlertConfig = {
  successRateThreshold: 95, // Alert if success rate drops below 95%
  latencyThresholdMs: 5000, // Alert if p95 latency exceeds 5 seconds
  timeWindowMinutes: 60, // Track metrics over 60 minute window
};

export class PerformanceMonitor {
  private static instance: PerformanceMonitor | null = null;
  private deliveryEvents: DeliveryEvent[] = [];
  private config: PerformanceAlertConfig;
  private lastAlertTime: Date | null = null;
  private alertCooldownMinutes: number = 15; // Don't alert more than once per 15 minutes

  private constructor(config: Partial<PerformanceAlertConfig> = {}) {
    this.config = { ...DEFAULT_ALERT_CONFIG, ...config };
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<PerformanceAlertConfig>): PerformanceMonitor {
    if (!this.instance) {
      this.instance = new PerformanceMonitor(config);
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
   * Track a notification delivery
   * 
   * @param success - Whether delivery was successful
   * @param latencyMs - Time taken to deliver notification in milliseconds
   * @param userId - User ID the notification was sent to
   * @param notificationType - Type of notification
   */
  trackDelivery(
    success: boolean,
    latencyMs: number,
    userId: string,
    notificationType: string
  ): void {
    const event: DeliveryEvent = {
      timestamp: new Date(),
      success,
      latencyMs,
      userId,
      notificationType,
    };

    this.deliveryEvents.push(event);
    this.cleanupOldEvents();

    // Check if we should alert
    this.checkAndAlert();
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    this.cleanupOldEvents();

    const timeWindow = new Date();
    timeWindow.setMinutes(timeWindow.getMinutes() - this.config.timeWindowMinutes);

    const totalDeliveries = this.deliveryEvents.length;
    const successfulDeliveries = this.deliveryEvents.filter(e => e.success).length;
    const failedDeliveries = totalDeliveries - successfulDeliveries;
    const successRate = totalDeliveries > 0 
      ? (successfulDeliveries / totalDeliveries) * 100 
      : 100;

    // Calculate latency metrics
    const latencies = this.deliveryEvents.map(e => e.latencyMs).sort((a, b) => a - b);
    
    const averageLatencyMs = latencies.length > 0
      ? latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length
      : 0;

    const p50LatencyMs = this.calculatePercentile(latencies, 50);
    const p95LatencyMs = this.calculatePercentile(latencies, 95);
    const p99LatencyMs = this.calculatePercentile(latencies, 99);
    const maxLatencyMs = latencies.length > 0 ? latencies[latencies.length - 1] : 0;
    const minLatencyMs = latencies.length > 0 ? latencies[0] : 0;

    return {
      totalDeliveries,
      successfulDeliveries,
      failedDeliveries,
      successRate,
      averageLatencyMs,
      p50LatencyMs,
      p95LatencyMs,
      p99LatencyMs,
      maxLatencyMs,
      minLatencyMs,
      timeWindow: timeWindow.toISOString(),
    };
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.deliveryEvents = [];
    this.lastAlertTime = null;
  }

  /**
   * Update alert configuration
   */
  updateConfig(config: Partial<PerformanceAlertConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): PerformanceAlertConfig {
    return { ...this.config };
  }

  /**
   * Get metrics by notification type
   */
  getMetricsByType(): Record<string, PerformanceMetrics> {
    this.cleanupOldEvents();

    const typeGroups: Record<string, DeliveryEvent[]> = {};

    // Group events by notification type
    for (const event of this.deliveryEvents) {
      if (!typeGroups[event.notificationType]) {
        typeGroups[event.notificationType] = [];
      }
      typeGroups[event.notificationType].push(event);
    }

    // Calculate metrics for each type
    const metricsByType: Record<string, PerformanceMetrics> = {};

    for (const [type, events] of Object.entries(typeGroups)) {
      const totalDeliveries = events.length;
      const successfulDeliveries = events.filter(e => e.success).length;
      const failedDeliveries = totalDeliveries - successfulDeliveries;
      const successRate = totalDeliveries > 0 
        ? (successfulDeliveries / totalDeliveries) * 100 
        : 100;

      const latencies = events.map(e => e.latencyMs).sort((a, b) => a - b);
      
      const averageLatencyMs = latencies.length > 0
        ? latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length
        : 0;

      metricsByType[type] = {
        totalDeliveries,
        successfulDeliveries,
        failedDeliveries,
        successRate,
        averageLatencyMs,
        p50LatencyMs: this.calculatePercentile(latencies, 50),
        p95LatencyMs: this.calculatePercentile(latencies, 95),
        p99LatencyMs: this.calculatePercentile(latencies, 99),
        maxLatencyMs: latencies.length > 0 ? latencies[latencies.length - 1] : 0,
        minLatencyMs: latencies.length > 0 ? latencies[0] : 0,
        timeWindow: new Date(Date.now() - this.config.timeWindowMinutes * 60 * 1000).toISOString(),
      };
    }

    return metricsByType;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Remove delivery events outside the time window
   */
  private cleanupOldEvents(): void {
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - this.config.timeWindowMinutes);

    this.deliveryEvents = this.deliveryEvents.filter(
      event => event.timestamp > cutoffTime
    );
  }

  /**
   * Calculate percentile from sorted array
   */
  private calculatePercentile(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 0) {
      return 0;
    }

    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, index)];
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

    const metrics = this.getMetrics();

    // Check if success rate is below threshold
    const successRateLow = metrics.successRate < this.config.successRateThreshold;

    // Check if p95 latency exceeds threshold
    const latencyHigh = metrics.p95LatencyMs > this.config.latencyThresholdMs;

    if (successRateLow || latencyHigh) {
      const reasons: string[] = [];

      if (successRateLow) {
        reasons.push(
          `Success rate (${metrics.successRate.toFixed(1)}%) below threshold (${this.config.successRateThreshold}%)`
        );
      }

      if (latencyHigh) {
        reasons.push(
          `P95 latency (${metrics.p95LatencyMs.toFixed(0)}ms) exceeds threshold (${this.config.latencyThresholdMs}ms)`
        );
      }

      this.sendAlert(metrics, reasons.join(', '));
      this.lastAlertTime = new Date();
    }
  }

  /**
   * Send alert to administrators
   * 
   * @param metrics - Current performance metrics
   * @param reason - Reason for alert
   */
  private sendAlert(metrics: PerformanceMetrics, reason: string): void {
    const alertMessage = `
⚠️ PUSH NOTIFICATION PERFORMANCE ALERT ⚠️

${reason}

Performance Metrics (${this.config.timeWindowMinutes} minute window):
- Total Deliveries: ${metrics.totalDeliveries}
- Successful: ${metrics.successfulDeliveries}
- Failed: ${metrics.failedDeliveries}
- Success Rate: ${metrics.successRate.toFixed(1)}%

Latency Metrics:
- Average: ${metrics.averageLatencyMs.toFixed(0)}ms
- P50 (Median): ${metrics.p50LatencyMs.toFixed(0)}ms
- P95: ${metrics.p95LatencyMs.toFixed(0)}ms
- P99: ${metrics.p99LatencyMs.toFixed(0)}ms
- Max: ${metrics.maxLatencyMs.toFixed(0)}ms
- Min: ${metrics.minLatencyMs.toFixed(0)}ms

Time Window Start: ${metrics.timeWindow}

Action Required: Investigate push notification performance degradation.
    `.trim();

    // Log alert
    console.warn(alertMessage);

    // Call custom alert callback if provided
    if (this.config.alertCallback) {
      try {
        this.config.alertCallback(metrics, reason);
      } catch (error) {
        console.error('Error calling alert callback:', error);
      }
    }

    // TODO: Send alert via monitoring service (e.g., PagerDuty, Slack, email)
  }
}

/**
 * Convenience function to track delivery
 */
export function trackDelivery(
  success: boolean,
  latencyMs: number,
  userId: string,
  notificationType: string
): void {
  PerformanceMonitor.getInstance().trackDelivery(success, latencyMs, userId, notificationType);
}

/**
 * Convenience function to get metrics
 */
export function getPerformanceMetrics(): PerformanceMetrics {
  return PerformanceMonitor.getInstance().getMetrics();
}

/**
 * Convenience function to get metrics by type
 */
export function getMetricsByType(): Record<string, PerformanceMetrics> {
  return PerformanceMonitor.getInstance().getMetricsByType();
}

/**
 * Convenience function to configure alerts
 */
export function configurePerformanceAlerts(config: Partial<PerformanceAlertConfig>): void {
  PerformanceMonitor.getInstance().updateConfig(config);
}
