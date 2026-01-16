# Scheduling Removal Summary

## Decision
Remove all scheduling functionality from the push notification system for MVP. Notifications will be sent immediately when created, not scheduled for future delivery.

## Status: ✅ COMPLETE

All scheduling-related content has been removed from the venue promotional push notification spec.

## What Was Removed

### From Requirements
- **Requirement 5: Push Notification Scheduling** (entire requirement - 10 acceptance criteria)
- **Requirement 16: Background Push Processing** (entire requirement - 10 acceptance criteria)
- References to "scheduled" status in Requirement 10 (notification history)

### From Design
- **SchedulingService** component (entire component)
- Schedule-related methods from PushNotificationService:
  - `scheduleNotification()`
  - `cancelScheduledNotification()`
- Schedule-related database fields:
  - `scheduled_for` timestamp
  - `status` values: 'scheduled'
- **Properties 21-26** (6 scheduling-related correctness properties)
- Background job processor architecture
- Timezone handling for scheduled notifications

### From Tasks
- **Task 8: Notification Scheduling** (entire task group - 5 subtasks)
  - SchedulingService class
  - Background job processor
  - Timezone handling
  - Scheduled notification management UI
  - Property tests for scheduling
- Task 6.4: Remove "Schedule for Later" button (keep "Send Now" only)
- Task 13.2: Remove scheduled notification filtering

## What Remains

### Simplified Flow
1. Venue owner creates notification
2. Venue owner clicks "Send Now"
3. System immediately sends to targeted users
4. Analytics tracked in real-time

### Simplified Database Schema
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
- `scheduled_for` - No longer needed
- `status` value 'scheduled' - No longer needed

### Benefits of Removal
- ✅ Simpler architecture (no background jobs)
- ✅ Faster implementation (~5-6 fewer tasks)
- ✅ Easier testing (no time-based logic)
- ✅ Fewer edge cases (no timezone issues)
- ✅ Immediate feedback (send happens right away)
- ✅ Reduced infrastructure (no job queue needed)

### Future Enhancement
Scheduling can be added in Phase 3 if needed:
- Add back `scheduled_for` field
- Implement background job processor
- Add scheduling UI
- Estimated: 1-2 weeks of work


## Changes Made

### requirements.md ✅
- Removed Requirement 5: Push Notification Scheduling (10 acceptance criteria)
- Removed Requirement 16: Background Push Processing (10 acceptance criteria)
- Removed "scheduled" status from Requirement 10 (notification history filtering)
- Renumbered requirements 5-20 → 5-18

### design.md ✅
- Removed SchedulingService component from architecture diagram
- Removed scheduling methods from PushNotificationService interface
- Removed Properties 21-26 (6 scheduling-related correctness properties)
- Renumbered remaining properties (Property 27 → Property 21, etc.)
- Updated database schema to remove `scheduled_for` field and 'scheduled' status
- Removed background job processor from Implementation Notes
- Updated testing strategy to remove scheduling flow tests
- Updated monitoring to remove background job metrics
- Simplified component interaction flow (removed scheduling step)

### tasks.md ✅
- Removed Task 8: Notification Scheduling (entire task group with 5 subtasks)
- Updated Task 6.4: Changed from "Add send/schedule buttons" to "Add send button"
- Updated Task 12.2 (formerly 13.2): Removed "scheduled" from status filter options
- Updated Task 20.3 (formerly 21.3): Removed scheduling flow from integration tests
- Renumbered all tasks after Task 8 (Task 9 → Task 8, Task 10 → Task 9, etc.)
- Updated overview to remove scheduling from description
- Updated property test references to use new property numbers
- Updated total property count from 79 to 73 properties

## Final Counts

- **Requirements**: 20 → 18 (removed 2)
- **Properties**: 79 → 73 (removed 6)
- **Tasks**: 22 task groups → 21 task groups (removed 1)
- **Subtasks**: ~55 → ~50 (removed ~5)

## Estimated Time Saved

- Development: ~1 week
- Testing: ~2-3 days
- Infrastructure setup: ~1-2 days
- **Total**: ~1.5-2 weeks saved
