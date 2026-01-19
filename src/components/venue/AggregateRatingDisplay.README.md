# AggregateRatingDisplay Component

## Overview

The `AggregateRatingDisplay` component displays aggregate venue ratings with stars, numerical values, and review counts. It's designed to be used across the application in venue cards, detail screens, and anywhere ratings need to be displayed.

## Features

- ⭐ **Visual Star Rating**: Displays filled, half-filled, and empty stars based on rating
- 🔢 **Numerical Display**: Shows precise rating value (e.g., "4.5")
- 📊 **Review Count**: Displays total number of reviews (e.g., "(127 reviews)")
- 🎨 **Highlight Color**: Uses golden color (#F59E0B) for high ratings (>= 4.5)
- 📏 **Multiple Sizes**: Supports small, medium, and large size variants
- 🎯 **Zero Reviews Handling**: Shows "No reviews yet" when no reviews exist
- ♿ **Accessible**: Properly formatted for screen readers

## Requirements Satisfied

- ✅ **Requirement 3.1**: Display aggregate rating on venue detail screen
- ✅ **Requirement 3.2**: Show filled stars representing average rating
- ✅ **Requirement 7.2**: Show numerical rating on venue cards
- ✅ **Requirement 7.3**: Show review count in parentheses
- ✅ **Requirement 7.6**: Highlighted color for ratings >= 4.5

## Usage

### Basic Usage

```tsx
import { AggregateRatingDisplay } from '../components/venue';

// Display rating with count
<AggregateRatingDisplay
  rating={4.5}
  reviewCount={127}
/>
```

### Size Variants

```tsx
// Small size (for compact cards)
<AggregateRatingDisplay
  rating={4.3}
  reviewCount={89}
  size="small"
/>

// Medium size (default)
<AggregateRatingDisplay
  rating={4.3}
  reviewCount={89}
  size="medium"
/>

// Large size (for detail screens)
<AggregateRatingDisplay
  rating={4.3}
  reviewCount={89}
  size="large"
/>
```

### Without Review Count

```tsx
// Hide review count (useful for compact displays)
<AggregateRatingDisplay
  rating={4.2}
  reviewCount={93}
  showCount={false}
/>
```

### Zero Reviews

```tsx
// Automatically shows "No reviews yet"
<AggregateRatingDisplay
  rating={0}
  reviewCount={0}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `rating` | `number` | Required | Average rating (0-5, one decimal place) |
| `reviewCount` | `number` | Required | Total number of reviews |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size variant for the display |
| `showCount` | `boolean` | `true` | Whether to show the review count |

## Size Specifications

### Small
- Star size: 14px
- Rating font: 13px
- Count font: 11px
- Gap: 4px

### Medium (Default)
- Star size: 18px
- Rating font: 16px
- Count font: 13px
- Gap: 6px

### Large
- Star size: 22px
- Rating font: 20px
- Count font: 15px
- Gap: 8px

## Star Display Logic

The component intelligently displays stars based on the rating:

- **Filled stars** (⭐): For whole numbers (e.g., 4.0 shows 4 filled stars)
- **Half stars** (⭐): For decimals >= 0.5 (e.g., 4.5 shows 4 filled + 1 half)
- **Empty stars** (☆): For remaining stars up to 5 total

### Examples

- `4.8` → ⭐⭐⭐⭐⭐ (5 filled stars)
- `4.5` → ⭐⭐⭐⭐⭐ (4 filled + 1 half)
- `4.3` → ⭐⭐⭐⭐☆ (4 filled + 1 empty)
- `3.7` → ⭐⭐⭐⭐☆ (3 filled + 1 half + 1 empty)
- `2.2` → ⭐⭐☆☆☆ (2 filled + 3 empty)

## Color Scheme

### High Rating (>= 4.5)
- **Star Color**: `#F59E0B` (Golden/Amber)
- **Text Color**: `#F59E0B` (Golden/Amber)
- **Purpose**: Highlights excellent ratings

### Normal Rating (< 4.5)
- **Star Color**: `theme.colors.textSecondary`
- **Text Color**: `theme.colors.textSecondary`
- **Purpose**: Standard display for average ratings

### No Reviews
- **Text Color**: `theme.colors.textSecondary`
- **Style**: Italic
- **Message**: "No reviews yet"

## Integration Examples

### Venue Card (Home Feed)

```tsx
import { AggregateRatingDisplay } from '../components/venue';

const VenueCard = ({ venue }) => (
  <View>
    <Text>{venue.name}</Text>
    <AggregateRatingDisplay
      rating={venue.aggregate_rating}
      reviewCount={venue.review_count}
      size="small"
    />
  </View>
);
```

### Venue Detail Screen

```tsx
import { AggregateRatingDisplay } from '../components/venue';

const VenueDetailScreen = ({ venue }) => (
  <View>
    <Text>{venue.name}</Text>
    <AggregateRatingDisplay
      rating={venue.aggregate_rating}
      reviewCount={venue.review_count}
      size="large"
    />
  </View>
);
```

### Compact Display (No Count)

```tsx
import { AggregateRatingDisplay } from '../components/venue';

const CompactVenueCard = ({ venue }) => (
  <View>
    <Text>{venue.name}</Text>
    <AggregateRatingDisplay
      rating={venue.aggregate_rating}
      reviewCount={venue.review_count}
      size="small"
      showCount={false}
    />
  </View>
);
```

## Testing

The component includes comprehensive unit tests covering:

- ✅ Basic rendering with rating and count
- ✅ Zero reviews handling
- ✅ Singular vs plural review text
- ✅ Show/hide review count
- ✅ Rating formatting (one decimal place)
- ✅ Perfect 5.0 rating
- ✅ All size variants

Run tests:
```bash
npm test -- src/components/venue/__tests__/AggregateRatingDisplay.test.tsx
```

## Example Component

A comprehensive example component is available at:
`src/components/venue/AggregateRatingDisplay.example.tsx`

This example demonstrates:
- High ratings (highlighted)
- Medium ratings
- Low ratings
- Edge cases (5.0, single review, no reviews, half stars)
- Size comparisons
- With/without review count

## Files Created

1. **Component**: `src/components/venue/AggregateRatingDisplay.tsx`
2. **Tests**: `src/components/venue/__tests__/AggregateRatingDisplay.test.tsx`
3. **Example**: `src/components/venue/AggregateRatingDisplay.example.tsx`
4. **Documentation**: `src/components/venue/AggregateRatingDisplay.README.md`
5. **Export**: Updated `src/components/venue/index.ts`

## Next Steps

This component is ready to be integrated into:

1. **Task 17.1**: Add to venue detail screen header
2. **Task 18.1**: Add to home feed venue cards
3. **Task 19**: Integrate with venue dashboard analytics

The component is fully tested, documented, and ready for production use.
