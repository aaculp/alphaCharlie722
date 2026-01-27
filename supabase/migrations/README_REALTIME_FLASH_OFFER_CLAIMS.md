# Real-Time Flash Offer Claims Migration

This migration enables Supabase real-time subscriptions for the `flash_offer_claims` table, allowing instant push updates when claim statuses change.

## What This Migration Does

1. **Enables Real-Time**: Adds `flash_offer_claims` to the `supabase_realtime` publication
2. **Verifies Setup**: Confirms the table is properly configured for real-time
3. **Respects RLS**: Real-time subscriptions automatically enforce existing Row-Level Security policies

## Prerequisites

Before applying this migration, ensure:

- ✅ `flash_offer_claims` table exists (from migration `012_create_flash_offers_tables.sql`)
- ✅ RLS policies are configured (from migration `013_rls_flash_offers.sql`)
- ✅ Indexes exist for `user_id` and `status` columns
- ✅ `updated_at` trigger is configured

## How to Apply This Migration

### Option 1: Using Supabase CLI (Recommended)

```bash
# If using local Supabase
supabase db push

# Or apply to production
supabase db push --linked
```

The Supabase CLI will automatically detect and apply the new migration file.

### Option 2: Using Supabase Dashboard

1. Log in to your [Supabase Dashboard](https://app.supabase.com)
2. Navigate to your project
3. Go to **SQL Editor**
4. Copy the contents of `20260126221934_enable_realtime_flash_offer_claims.sql`
5. Paste into the SQL Editor
6. Click **Run**

### Option 3: Using psql

```bash
psql $DATABASE_URL -f supabase/migrations/20260126221934_enable_realtime_flash_offer_claims.sql
```

## Verification

After applying the migration, run the test script to verify everything is configured correctly:

### Using Supabase Dashboard

1. Go to **SQL Editor**
2. Copy the contents of `database/migrations/test_realtime_rls_flash_offer_claims.sql`
3. Paste and run

Expected output:
```
✓ Test 1 PASSED: flash_offer_claims is enabled for real-time
✓ Test 2 PASSED: RLS is enabled on flash_offer_claims
✓ Test 3 PASSED: Required RLS policies exist
✓ Test 4 PASSED: All required columns exist
✓ Test 5 PASSED: All required indexes exist
✓ Test 6 PASSED: updated_at trigger exists
✓ All tests passed! Real-time infrastructure is properly configured
```

### Using psql

```bash
psql $DATABASE_URL -f database/migrations/test_realtime_rls_flash_offer_claims.sql
```

## How Real-Time Subscriptions Work

Once this migration is applied, clients can subscribe to claim updates:

### Single Claim Subscription (Claim Detail Screen)

```typescript
const subscription = supabase
  .channel(`claim:${claimId}`)
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'flash_offer_claims',
      filter: `id=eq.${claimId}`
    },
    (payload) => {
      console.log('Claim updated:', payload.new);
      // Update UI with new claim status
    }
  )
  .subscribe();
```

### User Claims Subscription (My Claims Screen)

```typescript
const subscription = supabase
  .channel(`user_claims:${userId}`)
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'flash_offer_claims',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      console.log('User claim updated:', payload.new);
      // Update claims list in UI
    }
  )
  .subscribe();
```

## Security

Real-time subscriptions automatically respect existing RLS policies:

1. **Users can only subscribe to their own claims**
   - Enforced by "Users can view their own claims" policy
   - Users cannot receive updates for other users' claims

2. **Venue staff can subscribe to claims for their venue's offers**
   - Enforced by "Venue staff can view claims for their offers" policy
   - Venue staff can monitor redemptions in real-time

3. **Unauthorized subscriptions are rejected**
   - Supabase validates authentication tokens
   - RLS policies are checked before broadcasting updates

## Performance Considerations

- **Efficient Filtering**: Use `filter` parameter to subscribe only to relevant claims
- **Single Connection**: Supabase reuses WebSocket connections across multiple subscriptions
- **Automatic Cleanup**: Unsubscribe when components unmount to free resources

## Troubleshooting

### Issue: "Table not found in publication"

**Solution**: Verify the migration was applied successfully:
```sql
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'flash_offer_claims';
```

Should return 1 row.

### Issue: "Subscription not receiving updates"

**Possible causes**:
1. RLS policies blocking access - verify user has permission to view the claim
2. Filter syntax incorrect - check the filter matches the column name exactly
3. WebSocket connection failed - check network connectivity

**Debug**:
```typescript
subscription.on('error', (error) => {
  console.error('Subscription error:', error);
});
```

### Issue: "Updates delayed or not instant"

**Possible causes**:
1. Network latency - check connection quality
2. Database load - monitor Supabase dashboard for performance issues
3. Too many subscriptions - optimize by using broader filters

## Rollback

If you need to disable real-time for this table:

```sql
ALTER PUBLICATION supabase_realtime DROP TABLE flash_offer_claims;
```

**Note**: This will not affect the table structure or RLS policies, only real-time broadcasting.

## Related Files

- **Migration**: `supabase/migrations/20260126221934_enable_realtime_flash_offer_claims.sql`
- **Test Script**: `database/migrations/test_realtime_rls_flash_offer_claims.sql`
- **Original Schema**: `database/migrations/012_create_flash_offers_tables.sql`
- **RLS Policies**: `database/migrations/013_rls_flash_offers.sql`
- **Design Doc**: `.kiro/specs/real-time-claim-feedback/design.md`
- **Requirements**: `.kiro/specs/real-time-claim-feedback/requirements.md`

## Next Steps

After applying this migration:

1. ✅ Real-time infrastructure is ready
2. ⏭️ Implement SubscriptionManager class (Task 2)
3. ⏭️ Implement ReconnectionStrategy (Task 3)
4. ⏭️ Integrate into Claim Detail Screen (Task 7)
5. ⏭️ Integrate into My Claims Screen (Task 8)

See `.kiro/specs/real-time-claim-feedback/tasks.md` for the complete implementation plan.
