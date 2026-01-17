# Testing Guide for send-flash-offer-push Edge Function

## Overview

This document describes how to test the `send-flash-offer-push` Edge Function, including unit tests for environment variable validation and integration tests for the complete flow.

## Prerequisites

- [Deno](https://deno.land/) installed (for unit tests)
- [Supabase CLI](https://supabase.com/docs/guides/cli) installed (for local testing)
- Valid Firebase service account credentials
- Valid Supabase project with service role key

## Unit Tests

### Environment Variable Validation Tests

**File**: `index.test.ts`

**Requirements Tested**:
- Requirement 3.5: Edge Function validates required credentials are present
- Requirement 3.6: Returns generic error without exposing configuration details

**Running the Tests**:

```bash
# Run all unit tests
deno test --allow-env --allow-net index.test.ts

# Run with verbose output
deno test --allow-env --allow-net --trace-ops index.test.ts

# Run specific test
deno test --allow-env --allow-net --filter "Missing FIREBASE_SERVICE_ACCOUNT" index.test.ts
```

**Test Coverage**:

1. ✅ Missing FIREBASE_SERVICE_ACCOUNT
2. ✅ Missing SUPABASE_SERVICE_ROLE_KEY
3. ✅ Missing SUPABASE_URL
4. ✅ Missing multiple variables
5. ✅ All variables present (success case)
6. ✅ Missing all variables
7. ✅ Generic error message (security)
8. ✅ Empty string handling

**Expected Output**:

```
running 8 tests from ./index.test.ts
test Environment Variable Validation - Missing FIREBASE_SERVICE_ACCOUNT ... ok (2ms)
test Environment Variable Validation - Missing SUPABASE_SERVICE_ROLE_KEY ... ok (1ms)
test Environment Variable Validation - Missing SUPABASE_URL ... ok (1ms)
test Environment Variable Validation - Missing multiple variables ... ok (1ms)
test Environment Variable Validation - All variables present ... ok (1ms)
test Environment Variable Validation - Missing all variables ... ok (1ms)
test Environment Variable Validation - Returns generic error message ... ok (1ms)
test Environment Variable Validation - Empty strings treated as missing ... ok (1ms)

ok | 8 passed | 0 failed (10ms)
```

## Integration Tests

### Local Testing with Supabase CLI

**Prerequisites**:
1. Start local Supabase instance:
   ```bash
   supabase start
   ```

2. Set up environment variables:
   ```bash
   # Create .env file in supabase/functions/send-flash-offer-push/
   cat > .env << EOF
   FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
   SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'
   SUPABASE_URL='http://localhost:54321'
   EOF
   ```

3. Deploy function locally:
   ```bash
   supabase functions deploy send-flash-offer-push --no-verify-jwt
   ```

**Running Integration Tests**:

```bash
# From supabase/functions directory
./test-function.sh local <jwt_token> <offer_id>
```

### Testing Environment Variable Validation in Integration

**Test 1: Missing FIREBASE_SERVICE_ACCOUNT**

```bash
# Temporarily unset the variable
unset FIREBASE_SERVICE_ACCOUNT

# Deploy and test
supabase functions deploy send-flash-offer-push --no-verify-jwt

# Make request
curl -X POST http://localhost:54321/functions/v1/send-flash-offer-push \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"offerId": "test-id"}'

# Expected response:
# {
#   "success": false,
#   "error": "Server configuration error",
#   "code": "INTERNAL_ERROR"
# }
# Status: 500
```

**Test 2: All Variables Present**

```bash
# Set all required variables
export FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
export SUPABASE_SERVICE_ROLE_KEY='your-key'
export SUPABASE_URL='http://localhost:54321'

# Deploy and test
supabase functions deploy send-flash-offer-push --no-verify-jwt

# Make request
curl -X POST http://localhost:54321/functions/v1/send-flash-offer-push \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"offerId": "test-id"}'

# Expected: Should not return configuration error
```

## Test Scenarios

### Scenario 1: Graceful Failure on Missing Credentials

**Objective**: Verify that the Edge Function fails gracefully when credentials are missing.

**Steps**:
1. Remove one or more environment variables
2. Deploy the function
3. Make a request
4. Verify response is 500 with generic error message
5. Verify logs show which variables are missing (server-side only)
6. Verify response does NOT expose which variables are missing (security)

**Expected Behavior**:
- Status: 500
- Response: `{"success": false, "error": "Server configuration error", "code": "INTERNAL_ERROR"}`
- Logs: Should contain specific missing variables (for debugging)
- Response: Should NOT contain specific missing variables (for security)

### Scenario 2: Successful Validation

**Objective**: Verify that the Edge Function accepts valid configuration.

**Steps**:
1. Set all required environment variables
2. Deploy the function
3. Make a request
4. Verify no configuration error is returned

**Expected Behavior**:
- No configuration error
- Function proceeds to authentication step

## Debugging

### View Logs

```bash
# Real-time logs
supabase functions logs send-flash-offer-push --tail

# Recent logs
supabase functions logs send-flash-offer-push --limit 100
```

### Common Issues

**Issue**: Tests fail with "Deno not found"
**Solution**: Install Deno: `curl -fsSL https://deno.land/x/install/install.sh | sh`

**Issue**: Integration tests fail with "Connection refused"
**Solution**: Ensure Supabase is running: `supabase start`

**Issue**: Environment variables not loaded
**Solution**: Check `.env` file exists and is in correct location

## Continuous Integration

To run these tests in CI/CD:

```yaml
# Example GitHub Actions workflow
- name: Install Deno
  uses: denoland/setup-deno@v1
  with:
    deno-version: v1.x

- name: Run unit tests
  run: |
    cd supabase/functions/send-flash-offer-push
    deno test --allow-env --allow-net index.test.ts
```

## Next Steps

After environment variable validation tests pass:
1. Implement Firebase Admin SDK initialization (Task 4)
2. Add tests for JWT authentication (Task 3.1)
3. Add tests for database queries (Task 5.1)
4. Add end-to-end integration tests (Task 25)

## References

- [Deno Testing Documentation](https://deno.land/manual/testing)
- [Supabase Edge Functions Testing](https://supabase.com/docs/guides/functions/unit-test)
- Requirements: 3.5, 3.6 in requirements.md
