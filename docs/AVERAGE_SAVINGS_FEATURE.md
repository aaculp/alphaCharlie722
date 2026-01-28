# Average Savings Feature

## Overview

Added average savings calculation to the user profile screen, showing users the average dollar value they save per redeemed flash offer.

## Changes Made

### 1. Profile Service Updates

**File:** `src/services/api/profile.ts`

Added calculation for average savings:

```typescript
let totalSavings = 0;
let averageSavings = 0;
let redeemedCount = 0;

// Query redeemed claims with claim_value
const { data: redeemedClaims } = await supabase
  .from('flash_offer_claims')
  .select(`
    id,
    offer:flash_offers!inner(claim_value)
  `)
  .eq('user_id', userId)
  .eq('status', 'redeemed');

// Calculate total and average
if (redeemedClaims && redeemedClaims.length > 0) {
  redeemedCount = redeemedClaims.length;
  totalSavings = redeemedClaims.reduce((sum, claim) => {
    const offerValue = claim.offer?.claim_value || 0;
    return sum + offerValue;
  }, 0);
  
  // Round to 2 decimal places
  totalSavings = Math.round(totalSavings * 100) / 100;
  averageSavings = Math.round((totalSavings / redeemedCount) * 100) / 100;
}
```

### 2. Type Definition Updates

**File:** `src/types/profile.types.ts`

Added `averageSavings` field to `UserProfile` interface:

```typescript
export interface UserProfile {
  // ... other fields
  
  // Flash Offers
  redeemedOffersCount?: number; // Offers actually redeemed
  totalSavings?: number; // Total dollar value saved from redeemed offers
  averageSavings?: number; // Average dollar value per redeemed offer
  
  // ... other fields
}
```

### 3. UI Updates

**File:** `src/screens/customer/ProfileScreen.tsx`

Added new StatCard for average savings:

```tsx
{/* Average Savings per Offer */}
{(profileData?.averageSavings ?? 0) > 0 && (
  <StatCard
    icon="trending-up"
    label="Avg per Offer"
    value={formatCurrency(profileData?.averageSavings)}
    iconColor="#059669"
    subtitle="Money saved"
  />
)}
```

## Display Logic

Both stat cards are conditionally rendered:

1. **Total Savings** - Shows when `totalSavings > 0`
   - Icon: `cash` (💵)
   - Color: `#10B981` (green)
   - Format: Currency (e.g., "$138.95")

2. **Average Savings** - Shows when `averageSavings > 0`
   - Icon: `trending-up` (📈)
   - Color: `#059669` (darker green)
   - Format: Currency (e.g., "$46.32")
   - Subtitle: "Money saved"

## Example Display

For a user who has redeemed 3 offers with values $15.50, $123.45, and $0.00:

```
┌─────────────────────┐  ┌─────────────────────┐
│ 💵 Total Savings    │  │ 📈 Avg per Offer    │
│    $138.95          │  │    $46.32           │
│                     │  │    Money saved      │
└─────────────────────┘  └─────────────────────┘
```

## Calculation Details

- **Total Savings**: Sum of all `claim_value` from redeemed offers
- **Average Savings**: Total savings ÷ Number of redeemed offers
- **Rounding**: Both values rounded to 2 decimal places
- **Zero Values**: Offers with `claim_value = 0.00` are included in the calculation

## Benefits

1. **User Engagement**: Shows tangible value users get from the app
2. **Gamification**: Encourages users to redeem more offers
3. **Transparency**: Clear metrics on savings behavior
4. **Comparison**: Users can see both total and per-offer savings

## Testing

To test the feature:

1. Create flash offers with various claim values
2. Claim and redeem the offers
3. Navigate to profile screen
4. Verify both stat cards appear with correct calculations

Example SQL to verify:

```sql
SELECT 
  COUNT(*) as redeemed_count,
  SUM(fo.claim_value) as total_savings,
  ROUND(AVG(fo.claim_value)::numeric, 2) as average_savings
FROM flash_offer_claims foc
JOIN flash_offers fo ON foc.offer_id = fo.id
WHERE foc.user_id = 'USER_ID_HERE'
  AND foc.status = 'redeemed';
```

## Related Files

- Profile Service: `src/services/api/profile.ts`
- Profile Types: `src/types/profile.types.ts`
- Profile Screen: `src/screens/customer/ProfileScreen.tsx`
- Currency Utility: `src/utils/currency.ts`
