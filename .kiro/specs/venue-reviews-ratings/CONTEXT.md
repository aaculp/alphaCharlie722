# Venue Reviews & Ratings System - Context Summary

**Date:** January 18, 2026  
**Status:** Requirements Complete, Ready for Design Phase  
**Priority:** HIGH (Blocks venue analytics dashboard)

---

## Why We're Building This

### The Problem
The venue analytics dashboard currently shows **"Rating Today"** and **"Weekly Avg Rating"**, but these are pulling from a `reviews` table that **doesn't exist yet**. The system falls back to mock data (4.8 rating), which means venue owners can't see real customer feedback.

### The Solution
Implement a complete Reviews & Ratings system that allows:
- **Users** to leave star ratings (1-5) and written reviews after visiting venues
- **Venue owners** to see real rating data in their analytics dashboard
- **All users** to see ratings on venue cards and detail screens for social proof

---

## What We've Completed

### ✅ Requirements Document
**Location:** `.kiro/specs/venue-reviews-ratings/requirements.md`

**Key Requirements:**
1. **Review Submission** - Users can leave ratings from venue detail screen
2. **Post-Check-Out Prompt** - Automatic review prompt after checking out
3. **Review Display** - Reviews shown on venue detail screen and home feed cards
4. **Filtering & Sorting** - Most Recent, Highest Rated, Most Helpful
5. **Helpful Votes** - Users can mark reviews as helpful
6. **Edit/Delete** - Users can manage their own reviews
7. **Verified Badge** - Reviews from users who checked in get verified badge
8. **Venue Owner Responses** - Owners can respond to customer reviews
9. **Content Moderation** - Profanity filtering with tiered approach (censor mild, reject severe)
10. **Analytics Integration** - Reviews feed into venue dashboard metrics

**Content Moderation Approach:**
- **Library:** `bad-words` (client-side) + optional Perspective API (backend)
- **Strategy:** Tiered moderation (censor mild profanity, reject hate speech)
- **Whitelist:** Venue-specific terms (cocktails, breast meat, etc.)

---

## User Experience Flow

### Customer Journey:
1. **User checks out from venue** → Review prompt modal appears
2. **Quick rating:** Tap 1-5 stars → Instantly submitted
3. **Detailed review:** Tap "Add written review" → Opens full modal with text input
4. **Review appears:** On venue detail screen, home feed cards, and in analytics

### Venue Owner Journey:
1. **Dashboard shows real ratings:** "Today's Rating" and "Weekly Avg Rating" populate with actual data
2. **View recent reviews:** See latest customer feedback
3. **Respond to reviews:** Engage with customers directly
4. **Track trends:** Rating distribution chart, response time metrics

---

## Technical Context

### Current State:
- **Backend:** `venueAnalyticsService.ts` already queries `reviews` table (but it doesn't exist)
- **Frontend:** VenueDashboardScreen displays rating cards (currently showing mock data)
- **Check-in System:** Fully functional, perfect trigger point for review prompts
- **Auth System:** Complete, can track which users leave reviews

### What Needs to Be Built:
1. **Database:** `reviews` table with proper schema and RLS policies
2. **Backend API:** Review CRUD operations, aggregation logic
3. **Frontend Components:** Review modal, review cards, review list
4. **Integration:** Wire reviews into existing analytics service
5. **Content Moderation:** Implement profanity filtering

---

## Architecture Decisions

### Database Design:
```sql
reviews (
  id uuid PRIMARY KEY,
  venue_id uuid REFERENCES venues(id),
  user_id uuid REFERENCES profiles(id),
  rating integer (1-5),
  review_text text (max 500 chars, optional),
  is_verified boolean (checked in before reviewing),
  helpful_count integer,
  created_at timestamp,
  updated_at timestamp
)
```

### Aggregate Data:
- Store `aggregate_rating` and `review_count` directly on `venues` table
- Update via database trigger when reviews are added/deleted
- Cache review lists with 5-minute TTL

### Review Prompt Timing:
- Trigger: User checks out from venue
- Modal: Simple star selector with optional "Add written review" button
- Frequency: Once per check-out (don't spam)

---

## Integration Points

### Existing Systems to Connect:
1. **Check-In System** → Trigger review prompt on check-out
2. **Venue Analytics** → Pull real review data instead of mock data
3. **Home Feed** → Display ratings on venue cards
4. **Venue Detail Screen** → Show reviews section
5. **Notification System** → Notify users when venue owner responds

### Files to Modify:
- `src/services/venueAnalyticsService.ts` - Remove mock data fallbacks
- `src/screens/venue/VenueDashboardScreen.tsx` - Display real rating data
- `src/screens/customer/VenueDetailScreen.tsx` - Add reviews section
- `src/components/checkin/CheckInModal.tsx` - Add review prompt on check-out
- `src/components/venue/VenueCard.tsx` - Display ratings on cards

---

## Success Criteria

### Must Have (MVP):
- [x] Requirements document complete
- [ ] Design document with data models and API specs
- [ ] Tasks document with implementation plan
- [ ] Database schema and migrations
- [ ] Review submission (star rating + optional text)
- [ ] Post-check-out review prompt
- [ ] Review display on venue detail screen
- [ ] Aggregate rating on venue cards
- [ ] Analytics dashboard shows real ratings
- [ ] Basic content moderation (profanity filter)

### Nice to Have (Post-MVP):
- [ ] Photo attachments to reviews
- [ ] Review photos gallery
- [ ] Advanced moderation (Perspective API)
- [ ] Review quality badges (Detailed Review, Top Review)
- [ ] Reviewer reputation system

---

## Next Steps for New Agent

### Immediate Tasks:
1. **Review the requirements document** (`.kiro/specs/venue-reviews-ratings/requirements.md`)
2. **Create design document** with:
   - Database schema (reviews table, indexes, RLS policies)
   - API endpoints (CRUD operations, aggregation)
   - Component architecture (ReviewModal, ReviewCard, ReviewList)
   - Content moderation implementation
   - Analytics integration approach
3. **Create tasks document** with implementation checklist
4. **Begin implementation** starting with database schema

### Key Questions to Address in Design:
- How do we efficiently aggregate ratings? (Database trigger vs application logic)
- How do we handle review edits? (Update timestamp, show "Edited" badge)
- How do we prevent review spam? (Rate limiting, one review per venue per user)
- How do we cache review data? (TTL strategy, invalidation on new reviews)
- How do we handle deleted users? (Anonymize reviews vs cascade delete)

---

## Reference Documents

- **Requirements:** `.kiro/specs/venue-reviews-ratings/requirements.md`
- **MVP Workflow:** `docs/MVP_COMPLETION_WORKFLOW.md` (Section 3.1)
- **Feature Roadmap:** `docs/feature-roadmap.md` (Reviews mentioned in Phase 1)
- **Analytics Service:** `src/services/venueAnalyticsService.ts` (Already expects reviews)
- **Venue Dashboard:** `src/screens/venue/VenueDashboardScreen.tsx` (Displays ratings)

---

## Important Notes

- **This is a HIGH PRIORITY feature** - It unblocks real analytics data for venue owners
- **User experience is critical** - Review prompts should feel natural, not intrusive
- **Content moderation is essential** - Balance between free expression and platform quality
- **Performance matters** - Aggregate ratings must be fast (cached, not calculated on-demand)
- **Mobile-first design** - All UI components must work well on small screens

---

## Questions or Blockers?

If you encounter any issues or need clarification:
1. Check the requirements document for detailed acceptance criteria
2. Review the MVP workflow document for context on related features
3. Look at existing check-in system for integration patterns
4. Examine venue analytics service to understand data expectations

---

**Ready to proceed with design phase!** 🚀
