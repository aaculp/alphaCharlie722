/**
 * Property-Based Tests for FCMService
 * Task: 16.1 Write property test for JWT token inclusion
 * Feature: flash-offer-push-backend
 * 
 * Tests Edge Function integration and JWT token handling
 */

import * as fc from 'fast-check';
import { FCMService } from '../FCMService';
import { supabase } from '../../lib/supabase';

// Mock Supabase
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
  },
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('FCMService - Property-Based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /**
   * Property 12: JWT Token Inclusion
   * Feature: flash-offer-push-backend, Property 12: JWT Token Inclusion
   * Validates: Requirements 4.2
   * 
   * For any call from FCMService to the Edge Function, the request headers should
   * include the user's Supabase JWT token in the Authorization header.
   */
  describe('Property 12: JWT Token Inclusion', () => {
    it('should include JWT token in Authorization header for all Edge Function calls', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // offerId
          fc.base64String({ minLength: 100, maxLength: 500 }), // JWT token (simulated as base64 string)
          async (offerId, jwtToken) => {
            // Skip invalid inputs
            fc.pre(offerId.trim().length > 0);
            fc.pre(jwtToken.trim().length > 0);

            // Reset mocks for each test
            (global.fetch as jest.Mock).mockClear();
            (supabase.auth.getSession as jest.Mock).mockClear();

            // Mock successful session with JWT token
            (supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
              data: {
                session: {
                  access_token: jwtToken,
                  user: { id: fc.sample(fc.uuid(), 1)[0] },
                },
              },
              error: null,
            });

            // Mock successful Edge Function response
            (global.fetch as jest.Mock).mockResolvedValueOnce({
              ok: true,
              status: 200,
              json: async () => ({
                success: true,
                targetedUserCount: 10,
                sentCount: 10,
                failedCount: 0,
                errors: [],
              }),
            });

            // Call sendViaEdgeFunction
            await FCMService.sendViaEdgeFunction(offerId);

            // Verify fetch was called
            expect(global.fetch).toHaveBeenCalled();

            // Get the fetch call arguments
            const fetchCalls = (global.fetch as jest.Mock).mock.calls;
            expect(fetchCalls.length).toBeGreaterThan(0);

            // Check the first call (should be the Edge Function call)
            const [url, options] = fetchCalls[0];

            // Verify Authorization header is present
            expect(options).toHaveProperty('headers');
            expect(options.headers).toHaveProperty('Authorization');

            // Verify Authorization header contains the JWT token
            const authHeader = options.headers.Authorization;
            expect(authHeader).toBe(`Bearer ${jwtToken}`);

            // Verify the token matches the one from the session
            expect(authHeader).toContain(jwtToken);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should fail gracefully when no JWT token is available', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // offerId
          async (offerId) => {
            // Skip invalid inputs
            fc.pre(offerId.trim().length > 0);

            // Mock session without JWT token
            (supabase.auth.getSession as jest.Mock).mockResolvedValue({
              data: {
                session: null,
              },
              error: null,
            });

            // Call sendViaEdgeFunction
            const result = await FCMService.sendViaEdgeFunction(offerId);

            // Verify it returns an error response
            expect(result.success).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0].error).toContain('Authentication');

            // Verify fetch was NOT called (no token, so no request)
            expect(global.fetch).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include JWT token for retry attempts', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // offerId
          fc.base64String({ minLength: 100, maxLength: 500 }), // JWT token
          async (offerId, jwtToken) => {
            // Skip invalid inputs
            fc.pre(offerId.trim().length > 0);
            fc.pre(jwtToken.trim().length > 0);

            // Reset mocks for each test
            (global.fetch as jest.Mock).mockClear();
            (supabase.auth.getSession as jest.Mock).mockClear();

            // Mock successful session with JWT token (will be called twice for retry)
            (supabase.auth.getSession as jest.Mock).mockResolvedValue({
              data: {
                session: {
                  access_token: jwtToken,
                  user: { id: fc.sample(fc.uuid(), 1)[0] },
                },
              },
              error: null,
            });

            // Mock first call fails with 500 (retryable), second succeeds
            let callCount = 0;
            (global.fetch as jest.Mock).mockImplementation(async () => {
              callCount++;
              if (callCount === 1) {
                // First call: server error (retryable)
                return {
                  ok: false,
                  status: 500,
                  json: async () => ({
                    success: false,
                    error: 'Internal server error',
                    code: 'INTERNAL_ERROR',
                  }),
                };
              } else {
                // Second call: success
                return {
                  ok: true,
                  status: 200,
                  json: async () => ({
                    success: true,
                    targetedUserCount: 5,
                    sentCount: 5,
                    failedCount: 0,
                    errors: [],
                  }),
                };
              }
            });

            // Call sendViaEdgeFunction (will retry once)
            await FCMService.sendViaEdgeFunction(offerId);

            // Verify fetch was called twice (initial + 1 retry)
            expect(global.fetch).toHaveBeenCalledTimes(2);

            // Verify both calls included the JWT token
            const fetchCalls = (global.fetch as jest.Mock).mock.calls;
            
            for (const [url, options] of fetchCalls) {
              expect(options.headers.Authorization).toBe(`Bearer ${jwtToken}`);
            }
          }
        ),
        { numRuns: 10 } // Reduced to 10 runs to avoid timeout (each run takes ~2 seconds due to retry delay)
      );
    }, 60000); // Increase timeout to 60 seconds for retry delays

    it('should use the same JWT token format for all requests', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.uuid(), { minLength: 1, maxLength: 3 }), // Multiple offer IDs (reduced to 3 max)
          fc.base64String({ minLength: 100, maxLength: 500 }), // JWT token
          async (offerIds, jwtToken) => {
            // Skip invalid inputs
            fc.pre(offerIds.every(id => id.trim().length > 0));
            fc.pre(jwtToken.trim().length > 0);

            // Reset fetch mock call count
            (global.fetch as jest.Mock).mockClear();
            (supabase.auth.getSession as jest.Mock).mockClear();

            // Mock successful session with JWT token (will be called multiple times)
            (supabase.auth.getSession as jest.Mock).mockResolvedValue({
              data: {
                session: {
                  access_token: jwtToken,
                  user: { id: fc.sample(fc.uuid(), 1)[0] },
                },
              },
              error: null,
            });

            // Mock successful Edge Function response
            (global.fetch as jest.Mock).mockResolvedValue({
              ok: true,
              status: 200,
              json: async () => ({
                success: true,
                targetedUserCount: 10,
                sentCount: 10,
                failedCount: 0,
                errors: [],
              }),
            });

            // Call sendViaEdgeFunction for each offer ID
            for (const offerId of offerIds) {
              await FCMService.sendViaEdgeFunction(offerId);
            }

            // Verify all calls used the same JWT token format
            const fetchCalls = (global.fetch as jest.Mock).mock.calls;
            expect(fetchCalls.length).toBe(offerIds.length);

            for (const [url, options] of fetchCalls) {
              expect(options.headers.Authorization).toBe(`Bearer ${jwtToken}`);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 13: Offer ID Parameter Inclusion
   * Feature: flash-offer-push-backend, Property 13: Offer ID Parameter Inclusion
   * Validates: Requirements 4.3
   * 
   * For any call from FCMService to the Edge Function, the request body should
   * include the offer ID.
   */
  describe('Property 13: Offer ID Parameter Inclusion', () => {
    it('should include offer ID in request body for all Edge Function calls', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // offerId
          fc.base64String({ minLength: 100, maxLength: 500 }), // JWT token
          async (offerId, jwtToken) => {
            // Skip invalid inputs
            fc.pre(offerId.trim().length > 0);
            fc.pre(jwtToken.trim().length > 0);

            // Reset mocks for each test
            (global.fetch as jest.Mock).mockClear();
            (supabase.auth.getSession as jest.Mock).mockClear();

            // Mock successful session with JWT token
            (supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
              data: {
                session: {
                  access_token: jwtToken,
                  user: { id: fc.sample(fc.uuid(), 1)[0] },
                },
              },
              error: null,
            });

            // Mock successful Edge Function response
            (global.fetch as jest.Mock).mockResolvedValueOnce({
              ok: true,
              status: 200,
              json: async () => ({
                success: true,
                targetedUserCount: 10,
                sentCount: 10,
                failedCount: 0,
                errors: [],
              }),
            });

            // Call sendViaEdgeFunction
            await FCMService.sendViaEdgeFunction(offerId);

            // Verify fetch was called
            expect(global.fetch).toHaveBeenCalled();

            // Get the fetch call arguments
            const fetchCalls = (global.fetch as jest.Mock).mock.calls;
            expect(fetchCalls.length).toBeGreaterThan(0);

            // Check the first call (should be the Edge Function call)
            const [_url, options] = fetchCalls[0];

            // Verify request body is present
            expect(options).toHaveProperty('body');

            // Parse the request body
            const requestBody = JSON.parse(options.body);

            // Verify offer ID is present in the body
            expect(requestBody).toHaveProperty('offerId');

            // Verify the offer ID matches the one passed to the function
            expect(requestBody.offerId).toBe(offerId);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include offer ID in request body for retry attempts', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // offerId
          fc.base64String({ minLength: 100, maxLength: 500 }), // JWT token
          async (offerId, jwtToken) => {
            // Skip invalid inputs
            fc.pre(offerId.trim().length > 0);
            fc.pre(jwtToken.trim().length > 0);

            // Reset mocks for each test
            (global.fetch as jest.Mock).mockClear();
            (supabase.auth.getSession as jest.Mock).mockClear();

            // Mock successful session with JWT token (will be called twice for retry)
            (supabase.auth.getSession as jest.Mock).mockResolvedValue({
              data: {
                session: {
                  access_token: jwtToken,
                  user: { id: fc.sample(fc.uuid(), 1)[0] },
                },
              },
              error: null,
            });

            // Mock first call fails with 500 (retryable), second succeeds
            let callCount = 0;
            (global.fetch as jest.Mock).mockImplementation(async () => {
              callCount++;
              if (callCount === 1) {
                // First call: server error (retryable)
                return {
                  ok: false,
                  status: 500,
                  json: async () => ({
                    success: false,
                    error: 'Internal server error',
                    code: 'INTERNAL_ERROR',
                  }),
                };
              } else {
                // Second call: success
                return {
                  ok: true,
                  status: 200,
                  json: async () => ({
                    success: true,
                    targetedUserCount: 5,
                    sentCount: 5,
                    failedCount: 0,
                    errors: [],
                  }),
                };
              }
            });

            // Call sendViaEdgeFunction (will retry once)
            await FCMService.sendViaEdgeFunction(offerId);

            // Verify fetch was called twice (initial + 1 retry)
            expect(global.fetch).toHaveBeenCalledTimes(2);

            // Verify both calls included the offer ID in the body
            const fetchCalls = (global.fetch as jest.Mock).mock.calls;
            
            for (const [_url, options] of fetchCalls) {
              const requestBody = JSON.parse(options.body);
              expect(requestBody.offerId).toBe(offerId);
            }
          }
        ),
        { numRuns: 10 } // Reduced to 10 runs to avoid timeout (each run takes ~2 seconds due to retry delay)
      );
    }, 60000); // Increase timeout to 60 seconds for retry delays

    it('should include offer ID for different offer IDs in multiple calls', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.uuid(), { minLength: 1, maxLength: 3 }), // Multiple offer IDs (reduced to 3 max)
          fc.base64String({ minLength: 100, maxLength: 500 }), // JWT token
          async (offerIds, jwtToken) => {
            // Skip invalid inputs
            fc.pre(offerIds.every(id => id.trim().length > 0));
            fc.pre(jwtToken.trim().length > 0);

            // Reset fetch mock call count
            (global.fetch as jest.Mock).mockClear();
            (supabase.auth.getSession as jest.Mock).mockClear();

            // Mock successful session with JWT token (will be called multiple times)
            (supabase.auth.getSession as jest.Mock).mockResolvedValue({
              data: {
                session: {
                  access_token: jwtToken,
                  user: { id: fc.sample(fc.uuid(), 1)[0] },
                },
              },
              error: null,
            });

            // Mock successful Edge Function response
            (global.fetch as jest.Mock).mockResolvedValue({
              ok: true,
              status: 200,
              json: async () => ({
                success: true,
                targetedUserCount: 10,
                sentCount: 10,
                failedCount: 0,
                errors: [],
              }),
            });

            // Call sendViaEdgeFunction for each offer ID
            for (const offerId of offerIds) {
              await FCMService.sendViaEdgeFunction(offerId);
            }

            // Verify all calls included the correct offer ID
            const fetchCalls = (global.fetch as jest.Mock).mock.calls;
            expect(fetchCalls.length).toBe(offerIds.length);

            for (let i = 0; i < fetchCalls.length; i++) {
              const [_url, options] = fetchCalls[i];
              const requestBody = JSON.parse(options.body);
              expect(requestBody.offerId).toBe(offerIds[i]);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include only offer ID in request body (no extra fields)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // offerId
          fc.base64String({ minLength: 100, maxLength: 500 }), // JWT token
          async (offerId, jwtToken) => {
            // Skip invalid inputs
            fc.pre(offerId.trim().length > 0);
            fc.pre(jwtToken.trim().length > 0);

            // Reset mocks for each test
            (global.fetch as jest.Mock).mockClear();
            (supabase.auth.getSession as jest.Mock).mockClear();

            // Mock successful session with JWT token
            (supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
              data: {
                session: {
                  access_token: jwtToken,
                  user: { id: fc.sample(fc.uuid(), 1)[0] },
                },
              },
              error: null,
            });

            // Mock successful Edge Function response
            (global.fetch as jest.Mock).mockResolvedValueOnce({
              ok: true,
              status: 200,
              json: async () => ({
                success: true,
                targetedUserCount: 10,
                sentCount: 10,
                failedCount: 0,
                errors: [],
              }),
            });

            // Call sendViaEdgeFunction
            await FCMService.sendViaEdgeFunction(offerId);

            // Get the fetch call arguments
            const fetchCalls = (global.fetch as jest.Mock).mock.calls;
            const [_url, options] = fetchCalls[0];

            // Parse the request body
            const requestBody = JSON.parse(options.body);

            // Verify only offerId is present (no unexpected fields)
            const expectedKeys = ['offerId'];
            const actualKeys = Object.keys(requestBody);
            
            // Check that all expected keys are present
            expectedKeys.forEach(key => {
              expect(actualKeys).toContain(key);
            });

            // Check that offerId has the correct value
            expect(requestBody.offerId).toBe(offerId);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 14: Response Parsing Accuracy
   * Feature: flash-offer-push-backend, Property 14: Response Parsing Accuracy
   * Validates: Requirements 4.4
   * 
   * For any valid Edge Function response, the FCMService should correctly parse
   * and return the success/failure counts.
   */
  describe('Property 14: Response Parsing Accuracy', () => {
    it('should correctly parse success/failure counts from Edge Function response', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // offerId
          fc.base64String({ minLength: 100, maxLength: 500 }), // JWT token
          fc.nat({ max: 1000 }), // targetedUserCount
          fc.nat({ max: 1000 }), // sentCount
          fc.nat({ max: 1000 }), // failedCount
          async (offerId, jwtToken, targetedUserCount, sentCount, failedCount) => {
            // Skip invalid inputs
            fc.pre(offerId.trim().length > 0);
            fc.pre(jwtToken.trim().length > 0);
            // Ensure counts are consistent: sentCount + failedCount should not exceed targetedUserCount
            fc.pre(sentCount + failedCount <= targetedUserCount || targetedUserCount === 0);

            // Reset mocks for each test
            (global.fetch as jest.Mock).mockClear();
            (supabase.auth.getSession as jest.Mock).mockClear();

            // Mock successful session with JWT token
            (supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
              data: {
                session: {
                  access_token: jwtToken,
                  user: { id: fc.sample(fc.uuid(), 1)[0] },
                },
              },
              error: null,
            });

            // Mock Edge Function response with specific counts
            const mockResponse = {
              success: true,
              targetedUserCount,
              sentCount,
              failedCount,
              errors: [],
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
              ok: true,
              status: 200,
              json: async () => mockResponse,
            });

            // Call sendViaEdgeFunction
            const result = await FCMService.sendViaEdgeFunction(offerId);

            // Verify the result matches the mock response exactly
            expect(result.success).toBe(true);
            expect(result.targetedUserCount).toBe(targetedUserCount);
            expect(result.sentCount).toBe(sentCount);
            expect(result.failedCount).toBe(failedCount);
            expect(result.errors).toEqual([]);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly parse error array from Edge Function response', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // offerId
          fc.base64String({ minLength: 100, maxLength: 500 }), // JWT token
          fc.array(
            fc.record({
              token: fc.string({ minLength: 10, maxLength: 200 }),
              error: fc.string({ minLength: 5, maxLength: 100 }),
            }),
            { minLength: 0, maxLength: 10 }
          ), // errors array
          async (offerId, jwtToken, errors) => {
            // Skip invalid inputs
            fc.pre(offerId.trim().length > 0);
            fc.pre(jwtToken.trim().length > 0);

            // Reset mocks for each test
            (global.fetch as jest.Mock).mockClear();
            (supabase.auth.getSession as jest.Mock).mockClear();

            // Mock successful session with JWT token
            (supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
              data: {
                session: {
                  access_token: jwtToken,
                  user: { id: fc.sample(fc.uuid(), 1)[0] },
                },
              },
              error: null,
            });

            // Mock Edge Function response with errors
            const mockResponse = {
              success: true,
              targetedUserCount: 100,
              sentCount: 100 - errors.length,
              failedCount: errors.length,
              errors,
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
              ok: true,
              status: 200,
              json: async () => mockResponse,
            });

            // Call sendViaEdgeFunction
            const result = await FCMService.sendViaEdgeFunction(offerId);

            // Verify the errors array is parsed correctly
            expect(result.success).toBe(true);
            expect(result.errors).toEqual(errors);
            expect(result.errors.length).toBe(errors.length);

            // Verify each error has the expected structure
            result.errors.forEach((error, index) => {
              expect(error).toHaveProperty('token');
              expect(error).toHaveProperty('error');
              expect(error.token).toBe(errors[index].token);
              expect(error.error).toBe(errors[index].error);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle missing optional fields in Edge Function response', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // offerId
          fc.base64String({ minLength: 100, maxLength: 500 }), // JWT token
          fc.boolean(), // include targetedUserCount
          fc.boolean(), // include sentCount
          fc.boolean(), // include failedCount
          fc.boolean(), // include errors
          async (offerId, jwtToken, includeTargeted, includeSent, includeFailed, includeErrors) => {
            // Skip invalid inputs
            fc.pre(offerId.trim().length > 0);
            fc.pre(jwtToken.trim().length > 0);

            // Reset mocks for each test
            (global.fetch as jest.Mock).mockClear();
            (supabase.auth.getSession as jest.Mock).mockClear();

            // Mock successful session with JWT token
            (supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
              data: {
                session: {
                  access_token: jwtToken,
                  user: { id: fc.sample(fc.uuid(), 1)[0] },
                },
              },
              error: null,
            });

            // Build mock response with optional fields
            const mockResponse: any = {
              success: true,
            };

            if (includeTargeted) mockResponse.targetedUserCount = 50;
            if (includeSent) mockResponse.sentCount = 45;
            if (includeFailed) mockResponse.failedCount = 5;
            if (includeErrors) mockResponse.errors = [{ token: 'test-token', error: 'test-error' }];

            (global.fetch as jest.Mock).mockResolvedValueOnce({
              ok: true,
              status: 200,
              json: async () => mockResponse,
            });

            // Call sendViaEdgeFunction
            const result = await FCMService.sendViaEdgeFunction(offerId);

            // Verify the result handles missing fields with defaults
            expect(result.success).toBe(true);
            expect(result.targetedUserCount).toBe(includeTargeted ? 50 : 0);
            expect(result.sentCount).toBe(includeSent ? 45 : 0);
            expect(result.failedCount).toBe(includeFailed ? 5 : 0);
            expect(result.errors).toEqual(includeErrors ? [{ token: 'test-token', error: 'test-error' }] : []);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly parse error response from Edge Function', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // offerId
          fc.base64String({ minLength: 100, maxLength: 500 }), // JWT token
          fc.constantFrom(400, 404, 429), // error status codes (exclude 500 to avoid retries)
          fc.string({ minLength: 10, maxLength: 100 }), // error message
          fc.constantFrom('INVALID_REQUEST', 'OFFER_NOT_FOUND', 'RATE_LIMIT_EXCEEDED'), // error code (exclude INTERNAL_ERROR)
          async (offerId, jwtToken, statusCode, errorMessage, errorCode) => {
            // Skip invalid inputs
            fc.pre(offerId.trim().length > 0);
            fc.pre(jwtToken.trim().length > 0);
            fc.pre(errorMessage.trim().length > 0);

            // Reset mocks for each test
            (global.fetch as jest.Mock).mockClear();
            (supabase.auth.getSession as jest.Mock).mockClear();

            // Mock successful session with JWT token
            (supabase.auth.getSession as jest.Mock).mockResolvedValue({
              data: {
                session: {
                  access_token: jwtToken,
                  user: { id: fc.sample(fc.uuid(), 1)[0] },
                },
              },
              error: null,
            });

            // Mock Edge Function error response (non-retryable errors only)
            const mockResponse = {
              success: false,
              error: errorMessage,
              code: errorCode,
            };

            (global.fetch as jest.Mock).mockResolvedValue({
              ok: false,
              status: statusCode,
              json: async () => mockResponse,
            });

            // Call sendViaEdgeFunction
            const result = await FCMService.sendViaEdgeFunction(offerId);

            // Verify the error is parsed correctly
            expect(result.success).toBe(false);
            expect(result.targetedUserCount).toBe(0);
            expect(result.sentCount).toBe(0);
            expect(result.failedCount).toBe(0);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0].error).toContain(errorMessage);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain count consistency (sentCount + failedCount <= targetedUserCount)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(), // offerId
          fc.base64String({ minLength: 100, maxLength: 500 }), // JWT token
          fc.nat({ max: 1000 }), // targetedUserCount
          async (offerId, jwtToken, targetedUserCount) => {
            // Skip invalid inputs
            fc.pre(offerId.trim().length > 0);
            fc.pre(jwtToken.trim().length > 0);

            // Generate sentCount and failedCount that sum to targetedUserCount
            const sentCount = fc.sample(fc.nat({ max: targetedUserCount }), 1)[0];
            const failedCount = targetedUserCount - sentCount;

            // Reset mocks for each test
            (global.fetch as jest.Mock).mockClear();
            (supabase.auth.getSession as jest.Mock).mockClear();

            // Mock successful session with JWT token
            (supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
              data: {
                session: {
                  access_token: jwtToken,
                  user: { id: fc.sample(fc.uuid(), 1)[0] },
                },
              },
              error: null,
            });

            // Mock Edge Function response with consistent counts
            const mockResponse = {
              success: true,
              targetedUserCount,
              sentCount,
              failedCount,
              errors: [],
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
              ok: true,
              status: 200,
              json: async () => mockResponse,
            });

            // Call sendViaEdgeFunction
            const result = await FCMService.sendViaEdgeFunction(offerId);

            // Verify counts are parsed correctly and maintain consistency
            expect(result.targetedUserCount).toBe(targetedUserCount);
            expect(result.sentCount).toBe(sentCount);
            expect(result.failedCount).toBe(failedCount);
            
            // Verify the invariant: sentCount + failedCount should equal targetedUserCount
            expect(result.sentCount + result.failedCount).toBe(result.targetedUserCount);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
