/**
 * ContentModerationService
 * 
 * Provides content moderation for user-generated content (reviews, comments, etc.)
 * Uses a tiered approach: mild profanity (censor), severe content (reject), normal content (allow)
 * 
 * Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7, 19.8, 19.9, 19.10
 */

import { Filter } from 'bad-words';

/**
 * Profanity severity levels
 */
export type ProfanitySeverity = 'none' | 'mild' | 'severe';

/**
 * Content moderation result
 */
export interface ContentModerationResult {
  filtered: string;
  hadProfanity: boolean;
  severity: ProfanitySeverity;
  wasRejected: boolean;
  message?: string;
}

/**
 * Review text validation result
 */
export interface ReviewTextValidationResult {
  valid: boolean;
  error?: string;
  trimmedText?: string;
}

/**
 * ContentModerationService
 * 
 * Handles content moderation for reviews and other user-generated content.
 * Uses bad-words library with custom whitelist for venue-specific terms.
 */
export class ContentModerationService {
  private static filter: Filter;
  
  // Venue-specific whitelist - common false positives in restaurant/venue context
  // Requirement 19.5: Allow venue-related terms that might be flagged
  private static readonly VENUE_WHITELIST = [
    'cocktails',
    'cocktail',
    'breast',
    'breasts',
    'cock',
    'cocks',
    'cocky',
    'shitake',
    'shitakes',
    'ass',
    'asses',
    'assorted',
    'classic',
    'classics',
    'bass',
    'basses',
    'grasshopper',
    'grasshoppers',
  ];

  // Severe content patterns (hate speech, threats, extreme content)
  // Requirement 19.3: Reject severe content
  private static readonly SEVERE_PATTERNS = [
    // Hate speech patterns
    /\b(kill|murder|die|death)\s+(all|every|the)\s+\w+/i,
    /\b(hate|despise)\s+(all|every|the)\s+\w+/i,
    // Threats
    /\b(i'll|ill|i will|gonna)\s+(kill|hurt|harm|attack)/i,
    /\byou\s+(should|will|gonna)\s+(die|suffer)/i,
    // Extreme slurs (checking for patterns without listing actual words)
    /\bn[i1!]gg[e3]r/i,
    /\bf[a@]gg[o0]t/i,
    /\bc[u\*]nt/i,
    // Sexual harassment
    /\b(rape|molest|assault)\b/i,
  ];

  /**
   * Initialize the profanity filter with custom whitelist
   * Requirement 19.1, 19.8: Set up profanity filter with custom whitelist
   */
  private static initializeFilter(): void {
    if (!this.filter) {
      this.filter = new Filter();
      
      // Add venue-specific terms to whitelist
      this.filter.removeWords(...this.VENUE_WHITELIST);
    }
  }

  /**
   * Filter profanity in text with tiered approach
   * 
   * Requirements:
   * - 19.2: Censor mild profanity with asterisks
   * - 19.3: Reject severe content (hate speech/threats)
   * - 19.4: Use tiered approach (none/mild/severe)
   * 
   * @param text - Text to filter
   * @returns Content moderation result
   */
  static filterProfanity(text: string): ContentModerationResult {
    this.initializeFilter();

    // Check for severe content first
    const severity = this.detectSeverity(text);
    
    if (severity === 'severe') {
      // Requirement 19.3: Reject severe content
      return {
        filtered: text,
        hadProfanity: true,
        severity: 'severe',
        wasRejected: true,
        message: 'This content violates our community guidelines and cannot be posted. Please review our guidelines and try again.',
      };
    }

    // Check if text contains profanity using bad-words
    const hasProfanity = this.filter.isProfane(text);

    if (!hasProfanity) {
      // Requirement 19.4: Normal content (allow)
      return {
        filtered: text,
        hadProfanity: false,
        severity: 'none',
        wasRejected: false,
      };
    }

    // Requirement 19.2: Censor mild profanity with asterisks
    const filtered = this.filter.clean(text);

    return {
      filtered,
      hadProfanity: true,
      severity: 'mild',
      wasRejected: false,
      message: 'Some words were filtered to maintain a respectful environment.',
    };
  }

  /**
   * Validate review text
   * 
   * Requirements:
   * - 13.2: Max 500 characters
   * - 13.6: Trim leading/trailing whitespace
   * - 13.7: Prevent submission of only whitespace
   * 
   * @param text - Review text to validate
   * @returns Validation result
   */
  static validateReviewText(text: string): ReviewTextValidationResult {
    // Requirement 13.6: Trim leading/trailing whitespace
    const trimmed = text.trim();

    // Requirement 13.7: Prevent submission of only whitespace
    if (trimmed.length === 0) {
      return {
        valid: false,
        error: 'Review text cannot be empty or contain only spaces',
      };
    }

    // Requirement 13.2: Max 500 characters
    if (trimmed.length > 500) {
      return {
        valid: false,
        error: 'Review text cannot exceed 500 characters',
      };
    }

    return {
      valid: true,
      trimmedText: trimmed,
    };
  }

  /**
   * Check if text contains severe content (hate speech, threats)
   * 
   * Requirement 19.3: Detect severe content
   * 
   * @param text - Text to check
   * @returns True if text contains severe content
   */
  static containsSevereContent(text: string): boolean {
    return this.detectSeverity(text) === 'severe';
  }

  /**
   * Detect profanity severity level
   * 
   * @param text - Text to analyze
   * @returns Severity level
   */
  private static detectSeverity(text: string): ProfanitySeverity {
    // Check for severe patterns
    for (const pattern of this.SEVERE_PATTERNS) {
      if (pattern.test(text)) {
        return 'severe';
      }
    }

    // Check for mild profanity
    this.initializeFilter();
    if (this.filter.isProfane(text)) {
      return 'mild';
    }

    return 'none';
  }

  /**
   * Get community guidelines message
   * 
   * Requirement 19.9: Provide guidance on community guidelines
   * 
   * @returns Community guidelines message
   */
  static getCommunityGuidelinesMessage(): string {
    return `Our Community Guidelines:
    
1. Be respectful and constructive in your feedback
2. Focus on your experience with the venue
3. Avoid profanity, hate speech, and threats
4. Do not post spam or promotional content
5. Respect the privacy of others

Reviews that violate these guidelines may be removed.`;
  }

  /**
   * Add custom words to whitelist
   * Useful for venue-specific terms or brand names
   * 
   * @param words - Words to add to whitelist
   */
  static addToWhitelist(...words: string[]): void {
    this.initializeFilter();
    this.filter.removeWords(...words);
  }

  /**
   * Reset filter to default state
   * Useful for testing
   */
  static resetFilter(): void {
    this.filter = new Filter();
    this.filter.removeWords(...this.VENUE_WHITELIST);
  }
}
