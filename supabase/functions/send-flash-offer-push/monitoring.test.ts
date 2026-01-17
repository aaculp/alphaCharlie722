/**
 * Tests for Monitoring Module
 * 
 * Validates that monitoring service correctly tracks metrics and triggers alerts
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import { MonitoringService, ALERT_CONFIGS } from './monitoring.ts';

Deno.test('MonitoringService - Record execution time metric', () => {
  const service = new MonitoringService();
  
  service.recordMetric('execution_time', 15000, {
    offerId: 'test-offer-123',
  });
  
  const metrics = service.getMetrics('execution_time');
  assertEquals(metrics.length, 1);
  assertEquals(metrics[0].value, 15000);
  assertEquals(metrics[0].metadata?.offerId, 'test-offer-123');
});

Deno.test('MonitoringService - Record error rate metric', () => {
  const service = new MonitoringService();
  
  service.recordMetric('error_rate', 1, {
    errorType: 'database_error',
  });
  
  const metrics = service.getMetrics('error_rate');
  assertEquals(metrics.length, 1);
  assertEquals(metrics[0].value, 1);
});

Deno.test('MonitoringService - Record FCM failure rate metric', () => {
  const service = new MonitoringService();
  
  service.recordMetric('fcm_failure_rate', 0.15, {
    successCount: 85,
    failureCount: 15,
  });
  
  const metrics = service.getMetrics('fcm_failure_rate');
  assertEquals(metrics.length, 1);
  assertEquals(metrics[0].value, 0.15);
});

Deno.test('MonitoringService - Record rate limit violation metric', () => {
  const service = new MonitoringService();
  
  service.recordMetric('rate_limit_violations', 1, {
    venueId: 'venue-123',
    limitType: 'venue_send',
  });
  
  const metrics = service.getMetrics('rate_limit_violations');
  assertEquals(metrics.length, 1);
  assertEquals(metrics[0].value, 1);
});

Deno.test('MonitoringService - Get summary statistics', () => {
  const service = new MonitoringService();
  
  // Record some metrics
  service.recordMetric('execution_time', 5000);
  service.recordMetric('execution_time', 10000);
  service.recordMetric('error_rate', 1);
  service.recordMetric('rate_limit_violations', 1);
  
  const summary = service.getSummary();
  
  assertExists(summary.totalRequests);
  assertExists(summary.errorRate);
  assertExists(summary.avgExecutionTime);
  assertExists(summary.rateLimitViolations);
});

Deno.test('Alert configs - All thresholds defined', () => {
  assertEquals(ALERT_CONFIGS.length, 4);
  
  const errorRateConfig = ALERT_CONFIGS.find(c => c.type === 'error_rate');
  assertExists(errorRateConfig);
  assertEquals(errorRateConfig.threshold, 0.05);
  assertEquals(errorRateConfig.severity, 'warning');
  
  const executionTimeConfig = ALERT_CONFIGS.find(c => c.type === 'execution_time');
  assertExists(executionTimeConfig);
  assertEquals(executionTimeConfig.threshold, 25000);
  
  const fcmFailureConfig = ALERT_CONFIGS.find(c => c.type === 'fcm_failure_rate');
  assertExists(fcmFailureConfig);
  assertEquals(fcmFailureConfig.threshold, 0.10);
  
  const rateLimitConfig = ALERT_CONFIGS.find(c => c.type === 'rate_limit_violations');
  assertExists(rateLimitConfig);
  assertEquals(rateLimitConfig.threshold, 100);
});

Deno.test('MonitoringService - Metrics filtered by time window', () => {
  const service = new MonitoringService();
  
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  service.recordMetric('execution_time', 5000);
  
  const recentMetrics = service.getMetrics(
    'execution_time',
    oneHourAgo.toISOString(),
    now.toISOString()
  );
  
  assertEquals(recentMetrics.length, 1);
});
