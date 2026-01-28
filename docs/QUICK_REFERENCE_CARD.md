# Profile Metrics - Quick Reference Card

## 📊 All 12 Metrics at a Glance

| # | Metric | Icon | Color | Always Visible? | Condition | Database Source |
|---|--------|------|-------|-----------------|-----------|-----------------|
| 1 | Check-ins | 📍 | 🔵 Blue | ✅ Yes | - | `check_ins` count |
| 2 | Venues | 🏢 | 🟢 Green | ✅ Yes | - | Unique `venue_id` in `check_ins` |
| 3 | This Month | 📅 | 🟡 Yellow | ✅ Yes | - | `check_ins` where date >= start of month |
| 4 | Favorites | ❤️ | ❤️ Red | ✅ Yes | - | `favorites` count |
| 5 | Offers Redeemed | ⚡ | 🟠 Amber | ❌ No | Count > 0 | `flash_offer_claims` where `status = 'redeemed'` |
| 6 | Avg Rating | ⭐ | 🟣 Purple | ❌ No | Count > 0 | AVG(`rating`) from `reviews` |
| 7 | Helpful Votes | 👍 | 🔷 Cyan | ❌ No | Count > 0 | `helpful_votes` joined with user's `reviews` |
| 8 | Current Streak | 🔥 | 🔴 Red | ❌ No | Streak > 0 | Calculated from `check_ins.checked_in_at` |
| 9 | Longest Streak | 🏆 | 🟠 Amber | ❌ No | Streak > 0 | Calculated from `check_ins.checked_in_at` |
| 10 | Top Venue | 🎗️ | 🟢 Green | ❌ No | Has check-ins | Most frequent `venue_id` in `check_ins` |
| 11 | Most Active Day | 📅 | 🔵 Indigo | ❌ No | Has check-ins | Day of week analysis from `check_ins` |
| 12 | Favorite Time | ⏰ | 🟣 Pink | ❌ No | Has check-ins | Time of day analysis from `check_ins` |

## 🎨 Color Palette

```
Core Stats (Theme Colors):
🔵 Primary Blue    - Check-ins, Most Active Day
🟢 Success Green   - Venues, Top Venue  
🟡 Warning Yellow  - This Month
❤️ Error Red       - Favorites

Engagement Stats (Custom Colors):
🟠 Amber #F59E0B   - Offers, Longest Streak
🟣 Purple #8B5CF6  - Avg Rating
🔷 Cyan #06B6D4    - Helpful Votes

Achievement Stats (Warm Colors):
🔴 Red #EF4444     - Current Streak
🟠 Amber #F59E0B   - Longest Streak
🟢 Green #10B981   - Top Venue

Pattern Stats (Cool Colors):
🔵 Indigo #6366F1  - Most Active Day
🟣 Pink #EC4899    - Favorite Time
```

## 🔄 Conditional Rendering Logic

```typescript
// Core Stats - Always Visible
<StatCard value={checkInsCount || 0} />

// Conditional Stats - Only When > 0
{(redeemedOffersCount ?? 0) > 0 && (
  <StatCard value={redeemedOffersCount} />
)}

// Conditional Stats - Only When Exists
{topVenue && (
  <StatCard value={topVenue.visitCount} />
)}
```

## 📈 User Journey

| Stage | Cards Visible | User Activity |
|-------|---------------|---------------|
| **New User** | 4 | Just signed up |
| **First Check-in** | 6 | Checked in once |
| **Week 1** | 8 | Building streak, patterns emerging |
| **Week 2** | 10 | Wrote first review |
| **Month 1** | 12 | Fully engaged (all features used) |

## 🎯 Gamification Triggers

| Metric | Psychological Trigger | User Behavior |
|--------|----------------------|---------------|
| Current Streak | Fear of loss | Check in daily to maintain |
| Longest Streak | Achievement | Try to beat personal record |
| Top Venue | Loyalty | Visit favorite place more |
| Helpful Votes | Social validation | Write more reviews |
| Offers Redeemed | Savings | Claim more offers |
| Avg Rating | Quality | Maintain high standards |

## 💡 Quick Tips

### For Developers
- All new fields in `UserProfile` are optional
- All queries have error handling
- Failed queries don't break UI
- Calculations done in-memory
- No database migrations needed

### For Designers
- Each color has semantic meaning
- Icons + colors = accessibility
- Subtitles provide context
- 2-column grid layout
- Responsive on all devices

### For QA
- Test with 0 data (new user)
- Test with partial data
- Test with full data
- Test streak calculations
- Test time zone handling

### For Product
- Metrics encourage engagement
- Progressive disclosure pattern
- Gamification elements
- Social proof (helpful votes)
- Personalized insights

## 🔍 Testing Checklist

- [ ] New user sees 4 cards only
- [ ] First check-in adds 2 cards
- [ ] First review adds rating card
- [ ] First helpful vote adds votes card
- [ ] Streak cards appear/disappear correctly
- [ ] Top venue shows correct name
- [ ] Colors are correct
- [ ] Dark mode works
- [ ] Performance is good

## 📱 Device Support

| Device | Layout | Performance |
|--------|--------|-------------|
| iPhone SE | 2 columns | < 2s load |
| iPhone Pro | 2 columns | < 2s load |
| iPhone Pro Max | 2 columns | < 2s load |
| iPad | 2 columns (centered) | < 2s load |
| Android Small | 2 columns | < 2s load |
| Android Large | 2 columns | < 2s load |

## 🚀 Performance Targets

| User Type | Check-ins | Target Load Time |
|-----------|-----------|------------------|
| New | 0 | < 1 second |
| Light | 1-50 | < 2 seconds |
| Active | 51-500 | < 3 seconds |
| Power | 500+ | < 5 seconds |

## 📊 Success Metrics

### Technical
- Error rate < 1%
- Load time < 5s (p95)
- No crashes
- No memory leaks

### User
- Profile views +20%
- Time on profile +30%
- Check-in frequency +15%
- Review submissions +25%

### Business
- User retention +10%
- DAU/MAU ratio +5%
- Feature adoption +40%
- User satisfaction +15%

## 🎓 Key Concepts

**Conditional Rendering:**
```
if (hasData) {
  show card
} else {
  hide card
}
```

**Color-Coding:**
```
Each metric = Unique color
Color = Quick identification
Color = Semantic meaning
```

**Progressive Disclosure:**
```
Day 1:  Simple (4 cards)
Week 1: Growing (6-8 cards)
Month 1: Rich (10-12 cards)
```

**Gamification:**
```
Action → Reward → Motivation → Repeat
```

## 📞 Quick Links

- **Full Docs:** `docs/PROFILE_PERSONALIZATION.md`
- **Testing Guide:** `docs/PROFILE_TESTING_GUIDE.md`
- **Visual Reference:** `docs/PROFILE_VISUAL_REFERENCE.md`
- **Conditional Rendering:** `docs/CONDITIONAL_RENDERING_EXPLAINED.md`
- **Progression Visual:** `docs/PROFILE_PROGRESSION_VISUAL.md`

## 🎉 Summary

**12 metrics** that tell your story
**Smart rendering** that grows with you
**Color-coded** for quick scanning
**Gamified** to keep you engaged
**Personalized** to your patterns

Your profile is your journey! 🚀
