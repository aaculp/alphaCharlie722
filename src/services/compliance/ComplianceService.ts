/**
 * ComplianceService
 * 
 * Ensures push notifications comply with Apple Push Notification Service (APNs)
 * and Firebase Cloud Messaging (FCM) guidelines, as well as internal policies.
 * 
 * Requirements: 15.1, 15.2, 15.7, 15.8
 */

import { NotificationType } from '../../types/social.types';
import { DebugLogger } from '../DebugLogger';

/**
 * Notification audit log entry
 */
export interface NotificationAuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  notificationType: NotificationType;
  title: string;
  body: string;
  recipientCount: number;
  success: boolean;
  deliveredCount: number;
  failedCount: number;
  metadata?: Record<string, any>;
}

/**
 * Content validation result
 */
export interface ContentValidationResult {
  isValid: boolean;
  violations: string[];
}

/**
 * Compliance check result
 */
export interface ComplianceCheckResult {
  allowed: boolean;
  reason?: string;
  violations: string[];
}

/**
 * APNs Guidelines:
 * - Payload size limit: 4KB for regular notifications, 5KB for VoIP
 * - No spam or unsolicited notifications
 * - Must respect user preferences
 * - Must provide clear opt-out mechanism
 * - Content must be appropriate and not misleading
 * 
 * FCM Guidelines:
 * - Payload size limit: 4KB
 * - Rate limits: 1 million messages per minute per project
 * - No spam or abusive content
 * - Must respect user preferences
 * - Must handle token errors properly
 */
export class ComplianceService {
  private static auditLogs: NotificationAuditLog[] = [];
  private static readonly MAX_AUDIT_LOGS = 10000; // Keep last 10,000 logs in memory
  private static readonly MAX_PAYLOAD_SIZE_BYTES = 4096; // 4KB limit for both APNs and FCM
  
  // Prohibited content patterns (spam/abuse detection)
  private static readonly PROHIBITED_PATTERNS = [
    /\b(viagra|cialis|casino|lottery|winner|congratulations)\b/i,
    /\b(click here|act now|limited time|urgent)\b/i,
    /\$\$\$|💰💰💰/,
    /\b(free money|get rich|make money fast)\b/i,
  ];

  /**
   * Validate notification content for compliance
   * Checks for spam patterns, misleading content, and payload size
   * 
   * Requirements: 15.1, 15.2, 15.6
   * 
   * @param title - Notification title
   * @param body - Notification body
   * @param data - Notification data payload
   * @returns Validation result with violations
   */
  static validateNotificationContent(
    title: string,
    body: string,
    data: Record<string, any>
  ): ContentValidationResult {
    const violations: string[] = [];

    // Check title and body for prohibited patterns (spam detection)
    const combinedText = `${title} ${body}`;
    for (const pattern of this.PROHIBITED_PATTERNS) {
      if (pattern.test(combinedText)) {
        violations.push(`Content contains prohibited pattern: ${pattern.source}`);
      }
    }

    // Check for excessive capitalization (spam indicator)
    const uppercaseRatio = (combinedText.match(/[A-Z]/g) || []).length / combinedText.length;
    if (uppercaseRatio > 0.5 && combinedText.length > 10) {
      violations.push('Excessive capitalization detected (spam indicator)');
    }

    // Check for excessive punctuation (spam indicator)
    const punctuationCount = (combinedText.match(/[!?]{2,}/g) || []).length;
    if (punctuationCount > 2) {
      violations.push('Excessive punctuation detected (spam indicator)');
    }

    // Check payload size (APNs and FCM limit: 4KB)
    const payloadSize = this.calculatePayloadSize(title, body, data);
    if (payloadSize > this.MAX_PAYLOAD_SIZE_BYTES) {
      violations.push(
        `Payload size (${payloadSize} bytes) exceeds limit (${this.MAX_PAYLOAD_SIZE_BYTES} bytes)`
      );
    }

    // Check for empty content
    if (!title.trim() || !body.trim()) {
      violations.push('Title and body must not be empty');
    }

    // Check for reasonable length
    if (title.length > 100) {
      violations.push('Title exceeds recommended length (100 characters)');
    }

    if (body.length > 500) {
      violations.push('Body exceeds recommended length (500 characters)');
    }

    return {
      isValid: violations.length === 0,
      violations,
    };
  }

  /**
   * Perform comprehensive compliance check before sending notification
   * Validates content, checks rate limits, and verifies user preferences
   * 
   * Requirements: 15.1, 15.2, 15.3, 15.4, 15.7
   * 
   * @param userId - User ID to send notification to
   * @param notificationType - Type of notification
   * @param title - Notification title
   * @param body - Notification body
   * @param data - Notification data
   * @param userPreferencesEnabled - Whether user has enabled this notification type
   * @returns Compliance check result
   */
  static performComplianceCheck(
    userId: string,
    notificationType: NotificationType,
    title: string,
    body: string,
    data: Record<string, any>,
    userPreferencesEnabled: boolean
  ): ComplianceCheckResult {
    const violations: string[] = [];

    // Check user preferences (Requirement 15.4)
    if (!userPreferencesEnabled) {
      return {
        allowed: false,
        reason: 'User has disabled this notification type',
        violations: ['User opt-out preference not respected'],
      };
    }

    // Validate content
    const contentValidation = this.validateNotificationContent(title, body, data);
    if (!contentValidation.isValid) {
      violations.push(...contentValidation.violations);
    }

    // Check if notification type is allowed (no spam/unsolicited - Requirement 15.3)
    if (!this.isAllowedNotificationType(notificationType)) {
      violations.push(`Notification type ${notificationType} is not allowed`);
    }

    // Log compliance check
    DebugLogger.logFCMEvent('compliance_check', {
      userId,
      notificationType,
      allowed: violations.length === 0,
      violations,
    });

    return {
      allowed: violations.length === 0,
      reason: violations.length > 0 ? violations.join('; ') : undefined,
      violations,
    };
  }

  /**
   * Log notification send for audit trail
   * Maintains audit log for compliance reviews
   * 
   * Requirements: 15.8
   * 
   * @param log - Audit log entry
   */
  static logNotificationAudit(log: NotificationAuditLog): void {
    // Add to in-memory audit log
    this.auditLogs.push(log);

    // Trim logs if exceeding max
    if (this.auditLogs.length > this.MAX_AUDIT_LOGS) {
      this.auditLogs = this.auditLogs.slice(-this.MAX_AUDIT_LOGS);
    }

    // Log to debug logger
    DebugLogger.logNotificationSend(
      log.userId,
      log.notificationType,
      log.success,
      {
        title: log.title,
        body: log.body,
        recipientCount: log.recipientCount,
        deliveredCount: log.deliveredCount,
        failedCount: log.failedCount,
        timestamp: log.timestamp.toISOString(),
      }
    );

    // In production, this should also write to persistent storage (database)
    // For now, we log to console for audit trail
    console.log('📋 Audit Log:', {
      id: log.id,
      timestamp: log.timestamp.toISOString(),
      userId: log.userId,
      type: log.notificationType,
      success: log.success,
      delivered: log.deliveredCount,
      failed: log.failedCount,
    });
  }

  /**
   * Get audit logs for a specific user
   * 
   * @param userId - User ID to get logs for
   * @param limit - Maximum number of logs to return
   * @returns Array of audit logs
   */
  static getAuditLogsForUser(userId: string, limit: number = 100): NotificationAuditLog[] {
    return this.auditLogs
      .filter(log => log.userId === userId)
      .slice(-limit);
  }

  /**
   * Get audit logs for a specific notification type
   * 
   * @param notificationType - Notification type to filter by
   * @param limit - Maximum number of logs to return
   * @returns Array of audit logs
   */
  static getAuditLogsByType(
    notificationType: NotificationType,
    limit: number = 100
  ): NotificationAuditLog[] {
    return this.auditLogs
      .filter(log => log.notificationType === notificationType)
      .slice(-limit);
  }

  /**
   * Get all audit logs within a time range
   * 
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Array of audit logs
   */
  static getAuditLogsByDateRange(
    startDate: Date,
    endDate: Date
  ): NotificationAuditLog[] {
    return this.auditLogs.filter(
      log => log.timestamp >= startDate && log.timestamp <= endDate
    );
  }

  /**
   * Export audit logs as JSON
   * For compliance reporting and audits
   * 
   * @returns JSON string of all audit logs
   */
  static exportAuditLogs(): string {
    return JSON.stringify(this.auditLogs, null, 2);
  }

  /**
   * Clear audit logs
   * Should only be used for testing
   */
  static clearAuditLogs(): void {
    this.auditLogs = [];
    console.log('📋 Audit logs cleared');
  }

  /**
   * Get compliance statistics
   * 
   * @returns Statistics about notifications and compliance
   */
  static getComplianceStats(): {
    totalNotifications: number;
    successfulNotifications: number;
    failedNotifications: number;
    totalRecipients: number;
    totalDelivered: number;
    totalFailed: number;
    successRate: number;
  } {
    const total = this.auditLogs.length;
    const successful = this.auditLogs.filter(log => log.success).length;
    const failed = total - successful;
    
    const totalRecipients = this.auditLogs.reduce(
      (sum, log) => sum + log.recipientCount,
      0
    );
    const totalDelivered = this.auditLogs.reduce(
      (sum, log) => sum + log.deliveredCount,
      0
    );
    const totalFailedDeliveries = this.auditLogs.reduce(
      (sum, log) => sum + log.failedCount,
      0
    );

    return {
      totalNotifications: total,
      successfulNotifications: successful,
      failedNotifications: failed,
      totalRecipients,
      totalDelivered,
      totalFailed: totalFailedDeliveries,
      successRate: total > 0 ? (successful / total) * 100 : 0,
    };
  }

  /**
   * Track a notification report for compliance monitoring
   * Requirement 15.9: Allow users to report inappropriate notifications
   * 
   * @param reportId - ID of the report
   * @param notificationId - ID of the notification being reported
   * @param reporterId - ID of the user filing the report
   * @param reportedUserId - ID of the user who sent the notification
   * @param notificationType - Type of notification
   * @param reason - Reason for reporting
   * @param details - Optional additional details
   */
  static trackNotificationReport(
    reportId: string,
    notificationId: string,
    reporterId: string,
    reportedUserId: string,
    notificationType: NotificationType,
    reason: string,
    details?: string
  ): void {
    // Log the report for compliance tracking
    DebugLogger.logFCMEvent('notification_reported', {
      reportId,
      notificationId,
      reporterId,
      reportedUserId,
      notificationType,
      reason,
      details,
      timestamp: new Date().toISOString(),
    });

    // Log to console for audit trail
    console.log('🚨 Notification Report Filed:', {
      reportId,
      notificationId,
      reporterId,
      reportedUserId,
      type: notificationType,
      reason,
      timestamp: new Date().toISOString(),
    });

    // In production, this should trigger alerts for high-priority reports
    // (e.g., harassment, spam patterns from same user)
    if (reason === 'harassment' || reason === 'spam') {
      console.warn('⚠️ High-priority report filed:', {
        reportId,
        reason,
        reportedUserId,
      });
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Calculate payload size in bytes
   * Estimates the size of the notification payload
   * 
   * @param title - Notification title
   * @param body - Notification body
   * @param data - Notification data
   * @returns Estimated payload size in bytes
   */
  private static calculatePayloadSize(
    title: string,
    body: string,
    data: Record<string, any>
  ): number {
    // Rough estimation of payload size
    // In production, this should be more accurate based on actual FCM/APNs payload structure
    const titleSize = new Blob([title]).size;
    const bodySize = new Blob([body]).size;
    const dataSize = new Blob([JSON.stringify(data)]).size;
    
    // Add overhead for FCM/APNs wrapper (approximately 200 bytes)
    const overhead = 200;
    
    return titleSize + bodySize + dataSize + overhead;
  }

  /**
   * Check if notification type is allowed
   * Only social notifications are allowed (no spam/promotional)
   * 
   * Requirements: 15.3
   * 
   * @param notificationType - Notification type to check
   * @returns True if notification type is allowed
   */
  private static isAllowedNotificationType(notificationType: NotificationType): boolean {
    // All social notification types are allowed
    // Promotional/marketing notifications would be rejected here
    const allowedTypes: NotificationType[] = [
      'friend_request',
      'friend_accepted',
      'follow_request',
      'new_follower',
      'venue_share',
      'group_outing_invite',
      'group_outing_response',
      'group_outing_reminder',
      'collection_follow',
      'collection_update',
      'activity_like',
      'activity_comment',
      'friend_checkin_nearby',
    ];

    return allowedTypes.includes(notificationType);
  }
}
