# Push Notification Tier Structure

## Subscription Tiers

### 🆓 Free — $0/month
**"Basic Venue Presence"**

**Includes:**
- Venue profile
- Live activity indicator
- Public visibility
- **No push notification access**

**Target:** Venues testing the platform or not ready for paid marketing

---

### 🟢 Core — "Get Walk-Ins" — $79/month
**"Essential Marketing Tools"**

**Includes:**
- **20 push notifications per month**
- Notify favorited users
- Geo-targeted notifications (≤ 1 mile)
- Basic analytics (delivery rate, open rate)

**Why $79?**
- Below psychological $100 barrier
- Above "cheap tool" range
- Easy ROI justification (4-5 customers = break even)

**Target:** Small venues wanting to drive consistent foot traffic

---

### 🔵 Pro — "Predictable Demand" — $179/month
**"Professional Marketing Suite"**

**Includes:**
- **60 push notifications per month**
- Flash Offers™ feature
- Time + capacity triggers
- Expanded geo-targeting (up to 5 miles)
- Conversion analytics (check-in attribution)

**Positioning:**
- "This runs our promotions"
- For venues with regular promotional cadence
- Advanced targeting and analytics

**Target:** Established venues with active marketing strategies

---

### 🟣 Revenue+ — "Recover Lost Money" — $299/month
**"Revenue Recovery System"**

**Includes:**
- **Unlimited standard pushes** (fair use policy)
- Flash Offers priority delivery
- Automation rules (capacity-based, time-based)
- Advanced targeting (behavioral, demographic)
- Revenue attribution tracking
- Priority support

**Positioning:**
- "OTW is a revenue system, not software"
- Premium, unapologetic pricing
- For venues treating OTW as core revenue infrastructure

**Target:** High-volume venues maximizing revenue recovery

---

## Push Credit Add-Ons

For venues needing extra notifications beyond their tier limits:

| Pack Size | Price | Cost per Push |
|-----------|-------|---------------|
| 3 Pushes  | $25   | $8.33         |
| 10 Pushes | $120  | $12.00        |
| 25 Pushes | $299  | $11.96        |

**Pricing Strategy:**
- Push credits are intentionally more expensive than subscriptions
- Encourages upgrading to higher tiers vs. buying credits
- Credits never cheaper than subscription value

**Example:**
- Core tier: $79/month ÷ 20 pushes = $3.95 per push
- Credit pack: $25 ÷ 3 pushes = $8.33 per push
- **Credits cost 2.1x more** → incentivizes subscription upgrade

---

## Future Options (TBD)

### Boost Your Venue
- Pay-as-you-go option for occasional users
- Pricing TBD (likely $15-20 per push)
- For venues not ready for monthly commitment

---

## Implementation Notes

### Database Schema
```sql
-- Subscription tiers stored in venues table
subscription_tier VARCHAR(20) CHECK (tier IN ('free', 'core', 'pro', 'revenue_plus'))

-- Monthly quota tracking
CREATE TABLE push_notification_credits (
  venue_id UUID,
  month DATE, -- First day of month
  monthly_limit INTEGER, -- 0 for free, 20 for core, 60 for pro, -1 for unlimited
  used_count INTEGER DEFAULT 0,
  UNIQUE(venue_id, month)
);
```

### Quota Enforcement Logic
```typescript
function canSendPush(venue: Venue): boolean {
  if (venue.tier === 'free') return false;
  if (venue.tier === 'revenue_plus') return true; // Unlimited (fair use)
  
  const quota = getMonthlyQuota(venue.id);
  return quota.used_count < quota.monthly_limit;
}

function getMonthlyLimit(tier: string): number {
  switch(tier) {
    case 'free': return 0;
    case 'core': return 20;
    case 'pro': return 60;
    case 'revenue_plus': return -1; // Unlimited
  }
}
```

### Fair Use Policy (Revenue+)
- "Unlimited" means reasonable business use
- System monitors for abuse patterns:
  - More than 500 pushes/month → review
  - Spam complaints → review
  - Excessive failed deliveries → review
- Automated alerts for admin review

---

## Upgrade Paths

### Free → Core ($79)
**Trigger:** Venue wants to send first push notification
**Value Prop:** "Start driving walk-ins today"

### Core → Pro ($100 more)
**Trigger:** Hitting 20 push limit consistently
**Value Prop:** "3x more pushes + Flash Offers + better targeting"

### Pro → Revenue+ ($120 more)
**Trigger:** Hitting 60 push limit or wanting automation
**Value Prop:** "Unlimited pushes + automation + priority support"

---

## Analytics to Track

### Per Tier
- Average pushes sent per month
- Upgrade rate to next tier
- Churn rate
- Revenue per venue

### Push Credits
- Purchase frequency
- Average pack size
- Conversion to subscription upgrade

### Success Metrics
- Core tier: 15-20 pushes/month average (hitting limit)
- Pro tier: 45-60 pushes/month average (hitting limit)
- Revenue+: 100+ pushes/month average (using unlimited)
