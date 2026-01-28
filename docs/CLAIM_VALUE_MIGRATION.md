# Claim Value Migration

## Overview

This document describes the migration from `expected_value` to `claim_value` in the flash offers system.

## Changes Made

### 1. Database Schema Changes

**Migration File:** `database/migrations/022_rename_expected_value_to_claim_value_and_make_required.sql`

- Renamed column from `expected_value` to `claim_value`
- Changed from nullable to NOT NULL (required field)
- Set existing NULL values to 0.00 before applying NOT NULL constraint
- Updated column comment to reflect new name and requirement

**Schema:**
```sql
claim_value DECIMAL(10,2) NOT NULL CHECK (claim_value >= 0 AND claim_value <= 10000.00)
```

### 2. TypeScript Type Updates

**Files Updated:**
- `src/types/flashOffer.types.ts`
  - `FlashOffer.claim_value: number` (was `expected_value: number | null`)
  - `CreateFlashOfferInput.claim_value: number` (was `expected_value?: number`)
  - `UpdateFlashOfferInput.claim_value?: number` (was `expected_value?: number`)

- `src/types/flashOfferClaim.types.ts`
  - `FlashOfferClaimWithDetails.offer.claim_value: number` (was `expected_value: number | null`)

### 3. API Service Updates

**Files Updated:**
- `src/services/api/flashOffers.ts`
  - Updated all interfaces and JSDoc comments
  - Changed insert logic to use `claim_value` (required field)
  - Updated example code in documentation

- `src/services/api/flashOfferClaims.ts`
  - Updated all SELECT queries to use `claim_value`
  - Updated response mapping to use `claim_value`

- `src/services/api/profile.ts`
  - Updated savings calculation query to use `claim_value`
  - Removed NULL filter (no longer needed since field is required)

### 4. UI Component Updates

**Files Updated:**
- `src/components/venue/FlashOfferCreationModal.tsx`
  - Changed label from "Expected Value (Optional)" to "Claim Value *"
  - Updated helper text to remove "Optional"
  - Made field required in validation
  - Updated handler name from `handleExpectedValueChange` to `handleClaimValueChange`
  - Removed empty string handling (field is now required)

- `src/screens/customer/ClaimDetailScreen.tsx`
  - Removed conditional rendering (value is always present)
  - Updated to use `claim.offer.claim_value`

- `src/screens/venue/FlashOfferDetailScreen.tsx`
  - Removed conditional rendering (value is always present)
  - Updated to use `offer.claim_value`

### 5. Backward Compatibility

**Existing Data:**
- All existing offers with NULL `expected_value` were set to `0.00`
- No data loss occurred during migration
- All offers remain functional with the new schema

## Testing Performed

1. **Database Migration:**
   - ✅ Column renamed successfully
   - ✅ NOT NULL constraint applied
   - ✅ Existing NULL values converted to 0.00
   - ✅ CHECK constraints still enforced (0-10000 range)

2. **Validation Testing:**
   - ✅ Negative values rejected
   - ✅ Values exceeding 10000 rejected
   - ✅ Valid values (0.00, 10000.00, decimals) accepted
   - ✅ Required field validation in UI

3. **Savings Calculation:**
   - ✅ Profile service correctly sums claim_value
   - ✅ All redeemed claims included (no NULL filtering needed)
   - ✅ Proper rounding to 2 decimal places

## Migration Steps

1. Applied database migration via Supabase MCP
2. Synced migration to local filesystem
3. Updated TypeScript types
4. Updated API services
5. Updated UI components
6. Verified all changes in database

## Breaking Changes

⚠️ **This is a breaking change:**

- The field is now **required** when creating offers
- Frontend must provide a numeric value (cannot be omitted)
- Existing code that relied on NULL values will need updates

## Rollback Plan

If rollback is needed:

```sql
BEGIN;

-- Rename back to expected_value
ALTER TABLE flash_offers
  RENAME COLUMN claim_value TO expected_value;

-- Make nullable again
ALTER TABLE flash_offers
  ALTER COLUMN expected_value DROP NOT NULL;

-- Update comment
COMMENT ON COLUMN flash_offers.expected_value IS 'Expected dollar value of the offer in USD (0-10000, nullable)';

COMMIT;
```

## Next Steps

- Update any remaining test files to use `claim_value`
- Update API documentation
- Notify frontend team of breaking changes
- Update mobile app to require claim value input

## Related Files

- Migration: `database/migrations/022_rename_expected_value_to_claim_value_and_make_required.sql`
- Previous Migration: `database/migrations/021_convert_value_cap_to_expected_value.sql`
- Spec: `.kiro/specs/flash-offer-expected-value/`
