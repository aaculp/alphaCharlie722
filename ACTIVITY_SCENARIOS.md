# Complete Activity Feed Scenarios

## 🔵 Check-ins (Real Database Data)
**Icon**: `people` | **Color**: Blue (#2196F3)

### Variations:
- "Large group checked in"
- "New customer checked in" 
- "Repeat customer returned"
- "Family of 4 checked in"
- "Business meeting started"

**Trigger**: Real check-ins from your `check_ins` table

---

## 🟡 Reviews (Real Database Data)
**Icon**: `star` | **Color**: Amber (#FFC107)

### Variations:
- "New 5-star review received"
- "New 4-star review received"
- "New 3-star review received"
- "New 2-star review received"
- "New 1-star review received"

**Trigger**: Real reviews from `reviews` table (if exists)

---

## 🔴 Favorites (Real Database Data)
**Icon**: `heart` | **Color**: Pink (#E91E63)

### Variations:
- "New favorite added"
- "Customer added venue to favorites"

**Trigger**: Real favorites from `favorites` table (if exists)

---

## 🟣 Push Notifications (Real Database Data)
**Icon**: `notifications` | **Color**: Purple (#9C27B0)

### Variations:
- "Flash offer sent to 142 customers" (flash_offer type)
- "Promotion delivered to nearby users" (general type)
- "Special event notification sent to 87 users"

**Trigger**: Real push campaigns from `venue_push_notifications` table (if exists)

---

## 🟢 Revenue Events (Smart Simulation)
**Icon**: `card` | **Color**: Green (#4CAF50)

### Variations:
- "Payment processed: $15.67"
- "Payment processed: $32.45"
- "Payment processed: $58.23"
- "Daily revenue target reached"

**Trigger**: Appears when there are recent check-ins (simulates payments)

---

## 🟠 Capacity Alerts (Time-Based Simulation)
**Icon**: `warning` | **Color**: Orange (#FF9800)

### Variations:
- "Venue approaching peak capacity"
- "Venue reached maximum capacity"
- "Wait time increased to 15 minutes"

**Trigger**: Appears during peak hours (11 AM-2 PM, 5-8 PM) with 40% probability

---

## 🔵 Reservations (Random Simulation)
**Icon**: `calendar` | **Color**: Indigo (#3F51B5)

### Variations:
- "New reservation for 2 people"
- "New reservation for 3 people"
- "New reservation for 4 people"
- "New reservation for 5 people"
- "New reservation for 6 people"
- "New reservation for 7 people"
- "Reservation confirmed for tonight"

**Trigger**: 30% probability on each load

---

## 🟢 Activity Changes (Check-in Based)
**Icon**: `trending-up` | **Color**: Green (#4CAF50)

### Variations:
- "Activity level increased to 'Vibey'"
- "Activity level increased to 'Poppin'"
- "Activity level increased to 'Lit'"
- "Venue activity level updated"

**Trigger**: Appears when there are 2+ recent check-ins

---

## 🟦 Profile Updates (Random Simulation)
**Icon**: `create` | **Color**: Teal (#009688)

### Variations:
- "Menu updated with seasonal items"
- "Photos added to gallery"
- "Hours updated for holiday"
- "Venue description updated"
- "New amenities added"

**Trigger**: 30% probability on each load

---

## 🟠 Staff Actions (Random Simulation)
**Icon**: `person-add` | **Color**: Orange (#FF9800)

### Variations:
- "Staff member clocked in"
- "Manager updated venue status"
- "New staff member added"
- "Shift schedule updated"

**Trigger**: 25% probability on each load

---

## ⚫ System Events (Random Simulation)
**Icon**: `settings` | **Color**: Gray (#607D8B)

### Variations:
- "Daily analytics report generated"
- "Backup completed successfully"
- "System maintenance completed"
- "Security scan completed"

**Trigger**: 20% probability on each load

---

## 🔵 Customer Engagement (Random Simulation)
**Icon**: `chatbubble` | **Color**: Light Blue (#03A9F4)

### Variations:
- "Customer shared venue on social media"
- "Photo tagged with venue location"
- "Customer left positive feedback"
- "Venue mentioned in social post"

**Trigger**: 20% probability on each load

---

## Current Activity Feed Features:

✅ **Scrollable Feed**: Full-height container with smooth scrolling
✅ **Rich UI**: Icon containers with colored backgrounds
✅ **Type Badges**: Each activity shows its type (CHECKIN, REVIEW, etc.)
✅ **Real-time Timestamps**: "2 minutes ago", "1 hour ago", etc.
✅ **Mixed Data**: Combination of real database data and smart simulations
✅ **Up to 8 Activities**: Shows more activities for better engagement
✅ **Empty State**: Friendly message when no activities exist

## To See All Scenarios:

1. **Run the demo script**: `database/mockdata/demo-all-activities.sql`
2. **Refresh the dashboard** multiple times to see different simulated activities
3. **Check during peak hours** (11 AM-2 PM, 5-8 PM) for capacity alerts
4. **Add real reviews/favorites** if you have those tables set up

The activity feed will show a dynamic mix of real and simulated activities, giving venue owners a comprehensive view of everything happening at their venue!