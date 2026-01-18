# Push Notifications Production Checklist

This checklist ensures push notifications work reliably for all users in production.

## ✅ Pre-Launch Checklist

### 1. Firebase Configuration

- [ ] **Firebase Project Created**
  - Project created in [Firebase Console](https://console.firebase.google.com/)
  - Cloud Messaging enabled

- [ ] **Android Configuration**
  - `google-services.json` downloaded from Firebase Console
  - File placed at: `android/app/google-services.json`
  - File committed to repository (or added to CI/CD secrets)
  - SHA-1 fingerprint added to Firebase (for release builds)

- [ ] **iOS Configuration** (if supporting iOS)
  - `GoogleService-Info.plist` downloaded from Firebase Console
  - File placed at: `ios/alphaCharlie722/GoogleService-Info.plist`
  - APNs key uploaded to Firebase Console
  - Bundle ID matches Firebase configuration

### 2. Supabase Edge Function

- [ ] **Edge Function Deployed**
  - `send-flash-offer-push` function deployed to production
  - Environment variables configured:
    - `FIREBASE_SERVICE_ACCOUNT` (Firebase Admin SDK credentials)
    - `SUPABASE_URL` (auto-provided)
    - `SUPABASE_SERVICE_ROLE_KEY` (auto-provided)
    - `SUPABASE_ANON_KEY` (auto-provided)

- [ ] **Edge Function Tested**
  - Test with dry-run mode: `{ "offerId": "...", "dryRun": true }`
  - Test with real offer
  - Verify targeting logic works
  - Check rate limiting works

### 3. Database Setup

- [ ] **Tables Created**
  - `device_tokens` table exists
  - `notification_preferences` table exists
  - `flash_offer_rate_limits` table exists
  - `push_notification_analytics` table exists

- [ ] **RLS Policies Configured**
  - Users can manage their own device tokens
  - Users can manage their own notification preferences
  - Edge Function can access all tables (service role key)

- [ ] **Indexes Created**
  - Index on `device_tokens(user_id, is_active)`
  - Index on `notification_preferences(user_id)`
  - Index on `flash_offer_rate_limits(venue_id, window_start)`

### 4. App Configuration

- [ ] **Permissions Configured**
  - Android: `POST_NOTIFICATIONS` permission in `AndroidManifest.xml` (Android 13+)
  - iOS: Notification capability enabled in Xcode

- [ ] **Error Handling Implemented**
  - FCM token generation failures don't block app usage
  - Users can retry token generation from settings
  - Clear error messages shown to users
  - Fallback behavior when push is unavailable

- [ ] **User Experience**
  - Permission request shown at appropriate time (not immediately on launch)
  - Users can enable/disable push notifications in settings
  - Push notification status visible in settings
  - Troubleshooting guidance provided

### 5. Testing

- [ ] **Device Testing**
  - Tested on Android physical device
  - Tested on Android emulator with Google Play Services
  - Tested on iOS physical device (if supporting iOS)
  - Tested with different Android versions (10, 11, 12, 13+)

- [ ] **Scenario Testing**
  - New user signup → receives token
  - User logs out → token deactivated
  - User logs in on multiple devices → all devices receive notifications
  - User disables notifications → no notifications sent
  - User enables notifications → notifications resume
  - Token refresh works correctly

- [ ] **Edge Cases**
  - No Google Play Services (Android)
  - No internet connection
  - Firebase quota exceeded
  - Database connection failure
  - Invalid FCM token
  - Expired FCM token

### 6. Monitoring & Analytics

- [ ] **Logging Configured**
  - FCM token generation logged
  - Token storage failures logged
  - Push notification sends logged
  - Delivery failures logged

- [ ] **Analytics Tracked**
  - Token registration rate
  - Push notification delivery rate
  - User engagement with notifications
  - Error rates by type

- [ ] **Alerts Configured**
  - Alert when FCM error rate > 10%
  - Alert when token registration rate drops
  - Alert when Edge Function fails
  - Alert when rate limits are hit frequently

## 🚀 Production Deployment Steps

### Step 1: Deploy Edge Function

```bash
cd supabase/functions
./deploy.sh send-flash-offer-push
```

### Step 2: Verify Environment Variables

```bash
# Check Edge Function secrets
supabase secrets list

# Ensure FIREBASE_SERVICE_ACCOUNT is set
supabase secrets set FIREBASE_SERVICE_ACCOUNT="$(cat path/to/service-account.json)"
```

### Step 3: Build Production App

```bash
# Android
cd android
./gradlew assembleRelease

# iOS (if supporting)
cd ios
xcodebuild -workspace alphaCharlie722.xcworkspace -scheme alphaCharlie722 -configuration Release
```

### Step 4: Test Production Build

- Install production build on test device
- Create new account
- Verify FCM token is generated
- Send test flash offer
- Verify notification is received

### Step 5: Monitor Initial Rollout

- Monitor Edge Function logs
- Check FCM delivery rates
- Watch for error spikes
- Verify database performance

## 🔧 Troubleshooting Guide

### Issue: Users Not Receiving Notifications

**Possible Causes:**
1. FCM token not generated
2. Token not stored in database
3. User disabled notifications in preferences
4. User in quiet hours
5. User beyond max distance
6. Firebase quota exceeded
7. Invalid Firebase configuration

**Debug Steps:**
1. Check device_tokens table for user's token
2. Check notification_preferences for user
3. Check Edge Function logs for errors
4. Verify Firebase project is active
5. Check FCM quota in Firebase Console

### Issue: FCM Token Generation Fails

**Possible Causes:**
1. No Google Play Services (Android)
2. No internet connection
3. Firebase config file missing
4. Incorrect Firebase configuration
5. App not signed correctly (release builds)

**Debug Steps:**
1. Check console logs for specific error
2. Verify google-services.json is in app bundle
3. Check Google Play Services is installed
4. Verify internet connectivity
5. Check Firebase project configuration

### Issue: Edge Function Timeout

**Possible Causes:**
1. Too many users targeted (>1000)
2. Database query slow
3. FCM batch send slow
4. Network latency

**Debug Steps:**
1. Check Edge Function execution time in logs
2. Optimize database queries (add indexes)
3. Reduce batch size if needed
4. Check Supabase database performance

## 📊 Production Metrics to Monitor

### Key Metrics

1. **Token Registration Rate**
   - Target: >95% of users have active tokens
   - Alert if: <90%

2. **Push Delivery Rate**
   - Target: >98% successful deliveries
   - Alert if: <95%

3. **FCM Error Rate**
   - Target: <2% errors
   - Alert if: >5%

4. **Edge Function Success Rate**
   - Target: >99% successful executions
   - Alert if: <98%

5. **User Engagement Rate**
   - Target: >30% of users tap notifications
   - Track: Click-through rate by notification type

### Monitoring Queries

```sql
-- Check token registration rate
SELECT 
  COUNT(DISTINCT p.id) as total_users,
  COUNT(DISTINCT dt.user_id) as users_with_tokens,
  ROUND(COUNT(DISTINCT dt.user_id)::numeric / COUNT(DISTINCT p.id) * 100, 2) as registration_rate
FROM profiles p
LEFT JOIN device_tokens dt ON dt.user_id = p.id AND dt.is_active = true;

-- Check push delivery rate (last 24 hours)
SELECT 
  SUM(targeted_count) as total_targeted,
  SUM(success_count) as total_delivered,
  SUM(failure_count) as total_failed,
  ROUND(SUM(success_count)::numeric / NULLIF(SUM(targeted_count), 0) * 100, 2) as delivery_rate
FROM push_notification_analytics
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Check FCM error rate by type
SELECT 
  error_type,
  COUNT(*) as error_count,
  ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM push_notification_analytics WHERE created_at > NOW() - INTERVAL '24 hours') * 100, 2) as error_percentage
FROM push_notification_analytics
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND failure_count > 0
GROUP BY error_type
ORDER BY error_count DESC;
```

## 🔐 Security Checklist

- [ ] Firebase service account key stored securely (not in code)
- [ ] Supabase service role key not exposed to client
- [ ] RLS policies prevent unauthorized access
- [ ] User data sanitized in logs
- [ ] FCM tokens encrypted in transit
- [ ] Rate limiting prevents abuse
- [ ] Input validation on all Edge Function inputs

## 📱 User Communication

### In-App Messaging

- [ ] Onboarding explains push notification benefits
- [ ] Permission request has clear explanation
- [ ] Settings show current notification status
- [ ] Troubleshooting help available in-app

### Support Documentation

- [ ] FAQ covers common push notification issues
- [ ] Help center has troubleshooting guide
- [ ] Contact support option available

## 🎯 Success Criteria

Before marking production-ready:

- [ ] 95%+ of test users successfully register tokens
- [ ] 98%+ push notification delivery rate
- [ ] <2% FCM error rate
- [ ] Edge Function executes in <5 seconds average
- [ ] No critical errors in 48-hour test period
- [ ] User feedback is positive
- [ ] Support tickets are minimal

## 📝 Post-Launch Tasks

### Week 1
- [ ] Monitor metrics daily
- [ ] Review error logs
- [ ] Collect user feedback
- [ ] Address any critical issues

### Week 2-4
- [ ] Analyze engagement metrics
- [ ] Optimize notification timing
- [ ] A/B test notification content
- [ ] Refine targeting logic

### Ongoing
- [ ] Monthly review of metrics
- [ ] Quarterly Firebase quota check
- [ ] Regular security audits
- [ ] Feature improvements based on feedback
