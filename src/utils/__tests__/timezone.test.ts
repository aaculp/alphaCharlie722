/**
 * Unit Tests for Timezone Detection Utility
 * 
 * Tests the getDeviceTimezone() function to ensure it:
 * - Returns valid IANA timezone strings
 * - Falls back to 'UTC' on errors
 * - Validates timezone format correctly
 * - Never throws exceptions
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */

import { getDeviceTimezone } from '../timezone';

describe('getDeviceTimezone', () => {
  // Store original Intl object to restore after tests
  const originalIntl = global.Intl;

  afterEach(() => {
    // Restore original Intl after each test
    global.Intl = originalIntl;
  });

  describe('successful timezone detection', () => {
    it('should return valid IANA timezone string', () => {
      // Mock Intl to return a valid timezone
      global.Intl = {
        ...originalIntl,
        DateTimeFormat: jest.fn().mockImplementation(() => ({
          resolvedOptions: () => ({ timeZone: 'America/New_York' }),
        })),
      } as any;

      const result = getDeviceTimezone();
      expect(result).toBe('America/New_York');
    });

    it('should return UTC when timezone is UTC', () => {
      global.Intl = {
        ...originalIntl,
        DateTimeFormat: jest.fn().mockImplementation(() => ({
          resolvedOptions: () => ({ timeZone: 'UTC' }),
        })),
      } as any;

      const result = getDeviceTimezone();
      expect(result).toBe('UTC');
    });

    it('should handle various valid IANA timezones', () => {
      const validTimezones = [
        'America/Los_Angeles',
        'Europe/London',
        'Asia/Tokyo',
        'Australia/Sydney',
        'Africa/Cairo',
      ];

      validTimezones.forEach(timezone => {
        global.Intl = {
          ...originalIntl,
          DateTimeFormat: jest.fn().mockImplementation(() => ({
            resolvedOptions: () => ({ timeZone: timezone }),
          })),
        } as any;

        const result = getDeviceTimezone();
        expect(result).toBe(timezone);
      });
    });
  });

  describe('fallback to UTC on errors', () => {
    it('should return UTC when Intl API throws error', () => {
      global.Intl = {
        ...originalIntl,
        DateTimeFormat: jest.fn().mockImplementation(() => {
          throw new Error('Intl API unavailable');
        }),
      } as any;

      const result = getDeviceTimezone();
      expect(result).toBe('UTC');
    });

    it('should return UTC when timezone is empty string', () => {
      global.Intl = {
        ...originalIntl,
        DateTimeFormat: jest.fn().mockImplementation(() => ({
          resolvedOptions: () => ({ timeZone: '' }),
        })),
      } as any;

      const result = getDeviceTimezone();
      expect(result).toBe('UTC');
    });

    it('should return UTC when timezone is null', () => {
      global.Intl = {
        ...originalIntl,
        DateTimeFormat: jest.fn().mockImplementation(() => ({
          resolvedOptions: () => ({ timeZone: null }),
        })),
      } as any;

      const result = getDeviceTimezone();
      expect(result).toBe('UTC');
    });

    it('should return UTC when timezone is undefined', () => {
      global.Intl = {
        ...originalIntl,
        DateTimeFormat: jest.fn().mockImplementation(() => ({
          resolvedOptions: () => ({ timeZone: undefined }),
        })),
      } as any;

      const result = getDeviceTimezone();
      expect(result).toBe('UTC');
    });

    it('should return UTC when timezone is not a string', () => {
      global.Intl = {
        ...originalIntl,
        DateTimeFormat: jest.fn().mockImplementation(() => ({
          resolvedOptions: () => ({ timeZone: 12345 }),
        })),
      } as any;

      const result = getDeviceTimezone();
      expect(result).toBe('UTC');
    });
  });

  describe('IANA format validation', () => {
    it('should return UTC for non-IANA format timezones', () => {
      const invalidTimezones = [
        'EST',
        'PST',
        'GMT',
        'Eastern',
        'Pacific',
      ];

      invalidTimezones.forEach(timezone => {
        global.Intl = {
          ...originalIntl,
          DateTimeFormat: jest.fn().mockImplementation(() => ({
            resolvedOptions: () => ({ timeZone: timezone }),
          })),
        } as any;

        const result = getDeviceTimezone();
        expect(result).toBe('UTC');
      });
    });

    it('should accept timezones with forward slash', () => {
      global.Intl = {
        ...originalIntl,
        DateTimeFormat: jest.fn().mockImplementation(() => ({
          resolvedOptions: () => ({ timeZone: 'America/New_York' }),
        })),
      } as any;

      const result = getDeviceTimezone();
      expect(result).toBe('America/New_York');
    });

    it('should accept UTC as valid format', () => {
      global.Intl = {
        ...originalIntl,
        DateTimeFormat: jest.fn().mockImplementation(() => ({
          resolvedOptions: () => ({ timeZone: 'UTC' }),
        })),
      } as any;

      const result = getDeviceTimezone();
      expect(result).toBe('UTC');
    });
  });

  describe('error handling', () => {
    it('should never throw exceptions', () => {
      // Test various error scenarios
      const errorScenarios = [
        () => {
          global.Intl = undefined as any;
        },
        () => {
          global.Intl = null as any;
        },
        () => {
          global.Intl = {
            DateTimeFormat: undefined,
          } as any;
        },
        () => {
          global.Intl = {
            DateTimeFormat: jest.fn().mockImplementation(() => {
              throw new Error('Test error');
            }),
          } as any;
        },
      ];

      errorScenarios.forEach(setupError => {
        setupError();
        expect(() => getDeviceTimezone()).not.toThrow();
        expect(getDeviceTimezone()).toBe('UTC');
      });
    });

    it('should handle errors with stack traces', () => {
      const errorWithStack = new Error('Test error with stack');
      global.Intl = {
        ...originalIntl,
        DateTimeFormat: jest.fn().mockImplementation(() => {
          throw errorWithStack;
        }),
      } as any;

      const result = getDeviceTimezone();
      expect(result).toBe('UTC');
    });
  });

  describe('console logging', () => {
    let consoleLogSpy: jest.SpyInstance;
    let consoleWarnSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should log successful detection', () => {
      global.Intl = {
        ...originalIntl,
        DateTimeFormat: jest.fn().mockImplementation(() => ({
          resolvedOptions: () => ({ timeZone: 'America/New_York' }),
        })),
      } as any;

      getDeviceTimezone();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Timezone detected successfully:',
        'America/New_York'
      );
    });

    it('should log warning for invalid format', () => {
      global.Intl = {
        ...originalIntl,
        DateTimeFormat: jest.fn().mockImplementation(() => ({
          resolvedOptions: () => ({ timeZone: 'EST' }),
        })),
      } as any;

      getDeviceTimezone();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Timezone detection returned non-IANA format:',
        'EST'
      );
    });

    it('should log error when detection fails', () => {
      const testError = new Error('Test error');
      global.Intl = {
        ...originalIntl,
        DateTimeFormat: jest.fn().mockImplementation(() => {
          throw testError;
        }),
      } as any;

      getDeviceTimezone();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Timezone detection failed:',
        testError
      );
    });

    it('should log stack trace when error has stack', () => {
      const errorWithStack = new Error('Test error with stack');
      errorWithStack.stack = 'Error: Test error with stack\n    at test.ts:1:1';
      
      global.Intl = {
        ...originalIntl,
        DateTimeFormat: jest.fn().mockImplementation(() => {
          throw errorWithStack;
        }),
      } as any;

      getDeviceTimezone();
      
      // Verify error is logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Timezone detection failed:',
        errorWithStack
      );
      
      // Verify stack trace is logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Stack trace:',
        errorWithStack.stack
      );
    });
  });

  describe('performance', () => {
    it('should complete in less than 10ms', () => {
      global.Intl = {
        ...originalIntl,
        DateTimeFormat: jest.fn().mockImplementation(() => ({
          resolvedOptions: () => ({ timeZone: 'America/New_York' }),
        })),
      } as any;

      const startTime = performance.now();
      getDeviceTimezone();
      const endTime = performance.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(10);
    });
  });
});

describe('getFriendlyTimezoneName', () => {
  // Import the function
  const { getFriendlyTimezoneName } = require('../timezone');

  describe('US timezones', () => {
    it('should return friendly name for America/New_York', () => {
      expect(getFriendlyTimezoneName('America/New_York')).toBe('Eastern Time (ET)');
    });

    it('should return friendly name for America/Chicago', () => {
      expect(getFriendlyTimezoneName('America/Chicago')).toBe('Central Time (CT)');
    });

    it('should return friendly name for America/Denver', () => {
      expect(getFriendlyTimezoneName('America/Denver')).toBe('Mountain Time (MT)');
    });

    it('should return friendly name for America/Los_Angeles', () => {
      expect(getFriendlyTimezoneName('America/Los_Angeles')).toBe('Pacific Time (PT)');
    });

    it('should return friendly name for America/Anchorage', () => {
      expect(getFriendlyTimezoneName('America/Anchorage')).toBe('Alaska Time (AKT)');
    });

    it('should return friendly name for Pacific/Honolulu', () => {
      expect(getFriendlyTimezoneName('Pacific/Honolulu')).toBe('Hawaii Time (HT)');
    });
  });

  describe('European timezones', () => {
    it('should return friendly name for Europe/London', () => {
      expect(getFriendlyTimezoneName('Europe/London')).toBe('London (GMT)');
    });

    it('should return friendly name for Europe/Paris', () => {
      expect(getFriendlyTimezoneName('Europe/Paris')).toBe('Paris (CET)');
    });

    it('should return friendly name for Europe/Berlin', () => {
      expect(getFriendlyTimezoneName('Europe/Berlin')).toBe('Berlin (CET)');
    });

    it('should return friendly name for Europe/Moscow', () => {
      expect(getFriendlyTimezoneName('Europe/Moscow')).toBe('Moscow (MSK)');
    });
  });

  describe('Asian timezones', () => {
    it('should return friendly name for Asia/Tokyo', () => {
      expect(getFriendlyTimezoneName('Asia/Tokyo')).toBe('Tokyo (JST)');
    });

    it('should return friendly name for Asia/Shanghai', () => {
      expect(getFriendlyTimezoneName('Asia/Shanghai')).toBe('Shanghai (CST)');
    });

    it('should return friendly name for Asia/Singapore', () => {
      expect(getFriendlyTimezoneName('Asia/Singapore')).toBe('Singapore (SGT)');
    });

    it('should return friendly name for Asia/Dubai', () => {
      expect(getFriendlyTimezoneName('Asia/Dubai')).toBe('Dubai (GST)');
    });

    it('should return friendly name for Asia/Kolkata', () => {
      expect(getFriendlyTimezoneName('Asia/Kolkata')).toBe('India (IST)');
    });
  });

  describe('Australian timezones', () => {
    it('should return friendly name for Australia/Sydney', () => {
      expect(getFriendlyTimezoneName('Australia/Sydney')).toBe('Sydney (AEDT)');
    });

    it('should return friendly name for Australia/Melbourne', () => {
      expect(getFriendlyTimezoneName('Australia/Melbourne')).toBe('Melbourne (AEDT)');
    });

    it('should return friendly name for Australia/Perth', () => {
      expect(getFriendlyTimezoneName('Australia/Perth')).toBe('Perth (AWST)');
    });
  });

  describe('UTC timezone', () => {
    it('should return UTC for UTC timezone', () => {
      expect(getFriendlyTimezoneName('UTC')).toBe('UTC');
    });
  });

  describe('fallback behavior', () => {
    it('should return IANA format for unknown timezone', () => {
      const unknownTimezone = 'America/Unknown_City';
      expect(getFriendlyTimezoneName(unknownTimezone)).toBe(unknownTimezone);
    });

    it('should return IANA format for unmapped timezone', () => {
      const unmappedTimezone = 'Europe/Obscure_Place';
      expect(getFriendlyTimezoneName(unmappedTimezone)).toBe(unmappedTimezone);
    });

    it('should handle empty string gracefully', () => {
      expect(getFriendlyTimezoneName('')).toBe('');
    });
  });

  describe('COMMON_TIMEZONES coverage', () => {
    // Test that all timezones from NotificationSettingsScreen are covered
    const commonTimezones = [
      { iana: 'UTC', expected: 'UTC' },
      { iana: 'America/New_York', expected: 'Eastern Time (ET)' },
      { iana: 'America/Chicago', expected: 'Central Time (CT)' },
      { iana: 'America/Denver', expected: 'Mountain Time (MT)' },
      { iana: 'America/Los_Angeles', expected: 'Pacific Time (PT)' },
      { iana: 'America/Anchorage', expected: 'Alaska Time (AKT)' },
      { iana: 'Pacific/Honolulu', expected: 'Hawaii Time (HT)' },
      { iana: 'Europe/London', expected: 'London (GMT)' },
      { iana: 'Europe/Paris', expected: 'Paris (CET)' },
      { iana: 'Asia/Tokyo', expected: 'Tokyo (JST)' },
      { iana: 'Australia/Sydney', expected: 'Sydney (AEDT)' },
    ];

    commonTimezones.forEach(({ iana, expected }) => {
      it(`should have mapping for ${iana}`, () => {
        expect(getFriendlyTimezoneName(iana)).toBe(expected);
      });
    });
  });

  describe('additional timezone coverage', () => {
    it('should handle South American timezones', () => {
      expect(getFriendlyTimezoneName('America/Sao_Paulo')).toBe('São Paulo (BRT)');
      expect(getFriendlyTimezoneName('America/Buenos_Aires')).toBe('Buenos Aires (ART)');
    });

    it('should handle Canadian timezones', () => {
      expect(getFriendlyTimezoneName('America/Toronto')).toBe('Toronto (ET)');
      expect(getFriendlyTimezoneName('America/Vancouver')).toBe('Vancouver (PT)');
    });

    it('should handle African timezones', () => {
      expect(getFriendlyTimezoneName('Africa/Cairo')).toBe('Cairo (EET)');
      expect(getFriendlyTimezoneName('Africa/Johannesburg')).toBe('Johannesburg (SAST)');
    });

    it('should handle Middle Eastern timezones', () => {
      expect(getFriendlyTimezoneName('Asia/Jerusalem')).toBe('Jerusalem (IST)');
      expect(getFriendlyTimezoneName('Asia/Riyadh')).toBe('Riyadh (AST)');
    });

    it('should handle Pacific timezones', () => {
      expect(getFriendlyTimezoneName('Pacific/Auckland')).toBe('Auckland (NZDT)');
      expect(getFriendlyTimezoneName('Pacific/Fiji')).toBe('Fiji (FJT)');
    });
  });

  describe('function properties', () => {
    it('should always return a string', () => {
      const testCases = [
        'America/New_York',
        'Unknown/Timezone',
        'UTC',
        '',
        'Invalid',
      ];

      testCases.forEach(timezone => {
        const result = getFriendlyTimezoneName(timezone);
        expect(typeof result).toBe('string');
      });
    });

    it('should never return null or undefined', () => {
      const testCases = [
        'America/New_York',
        'Unknown/Timezone',
        '',
      ];

      testCases.forEach(timezone => {
        const result = getFriendlyTimezoneName(timezone);
        expect(result).not.toBeNull();
        expect(result).not.toBeUndefined();
      });
    });

    it('should be idempotent', () => {
      const timezone = 'America/New_York';
      const result1 = getFriendlyTimezoneName(timezone);
      const result2 = getFriendlyTimezoneName(timezone);
      expect(result1).toBe(result2);
    });
  });
});
