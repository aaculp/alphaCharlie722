# Tier Structure Update Summary

## Changes Made

Updated the venue promotional push notification spec to reflect the new subscription tier structure and pricing.

---

## What Changed

### 1. Subscription Tiers ✅

**Old Structure:**
- Free: 5 pushes/day
- Core: 20 pushes/day
- Pro: 60 pushes/day
- Revenue+: Unlimited

**New Structure:**
- **Free ($0)**: No push access
- **Core ($79/month)**: 20 pushes/month
- **Pro ($179/month)**: 60 pushes/month
- **Revenue+ ($299/month)**: Unlimited (fair use)

### 2. Quota Tracking ✅

**Changed from:**
- Daily quotas (reset at midnight)
- Tracked per day

**Changed to:**
- Monthly quotas (reset on 1st of month)
- Tracked per month

### 3. Push Credits ✅

**Added pricing structure:**
- 3 pushes: $25 ($8.33 per push)
- 10 pushes: $120 ($12.00 per push)
- 25 pushes: $299 ($11.96 per push)

**Strategy:** Credits intentionally more expensive than subscriptions to encourage tier upgrades

---

## Files Updated

### requirements.md ✅
- **Requirement 12**: Updated rate limiting to reflect new tier structure
  - Free tier: No push access
  - Core: 20/month
  - Pro: 60/month
  - Revenue+: Unlimited with fair use
- Changed from daily to monthly quota tracking
- Updated glossary to include push credit pricing

### design.md ✅
- **Overview**: Added tier-based access summary
- **Property 55**: Updated to reflect Free tier has no access
- **Property 56**: Updated tier limits (Free: no access, Core: 20/month, Pro: 60/month, Revenue+: unlimited)
- **Property 58**: Changed from "Daily Quota Reset" to monthly reset
- **Database Schema**: Updated `push_notification_credits` table
  - Changed `date` to `month` (first day of month)
  - Changed `daily_limit` to `monthly_limit`
  - Updated index name

### tasks.md ✅
- **Task 14.1**: Updated to implement monthly quota system
  - Changed from daily to monthly tracking
  - Updated tier limits
- **Task 14.2**: Added Free tier blocking logic
- **Task 14.4**: Updated property test references

### New Files Created ✅

**TIER_STRUCTURE.md**
- Complete tier breakdown with pricing
- Feature comparison
- Push credit pricing strategy
- Implementation notes
- Database schema examples
- Fair use policy details
- Upgrade path recommendations
- Analytics to track

**TIER_UPDATE_SUMMARY.md** (this file)
- Summary of all changes made

---

## Key Implementation Changes

### Database Schema
```sql
-- OLD
CREATE TABLE push_notification_credits (
  venue_id UUID,
  date DATE NOT NULL,
  daily_limit INTEGER NOT NULL,
  ...
);

-- NEW
CREATE TABLE push_notification_credits (
  venue_id UUID,
  month DATE NOT NULL, -- First day of month
  monthly_limit INTEGER NOT NULL,
  ...
);
```

### Quota Logic
```typescript
// OLD: Check daily quota
function canSendPush(venue: Venue): boolean {
  const today = new Date().toDateString();
  const quota = getDailyQuota(venue.id, today);
  return quota.used_count < quota.daily_limit;
}

// NEW: Check monthly quota
function canSendPush(venue: Venue): boolean {
  if (venue.tier === 'free') return false; // Block Free tier
  if (venue.tier === 'revenue_plus') return true; // Unlimited
  
  const month = getFirstDayOfMonth();
  const quota = getMonthlyQuota(venue.id, month);
  return quota.used_count < quota.monthly_limit;
}
```

---

## Business Logic Changes

### Free Tier
- **Before**: 5 pushes per day
- **After**: No push notification access at all
- **Reason**: Push notifications are now a premium feature starting at $79/month

### Quota Reset
- **Before**: Daily at midnight
- **After**: Monthly on the 1st
- **Reason**: Aligns with subscription billing cycle

### Fair Use Policy (Revenue+)
- Unlimited doesn't mean infinite
- System monitors for abuse:
  - >500 pushes/month triggers review
  - Spam complaints trigger review
  - Excessive failures trigger review

---

## Migration Notes

### For Existing Venues

**Free Tier Venues:**
- Lose push notification access
- Prompt to upgrade to Core ($79) to regain access
- Show upgrade CTA in dashboard

**Paid Tier Venues:**
- Quota converts from daily to monthly
- Core: 5/day × 30 days = 150/month → **reduced to 20/month**
- Pro: 20/day × 30 days = 600/month → **reduced to 60/month**
- Revenue+: Unlimited remains unlimited

**Data Migration:**
```sql
-- Convert existing daily quotas to monthly
-- This is a one-time migration script
UPDATE push_notification_credits
SET 
  month = DATE_TRUNC('month', date),
  monthly_limit = CASE 
    WHEN daily_limit = 5 THEN 0  -- Free tier loses access
    WHEN daily_limit = 20 THEN 20  -- Core gets 20/month
    WHEN daily_limit = 60 THEN 60  -- Pro gets 60/month
    ELSE -1  -- Revenue+ unlimited
  END;
```

---

## Testing Checklist

- [ ] Free tier venues cannot access push notification UI
- [ ] Core tier venues limited to 20 pushes/month
- [ ] Pro tier venues limited to 60 pushes/month
- [ ] Revenue+ tier venues have unlimited access
- [ ] Quota resets on 1st of each month
- [ ] Quota exceeded shows appropriate error message
- [ ] Dashboard displays remaining monthly quota
- [ ] Push credit purchases add to quota correctly
- [ ] Fair use monitoring alerts for Revenue+ abuse

---

## Documentation Updates Needed

### User-Facing
- [ ] Update pricing page with new tier structure
- [ ] Update venue dashboard to show monthly quotas
- [ ] Add upgrade prompts for Free tier venues
- [ ] Update help docs with new limits

### Internal
- [ ] Update admin panel to show monthly quotas
- [ ] Add fair use monitoring dashboard
- [ ] Update billing system for new tiers
- [ ] Add push credit purchase flow

---

## Rollout Strategy

### Phase 1: Backend Updates
1. Update database schema (add monthly tracking)
2. Update quota enforcement logic
3. Deploy to staging
4. Test all tier scenarios

### Phase 2: Frontend Updates
1. Update venue dashboard UI
2. Add Free tier blocking
3. Update quota displays (daily → monthly)
4. Add upgrade CTAs

### Phase 3: Migration
1. Migrate existing venues to new structure
2. Send communication about changes
3. Offer grace period for adjustment
4. Monitor for issues

### Phase 4: Monitoring
1. Track quota usage patterns
2. Monitor upgrade rates
3. Watch for fair use violations
4. Gather feedback

---

## Success Metrics

### Adoption
- % of Core tier venues using 15-20 pushes/month
- % of Pro tier venues using 45-60 pushes/month
- % of Revenue+ venues using >100 pushes/month

### Revenue
- Average revenue per venue (ARPV)
- Upgrade rate from Core → Pro
- Upgrade rate from Pro → Revenue+
- Push credit purchase frequency

### Engagement
- Push notification delivery rate
- Push notification open rate
- Check-in conversion rate
- Venue satisfaction scores
