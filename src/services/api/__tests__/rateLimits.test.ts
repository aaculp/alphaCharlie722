/**
 * Rate Limits Service Tests
 * 
 * Tests for the rate limits service functionality
 */

import { RateLimitsService } from '../rateLimits';

describe('RateLimitsService', () => {
  describe('formatRateLimitStatus', () => {
    it('should format unlimited status correctly', () => {
      const status = {
        currentCount: 0,
        limit: -1,
        remaining: -1,
        isUnlimited: true,
        resetsAt: null,
        tier: 'revenue',
      };

      const formatted = RateLimitsService.formatRateLimitStatus(status);
      expect(formatted).toBe('Unlimited offers');
    });

    it('should format limited status correctly', () => {
      const status = {
        currentCount: 2,
        limit: 5,
        remaining: 3,
        isUnlimited: false,
        resetsAt: null,
        tier: 'core',
      };

      const formatted = RateLimitsService.formatRateLimitStatus(status);
      expect(formatted).toBe('2 of 5 offers sent today');
    });

    it('should format at-limit status correctly', () => {
      const status = {
        currentCount: 3,
        limit: 3,
        remaining: 0,
        isUnlimited: false,
        resetsAt: null,
        tier: 'free',
      };

      const formatted = RateLimitsService.formatRateLimitStatus(status);
      expect(formatted).toBe('3 of 3 offers sent today');
    });
  });

  describe('getTimeUntilReset', () => {
    it('should return "Unknown" for null resetsAt', () => {
      const result = RateLimitsService.getTimeUntilReset(null);
      expect(result).toBe('Unknown');
    });

    it('should return "Now" for past resetsAt', () => {
      const pastDate = new Date(Date.now() - 1000).toISOString();
      const result = RateLimitsService.getTimeUntilReset(pastDate);
      expect(result).toBe('Now');
    });

    it('should format hours and minutes correctly', () => {
      const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString();
      const result = RateLimitsService.getTimeUntilReset(futureDate);
      expect(result).toMatch(/2h \d+m/);
    });

    it('should format minutes only when less than 1 hour', () => {
      const futureDate = new Date(Date.now() + 45 * 60 * 1000).toISOString();
      const result = RateLimitsService.getTimeUntilReset(futureDate);
      expect(result).toMatch(/\d+m/);
      expect(result).not.toContain('h');
    });
  });
});
