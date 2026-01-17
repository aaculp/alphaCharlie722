/**
 * Monitoring and Alerting Module
 * 
 * Provides real-time monitoring of Edge Function metrics and triggers alerts
 * when thresholds are exceeded.
 * 
 * Requirements:
 * - 6.5: Log failure reasons for debugging
 * - 9.6: Log warning if execution time exceeds 25 seconds
 */

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Metric types that can be tracked
 */
export type MetricType = 
  | 'error_rate'
  | 'execution_time'
  | 'fcm_failure_rate'
  | 'rate_limit_violations';

/**
 * Alert severity levels
 */
export type AlertSeverity = 'info' | 'warning' | 'critical';

/**
 * Metric data structure
 */
export interface Metric {
  type: MetricType;
  value: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/**
 * Alert configuration
 */
export interface AlertConfig {
  type: MetricType;
  threshold: number;
  severity: AlertSeverity;
  message: string;
}

/**
 * Alert thresholds based on requirements
 */
export const ALERT_CONFIGS: AlertConfig[] = [
  {
    type: 'error_rate',
    threshold: 0.05, // 5%
    severity: 'warning',
    message: 'Error rate exceeded 5%',
  },
  {
    type: 'execution_time',
    threshold: 25000, // 25 seconds
    severity: 'warning',
    message: 'Execution time exceeded 25 seconds',
  },
  {
    type: 'fcm_failure_rate',
    threshold: 0.10, // 10%
    severity: 'warning',
    message: 'FCM failure rate exceeded 10%',
  },
  {
    type: 'rate_limit_violations',
    threshold: 100, // 100 per hour
    severity: 'warning',
    message: 'Rate limit violations exceeded 100 per hour',
  },
];

/**
 * Monitoring service for tracking metrics and triggering alerts
 */
export class MonitoringService {
  private metrics: Metric[] = [];
  private readonly maxMetricsInMemory = 1000;

  /**
   * Record a metric
   */
  recordMetric(type: MetricType, value: number, metadata?: Record<string, unknown>): void {
    const metric: Metric = {
      type,
      value,
      timestamp: new Date().toISOString(),
      metadata,
    };

    this.metrics.push(metric);

    // Keep only recent metrics in memory
    if (this.metrics.length > this.maxMetricsInMemory) {
      this.metrics = this.metrics.slice(-this.maxMetricsInMemory);
    }

    // Check if alert should be triggered
    this.checkAlerts(metric);
  }

  /**
   * Check if any alert thresholds are exceeded
   */
  private checkAlerts(metric: Metric): void {
    const config = ALERT_CONFIGS.find(c => c.type === metric.type);
    if (!config) return;

    let shouldAlert = false;

    // For rate-based metrics (error_rate, fcm_failure_rate), check if value exceeds threshold
    if (metric.type === 'error_rate' || metric.type === 'fcm_failure_rate') {
      shouldAlert = metric.value > config.threshold;
    }
    // For count-based metrics (execution_time, rate_limit_violations), check if value exceeds threshold
    else if (metric.type === 'execution_time') {
      shouldAlert = metric.value > config.threshold;
    }
    // For rate_limit_violations, check hourly count
    else if (metric.type === 'rate_limit_violations') {
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const recentViolations = this.metrics.filter(
        m => m.type === 'rate_limit_violations' && m.timestamp > hourAgo
      );
      const totalViolations = recentViolations.reduce((sum, m) => sum + m.value, 0);
      shouldAlert = totalViolations > config.threshold;
    }

    if (shouldAlert) {
      this.triggerAlert(config, metric);
    }
  }

  /**
   * Trigger an alert
   */
  private triggerAlert(config: AlertConfig, metric: Metric): void {
    const alertLog = {
      severity: config.severity,
      type: config.type,
      message: config.message,
      value: metric.value,
      threshold: config.threshold,
      timestamp: metric.timestamp,
      metadata: metric.metadata,
    };

    // Log alert with appropriate severity
    if (config.severity === 'critical') {
      console.error('[ALERT][CRITICAL]', JSON.stringify(alertLog));
    } else if (config.severity === 'warning') {
      console.warn('[ALERT][WARNING]', JSON.stringify(alertLog));
    } else {
      console.log('[ALERT][INFO]', JSON.stringify(alertLog));
    }
  }

  /**
   * Get metrics for a specific type within a time window
   */
  getMetrics(
    type: MetricType,
    startTime?: string,
    endTime?: string
  ): Metric[] {
    let filtered = this.metrics.filter(m => m.type === type);

    if (startTime) {
      filtered = filtered.filter(m => m.timestamp >= startTime);
    }

    if (endTime) {
      filtered = filtered.filter(m => m.timestamp <= endTime);
    }

    return filtered;
  }

  /**
   * Calculate error rate over a time window
   */
  calculateErrorRate(windowMinutes: number = 5): number {
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
    const recentMetrics = this.metrics.filter(m => m.timestamp > windowStart);

    if (recentMetrics.length === 0) return 0;

    const errorCount = recentMetrics.filter(
      m => m.type === 'error_rate' && m.value === 1
    ).length;

    return errorCount / recentMetrics.length;
  }

  /**
   * Get summary statistics
   */
  getSummary(): {
    totalRequests: number;
    errorRate: number;
    avgExecutionTime: number;
    rateLimitViolations: number;
  } {
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const recentMetrics = this.metrics.filter(m => m.timestamp > hourAgo);

    const executionTimes = recentMetrics
      .filter(m => m.type === 'execution_time')
      .map(m => m.value);

    const violations = recentMetrics
      .filter(m => m.type === 'rate_limit_violations')
      .reduce((sum, m) => sum + m.value, 0);

    return {
      totalRequests: recentMetrics.length,
      errorRate: this.calculateErrorRate(60),
      avgExecutionTime: executionTimes.length > 0
        ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length
        : 0,
      rateLimitViolations: violations,
    };
  }
}

// Global monitoring service instance
export const monitoringService = new MonitoringService();
