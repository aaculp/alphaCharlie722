# MVP Completion Workflow

**Last Updated:** January 18, 2026  
**Purpose:** Systematic verification and completion of all MVP features with backend integration

---

## Workflow Strategy

**Approach:** Venue-First → User-Second → Integration Testing

**Rationale:**
- Venues are the foundation of the platform
- User features depend on venue data (check-ins, reviews, etc.)
- Backend infrastructure validation happens early
- Integration testing validates the complete user journey

---

## Phase 1: Venue Features (Backend-Heavy)

### 1.1 Venue Authentication & Accounts ✅ DONE
**Status:** Complete  
**Backend:** Supabase Auth + `venue_business_accounts` table  
**Frontend:** VenueDashboardScreen, AuthContext

**Verification Checklist:**
- [x] Venue can sign up with email/password
- [x] Venue can sign in and session persists
- [x] Venue business account created on signup
- [x] Venue type detected correctly (venue_owner vs customer)
- [x] Venue can sign out and session clears

**Files:**
- `src/contexts/AuthContext.tsx`
- `src/services/venueBusinessService.ts`
- `database/setup/02_venue_business_accounts.sql`

---

### 1.2 Venue Profile Management ✅ DONE
**Status:** Complete  
**Backend:** `venues` table, `venue_business_accounts` table  
**Frontend:** VenueDashboardScreen, venue update forms

**Verification Checklist:**
- [x] Venue can update basic information (name, description, hours)
- [x] Venue can update contact info (phone, website, address)
- [x] Venue can update amenities
- [x] Venue can set max capacity
- [x] Changes persist to database
- [x] Profile page displays updated information

**Files:**
- `src/screens/venue/VenueDashboardScreen.tsx`
- `src/services/venueBusinessService.ts`
- `database/setup/01_venues.sql`

---

### 1.3 Venue Push Notification Promos (Flash Offers) ✅ DONE
**Status:** Complete  
**Backend:** Edge function `send-flash-offer-push`, `flash_offers` table, `flash_offer_rate_limits` table  
**Frontend:** Flash offer creation modal, rate limit display

**Verification Checklist:**
- [x] Venue can create flash offers with title, description, expiration
- [x] System generates notification payload
- [x] Rate limiting enforced (tier-based: free=1/day, basic=5/day, premium=unlimited)
- [x] User targeting by distance and favorites
- [x] Quiet hours respected
- [x] Notification preferences honored
- [x] Push notifications sent via FCM
- [x] Analytics tracked (sent count, delivery status)

**Files:**
- `supabase/functions/send-flash-offer-push/index.ts`
- `src/screens/venue/FlashOfferCreationModal.tsx`
- `src/services/FlashOfferService.ts`
- `database/setup/flash_offers.sql`

**Backend Testing:**
- [x] Property-based tests for targeting logic
- [x] Property-based tests for rate limiting
- [x] Property-based tests for quiet hours
- [x] Unit tests for payload building

---

### 1.4 Venue Location-Based Display ✅ DONE
**Status:** Complete  
**Backend:** `venues` table with `created_at`, location data  
**Frontend:** NewVenuesSpotlight component on HomeScreen

**Verification Checklist:**
- [x] "New Venues Spotlight" section displays on home screen
- [x] Shows venues created within last 30 days
- [x] Horizontal scrolling works smoothly
- [x] Displays "Joined X days ago" badge
- [x] Venues sorted by signup date (newest first)
- [x] Tapping venue navigates to detail screen

**Files:**
- `src/components/venue/NewVenuesSpotlight.tsx`
- `src/services/api/venues.ts`
- `src/utils/formatting/venue.ts`

---

### 1.5 Venue Crowd Meter (Activity Level) ✅ DONE
**Status:** Complete  
**Backend:** `check_ins` table, real-time check-in counts  
**Frontend:** VenueEngagementChip, activity level calculation

**Verification Checklist:**
- [x] Activity level calculated based on current check-ins vs capacity
- [x] Five levels: Low-key (😌), Vibey (✨), Poppin (🎉), Lit (🔥), Maxed (⛔)
- [x] Displayed on venue cards in home feed
- [x] Displayed on venue detail screen
- [x] Updates in real-time when users check in/out
- [x] Percentage calculation accurate

**Files:**
- `src/components/venue/VenueEngagementChip.tsx`
- `src/utils/formatting/activity.ts`
- `src/hooks/useCheckInStats.ts`

---

### 1.6 Venue Promo System (QR Code) ⚠️ NEEDS VERIFICATION
**Status:** Partially Complete (Flash Offers done, traditional QR promos unclear)  
**Backend:** `promos` table (if exists), QR code generation  
**Frontend:** Promo creation, QR display, claim flow

**Verification Checklist:**
- [ ] Venue can create traditional promos (separate from flash offers)
- [ ] QR code generated for each promo
- [ ] QR code displayed to venue owner
- [ ] User can scan QR code to claim promo
- [ ] Claim recorded in database
- [ ] Venue can verify claimed promos
- [ ] Promo expiration handled
- [ ] Claim limits enforced

**Files to Check:**
- `.kiro/specs/venue-promo-system/` (spec exists)
- Search for `promos` table in database
- Search for QR code generation logic

**Action Required:** Verify if traditional promo system is implemented or if flash offers replaced it

---

### 1.7 Venue Promo Section on Venue Page ⚠️ NEEDS VERIFICATION
**Status:** Unclear  
**Backend:** Promo data retrieval  
**Frontend:** Promo display section on VenueDetailScreen

**Verification Checklist:**
- [ ] Active promos displayed on venue detail screen
- [ ] Promo cards show title, description, expiration
- [ ] Users can view promo details
- [ ] Users can claim promos from venue page
- [ ] Expired promos hidden or marked as expired

**Files to Check:**
- `src/screens/customer/VenueDetailScreen.tsx`
- Search for promo display components

**Action Required:** Verify promo display implementation

---

### 1.8 Venue Analytics Dashboard ✅ DONE (Mostly)
**Status:** Complete with mock data fallbacks  
**Backend:** `check_ins`, `reviews`, `favorites` tables  
**Frontend:** VenueDashboardScreen with analytics cards

**Verification Checklist:**
- [x] Today's Performance section displays
- [x] Check-ins count (real data)
- [x] New customers count (estimated)
- [x] Current activity level (real data)
- [ ] **Rating Today (NEEDS REVIEWS TABLE)** ← Currently using mock data
- [x] Weekly Analytics section displays
- [x] Total check-ins (real data)
- [ ] **Avg. Rating (NEEDS REVIEWS TABLE)** ← Currently using mock data
- [x] New favorites (real data)
- [x] Profile views (estimated)
- [x] Peak Hours Analysis (real data from check-ins)
- [x] Customer Insights (real data)

**Files:**
- `src/screens/venue/VenueDashboardScreen.tsx`
- `src/services/venueAnalyticsService.ts`

**Action Required:** Implement reviews system to populate rating data

---

## Phase 2: User Features (Profile & Interactions)

### 2.1 User Authentication ✅ DONE
**Status:** Complete  
**Backend:** Supabase Auth + `profiles` table  
**Frontend:** AuthScreen, AuthContext

**Verification Checklist:**
- [x] User can sign up with email/password
- [x] User can sign in and session persists
- [x] Profile created on signup
- [x] User type detected correctly (customer)
- [x] User can sign out and session clears
- [x] Default notification preferences created on signup

**Files:**
- `src/contexts/AuthContext.tsx`
- `src/screens/auth/AuthScreen.tsx`
- `database/setup/profiles.sql`

---

### 2.2 User Profile Management ✅ DONE (Basic)
**Status:** Basic profile management complete  
**Backend:** `profiles` table  
**Frontend:** SettingsScreen, profile update forms

**Verification Checklist:**
- [x] User can update name
- [x] User can update email
- [x] User can upload profile photo
- [x] Changes persist to database
- [ ] **Username system (NEEDS VERIFICATION)** ← Spec exists, implementation unclear
- [ ] **Bio field (NEEDS VERIFICATION)** ← Spec exists, implementation unclear

**Files:**
- `src/screens/customer/SettingsScreen.tsx`
- `src/services/api/profiles.ts` (if exists)

**Action Required:** Verify username and bio implementation

---

### 2.3 User Notification Preferences ✅ DONE
**Status:** Complete  
**Backend:** `notification_preferences` table  
**Frontend:** Notification settings toggles

**Verification Checklist:**
- [x] User can toggle flash offers on/off globally
- [x] User can set quiet hours (start/end time)
- [x] User can toggle notifications per venue
- [x] Preferences persist to database
- [x] Backend respects preferences when sending notifications
- [x] Default preferences created on signup

**Files:**
- `src/services/api/notificationPreferences.ts`
- `src/screens/customer/NotificationSettingsScreen.tsx` (if exists)
- `database/setup/notification_preferences.sql`

---

### 2.4 User Check-In/Out System ✅ DONE
**Status:** Complete  
**Backend:** `check_ins` table, location validation  
**Frontend:** CheckInButton, CheckInModal

**Verification Checklist:**
- [x] User can check in to venue within radius
- [x] Location validation enforced (must be within X meters)
- [x] User can only have one active check-in at a time
- [x] Checking in to new venue auto-checks out from previous
- [x] User can manually check out
- [x] Check-in count updates in real-time
- [x] Activity level updates when users check in/out
- [x] Check-in history tracked

**Files:**
- `src/components/checkin/CheckInButton.tsx`
- `src/components/checkin/CheckInModal.tsx`
- `src/services/api/checkins.ts`
- `src/hooks/useCheckInActions.ts`

---

### 2.5 User Pulses (Feedback System) ✅ DONE
**Status:** Complete  
**Backend:** `user_feedback` table  
**Frontend:** UserFeedback component with predefined options

**Verification Checklist:**
- [x] User can submit feedback after check-in
- [x] Predefined options only (no free text)
- [x] Feedback categories: vibe, service, value, etc.
- [x] Feedback stored in database
- [x] Venue owners can view feedback
- [x] No profanity issues (predefined options only)

**Files:**
- `src/components/checkin/UserFeedback.tsx`
- `src/services/api/feedback.ts`
- `database/setup/user_feedback.sql`

---

### 2.6 User "Heading To" Status ❌ NOT DONE
**Status:** Not implemented  
**Backend:** Needs new table or field in `profiles`  
**Frontend:** Needs UI component

**Verification Checklist:**
- [ ] User can set "heading to" status for a venue
- [ ] Status separate from check-in
- [ ] Status visible to friends (if social features enabled)
- [ ] Status auto-clears after X hours or when checking in
- [ ] Status displayed on user profile

**Action Required:** Determine if this feature is needed for MVP or post-MVP

---

### 2.7 User Profile Display Features ❌ NOT DONE
**Status:** Not implemented  
**Backend:** Data exists, display logic needed  
**Frontend:** Profile screen with privacy toggles

**Verification Checklist:**
- [ ] Privacy tier system (public/hidden toggle per section)
- [ ] # of promos claimed (display + toggle)
- [ ] # of check-ins (display + toggle)
- [ ] Most recent check-in (display + toggle)
- [ ] Scrollable section of user reviews (display + toggle)
- [ ] User's #1 checked-in venue (display + toggle)
- [ ] Privacy settings persist to database
- [ ] Other users respect privacy settings

**Files to Create:**
- Enhanced profile screen with stats
- Privacy settings screen
- Database fields for privacy preferences

**Action Required:** Implement user profile display with privacy controls

---

## Phase 3: Missing Core Features

### 3.1 Reviews & Ratings System ❌ NOT DONE (IN PROGRESS)
**Status:** Spec created, implementation pending  
**Backend:** Needs `reviews` table  
**Frontend:** Review submission modal, review display

**Verification Checklist:**
- [ ] User can leave star rating (1-5)
- [ ] User can write review text (optional, max 500 chars)
- [ ] Post-check-out review prompt
- [ ] Reviews displayed on venue detail screen
- [ ] Reviews displayed on home feed venue cards
- [ ] Aggregate rating calculated
- [ ] Review count displayed
- [ ] Helpful votes on reviews
- [ ] Venue owner can respond to reviews
- [ ] Content moderation (profanity filtering)
- [ ] Review analytics on venue dashboard

**Files to Create:**
- `database/setup/reviews.sql`
- `src/components/reviews/ReviewModal.tsx`
- `src/components/reviews/ReviewCard.tsx`
- `src/services/api/reviews.ts`
- `src/hooks/useReviews.ts`

**Action Required:** Complete reviews system implementation (current task)

---

### 3.2 Username Search System ⚠️ NEEDS VERIFICATION
**Status:** Spec exists, partial implementation  
**Backend:** `profiles` table with `username` field  
**Frontend:** Search with @ prefix

**Verification Checklist:**
- [ ] Username field exists in profiles table
- [ ] Username uniqueness enforced
- [ ] User can set username on signup
- [ ] User can search for other users with @ prefix
- [ ] @ prefix search returns user results (not venues)
- [ ] Search results show username, name, profile picture
- [ ] Tapping user result navigates to their profile

**Files to Check:**
- `.kiro/specs/username-system/` (spec exists)
- `src/services/api/friends.ts` (has searchUsers function)
- Database schema for username field

**Action Required:** Verify username system is fully implemented

---

### 3.3 Promo Claim Tracking ❌ NOT DONE
**Status:** Not implemented  
**Backend:** Needs claim tracking in database  
**Frontend:** Claim history display

**Verification Checklist:**
- [ ] User's claimed promos tracked in database
- [ ] Claim count displayed on user profile
- [ ] Claim history accessible to user
- [ ] Claimed promos show redemption status
- [ ] Privacy toggle for claim count visibility

**Action Required:** Implement promo claim tracking and display

---

## Phase 4: Integration & Polish

### 4.1 End-to-End User Journey Testing
**Verification Checklist:**
- [ ] New user signup → profile creation → notification preferences
- [ ] User browses venues → views details → checks in
- [ ] User receives post-check-out review prompt → leaves review
- [ ] User favorites venue → subscribes to notifications
- [ ] Venue creates flash offer → user receives notification
- [ ] User claims promo → venue verifies claim
- [ ] Venue owner views analytics → sees real data

---

### 4.2 Backend Data Integrity
**Verification Checklist:**
- [ ] All foreign keys properly constrained
- [ ] Row Level Security (RLS) policies tested
- [ ] Database indexes on frequently queried fields
- [ ] Cascade deletes configured correctly
- [ ] No orphaned records after user/venue deletion

---

### 4.3 Performance Optimization
**Verification Checklist:**
- [ ] Venue list loads in <500ms
- [ ] Check-in action completes in <300ms
- [ ] Review submission completes in <500ms
- [ ] Analytics dashboard loads in <1s
- [ ] Image loading optimized (lazy loading, caching)

---

## Execution Plan

### Week 1: Venue Feature Verification
- **Day 1-2:** Verify 1.6 (Promo System) and 1.7 (Promo Display)
- **Day 3:** Implement reviews table and backend API
- **Day 4-5:** Complete 1.8 (Analytics) with real review data

### Week 2: User Feature Completion
- **Day 1-2:** Verify 2.2 (Username system)
- **Day 3-4:** Implement 2.7 (Profile display with privacy)
- **Day 5:** Implement 3.3 (Promo claim tracking)

### Week 3: Reviews System
- **Day 1-2:** Frontend review submission and display
- **Day 3:** Content moderation integration
- **Day 4:** Venue owner response functionality
- **Day 5:** Review analytics integration

### Week 4: Integration & Testing
- **Day 1-2:** End-to-end testing
- **Day 3:** Backend data integrity verification
- **Day 4:** Performance optimization
- **Day 5:** Final QA and bug fixes

---

## Progress Tracking

**Overall MVP Completion:** 55% (11/20 features complete)

### By Phase:
- **Phase 1 (Venue):** 75% (6/8 complete)
- **Phase 2 (User):** 67% (4/6 complete)
- **Phase 3 (Missing):** 0% (0/3 complete)
- **Phase 4 (Integration):** 0% (0/3 complete)

### Priority Order:
1. **HIGH:** Reviews system (blocks analytics)
2. **HIGH:** User profile display (core MVP feature)
3. **MEDIUM:** Username verification (spec exists)
4. **MEDIUM:** Promo system verification (spec exists)
5. **LOW:** "Heading to" status (nice-to-have)
6. **LOW:** Promo claim tracking (depends on promo system)

---

## Next Steps

1. **Continue with Reviews System** (current task)
   - Complete requirements review
   - Create design document
   - Create tasks document
   - Begin implementation

2. **After Reviews:** Verify username system
   - Check database schema
   - Test @ prefix search
   - Verify user profile navigation

3. **Then:** Implement user profile display
   - Create privacy settings UI
   - Display stats with toggles
   - Test privacy enforcement

---

## Notes

- This workflow assumes a single developer working full-time
- Adjust timeline based on team size and availability
- Some features may be deprioritized based on user feedback
- Backend testing should happen in parallel with frontend development
- Consider creating a staging environment for integration testing

---

**Document Owner:** Development Team  
**Review Frequency:** Weekly during MVP completion phase  
**Last Review:** January 18, 2026
