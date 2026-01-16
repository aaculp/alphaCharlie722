# Push Notifications MVP Summary

## Overview

This document summarizes the two-phase approach to implementing push notifications in the OTW platform, with scheduling removed from MVP scope.

---

## Phase 1: Social Push Notifications ✅ Ready to Implement

**Spec Location:** `.kiro/specs/social-push-notifications/`

### Purpose
Replace 30-second polling with real-time push notifications for social interactions.

### Scope
- Friend requests
- Friend accepted
- Venue shares
- Real-time delivery only (no scheduling)

### Key Features
- Firebase Cloud Messaging setup (iOS + Android)
- Device token management
- Push permission handling
- Notification reception and navigation
- User preferences per notification type
- Remove polling system

### Estimated Effort
- **16 task groups** (~50 tasks)
- **2-3 weeks** implementation
- **20 correctness properties** for testing

### Benefits
- ✅ Instant notifications (no 30-second delay)
- ✅ Reduced battery drain (no polling)
- ✅ Reduced API calls
- ✅ Better user experience
- ✅ Foundation for venue promotional push

---

## Phase 2: Venue Promotional Push Notifications 🔄 Updated (No Scheduling)

**Spec Location:** `.kiro/specs/push-notification-system/`

### Purpose
Enable venues to send targeted promotional notifications to customers (monetization feature).

### Scope (Updated - Scheduling Removed)
- Venue dashboard UI for creating notifications
- Targeting engine (All Users, Favorites, Geo-radius)
- **Send Now only** (no scheduling)
- Notification templates (Flash Offer, Event, General)
- Analytics dashboard
- Rate limiting and quotas
- User preferences for venue notifications

### What Was Removed from MVP
❌ **Scheduling functionality:**
- "Schedule for Later" button
- Date/time picker
- Scheduled notification storage
- Background job processor
- Timezone handling
- Scheduled notification management UI
- 6 scheduling-related correctness properties

### What Remains
✅ **Core monetization features:**
- Create and send notifications immediately
- Target specific users (favorites, geo-radius)
- Track analytics (sent, delivered, opened, conversions)
- Rate limiting per tier
- User preferences and muting
- Notification history

### Estimated Effort (After Scheduling Removal)
- **~10 task groups** (~40-45 tasks, down from ~50-55)
- **2.5-3.5 weeks** implementation (down from 3-4 weeks)
- **~73 correctness properties** (down from 79)

### Infrastructure Reused from Phase 1
- ✅ Firebase Cloud Messaging setup (100%)
- ✅ Device token management (100%)
- ✅ Push permission handling (100%)
- ✅ Core FCM service (100%)
- ✅ Notification reception (100%)
- ✅ Error handling (100%)
- ✅ Performance optimization (100%)

**~60% of infrastructure already built in Phase 1!**

---

## What's Left to Build for Phase 2

### 1. Venue Dashboard UI (New)
**8-10 tasks**
- Create notification form
- Title/message inputs with character limits
- Notification type selector
- Targeting options UI
- Estimated reach counter
- **Send Now button** (no scheduling)
- Notification history view

### 2. Targeting Engine (New)
**6-8 tasks**
- All users targeting
- Favorites-only targeting
- Geo-targeting with radius options
- Combined filters
- Exclusion filters
- Reach estimation

### 3. Notification Templates (New)
**4-5 tasks**
- Flash Offer template
- Event template
- General template
- Template auto-population
- Custom template saving

### 4. Analytics Dashboard (New)
**5-6 tasks**
- Track sent/delivered/opened
- Calculate rates
- Track check-in attribution
- Analytics UI
- Per-notification and aggregate views

### 5. Rate Limiting & Quotas (New)
**4-5 tasks**
- Daily quota system
- Tier-based limits
- Quota enforcement
- Quota display
- Audit logging

### 6. User Preferences (Extends Existing)
**3-4 tasks**
- Venue notification type toggles
- Mute specific venues
- Quiet hours
- Preference enforcement

### 7. Database Schema (New Tables)
**3-4 tasks**
- `push_notifications` table (simplified - no `scheduled_for`)
- `notification_deliveries` table
- `notification_analytics` table
- Update `user_notification_preferences`

### 8. Test Notifications (New)
**2-3 tasks**
- Send test to venue owner only
- Don't consume credits
- Test feedback

### 9. Integration (Partial)
**3-4 tasks**
- Venue dashboard integration
- Location services (reuse)
- Favorites system (reuse)
- Check-in attribution (reuse)

---

## Simplified Database Schema (No Scheduling)

```sql
CREATE TABLE push_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES venues(id),
  title VARCHAR(50) NOT NULL,
  message VARCHAR(200) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('general', 'flash_offer', 'event')),
  targeting_mode VARCHAR(20) NOT NULL CHECK (targeting_mode IN ('all', 'favorites', 'geo')),
  geo_radius DECIMAL(5,2),
  combine_favorites BOOLEAN DEFAULT false,
  status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Removed fields:**
- ❌ `scheduled_for` - No longer needed
- ❌ `status` value 'scheduled' - No longer needed

---

## Benefits of Removing Scheduling

1. ✅ **Simpler Architecture** - No background job processor needed
2. ✅ **Faster Implementation** - ~5-6 fewer tasks
3. ✅ **Easier Testing** - No time-based logic or timezone edge cases
4. ✅ **Immediate Feedback** - Venues see results right away
5. ✅ **Reduced Infrastructure** - No job queue (Bull, Celery, etc.)
6. ✅ **Fewer Edge Cases** - No timezone conversions, DST handling
7. ✅ **Lower Complexity** - Easier to maintain and debug

---

## Future Enhancement: Scheduling (Phase 3)

If scheduling is needed later, it can be added as a focused enhancement:

**Estimated Effort:** 1-2 weeks
- Add `scheduled_for` field back
- Implement background job processor
- Add scheduling UI
- Handle timezone conversions
- Add scheduled notification management

---

## Recommended Implementation Order

### Week 1-3: Phase 1 (Social Push)
1. Firebase setup
2. Token management
3. Permission handling
4. Core push service
5. Friend request/accepted/venue share notifications
6. Notification reception
7. Remove polling

**Deliverable:** Real-time social notifications working

### Week 4-7: Phase 2 (Venue Promotional Push)
1. Venue dashboard UI
2. Targeting engine
3. Templates
4. Analytics
5. Rate limiting
6. User preferences
7. Testing

**Deliverable:** Venues can send targeted promotional notifications

---

## Total Effort Estimate

- **Phase 1:** 2-3 weeks
- **Phase 2:** 2.5-3.5 weeks
- **Total:** 4.5-6.5 weeks for complete push notification system

**With scheduling removed, saved ~1 week of development time!**

---

## Requirements Summary

### Phase 1: Social Push Notifications
- **15 requirements**
- **20 correctness properties**
- **~50 tasks**

### Phase 2: Venue Promotional Push (No Scheduling)
- **18 requirements** (down from 20)
- **~73 correctness properties** (down from 79)
- **~40-45 tasks** (down from ~50-55)

---

## Next Steps

1. ✅ **Review this summary** - Confirm approach looks good
2. ✅ **Start Phase 1** - Open `.kiro/specs/social-push-notifications/tasks.md`
3. ✅ **Begin with Task 1.1** - Install and configure Firebase SDK
4. ⏳ **Complete Phase 1** - Get social push working
5. ⏳ **Start Phase 2** - Build venue promotional features on proven foundation
