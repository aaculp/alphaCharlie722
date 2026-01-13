# Recent Check-Ins Enhancement Ideas

This document outlines comprehensive enhancement ideas for the Recent Check-Ins feature, including technical implementation details, database schemas, UI mockups, and user flows.

---

## Table of Contents

1. [Visit Streak Badges](#1-visit-streak-badges)
2. [Visit Milestones](#2-visit-milestones)
3. [Spending Insights](#3-spending-insights)
4. [Personal Stats Section](#4-personal-stats-section)
5. [Personalized Recommendations](#5-personalized-recommendations)
6. [Social Features](#6-social-features)
7. [Venue Loyalty Programs](#7-venue-loyalty-programs)

---

## 1. Visit Streak Badges

### Overview
Display contextual badges on venue cards that highlight the user's visit patterns and relationship with each venue. This creates a sense of progression and recognition for frequent visitors.

### Badge Types

**Visit Frequency Badges:**
- "First Timer" - First visit to this venue
- "2nd Visit" - Second visit
- "Regular" 🔥 - 5+ visits
- "VIP" ⭐ - 10+ visits
- "Legend" 👑 - 25+ visits

**Time-Based Badges:**
- "3rd visit this week!" - Multiple visits in current week
- "Back again!" - Visited within last 3 days
- "Long time no see" - First visit in 30+ days
- "Weekend Warrior" - Primarily visits on weekends

### Technical Implementation

#### Database Schema
```sql
-- Add to existing check_ins table or create new analytics table
CREATE TABLE user_venue_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  total_visits INTEGER DEFAULT 0,
  first_visit_at TIMESTAMP WITH TIME ZONE,
  last_visit_at TIMESTAMP WITH TIME ZONE,
  visits_this_week INTEGER DEFAULT 0,
  visits_this_month INTEGER DEFAULT 0,
  average_visit_duration INTERVAL,
  preferred_visit_days INTEGER[], -- Array of day numbers (0-6)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, venue_id)
);

-- Index for fast lookups
CREATE INDEX idx_user_venue_analytics_user ON user_venue_analytics(user_id);
CREATE INDEX idx_user_venue_analytics_venue ON user_venue_analytics(venue_id);
```

#### Service Layer
```typescript
// src/services/api/venueAnalytics.ts
export class VenueAnalyticsService {
  static async getUserVenueAnalytics(
    userId: string,
    venueId: string
  ): Promise<UserVenueAnalytics> {
    const { data, error } = await supabase
      .from('user_venue_analytics')
      .select('*')
      .eq('user_id', userId)
      .eq('venue_id', venueId)
      .single();

    if (error) throw error;
    return data;
  }

  static async getBadgeForVenue(
    userId: string,
    venueId: string
  ): Promise<VenueBadge> {
    const analytics = await this.getUserVenueAnalytics(userId, venueId);
    return this.calculateBadge(analytics);
  }

  private static calculateBadge(analytics: UserVenueAnalytics): VenueBadge {
    const { total_visits, last_visit_at, visits_this_week } = analytics;

    // Priority order for badge display
    if (total_visits >= 25) {
      return { type: 'legend', label: 'Legend 👑', color: '#FFD700' };
    }
    if (total_visits >= 10) {
      return { type: 'vip', label: 'VIP ⭐', color: '#9333EA' };
    }
    if (total_visits >= 5) {
      return { type: 'regular', label: 'Regular 🔥', color: '#EF4444' };
    }
    if (visits_this_week >= 3) {
      return { 
        type: 'weekly_streak', 
        label: `${visits_this_week} visits this week!`, 
        color: '#10B981' 
      };
    }
    if (total_visits === 1) {
      return { type: 'first_timer', label: 'First Timer', color: '#3B82F6' };
    }
    if (total_visits === 2) {
      return { type: 'second_visit', label: '2nd Visit', color: '#6366F1' };
    }

    return { type: 'visitor', label: `${total_visits} visits`, color: '#6B7280' };
  }
}
```


#### UI Component
```typescript
// src/components/venue/VenueBadge.tsx
interface VenueBadgeProps {
  userId: string;
  venueId: string;
  size?: 'small' | 'medium';
}

export const VenueBadge: React.FC<VenueBadgeProps> = ({ 
  userId, 
  venueId, 
  size = 'small' 
}) => {
  const [badge, setBadge] = useState<VenueBadge | null>(null);

  useEffect(() => {
    VenueAnalyticsService.getBadgeForVenue(userId, venueId)
      .then(setBadge)
      .catch(console.error);
  }, [userId, venueId]);

  if (!badge) return null;

  return (
    <View style={[styles.badge, { backgroundColor: badge.color }]}>
      <Text style={styles.badgeText}>{badge.label}</Text>
    </View>
  );
};
```

#### Integration with RecentCheckInsSection
```typescript
// Add to RecentCheckInCard component
<View style={styles.badgeContainer}>
  <VenueBadge 
    userId={checkIn.user_id} 
    venueId={checkIn.venue_id} 
    size="small" 
  />
</View>
```

### UI Mockup
```
┌─────────────────────────────────────────┐
│  🕐 Recently Visited                    │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────┐  ┌──────┐  ┌──────┐         │
│  │ IMG  │  │ IMG  │  │ IMG  │         │
│  │      │  │      │  │      │         │
│  ├──────┤  ├──────┤  ├──────┤         │
│  │Cafe  │  │Bar   │  │Rest  │         │
│  │☕    │  │🍺    │  │🍽️    │         │
│  │      │  │      │  │      │         │
│  │[🔥Regular]│[⭐VIP]│[First]│         │
│  │2h ago│  │1d ago│  │3d ago│         │
│  │😊 12 │  │🔥 45 │  │😊 8  │         │
│  └──────┘  └──────┘  └──────┘         │
│                                         │
└─────────────────────────────────────────┘
```

---

## 2. Visit Milestones

### Overview
Celebrate significant achievements in a user's venue exploration journey with animations, special badges, and shareable moments. This gamifies the experience and encourages continued engagement.

### Milestone Types

**Visit Count Milestones:**
- 10th visit to any venue
- 25th visit to any venue
- 50th visit to any venue
- 100th visit to any venue
- 10th visit to a specific venue
- First visit to 10 different venues
- First visit to 25 different venues

**Category Milestones:**
- Visited all venue categories
- 10 coffee shops visited
- 5 bars visited in one week

**Time-Based Milestones:**
- 7-day check-in streak
- 30-day check-in streak
- Checked in every day this week

### Technical Implementation

#### Database Schema
```sql
CREATE TABLE user_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  milestone_type VARCHAR(50) NOT NULL,
  milestone_value INTEGER NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
  is_shared BOOLEAN DEFAULT FALSE,
  metadata JSONB, -- Additional context (e.g., venue name, category)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_milestones_user ON user_milestones(user_id);
CREATE INDEX idx_user_milestones_type ON user_milestones(milestone_type);

-- Milestone definitions table
CREATE TABLE milestone_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  threshold INTEGER NOT NULL,
  reward_points INTEGER DEFAULT 0,
  badge_color VARCHAR(7),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed milestone definitions
INSERT INTO milestone_definitions (type, title, description, icon, threshold, reward_points, badge_color) VALUES
('total_visits_10', '10 Visits', 'Checked in 10 times', '🎉', 10, 100, '#3B82F6'),
('total_visits_25', '25 Visits', 'Checked in 25 times', '🌟', 25, 250, '#8B5CF6'),
('total_visits_50', '50 Visits', 'Checked in 50 times', '💎', 50, 500, '#EC4899'),
('total_visits_100', '100 Visits', 'Century Club!', '👑', 100, 1000, '#FFD700'),
('venue_visits_10', 'Loyal Customer', '10 visits to one venue', '🔥', 10, 200, '#EF4444'),
('unique_venues_10', 'Explorer', 'Visited 10 different venues', '🗺️', 10, 150, '#10B981'),
('unique_venues_25', 'Adventurer', 'Visited 25 different venues', '🧭', 25, 400, '#F59E0B'),
('streak_7', 'Week Warrior', '7-day check-in streak', '⚡', 7, 300, '#6366F1');
```

#### Service Layer
```typescript
// src/services/api/milestones.ts
export class MilestoneService {
  static async checkAndAwardMilestones(
    userId: string,
    checkInId: string
  ): Promise<UserMilestone[]> {
    const newMilestones: UserMilestone[] = [];

    // Get user's total check-in count
    const totalVisits = await this.getUserTotalVisits(userId);
    
    // Check total visit milestones
    const visitMilestones = [10, 25, 50, 100];
    for (const threshold of visitMilestones) {
      if (totalVisits === threshold) {
        const milestone = await this.awardMilestone(
          userId,
          `total_visits_${threshold}`,
          threshold
        );
        newMilestones.push(milestone);
      }
    }

    // Get unique venues count
    const uniqueVenues = await this.getUserUniqueVenuesCount(userId);
    const uniqueMilestones = [10, 25, 50];
    for (const threshold of uniqueMilestones) {
      if (uniqueVenues === threshold) {
        const milestone = await this.awardMilestone(
          userId,
          `unique_venues_${threshold}`,
          threshold
        );
        newMilestones.push(milestone);
      }
    }

    // Check streak milestones
    const currentStreak = await this.getUserCurrentStreak(userId);
    if (currentStreak === 7 || currentStreak === 30) {
      const milestone = await this.awardMilestone(
        userId,
        `streak_${currentStreak}`,
        currentStreak
      );
      newMilestones.push(milestone);
    }

    return newMilestones;
  }

  private static async awardMilestone(
    userId: string,
    milestoneType: string,
    value: number,
    venueId?: string
  ): Promise<UserMilestone> {
    // Check if already awarded
    const { data: existing } = await supabase
      .from('user_milestones')
      .select('id')
      .eq('user_id', userId)
      .eq('milestone_type', milestoneType)
      .single();

    if (existing) {
      return existing;
    }

    // Award new milestone
    const { data, error } = await supabase
      .from('user_milestones')
      .insert({
        user_id: userId,
        milestone_type: milestoneType,
        milestone_value: value,
        venue_id: venueId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getUserMilestones(userId: string): Promise<UserMilestone[]> {
    const { data, error } = await supabase
      .from('user_milestones')
      .select(`
        *,
        milestone_definitions(*)
      `)
      .eq('user_id', userId)
      .order('achieved_at', { ascending: false });

    if (error) throw error;
    return data;
  }
}
```


#### UI Component - Milestone Celebration Modal
```typescript
// src/components/milestones/MilestoneCelebration.tsx
interface MilestoneCelebrationProps {
  milestone: UserMilestone;
  visible: boolean;
  onClose: () => void;
  onShare: () => void;
}

export const MilestoneCelebration: React.FC<MilestoneCelebrationProps> = ({
  milestone,
  visible,
  onClose,
  onShare
}) => {
  const { theme } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          {/* Confetti animation */}
          <LottieView
            source={require('../../assets/animations/confetti.json')}
            autoPlay
            loop={false}
            style={styles.confetti}
          />

          <Text style={styles.icon}>{milestone.definition.icon}</Text>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {milestone.definition.title}
          </Text>
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            {milestone.definition.description}
          </Text>

          {milestone.reward_points > 0 && (
            <View style={styles.rewardBadge}>
              <Text style={styles.rewardText}>
                +{milestone.reward_points} points
              </Text>
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.shareButton]}
              onPress={onShare}
            >
              <Icon name="share-social" size={20} color="#FFF" />
              <Text style={styles.buttonText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.closeButton]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, { color: theme.colors.text }]}>
                Continue
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};
```

#### Integration with Check-In Flow
```typescript
// src/screens/customer/VenueDetailScreen.tsx
const handleCheckIn = async () => {
  try {
    const checkIn = await CheckInService.checkIn(venueId, user.id);
    
    // Check for new milestones
    const newMilestones = await MilestoneService.checkAndAwardMilestones(
      user.id,
      checkIn.id
    );

    // Show celebration modal for first new milestone
    if (newMilestones.length > 0) {
      setMilestoneToShow(newMilestones[0]);
      setShowMilestoneCelebration(true);
    }
  } catch (error) {
    console.error('Check-in error:', error);
  }
};
```

### UI Mockup
```
┌─────────────────────────────────────────┐
│                                         │
│           ✨ ✨ ✨ ✨ ✨              │
│                                         │
│              🎉                         │
│                                         │
│         10 Visits!                      │
│                                         │
│    You've checked in 10 times!          │
│                                         │
│         [+100 points]                   │
│                                         │
│   ┌──────────┐  ┌──────────┐          │
│   │  Share   │  │ Continue │          │
│   └──────────┘  └──────────┘          │
│                                         │
└─────────────────────────────────────────┘
```

---

## 3. Spending Insights

### Overview
Track and visualize spending patterns across venues, helping users understand their habits and make informed decisions. Requires integration with payment systems or manual entry.

### Features

**Per-Venue Spending:**
- Total spent at each venue
- Average spend per visit
- Last transaction amount
- Spending trend (increasing/decreasing)

**Aggregate Insights:**
- Monthly spending breakdown by venue
- Spending by category (Coffee, Dining, Bars, etc.)
- Most expensive venue
- Best value venue (based on rating vs. price)

**Budget Tracking:**
- Set monthly venue spending budget
- Alerts when approaching budget limit
- Spending vs. budget visualization

### Technical Implementation

#### Database Schema
```sql
CREATE TABLE user_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  check_in_id UUID REFERENCES check_ins(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payment_method VARCHAR(50),
  items JSONB, -- Optional: itemized receipt
  tip_amount DECIMAL(10, 2),
  tax_amount DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_transactions_user ON user_transactions(user_id);
CREATE INDEX idx_user_transactions_venue ON user_transactions(venue_id);
CREATE INDEX idx_user_transactions_date ON user_transactions(transaction_date);

CREATE TABLE user_budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  budget_type VARCHAR(20) NOT NULL, -- 'monthly', 'weekly', 'category'
  amount DECIMAL(10, 2) NOT NULL,
  category VARCHAR(50), -- Optional: for category-specific budgets
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Service Layer
```typescript
// src/services/api/spending.ts
export class SpendingService {
  static async addTransaction(
    userId: string,
    venueId: string,
    amount: number,
    checkInId?: string
  ): Promise<Transaction> {
    const { data, error } = await supabase
      .from('user_transactions')
      .insert({
        user_id: userId,
        venue_id: venueId,
        check_in_id: checkInId,
        amount
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getVenueSpending(
    userId: string,
    venueId: string
  ): Promise<VenueSpendingStats> {
    const { data, error } = await supabase
      .from('user_transactions')
      .select('amount, transaction_date')
      .eq('user_id', userId)
      .eq('venue_id', venueId)
      .order('transaction_date', { ascending: false });

    if (error) throw error;

    const total = data.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const average = data.length > 0 ? total / data.length : 0;
    const lastAmount = data.length > 0 ? parseFloat(data[0].amount) : 0;

    return {
      total,
      average,
      lastAmount,
      transactionCount: data.length,
      transactions: data
    };
  }

  static async getMonthlySpending(
    userId: string,
    year: number,
    month: number
  ): Promise<MonthlySpendingBreakdown> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const { data, error } = await supabase
      .from('user_transactions')
      .select(`
        amount,
        venue_id,
        venues(name, category)
      `)
      .eq('user_id', userId)
      .gte('transaction_date', startDate.toISOString())
      .lte('transaction_date', endDate.toISOString());

    if (error) throw error;

    // Group by venue
    const byVenue = new Map<string, number>();
    const byCategory = new Map<string, number>();
    let total = 0;

    data.forEach(transaction => {
      const amount = parseFloat(transaction.amount);
      total += amount;

      // By venue
      const venueTotal = byVenue.get(transaction.venue_id) || 0;
      byVenue.set(transaction.venue_id, venueTotal + amount);

      // By category
      const category = transaction.venues.category;
      const categoryTotal = byCategory.get(category) || 0;
      byCategory.set(category, categoryTotal + amount);
    });

    return {
      total,
      byVenue: Object.fromEntries(byVenue),
      byCategory: Object.fromEntries(byCategory),
      transactionCount: data.length
    };
  }

  static async checkBudgetStatus(
    userId: string
  ): Promise<BudgetStatus> {
    // Get active monthly budget
    const { data: budget } = await supabase
      .from('user_budgets')
      .select('*')
      .eq('user_id', userId)
      .eq('budget_type', 'monthly')
      .gte('end_date', new Date().toISOString())
      .single();

    if (!budget) {
      return { hasBudget: false };
    }

    // Get current month spending
    const now = new Date();
    const spending = await this.getMonthlySpending(
      userId,
      now.getFullYear(),
      now.getMonth() + 1
    );

    const percentUsed = (spending.total / parseFloat(budget.amount)) * 100;
    const remaining = parseFloat(budget.amount) - spending.total;

    return {
      hasBudget: true,
      budgetAmount: parseFloat(budget.amount),
      spent: spending.total,
      remaining,
      percentUsed,
      isOverBudget: remaining < 0,
      isNearLimit: percentUsed >= 80
    };
  }
}
```


#### UI Component - Spending Card
```typescript
// src/components/spending/VenueSpendingCard.tsx
interface VenueSpendingCardProps {
  venueId: string;
  userId: string;
}

export const VenueSpendingCard: React.FC<VenueSpendingCardProps> = ({
  venueId,
  userId
}) => {
  const { theme } = useTheme();
  const [spending, setSpending] = useState<VenueSpendingStats | null>(null);

  useEffect(() => {
    SpendingService.getVenueSpending(userId, venueId)
      .then(setSpending)
      .catch(console.error);
  }, [userId, venueId]);

  if (!spending || spending.transactionCount === 0) return null;

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.header}>
        <Icon name="wallet-outline" size={20} color={theme.colors.primary} />
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Your Spending
        </Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Total
          </Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            ${spending.total.toFixed(2)}
          </Text>
        </View>

        <View style={styles.stat}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Avg per visit
          </Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            ${spending.average.toFixed(2)}
          </Text>
        </View>

        <View style={styles.stat}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Last visit
          </Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>
            ${spending.lastAmount.toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  );
};
```

#### Integration with RecentCheckInsSection
```typescript
// Add spending indicator to card
<View style={styles.spendingRow}>
  <Icon name="cash-outline" size={12} color={theme.colors.textSecondary} />
  <Text style={[styles.spendingText, { color: theme.colors.textSecondary }]}>
    ${venueSpending?.total.toFixed(0) || '0'}
  </Text>
</View>
```

### UI Mockup
```
┌─────────────────────────────────────────┐
│  💰 Your Spending                       │
├─────────────────────────────────────────┤
│                                         │
│  This Month: $245.50                    │
│  Budget: $300.00                        │
│  [████████░░] 82%                       │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Top Venues                      │   │
│  ├─────────────────────────────────┤   │
│  │ 1. Coffee House      $85.00     │   │
│  │ 2. Pizza Place       $65.50     │   │
│  │ 3. Cocktail Bar      $55.00     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  By Category:                           │
│  ☕ Coffee: $85.00 (35%)                │
│  🍕 Dining: $105.50 (43%)               │
│  🍺 Bars: $55.00 (22%)                  │
│                                         │
└─────────────────────────────────────────┘
```

---

## 4. Personal Stats Section

### Overview
A comprehensive analytics dashboard that provides users with insights into their venue exploration habits, preferences, and patterns. This creates engagement through self-discovery and gamification.

### Stats Categories

**Activity Stats:**
- Total venues visited (all-time)
- Venues visited this month/week
- Most visited venue
- Average visits per week
- Current check-in streak
- Longest check-in streak

**Preference Stats:**
- Favorite category (most visited)
- Favorite time of day (morning/afternoon/evening)
- Favorite day of week
- Average visit duration
- Most explored neighborhood

**Discovery Stats:**
- New venues discovered this month
- Categories explored
- Distance traveled (total miles)
- Furthest venue visited

### Technical Implementation

#### Database Schema
```sql
CREATE TABLE user_stats_cache (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_venues_visited INTEGER DEFAULT 0,
  total_check_ins INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  favorite_category VARCHAR(50),
  favorite_day_of_week INTEGER,
  favorite_time_of_day VARCHAR(20), -- 'morning', 'afternoon', 'evening', 'night'
  average_visit_duration INTERVAL,
  total_distance_traveled DECIMAL(10, 2),
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to recalculate user stats
CREATE OR REPLACE FUNCTION calculate_user_stats(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_total_venues INTEGER;
  v_total_checkins INTEGER;
  v_favorite_category VARCHAR(50);
BEGIN
  -- Count unique venues
  SELECT COUNT(DISTINCT venue_id) INTO v_total_venues
  FROM check_ins
  WHERE user_id = p_user_id;

  -- Count total check-ins
  SELECT COUNT(*) INTO v_total_checkins
  FROM check_ins
  WHERE user_id = p_user_id;

  -- Find favorite category
  SELECT v.category INTO v_favorite_category
  FROM check_ins ci
  JOIN venues v ON ci.venue_id = v.id
  WHERE ci.user_id = p_user_id
  GROUP BY v.category
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  -- Upsert stats
  INSERT INTO user_stats_cache (
    user_id,
    total_venues_visited,
    total_check_ins,
    favorite_category,
    last_calculated_at
  ) VALUES (
    p_user_id,
    v_total_venues,
    v_total_checkins,
    v_favorite_category,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_venues_visited = EXCLUDED.total_venues_visited,
    total_check_ins = EXCLUDED.total_check_ins,
    favorite_category = EXCLUDED.favorite_category,
    last_calculated_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
```

#### Service Layer
```typescript
// src/services/api/userStats.ts
export class UserStatsService {
  static async getUserStats(userId: string): Promise<UserStats> {
    // Try to get cached stats
    const { data: cached } = await supabase
      .from('user_stats_cache')
      .select('*')
      .eq('user_id', userId)
      .single();

    // If cache is fresh (< 1 hour old), return it
    if (cached && this.isCacheFresh(cached.last_calculated_at)) {
      return this.transformCachedStats(cached);
    }

    // Otherwise, recalculate
    await supabase.rpc('calculate_user_stats', { p_user_id: userId });

    // Fetch fresh stats
    const { data, error } = await supabase
      .from('user_stats_cache')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return this.transformCachedStats(data);
  }

  static async getMonthlyStats(
    userId: string,
    year: number,
    month: number
  ): Promise<MonthlyStats> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const { data, error } = await supabase
      .from('check_ins')
      .select(`
        id,
        venue_id,
        checked_in_at,
        checked_out_at,
        venues(category, latitude, longitude)
      `)
      .eq('user_id', userId)
      .gte('checked_in_at', startDate.toISOString())
      .lte('checked_in_at', endDate.toISOString());

    if (error) throw error;

    // Calculate stats
    const uniqueVenues = new Set(data.map(ci => ci.venue_id)).size;
    const totalCheckIns = data.length;
    
    // Calculate average duration
    const durations = data
      .filter(ci => ci.checked_out_at)
      .map(ci => {
        const checkIn = new Date(ci.checked_in_at);
        const checkOut = new Date(ci.checked_out_at!);
        return checkOut.getTime() - checkIn.getTime();
      });
    
    const avgDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

    // Find most visited category
    const categoryCount = new Map<string, number>();
    data.forEach(ci => {
      const category = ci.venues.category;
      categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
    });
    
    const mostVisitedCategory = Array.from(categoryCount.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    return {
      uniqueVenues,
      totalCheckIns,
      avgDuration: Math.round(avgDuration / 60000), // Convert to minutes
      mostVisitedCategory,
      checkInsByDay: this.groupByDay(data),
      checkInsByCategory: Object.fromEntries(categoryCount)
    };
  }

  static async getCurrentStreak(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('check_ins')
      .select('checked_in_at')
      .eq('user_id', userId)
      .order('checked_in_at', { ascending: false })
      .limit(100);

    if (error || !data || data.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const checkIn of data) {
      const checkInDate = new Date(checkIn.checked_in_at);
      checkInDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor(
        (currentDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff === streak) {
        streak++;
      } else if (daysDiff > streak) {
        break;
      }
    }

    return streak;
  }

  private static isCacheFresh(lastCalculated: string): boolean {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return new Date(lastCalculated) > oneHourAgo;
  }

  private static groupByDay(checkIns: any[]): { [key: string]: number } {
    const byDay: { [key: string]: number } = {};
    
    checkIns.forEach(ci => {
      const date = new Date(ci.checked_in_at).toISOString().split('T')[0];
      byDay[date] = (byDay[date] || 0) + 1;
    });

    return byDay;
  }
}
```


#### UI Component - Personal Stats Dashboard
```typescript
// src/components/stats/PersonalStatsSection.tsx
interface PersonalStatsSectionProps {
  userId: string;
}

export const PersonalStatsSection: React.FC<PersonalStatsSectionProps> = ({ userId }) => {
  const { theme } = useTheme();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [userStats, monthly] = await Promise.all([
          UserStatsService.getUserStats(userId),
          UserStatsService.getMonthlyStats(
            userId,
            new Date().getFullYear(),
            new Date().getMonth() + 1
          )
        ]);
        setStats(userStats);
        setMonthlyStats(monthly);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  if (loading || !stats) {
    return <ActivityIndicator />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.header}>
        <Icon name="stats-chart" size={24} color={theme.colors.primary} />
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Your Stats
        </Text>
      </View>

      {/* Current Streak */}
      {stats.currentStreak > 0 && (
        <View style={styles.streakBanner}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={[styles.streakText, { color: theme.colors.text }]}>
            {stats.currentStreak} day streak!
          </Text>
        </View>
      )}

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          icon="location"
          label="Venues Visited"
          value={stats.totalVenuesVisited}
          color="#3B82F6"
        />
        <StatCard
          icon="checkmark-circle"
          label="Total Check-ins"
          value={stats.totalCheckIns}
          color="#10B981"
        />
        <StatCard
          icon="heart"
          label="Favorite Category"
          value={stats.favoriteCategory}
          color="#EC4899"
        />
        <StatCard
          icon="time"
          label="Avg Duration"
          value={`${stats.averageVisitDuration}m`}
          color="#F59E0B"
        />
      </View>

      {/* This Month Section */}
      {monthlyStats && (
        <View style={styles.monthSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            This Month
          </Text>
          <View style={styles.monthStats}>
            <View style={styles.monthStat}>
              <Text style={[styles.monthValue, { color: theme.colors.text }]}>
                {monthlyStats.uniqueVenues}
              </Text>
              <Text style={[styles.monthLabel, { color: theme.colors.textSecondary }]}>
                New Venues
              </Text>
            </View>
            <View style={styles.monthStat}>
              <Text style={[styles.monthValue, { color: theme.colors.text }]}>
                {monthlyStats.totalCheckIns}
              </Text>
              <Text style={[styles.monthLabel, { color: theme.colors.textSecondary }]}>
                Check-ins
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Category Breakdown */}
      {monthlyStats && (
        <View style={styles.categorySection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Top Categories
          </Text>
          {Object.entries(monthlyStats.checkInsByCategory)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([category, count]) => (
              <View key={category} style={styles.categoryRow}>
                <Text style={[styles.categoryName, { color: theme.colors.text }]}>
                  {category}
                </Text>
                <Text style={[styles.categoryCount, { color: theme.colors.textSecondary }]}>
                  {count} visits
                </Text>
              </View>
            ))}
        </View>
      )}
    </View>
  );
};

// Small stat card component
const StatCard: React.FC<{
  icon: string;
  label: string;
  value: string | number;
  color: string;
}> = ({ icon, label, value, color }) => {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.statCard, { backgroundColor: theme.colors.background }]}>
      <Icon name={icon} size={20} color={color} />
      <Text style={[styles.statValue, { color: theme.colors.text }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
};
```

#### Integration with HomeScreen
```typescript
// Add to HomeScreen after RecentCheckInsSection
{user && (
  <PersonalStatsSection userId={user.id} />
)}
```

### UI Mockup
```
┌─────────────────────────────────────────┐
│  📊 Your Stats                          │
├─────────────────────────────────────────┤
│                                         │
│  🔥 7 day streak!                       │
│                                         │
│  ┌─────────┐ ┌─────────┐              │
│  │📍 15    │ │✅ 42    │              │
│  │Venues   │ │Check-ins│              │
│  └─────────┘ └─────────┘              │
│  ┌─────────┐ ┌─────────┐              │
│  │❤️ Coffee│ │⏱️ 45m   │              │
│  │Category │ │Duration │              │
│  └─────────┘ └─────────┘              │
│                                         │
│  This Month                             │
│  ┌─────────────────────────────────┐   │
│  │  8 New Venues    12 Check-ins   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Top Categories                         │
│  ☕ Coffee Shops        5 visits        │
│  🍕 Restaurants         4 visits        │
│  🍺 Bars                3 visits        │
│                                         │
└─────────────────────────────────────────┘
```

---

## 5. Personalized Recommendations

### Overview
Use machine learning and collaborative filtering to suggest venues based on user behavior, preferences, and patterns. This increases discovery and engagement by surfacing relevant venues users might enjoy.

### Recommendation Types

**Based on History:**
- "People who visited X also loved Y"
- "Similar to venues you've visited"
- "More like [favorite venue]"

**Based on Patterns:**
- "You usually visit coffee shops on weekday mornings"
- "Try this bar - you love cocktail lounges"
- "New restaurant in your favorite category"

**Re-engagement:**
- "You haven't been here in a while" (venues not visited in 30+ days)
- "Come back to [venue name]"
- "Your favorite spot misses you"

**Discovery:**
- "Try something new" (categories user hasn't explored)
- "Trending in your area"
- "Hidden gems nearby"

### Technical Implementation

#### Database Schema
```sql
CREATE TABLE venue_similarities (
  venue_id_1 UUID REFERENCES venues(id) ON DELETE CASCADE,
  venue_id_2 UUID REFERENCES venues(id) ON DELETE CASCADE,
  similarity_score DECIMAL(3, 2) NOT NULL, -- 0.00 to 1.00
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (venue_id_1, venue_id_2)
);

CREATE INDEX idx_venue_similarities_score ON venue_similarities(similarity_score DESC);

CREATE TABLE user_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  recommendation_type VARCHAR(50) NOT NULL, -- 'similar', 'trending', 'comeback', 'new_category'
  score DECIMAL(3, 2) NOT NULL,
  reason TEXT,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  viewed_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  dismissed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_user_recommendations_user ON user_recommendations(user_id);
CREATE INDEX idx_user_recommendations_score ON user_recommendations(score DESC);
```

#### Service Layer
```typescript
// src/services/api/recommendations.ts
export class RecommendationService {
  static async getPersonalizedRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<VenueRecommendation[]> {
    try {
      // Get user's check-in history
      const history = await CheckInService.getUserCheckInHistory({
        userId,
        limit: 100,
        offset: 0
      });

      const visitedVenueIds = history.checkIns.map(ci => ci.venue_id);
      
      // Get recommendations based on multiple strategies
      const [similarVenues, trendingVenues, comebackVenues, newCategories] = 
        await Promise.all([
          this.getSimilarVenues(visitedVenueIds, limit),
          this.getTrendingVenues(userId, limit),
          this.getComebackVenues(userId, limit),
          this.getNewCategoryVenues(userId, limit)
        ]);

      // Combine and score recommendations
      const allRecommendations = [
        ...similarVenues,
        ...trendingVenues,
        ...comebackVenues,
        ...newCategories
      ];

      // Remove duplicates and sort by score
      const uniqueRecommendations = this.deduplicateAndScore(allRecommendations);

      // Store recommendations for analytics
      await this.storeRecommendations(userId, uniqueRecommendations);

      return uniqueRecommendations.slice(0, limit);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw error;
    }
  }

  private static async getSimilarVenues(
    visitedVenueIds: string[],
    limit: number
  ): Promise<VenueRecommendation[]> {
    if (visitedVenueIds.length === 0) return [];

    const { data, error } = await supabase
      .from('venue_similarities')
      .select(`
        venue_id_2,
        similarity_score,
        venues!venue_similarities_venue_id_2_fkey(*)
      `)
      .in('venue_id_1', visitedVenueIds)
      .not('venue_id_2', 'in', `(${visitedVenueIds.join(',')})`)
      .order('similarity_score', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(item => ({
      venue: item.venues,
      type: 'similar',
      score: item.similarity_score,
      reason: 'Similar to venues you love'
    }));
  }

  private static async getTrendingVenues(
    userId: string,
    limit: number
  ): Promise<VenueRecommendation[]> {
    // Get venues with high recent activity
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const { data, error } = await supabase
      .from('check_ins')
      .select(`
        venue_id,
        venues(*)
      `)
      .gte('checked_in_at', twentyFourHoursAgo.toISOString())
      .not('user_id', 'eq', userId);

    if (error) throw error;

    // Count check-ins per venue
    const venueCounts = new Map<string, { venue: any; count: number }>();
    
    data?.forEach(checkIn => {
      const existing = venueCounts.get(checkIn.venue_id);
      if (existing) {
        existing.count++;
      } else {
        venueCounts.set(checkIn.venue_id, {
          venue: checkIn.venues,
          count: 1
        });
      }
    });

    // Sort by count and return top venues
    return Array.from(venueCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(item => ({
        venue: item.venue,
        type: 'trending',
        score: Math.min(item.count / 100, 1), // Normalize to 0-1
        reason: `${item.count} people checked in recently`
      }));
  }

  private static async getComebackVenues(
    userId: string,
    limit: number
  ): Promise<VenueRecommendation[]> {
    // Get venues user hasn't visited in 30+ days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from('check_ins')
      .select(`
        venue_id,
        checked_in_at,
        venues(*)
      `)
      .eq('user_id', userId)
      .lt('checked_in_at', thirtyDaysAgo.toISOString())
      .order('checked_in_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(checkIn => {
      const daysSince = Math.floor(
        (Date.now() - new Date(checkIn.checked_in_at).getTime()) / 
        (1000 * 60 * 60 * 24)
      );

      return {
        venue: checkIn.venues,
        type: 'comeback',
        score: 0.7,
        reason: `You haven't been here in ${daysSince} days`
      };
    });
  }

  private static async getNewCategoryVenues(
    userId: string,
    limit: number
  ): Promise<VenueRecommendation[]> {
    // Get categories user has visited
    const { data: visitedCategories } = await supabase
      .from('check_ins')
      .select('venues(category)')
      .eq('user_id', userId);

    const visited = new Set(
      visitedCategories?.map(ci => ci.venues.category) || []
    );

    // Get venues from unvisited categories
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .not('category', 'in', `(${Array.from(visited).join(',')})`)
      .order('rating', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(venue => ({
      venue,
      type: 'new_category',
      score: 0.6,
      reason: `Try a new category: ${venue.category}`
    }));
  }

  private static deduplicateAndScore(
    recommendations: VenueRecommendation[]
  ): VenueRecommendation[] {
    const venueMap = new Map<string, VenueRecommendation>();

    recommendations.forEach(rec => {
      const existing = venueMap.get(rec.venue.id);
      if (!existing || rec.score > existing.score) {
        venueMap.set(rec.venue.id, rec);
      }
    });

    return Array.from(venueMap.values())
      .sort((a, b) => b.score - a.score);
  }

  private static async storeRecommendations(
    userId: string,
    recommendations: VenueRecommendation[]
  ): Promise<void> {
    const records = recommendations.map(rec => ({
      user_id: userId,
      venue_id: rec.venue.id,
      recommendation_type: rec.type,
      score: rec.score,
      reason: rec.reason
    }));

    await supabase
      .from('user_recommendations')
      .insert(records);
  }

  static async trackRecommendationClick(
    userId: string,
    venueId: string
  ): Promise<void> {
    await supabase
      .from('user_recommendations')
      .update({ clicked_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('venue_id', venueId)
      .is('clicked_at', null);
  }
}
```


#### UI Component - Recommendations Section
```typescript
// src/components/recommendations/RecommendationsSection.tsx
interface RecommendationsSectionProps {
  userId: string;
  onVenuePress: (venueId: string, venueName: string) => void;
}

export const RecommendationsSection: React.FC<RecommendationsSectionProps> = ({
  userId,
  onVenuePress
}) => {
  const { theme } = useTheme();
  const [recommendations, setRecommendations] = useState<VenueRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const recs = await RecommendationService.getPersonalizedRecommendations(
          userId,
          5
        );
        setRecommendations(recs);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [userId]);

  const handleVenuePress = async (venueId: string, venueName: string) => {
    await RecommendationService.trackRecommendationClick(userId, venueId);
    onVenuePress(venueId, venueName);
  };

  if (loading || recommendations.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="bulb-outline" size={20} color={theme.colors.primary} />
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Recommended for You
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {recommendations.map((rec) => (
          <RecommendationCard
            key={rec.venue.id}
            recommendation={rec}
            onPress={() => handleVenuePress(rec.venue.id, rec.venue.name)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const RecommendationCard: React.FC<{
  recommendation: VenueRecommendation;
  onPress: () => void;
}> = ({ recommendation, onPress }) => {
  const { theme } = useTheme();
  const { venue, reason, type } = recommendation;

  const getTypeIcon = () => {
    switch (type) {
      case 'similar': return '✨';
      case 'trending': return '🔥';
      case 'comeback': return '💙';
      case 'new_category': return '🎯';
      default: return '💡';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: venue.image_url || 'https://via.placeholder.com/140x100' }}
        style={styles.image}
      />

      <View style={styles.badge}>
        <Text style={styles.badgeText}>{getTypeIcon()}</Text>
      </View>

      <View style={styles.cardContent}>
        <Text style={[styles.venueName, { color: theme.colors.text }]} numberOfLines={1}>
          {venue.name}
        </Text>
        <Text style={[styles.category, { color: theme.colors.textSecondary }]} numberOfLines={1}>
          {venue.category}
        </Text>
        <Text style={[styles.reason, { color: theme.colors.primary }]} numberOfLines={2}>
          {reason}
        </Text>
      </View>
    </TouchableOpacity>
  );
};
```

### UI Mockup
```
┌─────────────────────────────────────────┐
│  💡 Recommended for You                 │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────┐  ┌──────┐  ┌──────┐         │
│  │ IMG  │  │ IMG  │  │ IMG  │         │
│  │  ✨  │  │  🔥  │  │  💙  │         │
│  ├──────┤  ├──────┤  ├──────┤         │
│  │Cafe  │  │Bar   │  │Rest  │         │
│  │☕    │  │🍺    │  │🍽️    │         │
│  │Similar│  │Trend-│  │Come  │         │
│  │to your│  │ing   │  │back! │         │
│  │favs  │  │nearby│  │      │         │
│  └──────┘  └──────┘  └──────┘         │
│                                         │
└─────────────────────────────────────────┘
```

---

## 6. Social Features

### Overview
Enable users to connect with friends, share their favorite venues, and discover where their social circle hangs out. This adds a social layer that increases engagement and creates network effects.

### Features

**Friend Activity:**
- See which friends visited the same venues
- "John was here 2 days ago"
- Friend check-in notifications
- Mutual friends at venue

**Shared Lists:**
- Create and share venue lists ("Best Coffee in SF")
- Collaborative lists with friends
- Public vs. private lists
- Follow other users' lists

**Social Proof:**
- "3 of your friends love this place"
- Friend recommendations
- Most popular venues among friends
- Friend ratings and reviews

**Check-in Sharing:**
- Share check-ins to social media
- Tag friends in check-ins
- Check-in photos
- Comments on check-ins

### Technical Implementation

#### Database Schema
```sql
CREATE TABLE user_friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL, -- 'pending', 'accepted', 'blocked'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

CREATE INDEX idx_user_friendships_user ON user_friendships(user_id);
CREATE INDEX idx_user_friendships_friend ON user_friendships(friend_id);
CREATE INDEX idx_user_friendships_status ON user_friendships(status);

CREATE TABLE venue_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  is_collaborative BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE venue_list_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID REFERENCES venue_lists(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  added_by UUID REFERENCES users(id) ON DELETE SET NULL,
  note TEXT,
  position INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(list_id, venue_id)
);

CREATE TABLE venue_list_followers (
  list_id UUID REFERENCES venue_lists(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  followed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (list_id, user_id)
);

CREATE TABLE check_in_tags (
  check_in_id UUID REFERENCES check_ins(id) ON DELETE CASCADE,
  tagged_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (check_in_id, tagged_user_id)
);

CREATE TABLE check_in_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  check_in_id UUID REFERENCES check_ins(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Service Layer
```typescript
// src/services/api/social.ts
export class SocialService {
  static async getFriends(userId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('user_friendships')
      .select(`
        friend_id,
        users!user_friendships_friend_id_fkey(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'accepted');

    if (error) throw error;
    return (data || []).map(f => f.users);
  }

  static async getFriendActivity(
    userId: string,
    venueId: string
  ): Promise<FriendActivity[]> {
    // Get user's friends
    const friends = await this.getFriends(userId);
    const friendIds = friends.map(f => f.id);

    if (friendIds.length === 0) return [];

    // Get friend check-ins at this venue
    const { data, error } = await supabase
      .from('check_ins')
      .select(`
        *,
        users(id, name, avatar_url)
      `)
      .eq('venue_id', venueId)
      .in('user_id', friendIds)
      .order('checked_in_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    return (data || []).map(checkIn => ({
      friend: checkIn.users,
      checkInTime: checkIn.checked_in_at,
      isActive: checkIn.is_active
    }));
  }

  static async sendFriendRequest(
    userId: string,
    friendId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('user_friendships')
      .insert({
        user_id: userId,
        friend_id: friendId,
        status: 'pending'
      });

    if (error) throw error;
  }

  static async acceptFriendRequest(
    userId: string,
    friendId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('user_friendships')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('user_id', friendId)
      .eq('friend_id', userId)
      .eq('status', 'pending');

    if (error) throw error;

    // Create reciprocal friendship
    await supabase
      .from('user_friendships')
      .insert({
        user_id: userId,
        friend_id: friendId,
        status: 'accepted',
        accepted_at: new Date().toISOString()
      });
  }

  static async createVenueList(
    userId: string,
    name: string,
    description?: string,
    isPublic: boolean = false
  ): Promise<VenueList> {
    const { data, error } = await supabase
      .from('venue_lists')
      .insert({
        user_id: userId,
        name,
        description,
        is_public: isPublic
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async addVenueToList(
    listId: string,
    venueId: string,
    userId: string,
    note?: string
  ): Promise<void> {
    // Get current max position
    const { data: items } = await supabase
      .from('venue_list_items')
      .select('position')
      .eq('list_id', listId)
      .order('position', { ascending: false })
      .limit(1);

    const nextPosition = items && items.length > 0 ? items[0].position + 1 : 0;

    const { error } = await supabase
      .from('venue_list_items')
      .insert({
        list_id: listId,
        venue_id: venueId,
        added_by: userId,
        note,
        position: nextPosition
      });

    if (error) throw error;
  }

  static async getUserLists(userId: string): Promise<VenueList[]> {
    const { data, error } = await supabase
      .from('venue_lists')
      .select(`
        *,
        venue_list_items(count)
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getListVenues(listId: string): Promise<VenueListItem[]> {
    const { data, error } = await supabase
      .from('venue_list_items')
      .select(`
        *,
        venues(*),
        users(id, name, avatar_url)
      `)
      .eq('list_id', listId)
      .order('position', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async tagFriendInCheckIn(
    checkInId: string,
    taggedUserId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('check_in_tags')
      .insert({
        check_in_id: checkInId,
        tagged_user_id: taggedUserId
      });

    if (error) throw error;
  }

  static async addCheckInComment(
    checkInId: string,
    userId: string,
    comment: string
  ): Promise<void> {
    const { error } = await supabase
      .from('check_in_comments')
      .insert({
        check_in_id: checkInId,
        user_id: userId,
        comment
      });

    if (error) throw error;
  }

  static async getFriendCheckInsAtVenue(
    userId: string,
    venueId: string
  ): Promise<number> {
    const friends = await this.getFriends(userId);
    const friendIds = friends.map(f => f.id);

    if (friendIds.length === 0) return 0;

    const { count, error } = await supabase
      .from('check_ins')
      .select('id', { count: 'exact', head: true })
      .eq('venue_id', venueId)
      .in('user_id', friendIds);

    if (error) return 0;
    return count || 0;
  }
}
```


#### UI Component - Friend Activity Badge
```typescript
// src/components/social/FriendActivityBadge.tsx
interface FriendActivityBadgeProps {
  userId: string;
  venueId: string;
}

export const FriendActivityBadge: React.FC<FriendActivityBadgeProps> = ({
  userId,
  venueId
}) => {
  const { theme } = useTheme();
  const [activity, setActivity] = useState<FriendActivity[]>([]);
  const [friendCount, setFriendCount] = useState(0);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const [friendActivity, count] = await Promise.all([
          SocialService.getFriendActivity(userId, venueId),
          SocialService.getFriendCheckInsAtVenue(userId, venueId)
        ]);
        setActivity(friendActivity);
        setFriendCount(count);
      } catch (error) {
        console.error('Error fetching friend activity:', error);
      }
    };

    fetchActivity();
  }, [userId, venueId]);

  if (friendCount === 0) return null;

  const recentFriend = activity[0];
  const timeAgo = recentFriend 
    ? formatCheckInTime(recentFriend.checkInTime)
    : '';

  return (
    <View style={[styles.badge, { backgroundColor: theme.colors.primary + '20' }]}>
      <Icon name="people" size={14} color={theme.colors.primary} />
      <Text style={[styles.text, { color: theme.colors.primary }]}>
        {friendCount === 1 && recentFriend
          ? `${recentFriend.friend.name} was here ${timeAgo}`
          : `${friendCount} friends have been here`
        }
      </Text>
    </View>
  );
};
```

#### UI Component - Venue Lists
```typescript
// src/components/social/VenueListCard.tsx
interface VenueListCardProps {
  list: VenueList;
  onPress: () => void;
}

export const VenueListCard: React.FC<VenueListCardProps> = ({ list, onPress }) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Icon 
          name={list.is_public ? "globe-outline" : "lock-closed-outline"} 
          size={20} 
          color={theme.colors.primary} 
        />
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {list.name}
        </Text>
      </View>

      {list.description && (
        <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
          {list.description}
        </Text>
      )}

      <View style={styles.footer}>
        <Text style={[styles.count, { color: theme.colors.textSecondary }]}>
          {list.venue_count} venues
        </Text>
        {list.is_collaborative && (
          <View style={styles.collaborativeBadge}>
            <Icon name="people" size={12} color={theme.colors.primary} />
            <Text style={[styles.badgeText, { color: theme.colors.primary }]}>
              Collaborative
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};
```

#### Integration with VenueDetailScreen
```typescript
// Add friend activity to venue detail
<FriendActivityBadge userId={user.id} venueId={venueId} />

// Add "Add to List" button
<TouchableOpacity
  style={styles.addToListButton}
  onPress={() => setShowListPicker(true)}
>
  <Icon name="bookmark-outline" size={20} color={theme.colors.primary} />
  <Text style={styles.buttonText}>Add to List</Text>
</TouchableOpacity>
```

### UI Mockup
```
┌─────────────────────────────────────────┐
│  Venue Detail                           │
├─────────────────────────────────────────┤
│                                         │
│  [IMAGE]                                │
│                                         │
│  Coffee House                           │
│  ⭐⭐⭐⭐⭐ 4.8                          │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 👥 Sarah was here 2 hours ago   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 3 of your friends love this     │   │
│  │ place                           │   │
│  │                                 │   │
│  │ [Sarah] [John] [Mike]           │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Check In] [Add to List] [Share]      │
│                                         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  📚 My Lists                            │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🌍 Best Coffee in SF            │   │
│  │ My favorite coffee spots        │   │
│  │ 12 venues                       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🔒 Date Night Ideas             │   │
│  │ Romantic restaurants            │   │
│  │ 8 venues • 👥 Collaborative     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [+ Create New List]                    │
│                                         │
└─────────────────────────────────────────┘
```

---

## 7. Venue Loyalty Programs

### Overview
Implement digital loyalty programs that track visits and reward repeat customers. This creates incentives for users to return to venues and increases engagement with the platform.

### Features

**Stamp Cards:**
- Digital punch cards (e.g., "Buy 5 coffees, get 1 free")
- Visual progress tracking
- Automatic stamp on check-in
- Redemption tracking

**Points System:**
- Earn points per visit
- Bonus points for specific actions (reviews, photos, friend referrals)
- Points multipliers during promotions
- Redeem points for rewards

**Tiered Rewards:**
- Bronze/Silver/Gold/Platinum tiers
- Unlock perks at each tier
- Exclusive deals for higher tiers
- Tier progress visualization

**Exclusive Deals:**
- Member-only discounts
- Early access to new menu items
- Birthday rewards
- Surprise and delight offers

### Technical Implementation

#### Database Schema
```sql
CREATE TABLE loyalty_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
  program_type VARCHAR(20) NOT NULL, -- 'stamps', 'points', 'tiered'
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  stamps_required INTEGER, -- For stamp cards
  points_per_visit INTEGER, -- For points system
  tier_thresholds JSONB, -- For tiered programs: {"bronze": 5, "silver": 10, "gold": 25}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_loyalty_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  program_id UUID REFERENCES loyalty_programs(id) ON DELETE CASCADE,
  current_stamps INTEGER DEFAULT 0,
  total_stamps_earned INTEGER DEFAULT 0,
  current_points INTEGER DEFAULT 0,
  total_points_earned INTEGER DEFAULT 0,
  current_tier VARCHAR(20),
  tier_visits INTEGER DEFAULT 0,
  last_visit_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, program_id)
);

CREATE TABLE loyalty_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID REFERENCES loyalty_programs(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  reward_type VARCHAR(20) NOT NULL, -- 'discount', 'free_item', 'upgrade', 'exclusive'
  cost_stamps INTEGER,
  cost_points INTEGER,
  tier_required VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE loyalty_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reward_id UUID REFERENCES loyalty_rewards(id) ON DELETE CASCADE,
  program_id UUID REFERENCES loyalty_programs(id) ON DELETE CASCADE,
  check_in_id UUID REFERENCES check_ins(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'active' -- 'active', 'used', 'expired'
);

CREATE INDEX idx_loyalty_programs_venue ON loyalty_programs(venue_id);
CREATE INDEX idx_user_loyalty_progress_user ON user_loyalty_progress(user_id);
CREATE INDEX idx_user_loyalty_progress_program ON user_loyalty_progress(program_id);
CREATE INDEX idx_loyalty_redemptions_user ON loyalty_redemptions(user_id);
```

#### Service Layer
```typescript
// src/services/api/loyalty.ts
export class LoyaltyService {
  static async getVenueLoyaltyProgram(
    venueId: string
  ): Promise<LoyaltyProgram | null> {
    const { data, error } = await supabase
      .from('loyalty_programs')
      .select('*')
      .eq('venue_id', venueId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  }

  static async getUserProgress(
    userId: string,
    programId: string
  ): Promise<UserLoyaltyProgress> {
    const { data, error } = await supabase
      .from('user_loyalty_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('program_id', programId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Create new progress record
        return await this.createProgress(userId, programId);
      }
      throw error;
    }

    return data;
  }

  private static async createProgress(
    userId: string,
    programId: string
  ): Promise<UserLoyaltyProgress> {
    const { data, error } = await supabase
      .from('user_loyalty_progress')
      .insert({
        user_id: userId,
        program_id: programId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async recordVisit(
    userId: string,
    venueId: string,
    checkInId: string
  ): Promise<UserLoyaltyProgress | null> {
    // Get venue's loyalty program
    const program = await this.getVenueLoyaltyProgram(venueId);
    if (!program) return null;

    // Get or create user progress
    const progress = await this.getUserProgress(userId, program.id);

    // Update progress based on program type
    let updates: Partial<UserLoyaltyProgress> = {
      last_visit_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (program.program_type === 'stamps') {
      updates.current_stamps = (progress.current_stamps || 0) + 1;
      updates.total_stamps_earned = (progress.total_stamps_earned || 0) + 1;

      // Check if stamp card is complete
      if (updates.current_stamps >= program.stamps_required) {
        // Award reward and reset stamps
        await this.awardStampReward(userId, program.id, checkInId);
        updates.current_stamps = 0;
      }
    } else if (program.program_type === 'points') {
      const pointsToAdd = program.points_per_visit || 10;
      updates.current_points = (progress.current_points || 0) + pointsToAdd;
      updates.total_points_earned = (progress.total_points_earned || 0) + pointsToAdd;
    } else if (program.program_type === 'tiered') {
      updates.tier_visits = (progress.tier_visits || 0) + 1;
      
      // Check for tier upgrade
      const newTier = this.calculateTier(
        updates.tier_visits,
        program.tier_thresholds
      );
      
      if (newTier !== progress.current_tier) {
        updates.current_tier = newTier;
        // Notify user of tier upgrade
        await this.notifyTierUpgrade(userId, program.id, newTier);
      }
    }

    // Update progress
    const { data, error } = await supabase
      .from('user_loyalty_progress')
      .update(updates)
      .eq('user_id', userId)
      .eq('program_id', program.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private static calculateTier(
    visits: number,
    thresholds: any
  ): string {
    if (visits >= thresholds.platinum) return 'platinum';
    if (visits >= thresholds.gold) return 'gold';
    if (visits >= thresholds.silver) return 'silver';
    if (visits >= thresholds.bronze) return 'bronze';
    return 'none';
  }

  private static async awardStampReward(
    userId: string,
    programId: string,
    checkInId: string
  ): Promise<void> {
    // Get the stamp completion reward
    const { data: reward } = await supabase
      .from('loyalty_rewards')
      .select('*')
      .eq('program_id', programId)
      .eq('reward_type', 'free_item')
      .single();

    if (!reward) return;

    // Create redemption record
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 day expiration

    await supabase
      .from('loyalty_redemptions')
      .insert({
        user_id: userId,
        reward_id: reward.id,
        program_id: programId,
        check_in_id: checkInId,
        expires_at: expiresAt.toISOString()
      });
  }

  private static async notifyTierUpgrade(
    userId: string,
    programId: string,
    newTier: string
  ): Promise<void> {
    // Implementation for push notification or in-app notification
    console.log(`User ${userId} upgraded to ${newTier} tier in program ${programId}`);
  }

  static async getAvailableRewards(
    userId: string,
    programId: string
  ): Promise<LoyaltyReward[]> {
    const progress = await this.getUserProgress(userId, programId);

    const { data, error } = await supabase
      .from('loyalty_rewards')
      .select('*')
      .eq('program_id', programId)
      .eq('is_active', true);

    if (error) throw error;

    // Filter rewards based on user's progress
    return (data || []).filter(reward => {
      if (reward.cost_stamps && progress.current_stamps < reward.cost_stamps) {
        return false;
      }
      if (reward.cost_points && progress.current_points < reward.cost_points) {
        return false;
      }
      if (reward.tier_required && !this.meetsT ierRequirement(
        progress.current_tier,
        reward.tier_required
      )) {
        return false;
      }
      return true;
    });
  }

  private static meetsTierRequirement(
    currentTier: string,
    requiredTier: string
  ): boolean {
    const tierOrder = ['bronze', 'silver', 'gold', 'platinum'];
    const currentIndex = tierOrder.indexOf(currentTier);
    const requiredIndex = tierOrder.indexOf(requiredTier);
    return currentIndex >= requiredIndex;
  }

  static async redeemReward(
    userId: string,
    rewardId: string,
    programId: string
  ): Promise<LoyaltyRedemption> {
    const progress = await this.getUserProgress(userId, programId);
    const { data: reward } = await supabase
      .from('loyalty_rewards')
      .select('*')
      .eq('id', rewardId)
      .single();

    if (!reward) throw new Error('Reward not found');

    // Deduct cost from progress
    const updates: Partial<UserLoyaltyProgress> = {};
    
    if (reward.cost_stamps) {
      updates.current_stamps = progress.current_stamps - reward.cost_stamps;
    }
    if (reward.cost_points) {
      updates.current_points = progress.current_points - reward.cost_points;
    }

    await supabase
      .from('user_loyalty_progress')
      .update(updates)
      .eq('user_id', userId)
      .eq('program_id', programId);

    // Create redemption
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { data: redemption, error } = await supabase
      .from('loyalty_redemptions')
      .insert({
        user_id: userId,
        reward_id: rewardId,
        program_id: programId,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return redemption;
  }

  static async getUserRedemptions(
    userId: string
  ): Promise<LoyaltyRedemption[]> {
    const { data, error } = await supabase
      .from('loyalty_redemptions')
      .select(`
        *,
        loyalty_rewards(*),
        loyalty_programs(*, venues(name, image_url))
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('redeemed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}
```


#### UI Component - Loyalty Card
```typescript
// src/components/loyalty/LoyaltyCard.tsx
interface LoyaltyCardProps {
  userId: string;
  venueId: string;
  venueName: string;
}

export const LoyaltyCard: React.FC<LoyaltyCardProps> = ({
  userId,
  venueId,
  venueName
}) => {
  const { theme } = useTheme();
  const [program, setProgram] = useState<LoyaltyProgram | null>(null);
  const [progress, setProgress] = useState<UserLoyaltyProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLoyalty = async () => {
      try {
        setLoading(true);
        const loyaltyProgram = await LoyaltyService.getVenueLoyaltyProgram(venueId);
        
        if (loyaltyProgram) {
          setProgram(loyaltyProgram);
          const userProgress = await LoyaltyService.getUserProgress(
            userId,
            loyaltyProgram.id
          );
          setProgress(userProgress);
        }
      } catch (error) {
        console.error('Error fetching loyalty data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLoyalty();
  }, [userId, venueId]);

  if (loading || !program || !progress) return null;

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.header}>
        <Icon name="gift" size={24} color={theme.colors.primary} />
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {program.name}
        </Text>
      </View>

      {program.program_type === 'stamps' && (
        <StampProgress
          current={progress.current_stamps}
          required={program.stamps_required}
        />
      )}

      {program.program_type === 'points' && (
        <PointsProgress
          current={progress.current_points}
          total={progress.total_points_earned}
        />
      )}

      {program.program_type === 'tiered' && (
        <TierProgress
          currentTier={progress.current_tier}
          visits={progress.tier_visits}
          thresholds={program.tier_thresholds}
        />
      )}

      <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
        {program.description}
      </Text>
    </View>
  );
};

// Stamp card progress component
const StampProgress: React.FC<{ current: number; required: number }> = ({
  current,
  required
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.stampContainer}>
      <View style={styles.stampGrid}>
        {Array.from({ length: required }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.stamp,
              {
                backgroundColor: index < current
                  ? theme.colors.primary
                  : theme.colors.background
              }
            ]}
          >
            {index < current && (
              <Icon name="checkmark" size={20} color="#FFF" />
            )}
          </View>
        ))}
      </View>
      <Text style={[styles.progressText, { color: theme.colors.text }]}>
        {current} / {required} stamps
      </Text>
      {current === required - 1 && (
        <Text style={[styles.almostText, { color: theme.colors.primary }]}>
          🎉 One more visit for a free reward!
        </Text>
      )}
    </View>
  );
};

// Points progress component
const PointsProgress: React.FC<{ current: number; total: number }> = ({
  current,
  total
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.pointsContainer}>
      <View style={styles.pointsRow}>
        <Text style={[styles.pointsValue, { color: theme.colors.primary }]}>
          {current}
        </Text>
        <Text style={[styles.pointsLabel, { color: theme.colors.text }]}>
          points available
        </Text>
      </View>
      <Text style={[styles.totalPoints, { color: theme.colors.textSecondary }]}>
        {total} earned all-time
      </Text>
    </View>
  );
};

// Tier progress component
const TierProgress: React.FC<{
  currentTier: string;
  visits: number;
  thresholds: any;
}> = ({ currentTier, visits, thresholds }) => {
  const { theme } = useTheme();

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return '#E5E7EB';
      case 'gold': return '#FFD700';
      case 'silver': return '#C0C0C0';
      case 'bronze': return '#CD7F32';
      default: return theme.colors.textSecondary;
    }
  };

  const getNextTier = () => {
    const tiers = ['bronze', 'silver', 'gold', 'platinum'];
    const currentIndex = tiers.indexOf(currentTier);
    return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;
  };

  const nextTier = getNextTier();
  const nextThreshold = nextTier ? thresholds[nextTier] : null;
  const visitsToNext = nextThreshold ? nextThreshold - visits : 0;

  return (
    <View style={styles.tierContainer}>
      <View style={styles.tierBadge}>
        <Icon 
          name="trophy" 
          size={32} 
          color={getTierColor(currentTier)} 
        />
        <Text style={[styles.tierName, { color: theme.colors.text }]}>
          {currentTier.toUpperCase()}
        </Text>
      </View>

      {nextTier && (
        <View style={styles.tierProgress}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.colors.primary,
                  width: `${(visits / nextThreshold) * 100}%`
                }
              ]}
            />
          </View>
          <Text style={[styles.tierProgressText, { color: theme.colors.textSecondary }]}>
            {visitsToNext} more visits to {nextTier}
          </Text>
        </View>
      )}
    </View>
  );
};
```

#### UI Component - Rewards List
```typescript
// src/components/loyalty/RewardsList.tsx
interface RewardsListProps {
  userId: string;
  programId: string;
  onRedeemPress: (rewardId: string) => void;
}

export const RewardsList: React.FC<RewardsListProps> = ({
  userId,
  programId,
  onRedeemPress
}) => {
  const { theme } = useTheme();
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        setLoading(true);
        const available = await LoyaltyService.getAvailableRewards(
          userId,
          programId
        );
        setRewards(available);
      } catch (error) {
        console.error('Error fetching rewards:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRewards();
  }, [userId, programId]);

  if (loading) return <ActivityIndicator />;
  if (rewards.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Available Rewards
      </Text>

      {rewards.map(reward => (
        <View
          key={reward.id}
          style={[styles.rewardCard, { backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.rewardContent}>
            <Text style={[styles.rewardName, { color: theme.colors.text }]}>
              {reward.name}
            </Text>
            <Text style={[styles.rewardDescription, { color: theme.colors.textSecondary }]}>
              {reward.description}
            </Text>

            <View style={styles.costBadge}>
              {reward.cost_stamps && (
                <Text style={[styles.costText, { color: theme.colors.primary }]}>
                  {reward.cost_stamps} stamps
                </Text>
              )}
              {reward.cost_points && (
                <Text style={[styles.costText, { color: theme.colors.primary }]}>
                  {reward.cost_points} points
                </Text>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.redeemButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => onRedeemPress(reward.id)}
          >
            <Text style={styles.redeemButtonText}>Redeem</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};
```

#### Integration with Check-In Flow
```typescript
// After successful check-in, record loyalty visit
const handleCheckIn = async () => {
  try {
    const checkIn = await CheckInService.checkIn(venueId, user.id);
    
    // Record loyalty visit
    const loyaltyProgress = await LoyaltyService.recordVisit(
      user.id,
      venueId,
      checkIn.id
    );

    // Show loyalty progress update
    if (loyaltyProgress) {
      setShowLoyaltyUpdate(true);
      setLoyaltyProgress(loyaltyProgress);
    }
  } catch (error) {
    console.error('Check-in error:', error);
  }
};
```

### UI Mockup
```
┌─────────────────────────────────────────┐
│  🎁 Coffee Rewards                      │
├─────────────────────────────────────────┤
│                                         │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐        │
│  │ ✓ │ │ ✓ │ │ ✓ │ │ ✓ │ │   │        │
│  └───┘ └───┘ └───┘ └───┘ └───┘        │
│                                         │
│  4 / 5 stamps                           │
│  🎉 One more visit for a free coffee!   │
│                                         │
│  Buy 5 coffees, get 1 free              │
│                                         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  🏆 VIP Member                          │
├─────────────────────────────────────────┤
│                                         │
│         🏆                              │
│        GOLD                             │
│                                         │
│  [████████░░] 80%                       │
│  2 more visits to platinum              │
│                                         │
│  Perks:                                 │
│  ✓ 10% off all purchases                │
│  ✓ Priority seating                     │
│  ✓ Birthday reward                      │
│                                         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Available Rewards                      │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Free Coffee                     │   │
│  │ Any size, any drink             │   │
│  │                                 │   │
│  │ 5 stamps        [Redeem]        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 20% Off                         │   │
│  │ Your next purchase              │   │
│  │                                 │   │
│  │ 100 points      [Redeem]        │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

---

## Implementation Priority

Based on complexity and user value, here's a suggested implementation order:

### Phase 1: Foundation (Weeks 1-2)
1. **Visit Streak Badges** - Quick win, high engagement
2. **Personal Stats Section** - Leverages existing data

### Phase 2: Gamification (Weeks 3-4)
3. **Visit Milestones** - Builds on badges, adds celebration
4. **Venue Loyalty Programs** - High value for venues and users

### Phase 3: Discovery (Weeks 5-6)
5. **Personalized Recommendations** - Requires ML/analytics setup
6. **Spending Insights** - Requires payment integration

### Phase 4: Social (Weeks 7-8)
7. **Social Features** - Most complex, requires friend system

---

## Technical Considerations

### Performance
- Cache user stats and analytics data
- Use background jobs for heavy calculations
- Implement pagination for all lists
- Optimize database queries with proper indexes

### Privacy
- Allow users to control visibility of check-ins
- Private vs. public lists
- Friend-only vs. public sharing
- GDPR compliance for data export/deletion

### Scalability
- Use Redis for real-time stats caching
- Implement rate limiting on API endpoints
- Queue system for notification delivery
- CDN for images and static assets

### Testing
- Unit tests for all service methods
- Integration tests for check-in flows
- E2E tests for critical user journeys
- Load testing for recommendation engine

---

## Success Metrics

### Engagement Metrics
- Daily active users (DAU)
- Average check-ins per user per week
- Feature adoption rates
- Time spent in app

### Retention Metrics
- 7-day retention rate
- 30-day retention rate
- Churn rate
- Return visit frequency

### Social Metrics
- Friend connections per user
- List creation and sharing rates
- Social check-in engagement
- Viral coefficient

### Loyalty Metrics
- Loyalty program enrollment rate
- Reward redemption rate
- Repeat visit rate per venue
- Average customer lifetime value

---

## Conclusion

These enhancements transform the Recent Check-Ins feature from a simple history view into a comprehensive engagement platform. By implementing gamification, social features, and loyalty programs, you create multiple reasons for users to return to the app and engage with venues.

The modular design allows for incremental implementation, starting with high-value, low-complexity features like badges and stats, then building up to more sophisticated features like recommendations and social networking.

Each feature is designed to work independently while also complementing the others, creating a cohesive ecosystem that benefits users, venues, and the platform.
