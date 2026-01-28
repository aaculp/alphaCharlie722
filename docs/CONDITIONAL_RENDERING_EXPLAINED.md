# Smart Conditional Rendering & Color-Coding Explained

## 1. Smart Conditional Rendering

### What It Means
Conditional rendering means that stat cards only appear on the profile screen when the user has actual data for that metric. This creates a clean, progressive experience that grows with user engagement.

### Why It Matters
- **New users** see a clean, simple profile (not overwhelming)
- **Active users** see rich, personalized data (engaging)
- **No clutter** from empty or zero-value metrics
- **Progressive disclosure** - UI grows as user engages more

### How It Works

#### Example 1: Flash Offers Card
```typescript
{/* Only show if user has redeemed at least 1 offer */}
{(profileData?.redeemedOffersCount ?? 0) > 0 && (
  <StatCard
    icon="flash"
    label="Offers Redeemed"
    value={profileData?.redeemedOffersCount || 0}
    iconColor="#F59E0B"
  />
)}
```

**Breakdown:**
- `profileData?.redeemedOffersCount` - Gets the count (undefined if not loaded)
- `?? 0` - If undefined, use 0 as default
- `> 0` - Only true if count is greater than 0
- `&&` - If condition is true, render the StatCard
- If false, nothing renders (card is hidden)

#### Example 2: Current Streak Card
```typescript
{/* Only show if user has an active streak */}
{(profileData?.currentStreak ?? 0) > 0 && (
  <StatCard
    icon="flame"
    label="Current Streak"
    value={profileData?.currentStreak || 0}
    iconColor="#EF4444"
    subtitle="Days in a row"
  />
)}
```

**Why this matters:**
- If user hasn't checked in recently → No streak → Card hidden
- If user has 7-day streak → Card shows "7"
- Encourages users to maintain streaks (gamification)

#### Example 3: Top Venue Card
```typescript
{/* Only show if user has a top venue */}
{profileData?.topVenue && (
  <StatCard
    icon="ribbon"
    label="Top Venue"
    value={profileData.topVenue.visitCount}
    iconColor="#10B981"
    subtitle={profileData.topVenue.name}
  />
)}
```

**Why this matters:**
- New users with no check-ins → No top venue → Card hidden
- Users with check-ins → Shows their favorite spot
- Provides personalized insight

### Visual Comparison

#### New User Profile (Just Signed Up)
```
┌──────────────┬──────────────┐
│ Check-ins: 0 │ Venues: 0    │
├──────────────┼──────────────┤
│ This Month:0 │ Favorites: 0 │
└──────────────┴──────────────┘

Only 4 cards visible
Clean, simple interface
Not overwhelming
```

#### Active User Profile (100+ check-ins, reviews, offers)
```
┌──────────────┬──────────────┐
│ Check-ins:   │ Venues: 25   │
│ 127          │              │
├──────────────┼──────────────┤
│ This Month:  │ Favorites:   │
│ 18           │ 12           │
├──────────────┼──────────────┤
│ Offers: 5    │ Avg Rating   │  ← These cards only
│              │ 4.3          │     appear because
├──────────────┼──────────────┤     user has data
│ Helpful: 15  │ Current      │
│              │ Streak: 7    │
├──────────────┼──────────────┤
│ Longest: 14  │ Top Venue    │
│              │ Joe's (23x)  │
├──────────────┼──────────────┤
│ Most Active  │ Favorite     │
│ Friday       │ Evening      │
└──────────────┴──────────────┘

Up to 12 cards visible
Rich, personalized data
Highly engaging
```

### The Nullish Coalescing Operator (`??`)

You'll see this pattern throughout:
```typescript
(profileData?.redeemedOffersCount ?? 0) > 0
```

**What it does:**
- `profileData?.redeemedOffersCount` - Safely access the property
- `?? 0` - If the value is `null` or `undefined`, use `0` instead
- `> 0` - Check if the result is greater than 0

**Why not just use `||`?**
```typescript
// Problem with ||
(profileData?.redeemedOffersCount || 0) > 0
// If redeemedOffersCount is 0, it's falsy, so becomes 0
// This works, but ?? is more explicit

// Better with ??
(profileData?.redeemedOffersCount ?? 0) > 0
// Only replaces null/undefined, not 0
// More semantically correct
```

### Core Stats vs Conditional Stats

#### Core Stats (Always Visible)
```typescript
// These ALWAYS show, even if value is 0
<StatCard
  icon="location"
  label="Check-ins"
  value={profileData?.checkInsCount || 0}
  iconColor={theme.colors.primary}
/>
```
**Why always visible:**
- Fundamental metrics everyone should see
- Shows potential (even at 0)
- Encourages first action

#### Conditional Stats (Show When > 0)
```typescript
// These ONLY show when user has data
{(profileData?.redeemedOffersCount ?? 0) > 0 && (
  <StatCard
    icon="flash"
    label="Offers Redeemed"
    value={profileData?.redeemedOffersCount || 0}
    iconColor="#F59E0B"
  />
)}
```
**Why conditional:**
- Not everyone uses these features
- Reduces clutter for non-users
- Highlights achievements when earned

---

## 2. Color-Coded Icons

### What It Means
Each metric has a unique, meaningful color that helps users quickly identify and understand different types of stats at a glance.

### Why It Matters
- **Visual hierarchy** - Different colors draw attention
- **Quick scanning** - Users can find metrics faster
- **Semantic meaning** - Colors convey meaning
- **Aesthetic appeal** - Makes profile more engaging
- **Accessibility** - Combined with icons, not just color

### The Color Palette

#### Core Stats (Theme Colors)
```typescript
// Check-ins - Primary Blue
<StatCard
  icon="location"
  label="Check-ins"
  value={42}
  iconColor={theme.colors.primary}  // 🔵 Blue
/>

// Venues - Success Green
<StatCard
  icon="business"
  label="Venues"
  value={15}
  iconColor={theme.colors.success}  // 🟢 Green
/>

// This Month - Warning Yellow
<StatCard
  icon="calendar"
  label="This Month"
  value={12}
  iconColor={theme.colors.warning}  // 🟡 Yellow
/>

// Favorites - Error Red (Heart color)
<StatCard
  icon="heart"
  label="Favorites"
  value={8}
  iconColor={theme.colors.error}  // ❤️ Red
/>
```

**Why theme colors:**
- Consistent with app design
- Adapts to light/dark mode
- Professional appearance

#### Engagement Stats (Custom Colors)
```typescript
// Flash Offers - Amber (Energy, Excitement)
<StatCard
  icon="flash"
  label="Offers Redeemed"
  value={5}
  iconColor="#F59E0B"  // ⚡ Amber
/>

// Average Rating - Purple (Quality, Premium)
<StatCard
  icon="star"
  label="Avg Rating"
  value="4.2"
  iconColor="#8B5CF6"  // ⭐ Purple
/>

// Helpful Votes - Cyan (Community, Support)
<StatCard
  icon="thumbs-up"
  label="Helpful Votes"
  value={23}
  iconColor="#06B6D4"  // 👍 Cyan
/>
```

**Why custom colors:**
- Stand out from core stats
- Convey specific meanings
- Create visual interest

#### Achievement Stats (Warm Colors)
```typescript
// Current Streak - Red (Fire, Passion)
<StatCard
  icon="flame"
  label="Current Streak"
  value={7}
  iconColor="#EF4444"  // 🔥 Red
/>

// Longest Streak - Amber (Trophy, Achievement)
<StatCard
  icon="trophy"
  label="Longest Streak"
  value={14}
  iconColor="#F59E0B"  // 🏆 Amber
/>

// Top Venue - Green (Winner, Success)
<StatCard
  icon="ribbon"
  label="Top Venue"
  value={12}
  iconColor="#10B981"  // 🎗️ Green
/>
```

**Why warm colors:**
- Associated with achievement
- Energetic and motivating
- Gamification psychology

#### Pattern Stats (Cool Colors)
```typescript
// Most Active Day - Indigo (Calendar, Planning)
<StatCard
  icon="calendar-outline"
  label="Most Active"
  value="Friday"
  iconColor="#6366F1"  // 📅 Indigo
/>

// Favorite Time - Pink (Time, Preference)
<StatCard
  icon="time-outline"
  label="Favorite Time"
  value="Evening"
  iconColor="#EC4899"  // ⏰ Pink
/>
```

**Why cool colors:**
- Analytical/informational
- Less urgent than achievements
- Visually distinct

### Color Psychology

| Color | Meaning | Used For | Why |
|-------|---------|----------|-----|
| 🔵 Blue | Trust, Stability | Check-ins | Core metric, reliable |
| 🟢 Green | Growth, Success | Venues, Top Venue | Exploration, achievement |
| 🟡 Yellow | Energy, Attention | This Month | Current activity |
| ❤️ Red | Love, Passion | Favorites, Streak | Emotional connection |
| ⚡ Amber | Excitement, Value | Offers, Trophy | Rewards, wins |
| ⭐ Purple | Quality, Premium | Ratings | Excellence |
| 👍 Cyan | Community, Support | Helpful Votes | Social validation |
| 🔥 Red | Fire, Intensity | Current Streak | Active engagement |
| 📅 Indigo | Planning, Insight | Most Active Day | Patterns |
| ⏰ Pink | Time, Personal | Favorite Time | Preferences |

### Visual Example

```
Profile Screen
┌─────────────────────────────────────┐
│                                     │
│  ┌──────────┐  ┌──────────┐       │
│  │ 🔵 📍    │  │ 🟢 🏢    │       │
│  │ Check-ins│  │ Venues   │       │
│  │    42    │  │    15    │       │
│  └──────────┘  └──────────┘       │
│                                     │
│  ┌──────────┐  ┌──────────┐       │
│  │ 🟡 📅    │  │ ❤️ ❤️     │       │
│  │ This     │  │ Favorites│       │
│  │ Month 12 │  │     8    │       │
│  └──────────┘  └──────────┘       │
│                                     │
│  ┌──────────┐  ┌──────────┐       │
│  │ ⚡ ⚡     │  │ ⭐ ⭐     │       │
│  │ Offers   │  │ Avg      │       │
│  │ Redeemed │  │ Rating   │       │
│  │     5    │  │   4.2    │       │
│  └──────────┘  └──────────┘       │
│                                     │
│  ┌──────────┐  ┌──────────┐       │
│  │ 👍 👍    │  │ 🔥 🔥    │       │
│  │ Helpful  │  │ Current  │       │
│  │ Votes    │  │ Streak   │       │
│  │    23    │  │     7    │       │
│  └──────────┘  └──────────┘       │
│                                     │
└─────────────────────────────────────┘

Each card has:
- Colored icon circle (background)
- White icon inside
- Label text
- Large number
- Optional subtitle
```

### How Colors Are Applied

In the StatCard component:
```typescript
<View style={[styles.iconCircle, { backgroundColor: iconColor }]}>
  <Icon name={icon} size={16} color={theme.colors.surface} />
</View>
```

**What happens:**
1. `iconColor` prop is passed to StatCard
2. Applied as `backgroundColor` to icon circle
3. Icon itself is white (`theme.colors.surface`)
4. Creates colored circle with white icon inside

### Accessibility Considerations

**Not just color:**
- Icons provide visual meaning
- Labels provide text meaning
- Numbers provide data
- Color is enhancement, not requirement

**Color contrast:**
- All colors meet WCAG AA standards
- Icons are white on colored backgrounds
- High contrast for readability

**Color blindness:**
- Icons differentiate metrics
- Labels provide context
- Not relying solely on color

### Dark Mode Support

Colors work in both light and dark mode:

**Light Mode:**
```
┌──────────────┐
│ 🔵 Check-ins │  ← Blue circle
│              │     White icon
│      42      │     Dark text
└──────────────┘     Light background
```

**Dark Mode:**
```
┌──────────────┐
│ 🔵 Check-ins │  ← Blue circle (same)
│              │     White icon (same)
│      42      │     Light text
└──────────────┘     Dark background
```

The colored circles remain consistent, providing visual continuity across themes.

### Customization

Want to change a color? Easy:
```typescript
// Before
<StatCard
  icon="flash"
  label="Offers Redeemed"
  value={5}
  iconColor="#F59E0B"  // Amber
/>

// After (change to orange)
<StatCard
  icon="flash"
  label="Offers Redeemed"
  value={5}
  iconColor="#FF6B35"  // Orange
/>
```

### Best Practices

1. **Consistent colors** - Same metric always same color
2. **Meaningful colors** - Color matches metric meaning
3. **Sufficient contrast** - Always readable
4. **Not too many** - 10-12 colors max
5. **Grouped by type** - Similar metrics, similar color families

---

## Combined Effect

When you combine **conditional rendering** with **color-coding**, you get:

### New User Experience
```
Simple, clean profile
Only 4 cards (all blue/green/yellow/red)
Easy to understand
Not overwhelming
```

### Active User Experience
```
Rich, colorful profile
Up to 12 cards (rainbow of colors)
Each color tells a story
Engaging and motivating
Quick to scan
```

### Progressive Disclosure
```
Day 1:  4 cards  (core stats)
Day 7:  6 cards  (+ streak, top venue)
Day 30: 8 cards  (+ reviews, helpful votes)
Day 60: 12 cards (+ all patterns)
```

The profile literally grows with the user, becoming more colorful and informative as they engage more with the app!

---

## Summary

**Smart Conditional Rendering:**
- Cards only appear when user has data
- Keeps UI clean for new users
- Rewards active users with rich data
- Progressive disclosure pattern

**Color-Coded Icons:**
- Each metric has unique color
- Quick visual identification
- Semantic meaning
- Aesthetic appeal
- Accessible design

Together, they create a profile that's:
- ✅ Clean for beginners
- ✅ Rich for power users
- ✅ Easy to scan
- ✅ Visually engaging
- ✅ Motivating
- ✅ Accessible
