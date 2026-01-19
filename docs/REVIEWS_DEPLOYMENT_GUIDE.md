# Venue Reviews & Ratings System - Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the venue reviews and ratings system to production with a gradual rollout strategy.

## Deployment Strategy

We'll use a **phased rollout** approach:

1. **Phase 1**: Database migration (0% users)
2. **Phase 2**: Backend deployment (0% users, feature flag off)
3. **Phase 3**: Frontend deployment (0% users, feature flag off)
4. **Phase 4**: Internal testing (10% - internal users only)
5. **Phase 5**: Limited rollout (50% - selected users)
6. **Phase 6**: Full rollout (100% - all users)

## Prerequisites

### Required Access

- [ ] Production database admin credentials
- [ ] Supabase project admin access
- [ ] App deployment credentials (iOS/Android)
- [ ] Feature flag management access
- [ ] Monitoring dashboard access

### Required Backups

- [ ] Full database backup
- [ ] Current production app version
- [ ] Configuration backups
- [ ] Rollback scripts ready

### Testing Verification

- [ ] All tests passing in CI/CD
- [ ] Staging environment tested
- [ ] Performance benchmarks met
- [ ] Security audit completed

## Phase 1: Database Migration

### Timing

**Recommended**: Off-peak hours (2:00 AM - 4:00 AM local time)
**Duration**: 15-30 minutes

### Pre-Migration Checklist

- [ ] Database backup completed
- [ ] Migration script tested in staging
- [ ] Rollback script tested
- [ ] Team on standby
- [ ] Monitoring alerts configured

### Migration Steps

1. **Create Backup**

```bash
# Create timestamped backup
pg_dump -h <prod-host> -U <user> -d <prod-db> -F c -f backup_pre_reviews_$(date +%Y%m%d_%H%M%S).dump

# Verify backup
pg_restore --list backup_pre_reviews_*.dump | head -20
```

2. **Apply Migration**

```bash
# Connect to production database
psql -h <prod-host> -U <user> -d <prod-db>

# Run migration
\i database/migrations/apply-reviews-migration-production.sql

# Expected output:
# ✓ Created reviews table
# ✓ Created reviews indexes
# ✓ Created helpful_votes table
# ... (more success messages)
# ✓ Migration completed successfully!
```

3. **Verify Migration**

```bash
# Run verification script
\i database/migrations/verify_reviews_ratings_schema.sql

# Check tables exist
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('reviews', 'helpful_votes', 'venue_responses', 'review_reports');

# Verify venues table updated
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'venues' 
AND column_name IN ('aggregate_rating', 'review_count');
```

4. **Test Basic Operations**

```sql
-- Test review insertion
INSERT INTO public.reviews (venue_id, user_id, rating, review_text)
VALUES (
    (SELECT id FROM public.venues LIMIT 1),
    (SELECT id FROM auth.users LIMIT 1),
    5,
    'Test review for deployment verification'
);

-- Verify trigger updated venue
SELECT aggregate_rating, review_count 
FROM public.venues 
WHERE id = (SELECT venue_id FROM public.reviews ORDER BY created_at DESC LIMIT 1);

-- Clean up
DELETE FROM public.reviews WHERE review_text = 'Test review for deployment verification';
```

### Post-Migration Verification

- [ ] All tables created successfully
- [ ] All indexes created successfully
- [ ] All triggers working correctly
- [ ] RLS policies active
- [ ] No errors in database logs
- [ ] Trigger performance < 50ms

### Rollback (If Needed)

```bash
# If issues detected, rollback immediately
psql -h <prod-host> -U <user> -d <prod-db> -f database/migrations/rollback_reviews_migration.sql
```

## Phase 2: Backend Deployment

### Feature Flag Configuration

Before deploying, configure feature flags:

```typescript
// In your feature flag service
const REVIEW_FEATURE_FLAGS = {
  reviews_enabled: false,           // Master switch
  review_submission: false,         // Allow review submission
  review_display: false,            // Show reviews in UI
  helpful_votes: false,             // Enable helpful votes
  venue_responses: false,           // Enable venue owner responses
  review_notifications: false,      // Send review notifications
  rollout_percentage: 0,            // Percentage of users with access
};
```

### Deployment Steps

1. **Deploy Backend Code**

```bash
# Build backend
npm run build

# Run tests one final time
npm test

# Deploy to production
# (Your deployment process here - e.g., AWS, Heroku, etc.)
```

2. **Verify Backend Deployment**

```bash
# Test API endpoints (should return feature disabled)
curl -X POST https://api.yourapp.com/reviews \
  -H "Authorization: Bearer <token>" \
  -d '{"venueId": "...", "rating": 5}' \
  | jq

# Expected: {"error": "Feature not enabled"}
```

3. **Monitor Logs**

```bash
# Check for errors
tail -f /var/log/app/production.log | grep -i error

# Check for review-related logs
tail -f /var/log/app/production.log | grep -i review
```

### Verification

- [ ] Backend deployed successfully
- [ ] API endpoints responding
- [ ] Feature flags working correctly
- [ ] No errors in logs
- [ ] Database connections healthy

## Phase 3: Frontend Deployment

### Mobile App Deployment

1. **Build Apps**

```bash
# iOS
cd ios
pod install
xcodebuild -workspace alphaCharlie722.xcworkspace -scheme alphaCharlie722 -configuration Release

# Android
cd android
./gradlew assembleRelease
```

2. **Submit to App Stores**

**iOS (App Store Connect):**
- Upload build via Xcode or Transporter
- Submit for review
- Set release to manual (don't auto-release)

**Android (Google Play Console):**
- Upload APK/AAB to internal testing track
- Promote to production when ready
- Set staged rollout to 0% initially

3. **Verify App Builds**

- [ ] iOS build uploaded successfully
- [ ] Android build uploaded successfully
- [ ] Version numbers correct
- [ ] Release notes updated
- [ ] Screenshots updated (if needed)

### Verification

- [ ] Apps submitted to stores
- [ ] Builds approved (may take 1-3 days for iOS)
- [ ] Feature flags still disabled
- [ ] No crashes reported

## Phase 4: Internal Testing (10%)

### Enable for Internal Users

1. **Update Feature Flags**

```typescript
const REVIEW_FEATURE_FLAGS = {
  reviews_enabled: true,
  review_submission: true,
  review_display: true,
  helpful_votes: true,
  venue_responses: true,
  review_notifications: true,
  rollout_percentage: 10,           // 10% rollout
  user_whitelist: [                 // Internal team emails
    'team@yourcompany.com',
    'qa@yourcompany.com',
  ],
};
```

2. **Internal Testing Checklist**

- [ ] Submit a review
- [ ] Edit a review
- [ ] Delete a review
- [ ] Toggle helpful vote
- [ ] Submit venue owner response
- [ ] Report a review
- [ ] Verify notifications
- [ ] Test on iOS
- [ ] Test on Android
- [ ] Test content moderation
- [ ] Test rate limiting

3. **Monitor Metrics**

```sql
-- Review submission rate
SELECT COUNT(*) FROM reviews WHERE created_at > NOW() - INTERVAL '1 hour';

-- Trigger performance
SELECT * FROM trigger_performance_summary;

-- Error rate
SELECT COUNT(*) FROM error_logs WHERE created_at > NOW() - INTERVAL '1 hour';
```

### Success Criteria

- [ ] All features working correctly
- [ ] No critical bugs
- [ ] Performance within targets
- [ ] No database issues
- [ ] Team feedback positive

### Issues Found?

If issues are discovered:
1. Disable feature flags immediately
2. Fix issues in development
3. Redeploy and retest
4. Resume rollout when stable

## Phase 5: Limited Rollout (50%)

### Gradual Increase

**Day 1**: 10% → 25%
**Day 3**: 25% → 50%
**Day 7**: 50% → 75% (if no issues)

### Update Feature Flags

```typescript
const REVIEW_FEATURE_FLAGS = {
  reviews_enabled: true,
  review_submission: true,
  review_display: true,
  helpful_votes: true,
  venue_responses: true,
  review_notifications: true,
  rollout_percentage: 50,           // 50% rollout
};
```

### Monitoring Dashboard

Track these metrics hourly:

1. **Usage Metrics**
   - Review submissions per hour
   - Average reviews per user
   - Review text length distribution
   - Helpful votes per review

2. **Performance Metrics**
   - Review fetch time (target: < 300ms)
   - Review submission time (target: < 500ms)
   - Trigger execution time (target: < 50ms)
   - API response times

3. **Quality Metrics**
   - Content moderation trigger rate
   - Review report rate
   - Average review rating
   - Verified review percentage

4. **Error Metrics**
   - API error rate (target: < 1%)
   - Database error rate
   - Trigger failure rate
   - Client crash rate

### Alert Thresholds

Set up alerts for:
- Error rate > 5%
- API response time > 1s
- Trigger execution time > 100ms
- Review submission failure rate > 10%
- Database connection errors
- Crash rate increase > 2%

### User Feedback

Monitor support channels for:
- Bug reports
- Feature requests
- Confusion or usability issues
- Performance complaints

### Success Criteria

- [ ] Error rate < 1%
- [ ] Performance targets met
- [ ] No critical bugs
- [ ] Positive user feedback
- [ ] Database stable
- [ ] No rollback needed

## Phase 6: Full Rollout (100%)

### Final Rollout

**Timing**: After 7 days of successful 50% rollout

### Update Feature Flags

```typescript
const REVIEW_FEATURE_FLAGS = {
  reviews_enabled: true,
  review_submission: true,
  review_display: true,
  helpful_votes: true,
  venue_responses: true,
  review_notifications: true,
  rollout_percentage: 100,          // Full rollout
};
```

### Announcement

**To Users:**
```
🎉 New Feature: Venue Reviews!

Share your experiences and help others discover great venues. 
Leave a review after your next check-out!

• Rate venues 1-5 stars
• Add written feedback
• Mark helpful reviews
• See what others think

Start reviewing today!
```

**To Venue Owners:**
```
📊 New Feature: Customer Reviews

Your customers can now leave reviews! Use this feedback to:

• Improve your service
• Build trust with new customers
• Respond to feedback
• Track your reputation

Check your dashboard to see your reviews and respond to customers.
```

### Post-Launch Monitoring

**Week 1**: Monitor daily
- Review all metrics
- Respond to user feedback
- Fix any issues quickly
- Optimize performance

**Week 2-4**: Monitor every 2-3 days
- Track trends
- Analyze usage patterns
- Gather user feedback
- Plan improvements

**Month 2+**: Monitor weekly
- Review analytics
- Plan feature enhancements
- Optimize based on data

## Rollback Procedures

### Immediate Rollback (Critical Issues)

1. **Disable Feature Flags**

```typescript
const REVIEW_FEATURE_FLAGS = {
  reviews_enabled: false,           // Disable immediately
  review_submission: false,
  review_display: false,
  helpful_votes: false,
  venue_responses: false,
  review_notifications: false,
  rollout_percentage: 0,
};
```

2. **Rollback Database (If Needed)**

```bash
# Only if database corruption or critical data issues
psql -h <prod-host> -U <user> -d <prod-db> -f database/migrations/rollback_reviews_migration.sql
```

3. **Rollback App Version (If Needed)**

- Revert to previous app version in app stores
- Set staged rollout to 100% for old version

### Partial Rollback (Non-Critical Issues)

1. **Reduce Rollout Percentage**

```typescript
rollout_percentage: 10,  // Reduce to 10% while fixing
```

2. **Disable Specific Features**

```typescript
review_submission: false,  // Disable only problematic feature
```

3. **Fix and Redeploy**

- Fix issues in development
- Test thoroughly
- Redeploy
- Gradually increase rollout again

## Post-Deployment Checklist

### Day 1

- [ ] All phases completed successfully
- [ ] 100% rollout active
- [ ] No critical errors
- [ ] Performance targets met
- [ ] User feedback monitored
- [ ] Support team briefed

### Week 1

- [ ] Daily metrics reviewed
- [ ] User feedback analyzed
- [ ] Performance optimized
- [ ] Minor bugs fixed
- [ ] Documentation updated

### Month 1

- [ ] Usage analytics reviewed
- [ ] Feature adoption measured
- [ ] User satisfaction surveyed
- [ ] Venue owner feedback gathered
- [ ] Improvement roadmap created

## Success Metrics

### Technical Success

- ✅ Zero downtime deployment
- ✅ Error rate < 1%
- ✅ Performance targets met
- ✅ No data loss or corruption
- ✅ Successful rollback capability

### Business Success

- ✅ 50%+ users submit at least one review (Month 1)
- ✅ 80%+ venues have at least one review (Month 3)
- ✅ Average rating 4.0+ across platform
- ✅ 70%+ venue owners respond to reviews
- ✅ Positive user feedback (4.5+ app rating maintained)

### User Success

- ✅ Easy to submit reviews
- ✅ Helpful for decision-making
- ✅ Trustworthy and authentic
- ✅ Responsive venue owners
- ✅ Positive community culture

## Support Resources

### Documentation

- [API Reference](docs/api-reference.md)
- [Error Codes](docs/review-api-error-codes.md)
- [User Guide](docs/user-guides/how-to-write-a-review.md)
- [Venue Owner Guide](docs/user-guides/venue-owner-review-guide.md)
- [Community Guidelines](docs/user-guides/community-guidelines.md)

### Technical Resources

- [Database Migration Guide](database/migrations/PRODUCTION_MIGRATION_GUIDE.md)
- [Index Strategy](database/REVIEW_INDEX_STRATEGY.md)
- [Trigger Performance](database/TRIGGER_PERFORMANCE_MONITORING.md)
- [Design Document](.kiro/specs/venue-reviews-ratings/design.md)
- [Requirements](.kiro/specs/venue-reviews-ratings/requirements.md)

### Contact Information

**Deployment Team:**
- Lead: [Name] - [Email] - [Phone]
- Database Admin: [Name] - [Email] - [Phone]
- Backend Lead: [Name] - [Email] - [Phone]
- Mobile Lead: [Name] - [Email] - [Phone]

**On-Call:**
- Primary: [Name] - [Phone]
- Secondary: [Name] - [Phone]
- Escalation: [Name] - [Phone]

**Support:**
- User Support: support@otw.com
- Business Support: business-support@otw.com
- Technical Support: tech-support@otw.com

## Lessons Learned

After deployment, document:
- What went well
- What could be improved
- Unexpected issues
- Performance insights
- User feedback themes
- Recommendations for future deployments

---

**Deployment Date**: _____________
**Completed By**: _____________
**Status**: _____________

---

**Good luck with your deployment!** 🚀
