/**
 * PrivacyDataHandler
 * 
 * Handles user privacy data according to regulations (GDPR, CCPA, etc.).
 * Provides utilities for data anonymization, deletion, and export.
 * 
 * Requirements: 15.10
 */

/**
 * Privacy data types that need special handling
 */
export enum PrivacyDataType {
  DEVICE_TOKEN = 'device_token',
  USER_ID = 'user_id',
  EMAIL = 'email',
  NAME = 'name',
  AVATAR_URL = 'avatar_url',
  LOCATION = 'location',
  NOTIFICATION_CONTENT = 'notification_content',
}

/**
 * Data retention periods (in days)
 */
const RETENTION_PERIODS = {
  DEVICE_TOKENS: 30, // Inactive tokens deleted after 30 days
  NOTIFICATION_LOGS: 90, // Notification audit logs kept for 90 days
  USER_DATA: 365, // User data kept for 1 year after account deletion
};

/**
 * Anonymization options
 */
export interface AnonymizationOptions {
  preserveFormat?: boolean; // Keep the format (e.g., email structure)
  hashSeed?: string; // Seed for consistent hashing
}

export class PrivacyDataHandler {
  /**
   * Anonymize a piece of user data
   * Replaces identifiable information with anonymized version
   * 
   * @param data - Data to anonymize
   * @param dataType - Type of data being anonymized
   * @param options - Anonymization options
   * @returns Anonymized data
   */
  static anonymize(
    data: string,
    dataType: PrivacyDataType,
    options: AnonymizationOptions = {}
  ): string {
    if (!data) return '';

    switch (dataType) {
      case PrivacyDataType.EMAIL:
        return this.anonymizeEmail(data, options);
      
      case PrivacyDataType.NAME:
        return this.anonymizeName(data);
      
      case PrivacyDataType.USER_ID:
        return this.anonymizeUserId(data, options);
      
      case PrivacyDataType.DEVICE_TOKEN:
        return this.anonymizeDeviceToken(data);
      
      case PrivacyDataType.AVATAR_URL:
        return this.anonymizeUrl(data);
      
      case PrivacyDataType.LOCATION:
        return this.anonymizeLocation(data);
      
      case PrivacyDataType.NOTIFICATION_CONTENT:
        return this.anonymizeNotificationContent(data);
      
      default:
        return '[REDACTED]';
    }
  }

  /**
   * Check if data should be retained based on retention policy
   * 
   * @param dataType - Type of data
   * @param createdAt - When the data was created
   * @returns True if data should be retained
   */
  static shouldRetain(dataType: string, createdAt: Date): boolean {
    const now = new Date();
    const ageInDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

    switch (dataType) {
      case 'device_token':
        return ageInDays < RETENTION_PERIODS.DEVICE_TOKENS;
      
      case 'notification_log':
        return ageInDays < RETENTION_PERIODS.NOTIFICATION_LOGS;
      
      case 'user_data':
        return ageInDays < RETENTION_PERIODS.USER_DATA;
      
      default:
        return true; // Default to retaining if unknown type
    }
  }

  /**
   * Get retention period for a data type
   * 
   * @param dataType - Type of data
   * @returns Retention period in days
   */
  static getRetentionPeriod(dataType: string): number {
    switch (dataType) {
      case 'device_token':
        return RETENTION_PERIODS.DEVICE_TOKENS;
      
      case 'notification_log':
        return RETENTION_PERIODS.NOTIFICATION_LOGS;
      
      case 'user_data':
        return RETENTION_PERIODS.USER_DATA;
      
      default:
        return 365; // Default to 1 year
    }
  }

  /**
   * Prepare user data for export (GDPR right to data portability)
   * 
   * @param userData - User data to export
   * @returns Formatted data for export
   */
  static prepareDataExport(userData: Record<string, any>): Record<string, any> {
    return {
      exportDate: new Date().toISOString(),
      dataSubject: {
        userId: userData.userId,
        email: userData.email,
        name: userData.name,
        createdAt: userData.createdAt,
      },
      notificationPreferences: userData.notificationPreferences || {},
      deviceTokens: (userData.deviceTokens || []).map((token: any) => ({
        platform: token.platform,
        registeredAt: token.createdAt,
        lastUsed: token.lastUsedAt,
        // Don't include actual token for security
        tokenHash: token.token ? this.hashForExport(token.token) : null,
      })),
      notificationHistory: (userData.notificationHistory || []).map((notification: any) => ({
        type: notification.type,
        sentAt: notification.createdAt,
        read: notification.read,
        readAt: notification.readAt,
      })),
      privacySettings: userData.privacySettings || {},
      dataRetentionInfo: {
        deviceTokenRetention: `${RETENTION_PERIODS.DEVICE_TOKENS} days`,
        notificationLogRetention: `${RETENTION_PERIODS.NOTIFICATION_LOGS} days`,
        userDataRetention: `${RETENTION_PERIODS.USER_DATA} days after account deletion`,
      },
    };
  }

  /**
   * Validate that data handling complies with privacy regulations
   * 
   * @param operation - Operation being performed
   * @param dataType - Type of data
   * @param hasConsent - Whether user has given consent
   * @returns True if operation is compliant
   */
  static validateCompliance(
    operation: 'collect' | 'process' | 'store' | 'share' | 'delete',
    dataType: PrivacyDataType,
    hasConsent: boolean
  ): boolean {
    // For notification system, we need consent for:
    // - Collecting device tokens
    // - Processing notification preferences
    // - Storing notification history
    
    switch (operation) {
      case 'collect':
      case 'process':
      case 'store':
        // These operations require consent
        return hasConsent;
      
      case 'share':
        // We don't share user data with third parties
        return false;
      
      case 'delete':
        // Deletion is always allowed (right to erasure)
        return true;
      
      default:
        return false;
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Anonymize an email address
   */
  private static anonymizeEmail(email: string, options: AnonymizationOptions): string {
    if (options.preserveFormat) {
      const [localPart, domain] = email.split('@');
      if (localPart && domain) {
        const anonymizedLocal = localPart.charAt(0) + '***' + localPart.charAt(localPart.length - 1);
        return `${anonymizedLocal}@${domain}`;
      }
    }
    return '[EMAIL_REDACTED]';
  }

  /**
   * Anonymize a name
   */
  private static anonymizeName(name: string): string {
    const parts = name.split(' ');
    if (parts.length > 0) {
      return parts[0].charAt(0) + '***';
    }
    return '[NAME_REDACTED]';
  }

  /**
   * Anonymize a user ID
   */
  private static anonymizeUserId(userId: string, options: AnonymizationOptions): string {
    if (options.hashSeed) {
      // Create consistent hash for analytics
      return this.hashForExport(userId + options.hashSeed).substring(0, 16);
    }
    return '[USER_ID_REDACTED]';
  }

  /**
   * Anonymize a device token
   */
  private static anonymizeDeviceToken(token: string): string {
    // Show first and last 4 characters only
    if (token.length > 8) {
      return token.substring(0, 4) + '***' + token.substring(token.length - 4);
    }
    return '[TOKEN_REDACTED]';
  }

  /**
   * Anonymize a URL
   */
  private static anonymizeUrl(url: string): string {
    try {
      // Extract protocol and hostname manually for React Native compatibility
      const protocolMatch = url.match(/^(https?:)\/\//);
      const hostnameMatch = url.match(/^https?:\/\/([^\/]+)/);
      
      if (protocolMatch && hostnameMatch) {
        return `${protocolMatch[1]}//${hostnameMatch[1]}/[PATH_REDACTED]`;
      }
      
      return '[URL_REDACTED]';
    } catch {
      return '[URL_REDACTED]';
    }
  }

  /**
   * Anonymize location data
   */
  private static anonymizeLocation(location: string): string {
    // Keep city/state, remove specific address
    const parts = location.split(',');
    if (parts.length >= 2) {
      return parts.slice(-2).join(',').trim();
    }
    return '[LOCATION_REDACTED]';
  }

  /**
   * Anonymize notification content
   */
  private static anonymizeNotificationContent(content: string): string {
    // Remove any names or specific identifiers
    return content.replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, '[NAME]')
                  .replace(/\b\d{3}-\d{3}-\d{4}\b/g, '[PHONE]')
                  .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]');
  }

  /**
   * Create a hash for data export
   */
  private static hashForExport(data: string): string {
    // Simple hash for export purposes (not cryptographic)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }
}
