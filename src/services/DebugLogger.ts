/**
 * DebugLogger
 * 
 * Provides verbose logging for push notification debugging.
 * Can be enabled/disabled via environment variable or runtime flag.
 * 
 * Requirements: 13.8
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const DEBUG_MODE_KEY = '@push_notification_debug_mode';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
}

class DebugLoggerClass {
  private isDebugMode: boolean = false;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000; // Keep last 1000 logs

  /**
   * Initialize debug logger
   * Loads debug mode setting from storage
   */
  async initialize(): Promise<void> {
    try {
      const debugMode = await AsyncStorage.getItem(DEBUG_MODE_KEY);
      this.isDebugMode = debugMode === 'true';
      
      if (this.isDebugMode) {
        console.log('🐛 Debug mode enabled for push notifications');
      }
    } catch (error) {
      console.error('Error loading debug mode setting:', error);
    }
  }

  /**
   * Enable debug mode
   * Persists setting to storage
   */
  async enableDebugMode(): Promise<void> {
    this.isDebugMode = true;
    await AsyncStorage.setItem(DEBUG_MODE_KEY, 'true');
    console.log('🐛 Debug mode enabled');
  }

  /**
   * Disable debug mode
   * Persists setting to storage
   */
  async disableDebugMode(): Promise<void> {
    this.isDebugMode = false;
    await AsyncStorage.setItem(DEBUG_MODE_KEY, 'false');
    console.log('🐛 Debug mode disabled');
  }

  /**
   * Check if debug mode is enabled
   */
  isEnabled(): boolean {
    return this.isDebugMode;
  }

  /**
   * Log FCM event
   * 
   * @param event - Event name
   * @param data - Event data
   */
  logFCMEvent(event: string, data?: any): void {
    this.log(LogLevel.DEBUG, 'FCM', `Event: ${event}`, data);
  }

  /**
   * Log notification send
   * 
   * @param userId - User ID
   * @param notificationType - Notification type
   * @param success - Whether send was successful
   * @param data - Additional data
   */
  logNotificationSend(
    userId: string,
    notificationType: string,
    success: boolean,
    data?: any
  ): void {
    const message = `Send ${notificationType} to ${userId}: ${success ? 'SUCCESS' : 'FAILED'}`;
    this.log(success ? LogLevel.INFO : LogLevel.ERROR, 'NOTIFICATION_SEND', message, data);
  }

  /**
   * Log token operation
   * 
   * @param operation - Operation name (store, remove, refresh, etc.)
   * @param token - Device token (truncated)
   * @param success - Whether operation was successful
   * @param data - Additional data
   */
  logTokenOperation(
    operation: string,
    token: string,
    success: boolean,
    data?: any
  ): void {
    const truncatedToken = token.substring(0, 20) + '...';
    const message = `Token ${operation}: ${truncatedToken} - ${success ? 'SUCCESS' : 'FAILED'}`;
    this.log(success ? LogLevel.INFO : LogLevel.ERROR, 'TOKEN', message, data);
  }

  /**
   * Log navigation event
   * 
   * @param notificationType - Notification type that triggered navigation
   * @param screen - Target screen
   * @param params - Navigation parameters
   */
  logNavigationEvent(
    notificationType: string,
    screen: string,
    params?: any
  ): void {
    const message = `Navigate from ${notificationType} to ${screen}`;
    this.log(LogLevel.INFO, 'NAVIGATION', message, params);
  }

  /**
   * Log permission event
   * 
   * @param event - Event name (request, grant, deny, etc.)
   * @param status - Permission status
   * @param data - Additional data
   */
  logPermissionEvent(event: string, status: string, data?: any): void {
    const message = `Permission ${event}: ${status}`;
    this.log(LogLevel.INFO, 'PERMISSION', message, data);
  }

  /**
   * Log error
   * 
   * @param category - Error category
   * @param error - Error object or message
   * @param data - Additional data
   */
  logError(category: string, error: Error | string, data?: any): void {
    const message = error instanceof Error ? error.message : error;
    this.log(LogLevel.ERROR, category, message, {
      ...data,
      stack: error instanceof Error ? error.stack : undefined,
    });
  }

  /**
   * Get all logs
   * 
   * @returns Array of log entries
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs filtered by level
   * 
   * @param level - Log level to filter by
   * @returns Filtered log entries
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Get logs filtered by category
   * 
   * @param category - Category to filter by
   * @returns Filtered log entries
   */
  getLogsByCategory(category: string): LogEntry[] {
    return this.logs.filter(log => log.category === category);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
    console.log('🐛 Debug logs cleared');
  }

  /**
   * Export logs as JSON string
   * 
   * @returns JSON string of all logs
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Internal log method
   * 
   * @param level - Log level
   * @param category - Log category
   * @param message - Log message
   * @param data - Additional data
   */
  private log(level: LogLevel, category: string, message: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
    };

    // Add to logs array
    this.logs.push(entry);

    // Trim logs if exceeding max
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console log if debug mode enabled
    if (this.isDebugMode) {
      const emoji = this.getLevelEmoji(level);
      const timestamp = new Date().toLocaleTimeString();
      
      console.log(
        `${emoji} [${timestamp}] [${category}] ${message}`,
        data ? data : ''
      );
    }
  }

  /**
   * Get emoji for log level
   * 
   * @param level - Log level
   * @returns Emoji string
   */
  private getLevelEmoji(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return '🐛';
      case LogLevel.INFO:
        return 'ℹ️';
      case LogLevel.WARN:
        return '⚠️';
      case LogLevel.ERROR:
        return '❌';
      default:
        return '📝';
    }
  }
}

// Export singleton instance
export const DebugLogger = new DebugLoggerClass();
