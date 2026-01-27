/**
 * ClaimErrorHandler Tests
 * 
 * Tests for comprehensive error handling with classification and actionable guidance.
 * 
 * Requirements tested:
 * - 9.2: Actionable guidance in rejection messages
 * - 9.3: Expiration handling with appropriate messaging
 * - 9.4: Error classification (temporary vs permanent)
 * - 9.5: Error message consistency
 */

import {
  ClaimErrorHandler,
  getActionableGuidance,
  formatExpirationMessage,
  type ClaimError,
  type ErrorClassification,
} from '../ClaimErrorHandler';

describe('ClaimErrorHandler', () => {
  describe('createError', () => {
    it('should create expired error with correct classification', () => {
      const error = ClaimErrorHandler.createError('expired');
      
      expect(error.type).toBe('expired');
      expect(error.classification).toBe('permanent');
      expect(error.retryable).toBe(false);
      expect(error.title).toBe('Claim Expired');
      expect(error.message).toContain('expired');
      expect(error.actionableGuidance).toContain('Check for new flash offers');
    });

    it('should create rejected error with reason and actionable guidance', () => {
      const reason = 'Invalid claim code';
      const error = ClaimErrorHandler.createError('rejected', reason);
      
      expect(error.type).toBe('rejected');
      expect(error.classification).toBe('permanent');
      expect(error.retryable).toBe(false);
      expect(error.title).toBe('Claim Rejected');
      expect(error.message).toContain(reason);
      expect(error.actionableGuidance).toContain('Contact the venue');
    });

    it('should create connection_failed error as temporary', () => {
      const error = ClaimErrorHandler.createError('connection_failed');
      
      expect(error.type).toBe('connection_failed');
      expect(error.classification).toBe('temporary');
      expect(error.retryable).toBe(true);
      expect(error.title).toBe('Connection Issue');
      expect(error.actionableGuidance).toContain('Check your internet connection');
    });

    it('should create auth_failed error as temporary', () => {
      const error = ClaimErrorHandler.createError('auth_failed');
      
      expect(error.type).toBe('auth_failed');
      expect(error.classification).toBe('temporary');
      expect(error.retryable).toBe(false); // Not retryable, requires re-login
      expect(error.title).toBe('Authentication Error');
      expect(error.actionableGuidance).toContain('Log out and log back in');
    });

    it('should create subscription_failed error as temporary and retryable', () => {
      const error = ClaimErrorHandler.createError('subscription_failed');
      
      expect(error.type).toBe('subscription_failed');
      expect(error.classification).toBe('temporary');
      expect(error.retryable).toBe(true);
      expect(error.title).toBe('Update Error');
      expect(error.actionableGuidance).toContain('Pull down to refresh');
    });

    it('should include original error for logging', () => {
      const originalError = new Error('Network timeout');
      const error = ClaimErrorHandler.createError(
        'connection_failed',
        undefined,
        originalError
      );
      
      expect(error.originalError).toBe(originalError);
    });
  });

  describe('classifyError', () => {
    it('should classify network errors as temporary', () => {
      const networkError = new Error('Network request failed');
      const classification = ClaimErrorHandler.classifyError(networkError);
      
      expect(classification).toBe('temporary');
    });

    it('should classify auth errors as temporary', () => {
      const authError = { statusCode: 401, message: 'Unauthorized' };
      const classification = ClaimErrorHandler.classifyError(authError);
      
      expect(classification).toBe('temporary');
    });

    it('should classify validation errors as permanent', () => {
      const validationError = { statusCode: 400, message: 'Invalid input' };
      const classification = ClaimErrorHandler.classifyError(validationError);
      
      expect(classification).toBe('permanent');
    });

    it('should use classification from ClaimError if available', () => {
      const claimError: ClaimError = {
        type: 'expired',
        classification: 'permanent',
        title: 'Claim Expired',
        message: 'Expired',
        actionableGuidance: 'Check for new offers',
        retryable: false,
      };
      
      const classification = ClaimErrorHandler.classifyError(claimError);
      expect(classification).toBe('permanent');
    });

    it('should default to temporary for unknown errors', () => {
      const unknownError = { message: 'Something went wrong' };
      const classification = ClaimErrorHandler.classifyError(unknownError);
      
      expect(classification).toBe('temporary');
    });
  });

  describe('formatForDisplay', () => {
    it('should format error for UI display', () => {
      const error = ClaimErrorHandler.createError('rejected', 'Invalid code');
      const formatted = ClaimErrorHandler.formatForDisplay(error);
      
      expect(formatted.title).toBe('Claim Rejected');
      expect(formatted.message).toContain('Invalid code');
      expect(formatted.action).toContain('Contact the venue');
      expect(formatted.retryable).toBe(false);
      expect(formatted.classification).toBe('permanent');
    });

    it('should maintain consistency across error types', () => {
      const errors = [
        ClaimErrorHandler.createError('expired'),
        ClaimErrorHandler.createError('rejected', 'Test'),
        ClaimErrorHandler.createError('connection_failed'),
      ];
      
      errors.forEach(error => {
        const formatted = ClaimErrorHandler.formatForDisplay(error);
        
        expect(formatted).toHaveProperty('title');
        expect(formatted).toHaveProperty('message');
        expect(formatted).toHaveProperty('action');
        expect(formatted).toHaveProperty('retryable');
        expect(formatted).toHaveProperty('classification');
      });
    });
  });

  describe('handleClaimStatus', () => {
    it('should return expired error for expired status', () => {
      const error = ClaimErrorHandler.handleClaimStatus('expired');
      
      expect(error).not.toBeNull();
      expect(error?.type).toBe('expired');
      expect(error?.classification).toBe('permanent');
    });

    it('should return rejected error with reason for rejected status', () => {
      const reason = 'Invalid claim code';
      const error = ClaimErrorHandler.handleClaimStatus('rejected', reason);
      
      expect(error).not.toBeNull();
      expect(error?.type).toBe('rejected');
      expect(error?.message).toContain(reason);
    });

    it('should return already_redeemed error for redeemed status', () => {
      const error = ClaimErrorHandler.handleClaimStatus('redeemed');
      
      expect(error).not.toBeNull();
      expect(error?.type).toBe('already_redeemed');
      expect(error?.classification).toBe('permanent');
    });

    it('should return null for active status', () => {
      const error = ClaimErrorHandler.handleClaimStatus('active');
      expect(error).toBeNull();
    });

    it('should return null for pending status', () => {
      const error = ClaimErrorHandler.handleClaimStatus('pending');
      expect(error).toBeNull();
    });

    it('should return unknown error for unrecognized status', () => {
      const error = ClaimErrorHandler.handleClaimStatus('invalid_status');
      
      expect(error).not.toBeNull();
      expect(error?.type).toBe('unknown');
      // Unknown status is stored in originalError, not in message
      expect(error?.originalError).toEqual({ unknownStatus: 'invalid_status' });
    });
  });
});

describe('getActionableGuidance', () => {
  it('should return default guidance when no reason provided', () => {
    const guidance = getActionableGuidance();
    expect(guidance).toContain('Contact the venue');
  });

  it('should return expiration guidance for expired reasons', () => {
    const guidance1 = getActionableGuidance('Claim has expired');
    const guidance2 = getActionableGuidance('Time limit exceeded');
    
    expect(guidance1).toContain('expired');
    expect(guidance2).toContain('expired');
  });

  it('should return validation guidance for invalid reasons', () => {
    const guidance1 = getActionableGuidance('Invalid claim code');
    const guidance2 = getActionableGuidance('Code not found');
    
    expect(guidance1).toContain('Verify your claim code');
    expect(guidance2).toContain('Verify your claim code');
  });

  it('should return already used guidance for already used reasons', () => {
    const guidance1 = getActionableGuidance('Already redeemed');
    const guidance2 = getActionableGuidance('Claim has been used');
    
    expect(guidance1).toContain('already been used');
    expect(guidance2).toContain('already been used');
  });

  it('should return limit guidance for limit reasons', () => {
    const guidance1 = getActionableGuidance('Claim limit reached');
    const guidance2 = getActionableGuidance('Maximum claims exceeded');
    
    expect(guidance1).toContain('claim limit');
    expect(guidance2).toContain('claim limit');
  });

  it('should return default guidance for unrecognized reasons', () => {
    const guidance = getActionableGuidance('Some random reason');
    expect(guidance).toContain('Contact the venue');
  });
});

describe('formatExpirationMessage', () => {
  it('should format expiration message with date and time', () => {
    const expiresAt = '2024-01-15T10:30:00Z';
    const message = formatExpirationMessage(expiresAt);
    
    expect(message).toContain('expired on');
    expect(message).toContain('Jan 15, 2024');
    // Time will vary based on timezone, just check it has time format
    expect(message).toMatch(/at \d{1,2}:\d{2} (AM|PM)/);
  });

  it('should return default message when no timestamp provided', () => {
    const message = formatExpirationMessage();
    expect(message).toBe('This claim has expired and can no longer be redeemed.');
  });

  it('should return default message for invalid timestamp', () => {
    const message = formatExpirationMessage('invalid-date');
    expect(message).toBe('This claim has expired and can no longer be redeemed.');
  });
});

describe('Error Message Consistency (Requirement 9.5)', () => {
  it('should have consistent structure across all error types', () => {
    const errorTypes = [
      'expired',
      'rejected',
      'connection_failed',
      'auth_failed',
      'subscription_failed',
      'sync_failed',
      'invalid_claim',
      'already_redeemed',
      'unknown',
    ] as const;
    
    errorTypes.forEach(type => {
      const error = ClaimErrorHandler.createError(type);
      
      // All errors should have these properties
      expect(error).toHaveProperty('type');
      expect(error).toHaveProperty('classification');
      expect(error).toHaveProperty('title');
      expect(error).toHaveProperty('message');
      expect(error).toHaveProperty('actionableGuidance');
      expect(error).toHaveProperty('retryable');
      
      // All properties should be non-empty strings or booleans
      expect(typeof error.type).toBe('string');
      expect(typeof error.classification).toBe('string');
      expect(typeof error.title).toBe('string');
      expect(typeof error.message).toBe('string');
      expect(typeof error.actionableGuidance).toBe('string');
      expect(typeof error.retryable).toBe('boolean');
      
      expect(error.title.length).toBeGreaterThan(0);
      expect(error.message.length).toBeGreaterThan(0);
      expect(error.actionableGuidance.length).toBeGreaterThan(0);
    });
  });
});
