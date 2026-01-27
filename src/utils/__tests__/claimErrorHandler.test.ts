/**
 * Unit tests for claimErrorHandler
 * 
 * Tests error categorization, message mapping, and action guidance
 * for claim operation errors.
 */

import {
  handleClaimError,
  getErrorMessage,
  isRetryableError,
  requiresNavigation,
  type ClaimErrorResponse,
} from '../claimErrorHandler';

describe('claimErrorHandler', () => {
  describe('handleClaimError', () => {
    describe('eligibility errors', () => {
      it('should handle not checked in error with navigate action', () => {
        const error = new Error('You must be checked in to this venue to claim this offer');
        const result = handleClaimError(error);

        expect(result.type).toBe('eligibility');
        expect(result.message).toBe('You must check in at the venue to claim this offer');
        expect(result.action).toBe('navigate');
        expect(result.severity).toBe('warning');
        expect(result.navigationTarget).toBe('check_in');
        expect(result.originalError).toBe(error);
      });

      it('should handle already claimed error with navigate to my claims', () => {
        const error = new Error('You have already claimed this offer');
        const result = handleClaimError(error);

        expect(result.type).toBe('eligibility');
        expect(result.message).toBe("You've already claimed this offer. View your claim in My Claims.");
        expect(result.action).toBe('navigate');
        expect(result.severity).toBe('info');
        expect(result.navigationTarget).toBe('my_claims');
      });

      it('should handle offer full error with dismiss action', () => {
        const error = new Error('This offer has reached its maximum claims');
        const result = handleClaimError(error);

        expect(result.type).toBe('eligibility');
        expect(result.message).toBe('This offer has been fully claimed. Check back for new offers!');
        expect(result.action).toBe('dismiss');
        expect(result.severity).toBe('warning');
      });

      it('should handle expired offer error', () => {
        const error = new Error('This offer has expired');
        const result = handleClaimError(error);

        expect(result.type).toBe('eligibility');
        expect(result.message).toBe('This offer has expired');
        expect(result.action).toBe('dismiss');
        expect(result.severity).toBe('warning');
      });

      it('should handle not active offer error', () => {
        const error = new Error('This offer is not currently active');
        const result = handleClaimError(error);

        expect(result.type).toBe('eligibility');
        expect(result.message).toBe('This offer is not currently available');
        expect(result.action).toBe('dismiss');
        expect(result.severity).toBe('warning');
      });

      it('should handle "not active" variant error message', () => {
        const error = new Error('Offer is not active');
        const result = handleClaimError(error);

        expect(result.type).toBe('eligibility');
        expect(result.message).toBe('This offer is not currently available');
        expect(result.action).toBe('dismiss');
        expect(result.severity).toBe('warning');
      });
    });

    describe('network errors', () => {
      it('should handle network request failed error', () => {
        const error = new Error('Network request failed');
        const result = handleClaimError(error);

        expect(result.type).toBe('network');
        expect(result.message).toBe('Unable to connect. Check your internet connection and try again.');
        expect(result.action).toBe('retry');
        expect(result.severity).toBe('error');
      });

      it('should handle connection error', () => {
        const error = new Error('Connection refused');
        const result = handleClaimError(error);

        expect(result.type).toBe('network');
        expect(result.message).toBe('Unable to connect. Check your internet connection and try again.');
        expect(result.action).toBe('retry');
        expect(result.severity).toBe('error');
      });

      it('should handle failed to fetch error', () => {
        const error = new Error('Failed to fetch');
        const result = handleClaimError(error);

        expect(result.type).toBe('network');
        expect(result.message).toBe('Unable to connect. Check your internet connection and try again.');
        expect(result.action).toBe('retry');
        expect(result.severity).toBe('error');
      });
    });

    describe('timeout errors', () => {
      it('should handle timeout error', () => {
        const error = new Error('Request timeout');
        const result = handleClaimError(error);

        expect(result.type).toBe('timeout');
        expect(result.message).toBe('Request timed out. Your claim may still be processing. Check My Claims or try again.');
        expect(result.action).toBe('check_claims');
        expect(result.severity).toBe('warning');
      });

      it('should handle timed out error variant', () => {
        const error = new Error('Operation timed out');
        const result = handleClaimError(error);

        expect(result.type).toBe('timeout');
        expect(result.message).toBe('Request timed out. Your claim may still be processing. Check My Claims or try again.');
        expect(result.action).toBe('check_claims');
        expect(result.severity).toBe('warning');
      });
    });

    describe('race condition errors', () => {
      it('should handle explicit race condition error', () => {
        const error = new Error('Race condition detected');
        const result = handleClaimError(error);

        expect(result.type).toBe('race_condition');
        expect(result.message).toBe('This offer was just claimed by someone else and is now full');
        expect(result.action).toBe('dismiss');
        expect(result.severity).toBe('warning');
      });

      it('should handle concurrent maximum claims error', () => {
        const error = new Error('Maximum claims reached due to concurrent requests');
        const result = handleClaimError(error);

        expect(result.type).toBe('race_condition');
        expect(result.message).toBe('This offer was just claimed by someone else and is now full');
        expect(result.action).toBe('dismiss');
        expect(result.severity).toBe('warning');
      });
    });

    describe('unknown errors', () => {
      it('should handle unknown error with generic message', () => {
        const error = new Error('Something unexpected happened');
        const result = handleClaimError(error);

        expect(result.type).toBe('unknown');
        expect(result.message).toBe('Something went wrong. Please try again.');
        expect(result.action).toBe('retry');
        expect(result.severity).toBe('error');
      });

      it('should handle error without message', () => {
        const error = new Error();
        const result = handleClaimError(error);

        expect(result.type).toBe('unknown');
        expect(result.message).toBe('Something went wrong. Please try again.');
        expect(result.action).toBe('retry');
        expect(result.severity).toBe('error');
      });

      it('should handle null error', () => {
        const result = handleClaimError(null);

        expect(result.type).toBe('unknown');
        expect(result.message).toBe('Something went wrong. Please try again.');
        expect(result.action).toBe('retry');
        expect(result.severity).toBe('error');
      });

      it('should handle undefined error', () => {
        const result = handleClaimError(undefined);

        expect(result.type).toBe('unknown');
        expect(result.message).toBe('Something went wrong. Please try again.');
        expect(result.action).toBe('retry');
        expect(result.severity).toBe('error');
      });
    });

    describe('case insensitivity', () => {
      it('should handle errors with different casing', () => {
        const error1 = new Error('YOU MUST BE CHECKED IN');
        const result1 = handleClaimError(error1);
        expect(result1.type).toBe('eligibility');

        const error2 = new Error('Network Request Failed');
        const result2 = handleClaimError(error2);
        expect(result2.type).toBe('network');

        const error3 = new Error('TIMEOUT');
        const result3 = handleClaimError(error3);
        expect(result3.type).toBe('timeout');
      });
    });
  });

  describe('getErrorMessage', () => {
    it('should return correct message for eligibility error', () => {
      expect(getErrorMessage('eligibility')).toBe('You are not eligible to claim this offer');
    });

    it('should return correct message for network error', () => {
      expect(getErrorMessage('network')).toBe('Unable to connect. Check your internet connection and try again.');
    });

    it('should return correct message for timeout error', () => {
      expect(getErrorMessage('timeout')).toBe('Request timed out. Your claim may still be processing.');
    });

    it('should return correct message for race condition error', () => {
      expect(getErrorMessage('race_condition')).toBe('This offer was just claimed by someone else and is now full');
    });

    it('should return correct message for unknown error', () => {
      expect(getErrorMessage('unknown')).toBe('Something went wrong. Please try again.');
    });
  });

  describe('isRetryableError', () => {
    it('should return true for network errors', () => {
      const error = new Error('Network request failed');
      const result = handleClaimError(error);
      expect(isRetryableError(result)).toBe(true);
    });

    it('should return true for unknown errors', () => {
      const error = new Error('Something unexpected');
      const result = handleClaimError(error);
      expect(isRetryableError(result)).toBe(true);
    });

    it('should return false for eligibility errors', () => {
      const error = new Error('This offer has expired');
      const result = handleClaimError(error);
      expect(isRetryableError(result)).toBe(false);
    });

    it('should return false for timeout errors', () => {
      const error = new Error('Request timeout');
      const result = handleClaimError(error);
      expect(isRetryableError(result)).toBe(false);
    });

    it('should return false for race condition errors', () => {
      const error = new Error('Race condition detected');
      const result = handleClaimError(error);
      expect(isRetryableError(result)).toBe(false);
    });
  });

  describe('requiresNavigation', () => {
    it('should return true for not checked in error', () => {
      const error = new Error('You must be checked in to this venue');
      const result = handleClaimError(error);
      expect(requiresNavigation(result)).toBe(true);
      expect(result.navigationTarget).toBe('check_in');
    });

    it('should return true for already claimed error', () => {
      const error = new Error('You have already claimed this offer');
      const result = handleClaimError(error);
      expect(requiresNavigation(result)).toBe(true);
      expect(result.navigationTarget).toBe('my_claims');
    });

    it('should return false for network errors', () => {
      const error = new Error('Network request failed');
      const result = handleClaimError(error);
      expect(requiresNavigation(result)).toBe(false);
    });

    it('should return false for offer full error', () => {
      const error = new Error('This offer has reached its maximum claims');
      const result = handleClaimError(error);
      expect(requiresNavigation(result)).toBe(false);
    });
  });

  describe('error response structure', () => {
    it('should always include originalError in response', () => {
      const error = new Error('Test error');
      const result = handleClaimError(error);
      expect(result.originalError).toBe(error);
    });

    it('should always include type, message, action, and severity', () => {
      const error = new Error('Test error');
      const result = handleClaimError(error);
      
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('action');
      expect(result).toHaveProperty('severity');
      expect(typeof result.type).toBe('string');
      expect(typeof result.message).toBe('string');
      expect(typeof result.action).toBe('string');
      expect(typeof result.severity).toBe('string');
    });

    it('should include navigationTarget only for navigate actions', () => {
      const error1 = new Error('You must be checked in');
      const result1 = handleClaimError(error1);
      expect(result1.navigationTarget).toBeDefined();

      const error2 = new Error('Network request failed');
      const result2 = handleClaimError(error2);
      expect(result2.navigationTarget).toBeUndefined();
    });
  });
});
