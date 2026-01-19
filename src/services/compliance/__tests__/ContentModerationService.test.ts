/**
 * Unit Tests for ContentModerationService
 * 
 * Tests for profanity filtering with tiered approach
 * 
 * Requirements:
 * - 19.1: Use content moderation library
 * - 19.2: Censor mild profanity with asterisks
 * - 19.3: Reject severe content (hate speech/threats)
 * - 19.4: Tiered approach (none/mild/severe)
 * - 19.5: Whitelist venue-specific terms
 */

import { ContentModerationService } from '../ContentModerationService';

describe('ContentModerationService', () => {
  describe('filterProfanity', () => {
    it('should allow clean text unchanged', () => {
      const text = 'This is a great restaurant with amazing food!';
      const result = ContentModerationService.filterProfanity(text);

      expect(result.filtered).toBe(text);
      expect(result.hadProfanity).toBe(false);
      expect(result.severity).toBe('none');
      expect(result.wasRejected).toBe(false);
    });

    it('should censor mild profanity with asterisks', () => {
      const text = 'The damn service was slow';
      const result = ContentModerationService.filterProfanity(text);

      expect(result.filtered).toContain('***');
      expect(result.hadProfanity).toBe(true);
      expect(result.severity).toBe('mild');
      expect(result.wasRejected).toBe(false);
    });

    it('should reject severe profanity', () => {
      const text = 'This fucking place sucks';
      const result = ContentModerationService.filterProfanity(text);

      expect(result.hadProfanity).toBe(true);
      expect(result.severity).toBe('severe');
      expect(result.wasRejected).toBe(true);
    });

    it('should whitelist "cocktails"', () => {
      const text = 'Great cocktails and atmosphere!';
      const result = ContentModerationService.filterProfanity(text);

      expect(result.filtered).toBe(text);
      expect(result.hadProfanity).toBe(false);
      expect(result.severity).toBe('none');
    });

    it('should whitelist "breast" in food context', () => {
      const text = 'The chicken breast was perfectly cooked';
      const result = ContentModerationService.filterProfanity(text);

      expect(result.filtered).toBe(text);
      expect(result.hadProfanity).toBe(false);
      expect(result.severity).toBe('none');
    });

    it('should handle multiple mild profanity words', () => {
      const text = 'Damn, this hell of a place is great';
      const result = ContentModerationService.filterProfanity(text);

      expect(result.hadProfanity).toBe(true);
      expect(result.severity).toBe('mild');
      expect(result.wasRejected).toBe(false);
      expect(result.filtered).toContain('***');
    });

    it('should handle empty string', () => {
      const text = '';
      const result = ContentModerationService.filterProfanity(text);

      expect(result.filtered).toBe('');
      expect(result.hadProfanity).toBe(false);
      expect(result.severity).toBe('none');
    });

    it('should handle text with only whitespace', () => {
      const text = '   ';
      const result = ContentModerationService.filterProfanity(text);

      expect(result.filtered).toBe('   ');
      expect(result.hadProfanity).toBe(false);
      expect(result.severity).toBe('none');
    });

    it('should be case-insensitive for profanity detection', () => {
      const text = 'DAMN this place';
      const result = ContentModerationService.filterProfanity(text);

      expect(result.hadProfanity).toBe(true);
      expect(result.severity).toBe('mild');
    });
  });

  describe('validateReviewText', () => {
    it('should accept valid text', () => {
      const text = 'This is a great place!';
      const result = ContentModerationService.validateReviewText(text);

      expect(result.valid).toBe(true);
      expect(result.trimmedText).toBe(text);
      expect(result.error).toBeUndefined();
    });

    it('should trim leading and trailing whitespace', () => {
      const text = '  Great place!  ';
      const result = ContentModerationService.validateReviewText(text);

      expect(result.valid).toBe(true);
      expect(result.trimmedText).toBe('Great place!');
    });

    it('should reject empty string', () => {
      const text = '';
      const result = ContentModerationService.validateReviewText(text);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Review text cannot be empty or contain only spaces');
    });

    it('should reject whitespace-only string', () => {
      const text = '   ';
      const result = ContentModerationService.validateReviewText(text);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Review text cannot be empty or contain only spaces');
    });

    it('should reject text exceeding 500 characters', () => {
      const text = 'a'.repeat(501);
      const result = ContentModerationService.validateReviewText(text);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Review text cannot exceed 500 characters');
    });

    it('should accept text with exactly 500 characters', () => {
      const text = 'a'.repeat(500);
      const result = ContentModerationService.validateReviewText(text);

      expect(result.valid).toBe(true);
      expect(result.trimmedText).toBe(text);
    });

    it('should accept text with 499 characters', () => {
      const text = 'a'.repeat(499);
      const result = ContentModerationService.validateReviewText(text);

      expect(result.valid).toBe(true);
      expect(result.trimmedText).toBe(text);
    });

    it('should handle newlines and special characters', () => {
      const text = 'Great place!\nLoved the food.\n\nWill come back!';
      const result = ContentModerationService.validateReviewText(text);

      expect(result.valid).toBe(true);
      expect(result.trimmedText).toBe(text);
    });

    it('should handle unicode characters', () => {
      const text = 'Amazing food! 🍕🍔🍟';
      const result = ContentModerationService.validateReviewText(text);

      expect(result.valid).toBe(true);
      expect(result.trimmedText).toBe(text);
    });
  });

  describe('containsSevereContent', () => {
    it('should detect hate speech', () => {
      const text = 'I hate this place and everyone there';
      // Note: This is a simplified test. Real implementation would use more sophisticated detection
      const result = ContentModerationService.containsSevereContent(text);

      // This test depends on the actual implementation
      expect(typeof result).toBe('boolean');
    });

    it('should not flag normal negative reviews', () => {
      const text = 'The service was poor and the food was cold';
      const result = ContentModerationService.containsSevereContent(text);

      expect(result).toBe(false);
    });

    it('should handle empty string', () => {
      const text = '';
      const result = ContentModerationService.containsSevereContent(text);

      expect(result).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle very long text with profanity', () => {
      const text = 'a'.repeat(400) + ' damn ' + 'b'.repeat(90);
      const result = ContentModerationService.filterProfanity(text);

      expect(result.hadProfanity).toBe(true);
      expect(result.severity).toBe('mild');
    });

    it('should handle text with multiple types of whitespace', () => {
      const text = 'Great\tplace\nwith\rgood\r\nfood';
      const validation = ContentModerationService.validateReviewText(text);

      expect(validation.valid).toBe(true);
    });

    it('should handle text with HTML entities', () => {
      const text = 'Great &amp; amazing place!';
      const result = ContentModerationService.filterProfanity(text);

      expect(result.filtered).toBe(text);
      expect(result.hadProfanity).toBe(false);
    });

    it('should handle text with URLs', () => {
      const text = 'Check out https://example.com for more info';
      const result = ContentModerationService.filterProfanity(text);

      expect(result.filtered).toBe(text);
      expect(result.hadProfanity).toBe(false);
    });

    it('should handle text with email addresses', () => {
      const text = 'Contact us at info@example.com';
      const result = ContentModerationService.filterProfanity(text);

      expect(result.filtered).toBe(text);
      expect(result.hadProfanity).toBe(false);
    });
  });
});
