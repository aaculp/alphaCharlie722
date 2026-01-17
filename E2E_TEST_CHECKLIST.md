# Flash Offer Push Notifications - E2E Test Checklist

**Test Date**: _______________  
**Tester**: _______________  
**Environment**: ☐ Staging  ☐ Production  
**Build Version**: _______________

---

## Pre-Test Setup

### Environment Verification
- [ ] Supabase Edge Function deployed and accessible
- [ ] Firebase project configured correctly
- [ ] Database schema includes `notification_preferences` table
- [ ] Database schema includes `flash_offer_rate_limits` table
- [ ] RLS policies updated on `device_tokens` table
- [ ] Supabase secrets configured (FIREBASE_SERVICE_ACCOUNT, SUPABASE_SERVICE_ROLE_KEY)

### Test Devices
- [ ] Device 1 (Venue Owner): _________________ (Model/OS)
- [ ] Device 2 (Customer 1): _________________ (Model/OS)
- [ ] Device 3 (Customer 2): _________________ (Model/OS)
- [ ] All devices have app installed
- [ ] All devices have notification permissions enabled
- [ ] All devices have location permissions enabled

### Test Accounts Created
- [ ] Venue Owner Account: _________________ (Email)
  - User ID: _________________
  - Venue ID: _________________
  
- [ ] Customer 1 (Default Preferences): _________________ (Email)
  - User ID: _________________
  - Preferences: All enabled
  
- [ ] Customer 2 (Notifications Disabled): _________________ (Email)
  - User ID: _________________
  - Preferences: flash_offers_enabled = false
  
- [ ] Customer 3 (Quiet Hours): _________________ (Email)
  - User ID: _________________
  - Quiet Hours: _______ to _______
  
- [ ] Customer 4 (Distance Limit): _________________ (Email)
  - User ID: _________________
  - Max Distance: _______ miles

---

## Test Scenarios

### Scenario 1: Happy Path ✓
**Objective**: Verify basic notification delivery works

- [ ] Log in as venue owner
- [ ] Create flash offer with push enabled
  - Offer ID: _________________
- [ ] Offer created successfully
- [ ] Customer 1 receives notification within 10 seconds
- [ ] Notification appears in device notification tray
- [ ] Tapping notification opens app to offer detail
- [ ] Offer marked as `push_sent = true` in database
- [ ] Analytics recorded with correct counts
- [ ] Edge Function logs show successful execution

**Notes**: _________________________________________________________________

---

### Scenario 2: Preference Filtering - Disabled Notifications ✓
**Objective**: Verify users with disabled notifications are excluded

- [ ] Verify Customer 2 has `flash_offers_enabled = false`
- [ ] Create flash offer targeting all users
  - Offer ID: _________________
- [ ] Customer 1 receives notification
- [ ] Customer 2 does NOT receive notification
- [ ] Edge Function logs show user excluded
- [ ] Targeted count excludes Customer 2

**Notes**: _________________________________________________________________

---

### Scenario 3: Quiet Hours Filtering ✓
**Objective**: Verify quiet hours are respected

- [ ] Verify Customer 3 is currently in quiet hours
- [ ] Create flash offer targeting all users
  - Offer ID: _________________
- [ ] Customer 1 receives notification
- [ ] Customer 3 does NOT receive notification
- [ ] Edge Function logs show quiet hours exclusion
- [ ] Targeted count excludes Customer 3

**Notes**: _________________________________________________________________

---

### Scenario 4: Distance Filtering ✓
**Objective**: Verify distance limits are enforced

- [ ] Verify Customer 4 is beyond their max distance from venue
- [ ] Create flash offer targeting all users
  - Offer ID: _________________
- [ ] Customer 1 receives notification (within range)
- [ ] Customer 4 does NOT receive notification (beyond limit)
- [ ] Edge Function logs show distance exclusion
- [ ] Targeted count excludes Customer 4

**Notes**: _________________________________________________________________

---

### Scenario 5: Venue Rate Limiting ✓
**Objective**: Verify venue daily limits are enforced

- [ ] Check venue's subscription tier: _________________
- [ ] Expected daily limit: _______ offers
- [ ] Create offers until limit reached:
  - Offer 1: _________________ ✓
  - Offer 2: _________________ ✓
  - Offer 3: _________________ ✓
  - Offer 4: _________________ ✓
  - Offer 5: _________________ ✓
- [ ] Attempt to create one more offer
- [ ] Request rejected with rate limit error (429)
- [ ] Error message shows "Daily offer limit reached"
- [ ] Error message shows when venue can send next
- [ ] Rate limit counter in database shows correct count

**Notes**: _________________________________________________________________

---

### Scenario 6: User Rate Limiting ✓
**Objective**: Verify users don't receive too many notifications

- [ ] Send 10 flash offers to Customer 1 (from different venues if possible)
- [ ] Verify Customer 1 received all 10 notifications
- [ ] Attempt to send 11th notification
- [ ] Customer 1 excluded from 11th notification
- [ ] Other customers still receive 11th notification
- [ ] User rate limit counter shows count = 10

**Notes**: _________________________________________________________________

---

### Scenario 7: Idempotency ✓
**Objective**: Verify duplicate requests don't send twice

- [ ] Create flash offer with push enabled
  - Offer ID: _________________
- [ ] Customer 1 receives notification
- [ ] Manually call Edge Function again with same offer ID
- [ ] Second call returns success
- [ ] Edge Function logs show "push already sent"
- [ ] Customer 1 does NOT receive duplicate notification
- [ ] Offer still shows `push_sent = true`

**Notes**: _________________________________________________________________

---

### Scenario 8: Invalid Device Tokens ✓
**Objective**: Verify invalid tokens are handled correctly

- [ ] Insert invalid token in database: _________________
- [ ] Create flash offer targeting user with invalid token
  - Offer ID: _________________
- [ ] Edge Function attempts to send to invalid token
- [ ] Token marked as `is_active = false` in database
- [ ] Other valid tokens still receive notifications
- [ ] Edge Function logs show token deactivation
- [ ] Analytics show failure count for invalid token

**Notes**: _________________________________________________________________

---

### Scenario 9: Error Handling - Offer Not Found ✓
**Objective**: Verify proper error for invalid offer ID

- [ ] Call Edge Function with non-existent offer ID
- [ ] Response status code: 404
- [ ] Error code: "OFFER_NOT_FOUND"
- [ ] Error message is descriptive
- [ ] No notifications sent

**Notes**: _________________________________________________________________

---

### Scenario 10: Error Handling - Missing JWT ✓
**Objective**: Verify authentication is required

- [ ] Call Edge Function without Authorization header
- [ ] Response status code: 401
- [ ] Error code: "UNAUTHORIZED"
- [ ] Error message is descriptive
- [ ] No notifications sent

**Notes**: _________________________________________________________________

---

### Scenario 11: Dry Run Mode ✓
**Objective**: Verify dry run validates without sending

- [ ] Create flash offer
  - Offer ID: _________________
- [ ] Call Edge Function with `dryRun: true`
- [ ] Response shows success
- [ ] Response shows targeted user count
- [ ] Response shows what would be sent
- [ ] NO actual notifications sent to devices
- [ ] Offer remains `push_sent = false`

**Notes**: _________________________________________________________________

---

### Scenario 12: Analytics Tracking ✓
**Objective**: Verify all analytics are tracked

- [ ] Create flash offer with 5+ targeted users
  - Offer ID: _________________
- [ ] Verify `push_sent` event recorded in analytics table
- [ ] Recipient count matches targeted users
- [ ] Success count is accurate
- [ ] Failure count is accurate (if any)
- [ ] Timestamp is correct
- [ ] Venue dashboard shows metrics correctly

**Notes**: _________________________________________________________________

---

## Performance Tests

### Test 1: Large User Base (1000+ users) ✓
- [ ] Create 1000+ test customer accounts (or use existing)
- [ ] Create flash offer targeting all users
  - Offer ID: _________________
- [ ] Edge Function completes within 10 seconds
- [ ] All users receive notifications
- [ ] No timeout errors
- [ ] Logs show proper batching (500 per batch)
- [ ] Execution time: _______ seconds

**Notes**: _________________________________________________________________

---

### Test 2: Concurrent Offers ✓
- [ ] Create 5 flash offers simultaneously from different venues
- [ ] All offers processed successfully
- [ ] No race conditions observed
- [ ] Rate limits tracked correctly per venue
- [ ] No database deadlocks
- [ ] All notifications delivered

**Notes**: _________________________________________________________________

---

## Security Tests

### Test 1: RLS Policy Enforcement ✓
- [ ] Log in as Customer 1
- [ ] Attempt to query other users' device tokens via SQL
- [ ] Query fails or returns empty result
- [ ] User can only see their own tokens
- [ ] RLS policy working correctly

**Notes**: _________________________________________________________________

---

### Test 2: Credential Exposure ✓
- [ ] Create flash offer
- [ ] Check Edge Function response body
- [ ] Check Edge Function logs
- [ ] No Firebase credentials in response
- [ ] No Supabase service role key in response
- [ ] No credentials in logs
- [ ] Only sanitized data exposed

**Notes**: _________________________________________________________________

---

## Edge Cases

### Edge Case 1: User Disables Notifications Mid-Flight ✓
- [ ] Create flash offer
- [ ] User disables notifications before Edge Function runs
- [ ] User correctly excluded from targeting
- [ ] No notification sent to that user

**Notes**: _________________________________________________________________

---

### Edge Case 2: Offer Expires Before Push Sent ✓
- [ ] Create flash offer with very short expiration (1 minute)
- [ ] Wait for expiration
- [ ] Attempt to send push
- [ ] System handles gracefully (verify expected behavior)

**Notes**: _________________________________________________________________

---

### Edge Case 3: Venue Deleted Mid-Flight ✓
- [ ] Create flash offer
- [ ] Delete venue before push sent
- [ ] System handles gracefully (verify expected behavior)

**Notes**: _________________________________________________________________

---

## Regression Tests

### Regression 1: Existing Notification Flow ✓
- [ ] Friend request notifications still work
- [ ] Check-in notifications still work
- [ ] Other notification types unaffected

**Notes**: _________________________________________________________________

---

### Regression 2: Offer Creation Without Push ✓
- [ ] Create flash offer with push disabled
- [ ] Offer created successfully
- [ ] No Edge Function called
- [ ] No notifications sent
- [ ] Offer shows `push_sent = false`

**Notes**: _________________________________________________________________

---

## Final Verification

### Database State
- [ ] All test offers marked correctly
- [ ] Analytics data is accurate
- [ ] Rate limits are correct
- [ ] No orphaned data
- [ ] No data corruption

### Logs Review
- [ ] Edge Function logs reviewed
- [ ] No unexpected errors
- [ ] All success cases logged correctly
- [ ] All error cases logged correctly
- [ ] Performance metrics acceptable

### User Experience
- [ ] Notifications appear quickly (<10 seconds)
- [ ] Notification content is correct
- [ ] Tapping notification works correctly
- [ ] UI shows correct status
- [ ] Error messages are user-friendly

---

## Test Summary

**Total Scenarios**: 12 core + 2 performance + 2 security + 3 edge cases + 2 regression = 21

**Passed**: _______ / 21  
**Failed**: _______ / 21  
**Blocked**: _______ / 21  

### Critical Issues Found
1. _________________________________________________________________
2. _________________________________________________________________
3. _________________________________________________________________

### Non-Critical Issues Found
1. _________________________________________________________________
2. _________________________________________________________________
3. _________________________________________________________________

### Recommendations
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

## Sign-Off

**Ready for Production**: ☐ Yes  ☐ No  ☐ With Conditions

**Conditions (if applicable)**:
_________________________________________________________________
_________________________________________________________________

**Tester Signature**: _________________  **Date**: _________________

**Approver Signature**: _________________  **Date**: _________________

---

## Cleanup Performed

- [ ] Test offers deleted
- [ ] Test rate limits cleared
- [ ] Test analytics removed
- [ ] Test user preferences reset
- [ ] Test accounts documented for future use

**Cleanup Date**: _________________  
**Cleaned By**: _________________
