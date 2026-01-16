/**
 * PayloadValidator Tests
 * 
 * Tests for notification payload validation
 */

import { PayloadValidator } from '../PayloadValidator';
import type { SocialNotificationPayload } from '../../../services/PushNotificationService';
import type { NotificationPayload } from '../../../services/FCMService';

describe('PayloadValidator', () => {
  describe('validateSocialPayload', () => {
    it('should validate a valid social payload', () => {
      const payload: SocialNotificationPayload = {
        title: 'Test Notification',
        body: 'This is a test notification',
        data: {
          type: 'friend_request',
          navigationTarget: 'FriendRequests',
        },
      };

      const result = PayloadValidator.validateSocialPayload(payload);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject payload with missing title', () => {
      const payload: any = {
        body: 'This is a test notification',
        data: {
          type: 'friend_request',
          navigationTarget: 'FriendRequests',
        },
      };

      const result = PayloadValidator.validateSocialPayload(payload);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Title is required and must be a string');
    });

    it('should reject payload with title too long', () => {
      const payload: SocialNotificationPayload = {
        title: 'A'.repeat(101), // 101 characters
        body: 'This is a test notification',
        data: {
          type: 'friend_request',
          navigationTarget: 'FriendRequests',
        },
      };

      const result = PayloadValidator.validateSocialPayload(payload);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Title exceeds maximum length'))).toBe(true);
    });

    it('should reject payload with malicious content', () => {
      const payload: SocialNotificationPayload = {
        title: 'Test <script>alert("xss")</script>',
        body: 'This is a test notification',
        data: {
          type: 'friend_request',
          navigationTarget: 'FriendRequests',
        },
      };

      const result = PayloadValidator.validateSocialPayload(payload);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('prohibited or misleading content'))).toBe(true);
    });

    it('should reject payload with misleading content', () => {
      const payload: SocialNotificationPayload = {
        title: 'URGENT: Click here now!',
        body: 'Act now to claim your prize',
        data: {
          type: 'friend_request',
          navigationTarget: 'FriendRequests',
        },
      };

      const result = PayloadValidator.validateSocialPayload(payload);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('prohibited or misleading content'))).toBe(true);
    });

    it('should reject payload with http image URL', () => {
      const payload: SocialNotificationPayload = {
        title: 'Test Notification',
        body: 'This is a test notification',
        data: {
          type: 'friend_request',
          navigationTarget: 'FriendRequests',
        },
        imageUrl: 'http://example.com/image.jpg', // HTTP not HTTPS
      };

      const result = PayloadValidator.validateSocialPayload(payload);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('not a valid HTTPS URL'))).toBe(true);
    });

    it('should accept payload with https image URL', () => {
      const payload: SocialNotificationPayload = {
        title: 'Test Notification',
        body: 'This is a test notification',
        data: {
          type: 'friend_request',
          navigationTarget: 'FriendRequests',
        },
        imageUrl: 'https://example.com/image.jpg',
      };

      const result = PayloadValidator.validateSocialPayload(payload);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateFCMPayload', () => {
    it('should validate a valid FCM payload', () => {
      const payload: NotificationPayload = {
        notification: {
          title: 'Test Notification',
          body: 'This is a test notification',
        },
        data: {
          type: 'friend_request',
          navigationTarget: 'FriendRequests',
        },
      };

      const result = PayloadValidator.validateFCMPayload(payload);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject FCM payload with missing notification object', () => {
      const payload: any = {
        data: {
          type: 'friend_request',
          navigationTarget: 'FriendRequests',
        },
      };

      const result = PayloadValidator.validateFCMPayload(payload);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Notification object is required');
    });
  });

  describe('sanitizeString', () => {
    it('should remove HTML tags', () => {
      const input = 'Hello <script>alert("xss")</script> World';
      const sanitized = PayloadValidator.sanitizeString(input);

      expect(sanitized).toBe('Hello alert("xss") World');
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('</script>');
    });

    it('should remove JavaScript protocol', () => {
      const input = 'javascript:alert("xss")';
      const sanitized = PayloadValidator.sanitizeString(input);

      expect(sanitized).not.toContain('javascript:');
    });

    it('should remove event handlers', () => {
      const input = 'Hello onclick=alert("xss") World';
      const sanitized = PayloadValidator.sanitizeString(input);

      expect(sanitized).not.toContain('onclick=');
    });

    it('should trim whitespace', () => {
      const input = '  Hello World  ';
      const sanitized = PayloadValidator.sanitizeString(input);

      expect(sanitized).toBe('Hello World');
    });
  });
});
