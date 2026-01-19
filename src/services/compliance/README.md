# Compliance Services

This directory contains services for ensuring content and notification compliance.

## ContentModerationService

Provides content moderation for user-generated content (reviews, comments, etc.) using a tiered approach.

### Features

- **Profanity Filtering**: Automatically censors mild profanity with asterisks
- **Severe Content Detection**: Rejects hate speech, threats, and extreme content
- **Venue-Specific Whitelist**: Allows common restaurant/venue terms that might be flagged (e.g., "cocktails", "breast", "shitake")
- **Text Validation**: Validates review text length and whitespace
- **Tiered Approach**: Three severity levels (none, mild, severe)

### Usage

```typescript
import { ContentModerationService } from '@/services';

// Filter profanity in review text
const result = ContentModerationService.filterProfanity(reviewText);

if (result.wasRejected) {
  // Show error: content violates guidelines
  console.error(result.message);
} else if (result.hadProfanity) {
  // Show warning: some words were filtered
  console.warn(result.message);
  // Use filtered text
  const cleanText = result.filtered;
}

// Validate review text
const validation = ContentModerationService.validateReviewText(reviewText);

if (!validation.valid) {
  console.error(validation.error);
} else {
  // Use trimmed text
  const trimmedText = validation.trimmedText;
}
```

### Severity Levels

1. **None**: No profanity detected, content is clean
2. **Mild**: Profanity detected and censored with asterisks (e.g., "damn" → "d***")
3. **Severe**: Hate speech, threats, or extreme content detected - submission rejected

### Venue-Specific Whitelist

The following terms are whitelisted for restaurant/venue context:
- cocktails, cocktail
- breast, breasts
- cock, cocks, cocky
- shitake, shitakes
- ass, asses, assorted
- classic, classics
- bass, basses
- grasshopper, grasshoppers

### Adding Custom Whitelist Terms

```typescript
// Add venue-specific brand names or terms
ContentModerationService.addToWhitelist('brandname', 'specialterm');
```

### Requirements Validated

- **19.1**: Uses bad-words library for profanity detection
- **19.2**: Censors mild profanity with asterisks
- **19.3**: Rejects severe content (hate speech/threats)
- **19.4**: Uses tiered approach (none/mild/severe)
- **19.5**: Venue-specific whitelist for false positives
- **19.6**: Notifies users when content is filtered
- **19.8**: Custom whitelist configuration
- **19.9**: Provides community guidelines message

## ComplianceService

Ensures push notifications comply with APNs and FCM guidelines.

See `ComplianceService.ts` for details.
