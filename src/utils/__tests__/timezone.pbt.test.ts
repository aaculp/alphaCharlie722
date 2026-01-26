/**
 * Property-Based Tests for Timezone Detection Utility
 * 
 * Uses fast-check to verify that timezone detection properties hold
 * across all possible scenarios with 100+ generated test cases.
 * 
 * Properties tested:
 * 1. Function always returns a valid string
 * 2. Result is always IANA format or 'UTC'
 * 3. Function never throws exceptions
 * 4. Function is idempotent (same result on repeated calls)
 * 
 * Requirements: 7.1, 7.4
 * **Validates: Requirements 7.1, 7.4**
 */

import * as fc from 'fast-check';
import { getDeviceTimezone } from '../timezone';

describe('getDeviceTimezone - Property-Based Tests', () => {
  // Store original Intl object to restore after tests
  const originalIntl = global.Intl;

  afterEach(() => {
    // Restore original Intl after each test
    global.Intl = originalIntl;
  });

  /**
   * Property 1: Function always returns a valid string
   * 
   * This property verifies that regardless of the Intl API state or return value,
   * getDeviceTimezone() always returns a non-empty string.
   */
  test('always returns a valid non-empty string', () => {
    fc.assert(
      fc.property(
        // Generate arbitrary values that might be returned by Intl API
        fc.oneof(
          fc.string(), // Any string
          fc.constant(null), // null
          fc.constant(undefined), // undefined
          fc.integer(), // numbers
          fc.boolean(), // booleans
          fc.object(), // objects
        ),
        (mockTimezoneValue) => {
          // Mock Intl to return the generated value
          global.Intl = {
            ...originalIntl,
            DateTimeFormat: jest.fn().mockImplementation(() => ({
              resolvedOptions: () => ({ timeZone: mockTimezoneValue }),
            })),
          } as any;

          const result = getDeviceTimezone();

          // Property: result must be a string
          expect(typeof result).toBe('string');
          // Property: result must not be empty
          expect(result.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 } // Run 100+ test cases as per acceptance criteria
    );
  });

  /**
   * Property 2: Result is always IANA format or 'UTC'
   * 
   * This property verifies that the returned timezone is either:
   * - 'UTC' (the fallback value)
   * - A valid IANA format timezone (contains '/')
   */
  test('result is always IANA format or UTC', () => {
    fc.assert(
      fc.property(
        // Generate various string values that might be returned
        fc.oneof(
          fc.constant('UTC'),
          fc.constant('America/New_York'),
          fc.constant('Europe/London'),
          fc.constant('Asia/Tokyo'),
          fc.constant('EST'), // Invalid format
          fc.constant('PST'), // Invalid format
          fc.constant(''), // Empty string
          fc.string(), // Random strings
        ),
        (mockTimezoneValue) => {
          global.Intl = {
            ...originalIntl,
            DateTimeFormat: jest.fn().mockImplementation(() => ({
              resolvedOptions: () => ({ timeZone: mockTimezoneValue }),
            })),
          } as any;

          const result = getDeviceTimezone();

          // Property: result must be either 'UTC' or contain '/'
          const isValidFormat = result === 'UTC' || result.includes('/');
          expect(isValidFormat).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3: Function never throws exceptions
   * 
   * This property verifies that getDeviceTimezone() handles all error
   * conditions gracefully and never throws exceptions, regardless of
   * what the Intl API does.
   */
  test('never throws exceptions', () => {
    fc.assert(
      fc.property(
        // Generate various error scenarios
        fc.oneof(
          fc.constant('throw'), // Intl throws error
          fc.constant('undefined'), // Intl is undefined
          fc.constant('null'), // Intl is null
          fc.constant('no-method'), // DateTimeFormat is missing
          fc.constant('no-resolved'), // resolvedOptions is missing
          fc.string(), // Valid timezone string
        ),
        (errorScenario) => {
          // Setup different error scenarios
          switch (errorScenario) {
            case 'throw':
              global.Intl = {
                ...originalIntl,
                DateTimeFormat: jest.fn().mockImplementation(() => {
                  throw new Error('Intl API error');
                }),
              } as any;
              break;
            case 'undefined':
              global.Intl = undefined as any;
              break;
            case 'null':
              global.Intl = null as any;
              break;
            case 'no-method':
              global.Intl = {
                DateTimeFormat: undefined,
              } as any;
              break;
            case 'no-resolved':
              global.Intl = {
                ...originalIntl,
                DateTimeFormat: jest.fn().mockImplementation(() => ({
                  resolvedOptions: undefined,
                })),
              } as any;
              break;
            default:
              // Valid scenario
              global.Intl = {
                ...originalIntl,
                DateTimeFormat: jest.fn().mockImplementation(() => ({
                  resolvedOptions: () => ({ timeZone: errorScenario }),
                })),
              } as any;
          }

          // Property: function must not throw
          expect(() => getDeviceTimezone()).not.toThrow();
          
          // Property: function must return a string even in error cases
          const result = getDeviceTimezone();
          expect(typeof result).toBe('string');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4: Function is idempotent
   * 
   * This property verifies that calling getDeviceTimezone() multiple times
   * in succession returns the same result (idempotency). The function should
   * be deterministic for a given Intl API state.
   */
  test('is idempotent - same result on repeated calls', () => {
    fc.assert(
      fc.property(
        // Generate various timezone values
        fc.oneof(
          fc.constant('UTC'),
          fc.constant('America/New_York'),
          fc.constant('Europe/London'),
          fc.constant('Asia/Tokyo'),
          fc.constant('Australia/Sydney'),
          fc.string(),
          fc.constant(null),
          fc.constant(undefined),
        ),
        (mockTimezoneValue) => {
          // Mock Intl with a consistent value
          global.Intl = {
            ...originalIntl,
            DateTimeFormat: jest.fn().mockImplementation(() => ({
              resolvedOptions: () => ({ timeZone: mockTimezoneValue }),
            })),
          } as any;

          // Call function multiple times
          const result1 = getDeviceTimezone();
          const result2 = getDeviceTimezone();
          const result3 = getDeviceTimezone();

          // Property: all calls must return the same value
          expect(result1).toBe(result2);
          expect(result2).toBe(result3);
          expect(result1).toBe(result3);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional Property: Function handles all valid IANA timezones correctly
   * 
   * This property verifies that any valid IANA timezone format is returned
   * as-is without modification.
   */
  test('returns valid IANA timezones unchanged', () => {
    fc.assert(
      fc.property(
        // Generate IANA-like timezone strings
        fc.tuple(
          fc.constantFrom(
            'America',
            'Europe',
            'Asia',
            'Africa',
            'Australia',
            'Pacific',
            'Atlantic',
            'Indian'
          ),
          fc.constantFrom(
            'New_York',
            'Los_Angeles',
            'Chicago',
            'London',
            'Paris',
            'Tokyo',
            'Sydney',
            'Cairo',
            'Mumbai',
            'Shanghai'
          )
        ).map(([region, city]) => `${region}/${city}`),
        (validTimezone) => {
          global.Intl = {
            ...originalIntl,
            DateTimeFormat: jest.fn().mockImplementation(() => ({
              resolvedOptions: () => ({ timeZone: validTimezone }),
            })),
          } as any;

          const result = getDeviceTimezone();

          // Property: valid IANA timezones should be returned unchanged
          expect(result).toBe(validTimezone);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional Property: Function always returns UTC on invalid input
   * 
   * This property verifies that any invalid timezone format results in
   * the UTC fallback being returned.
   */
  test('returns UTC for all invalid timezone formats', () => {
    fc.assert(
      fc.property(
        // Generate invalid timezone formats (no slash, not UTC)
        fc.string().filter(s => s !== 'UTC' && !s.includes('/')),
        (invalidTimezone) => {
          global.Intl = {
            ...originalIntl,
            DateTimeFormat: jest.fn().mockImplementation(() => ({
              resolvedOptions: () => ({ timeZone: invalidTimezone }),
            })),
          } as any;

          const result = getDeviceTimezone();

          // Property: invalid formats must return UTC
          expect(result).toBe('UTC');
        }
      ),
      { numRuns: 100 }
    );
  });
});
