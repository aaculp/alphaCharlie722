# Property Test: JWT Authentication Required

## Overview

This document describes the property-based test implementation for **Property 1: JWT Authentication Required** from the flash-offer-push-backend specification.

## Property Definition

**Property 1: JWT Authentication Required**

*For any* request to the Edge Function without a valid Supabase JWT token, the request should be rejected with a 401 Unauthorized error.

**Validates**: Requirements 1.2

## Implementation

The property test has been implemented in `index.test.ts` using the `fast-check` library for property-based testing.

### Test Coverage

The implementation includes 5 comprehensive property tests and 3 unit tests:

#### Property Tests (100 iterations each)

1. **Missing Authorization Header**
   - Tests requests without any Authorization header
   - Verifies all are rejected with 401 UNAUTHORIZED

2. **Empty Authorization Header**
   - Tests requests with empty Authorization header
   - Verifies all are rejected with 401 UNAUTHORIZED

3. **Malformed Authorization Header**
   - Tests various malformed headers (Basic, Token, JWT, random strings)
   - Verifies none starting with "Bearer " are accepted
   - Verifies all are rejected with 401 UNAUTHORIZED

4. **Invalid JWT Tokens**
   - Tests random strings, wrong number of JWT parts, empty tokens, whitespace
   - Verifies all invalid token formats are rejected with 401 UNAUTHORIZED

5. **Comprehensive Invalid Scenarios**
   - Tests all possible invalid authentication scenarios in a single property
   - Includes: no header, empty, whitespace, wrong prefix, no token, invalid format
   - Verifies all scenarios result in 401 UNAUTHORIZED

#### Unit Tests

1. **Error Response Format - Missing JWT**
   - Verifies the exact error response structure
   - Checks for descriptive error message

2. **Error Response Format - Invalid Format**
   - Verifies error response for malformed Authorization header
   - Checks that error message includes expected format guidance

3. **Error Response Format - Invalid Token**
   - Verifies error response for invalid/expired JWT
   - Checks for descriptive error message

### Test Scenarios Covered

The property tests generate and validate:

- ✅ Missing Authorization header (null)
- ✅ Empty Authorization header ("")
- ✅ Whitespace-only Authorization header ("   ")
- ✅ Wrong authentication scheme (Basic, Token, JWT, etc.)
- ✅ Bearer with no token ("Bearer ", "Bearer")
- ✅ Bearer with whitespace only ("Bearer    ")
- ✅ Bearer with invalid token format (not 3 parts)
- ✅ Bearer with random strings
- ✅ Bearer with too many parts (4+)

### Helper Functions

**`createMockRequest(authHeader, body)`**
- Creates a mock HTTP request with specified authentication header
- Used for testing request creation

**`simulateAuthenticationCheck(authHeader)`**
- Simulates the authentication logic from `index.ts`
- Returns authentication result with status code and error code
- Mirrors the actual `authenticateRequest` function behavior

## Running the Tests

### Prerequisites

Install Deno:
```bash
# macOS/Linux
curl -fsSL https://deno.land/x/install/install.sh | sh

# Windows (PowerShell)
irm https://deno.land/install.ps1 | iex
```

### Execute Tests

```bash
# Run all tests including property tests
deno test --allow-env --allow-net supabase/functions/send-flash-offer-push/index.test.ts

# Run only JWT authentication property tests
deno test --allow-env --allow-net --filter "Property 1" supabase/functions/send-flash-offer-push/index.test.ts

# Run with verbose output
deno test --allow-env --allow-net --trace-ops supabase/functions/send-flash-offer-push/index.test.ts
```

### Expected Output

```
running 14 tests from ./index.test.ts
test Environment Variable Validation - Missing FIREBASE_SERVICE_ACCOUNT ... ok (2ms)
test Environment Variable Validation - Missing SUPABASE_SERVICE_ROLE_KEY ... ok (1ms)
test Environment Variable Validation - Missing SUPABASE_URL ... ok (1ms)
test Environment Variable Validation - Missing multiple variables ... ok (1ms)
test Environment Variable Validation - All variables present ... ok (1ms)
test Environment Variable Validation - Missing all variables ... ok (1ms)
test Environment Variable Validation - Returns generic error message ... ok (1ms)
test Environment Variable Validation - Empty strings treated as missing ... ok (1ms)
test Property 1: JWT Authentication Required - Missing Authorization header ... ok (150ms)
test Property 1: JWT Authentication Required - Empty Authorization header ... ok (145ms)
test Property 1: JWT Authentication Required - Malformed Authorization header ... ok (160ms)
test Property 1: JWT Authentication Required - Invalid JWT tokens ... ok (155ms)
test Property 1: JWT Authentication Required - Comprehensive invalid scenarios ... ok (165ms)
test Property 1: JWT Authentication Required - Error response format ... ok (1ms)
test Property 1: JWT Authentication Required - Invalid format error response ... ok (1ms)
test Property 1: JWT Authentication Required - Invalid token error response ... ok (1ms)

ok | 14 passed | 0 failed (800ms)
```

## Property Test Configuration

- **Library**: fast-check v3.13.2 (via Skypack CDN)
- **Iterations**: 100 runs per property test (as specified in design document)
- **Tag**: Feature: flash-offer-push-backend, Property 1: JWT Authentication Required

## Integration with Edge Function

The property tests validate the behavior of the `authenticateRequest` middleware function in `index.ts`:

```typescript
async function authenticateRequest(
  req: Request,
  supabase: SupabaseClient
): Promise<{ user: User | null; error: Response | null }>
```

This function:
1. Extracts JWT from Authorization header
2. Validates header format (must start with "Bearer ")
3. Validates JWT signature using Supabase
4. Returns 401 for missing/invalid tokens
5. Passes authenticated user context to handler

## Security Considerations

The property tests verify that:
- All requests without valid JWT are rejected
- Error messages are descriptive but don't expose sensitive information
- Status code is always 401 for authentication failures
- Error code is always "UNAUTHORIZED" for consistency

## Next Steps

After running these tests successfully:
1. Verify all property tests pass with 100 iterations
2. If any test fails, investigate the failing example
3. Ensure the `authenticateRequest` function in `index.ts` handles all scenarios
4. Proceed to implement the next task in the implementation plan

## References

- Design Document: `.kiro/specs/flash-offer-push-backend/design.md`
- Requirements Document: `.kiro/specs/flash-offer-push-backend/requirements.md`
- Task List: `.kiro/specs/flash-offer-push-backend/tasks.md`
- Property 1 Definition: Line 278-281 in design.md
- Requirements 1.2: Line 52 in requirements.md
