# Design Document: User Profile Redesign

## Overview

This design document outlines the architecture and implementation approach for redesigning the user profile screen with an enhanced visual layout featuring a hero section with profile photo, editable "About me" section, and tabbed navigation between Main Info and Settings.

The redesign focuses on creating a modern, Instagram-style profile interface that emphasizes visual appeal while maintaining functionality and accessibility.

## Architecture

### Component Hierarchy

```
ProfileScreen
├── HeroSection
│   ├── ProfileImage
│   ├── UsernameOverlay
│   ├── ShareButton
│   └── CameraButton
├── AboutMeSection
│   ├── AboutHeader (title + edit button)
│   ├── AboutText (read mode)
│   └── AboutEditor (edit mode)
│       ├── TextInput
│       └── SaveButton
├── TabNavigation
│   ├── MainInfoTab
│   └── SettingsTab
└── TabContent
    ├── MainInfoContent
    │   ├── FollowersCard
    │   │   ├── FollowerCount
    │   │   ├── AvatarRow
    │   │   └── InviteButton
    │   └── StatisticsCard
    │       ├── CheckInsStat
    │       ├── FavoritesStat
    │       └── FriendsStat
    └── SettingsContent
        └── SettingsMenu
            ├── NotificationsSetting
            ├── PrivacySetting
            ├── SecuritySetting
            ├── HelpSetting
            └── LogOutSetting
```

### State Management

```typescript
interface ProfileScreenState {
  // User data
  user: User | null;
  profileImageUri: string | null;
  aboutText: string;
  
  // UI state
  activeTab: 'main' | 'settings';
  isEditingAbout: boolean;
  
  // Loading states
  isUploadingPhoto: boolean;
  isSavingAbout: boolean;
  
  // Statistics
  followerCount: number;
  checkInsCount: number;
  favoritesCount: number;
  friendsCount: number;
  recentFollowers: User[];
}
```

### Data Flow

1. **Profile Load**: Fetch user profile data including photo URL, about text, and statistics
2. **Photo Upload**: User selects photo → validate → compress → upload → update state
3. **About Edit**: User enters edit mode → modifies text → saves → persist to backend → update state
4. **Tab Switch**: User taps tab → update activeTab state → render corresponding content

## Components and Interfaces

### HeroSection Component

**Purpose**: Display large profile photo with overlaid username and action buttons

**Props**:
```typescript
interface HeroSectionProps {
  profileImageUri: string | null;
  username: string;
  onCameraPress: () => void;
  onSharePress: () => void;
}
```

**Behavior**:
- Displays full-width image (400pt height)
- Shows placeholder if no image uploaded
- Overlays username at bottom-left
- Overlays share and camera buttons at bottom-right
- Camera button opens photo picker

### AboutMeSection Component

**Purpose**: Display and edit user's about text

**Props**:
```typescript
interface AboutMeSectionProps {
  aboutText: string;
  isEditing: boolean;
  onEditPress: () => void;
  onSavePress: (newText: string) => void;
  onTextChange: (text: string) => void;
}
```

**Behavior**:
- Shows read-only text by default
- Switches to edit mode with TextInput
- Validates text length (max 500 characters)
- Persists changes on save

### TabNavigation Component

**Purpose**: Provide tab switching interface

**Props**:
```typescript
interface TabNavigationProps {
  activeTab: 'main' | 'settings';
  onTabChange: (tab: 'main' | 'settings') => void;
}
```

**Behavior**:
- Displays two tabs side-by-side
- Shows active indicator (bottom border)
- Applies bold styling to active tab
- Triggers content change on tap

### FollowersCard Component

**Purpose**: Display follower count and recent followers

**Props**:
```typescript
interface FollowersCardProps {
  followerCount: number;
  recentFollowers: User[];
  onInvitePress: () => void;
}
```

**Behavior**:
- Displays large follower count
- Shows up to 4 avatar previews
- Provides invite friend button

### StatisticsCard Component

**Purpose**: Display user engagement statistics

**Props**:
```typescript
interface StatisticsCardProps {
  checkInsCount: number;
  favoritesCount: number;
  friendsCount: number;
}
```

**Behavior**:
- Displays three statistics in a row
- Each stat has icon, label, and value
- Icons: location (check-ins), heart (favorites), people (friends)

### SettingsMenu Component

**Purpose**: Display settings options

**Props**:
```typescript
interface SettingsMenuProps {
  onSettingPress: (setting: SettingType) => void;
}

type SettingType = 'notifications' | 'privacy' | 'security' | 'help' | 'logout';
```

**Behavior**:
- Displays list of setting options
- Each option has icon, label, and chevron
- Logout option styled in red
- Triggers navigation on tap

## Data Models

### User Profile Model

```typescript
interface UserProfile {
  id: string;
  email: string;
  username: string;
  profilePhotoUrl: string | null;
  aboutText: string;
  followerCount: number;
  checkInsCount: number;
  favoritesCount: number;
  friendsCount: number;
  createdAt: string;
  updatedAt: string;
}
```

### Photo Upload Model

```typescript
interface PhotoUploadRequest {
  userId: string;
  imageData: string; // base64 or file URI
  imageType: string; // 'image/jpeg' | 'image/png'
}

interface PhotoUploadResponse {
  success: boolean;
  photoUrl?: string;
  error?: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Placeholder Display

*For any* user profile without a photo URL, the hero section should display the placeholder image

**Validates: Requirements 1.2**

### Property 2: Photo Update Consistency

*For any* selected photo URI, after selection the hero section should display that exact URI

**Validates: Requirements 1.4**

### Property 3: Edit Mode State Transition

*For any* about text value, entering edit mode should display a text input containing that value

**Validates: Requirements 2.2**

### Property 4: About Text Persistence

*For any* edited about text, after saving the displayed text should match the saved text

**Validates: Requirements 2.4, 2.5**

### Property 5: Edit Icon Visibility

*For any* edit state, when not editing the edit icon should be visible, and when editing the checkmark icon should be visible

**Validates: Requirements 2.6, 2.7**

### Property 6: Active Tab Styling

*For any* active tab, that tab should have both the bottom border indicator and bold text styling applied

**Validates: Requirements 3.5, 3.6**

### Property 7: Statistics Display

*For any* set of statistics values (check-ins, favorites, friends), all three should be displayed with their corresponding icons

**Validates: Requirements 4.6, 4.7, 4.8**

### Property 8: Follower Avatar Rendering

*For any* list of recent followers, avatar components should be rendered for each follower up to a maximum of 4

**Validates: Requirements 4.3**

### Property 9: Setting Navigation

*For any* setting option, tapping it should trigger the navigation callback with the correct setting type

**Validates: Requirements 5.7**

### Property 10: Image Format Validation

*For any* file input, the system should reject files that are not valid image formats (jpeg, png, gif, webp)

**Validates: Requirements 6.1**

### Property 11: Image Compression

*For any* valid image input, the compressed output should have a smaller file size than the input

**Validates: Requirements 6.2**

### Property 12: Photo URL Storage

*For any* successful photo upload response, the returned photo URL should be stored in the profile state

**Validates: Requirements 6.4**

### Property 13: Conditional Photo Display

*For any* profile state, if photoUrl is non-null the uploaded photo should be displayed, otherwise the placeholder should be displayed

**Validates: Requirements 6.6**

### Property 14: Touch Target Accessibility

*For all* interactive elements (buttons, tabs, edit icon), the minimum dimensions should be at least 44pt x 44pt

**Validates: Requirements 7.3, 8.4**

### Property 15: Accessibility Labels

*For all* interactive elements, an accessibilityLabel property should be defined with a descriptive string

**Validates: Requirements 8.1**

### Property 16: Tab Change Announcements

*For any* tab change, AccessibilityInfo.announceForAccessibility should be called with the new tab name

**Validates: Requirements 8.2**

### Property 17: Edit Mode Announcements

*For any* transition to edit mode, AccessibilityInfo.announceForAccessibility should be called with "Editing about me"

**Validates: Requirements 8.3**

## Error Handling

### Photo Upload Errors

- **Network Error**: Display toast message "Failed to upload photo. Check your connection."
- **Invalid Format**: Display toast message "Please select a valid image file (JPEG, PNG, GIF, WEBP)"
- **File Too Large**: Display toast message "Image is too large. Please select a smaller image."
- **Server Error**: Display toast message "Upload failed. Please try again later."

**Behavior**: On any upload error, maintain the previous photo state and allow retry

### About Text Save Errors

- **Network Error**: Display toast message "Failed to save. Check your connection."
- **Validation Error**: Display toast message "About text is too long (max 500 characters)"
- **Server Error**: Display toast message "Save failed. Please try again later."

**Behavior**: On save error, keep edit mode active and preserve user's edited text

### Data Fetch Errors

- **Profile Load Error**: Display error state with retry button
- **Statistics Load Error**: Display "0" for failed statistics with refresh option

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples and edge cases:

- Hero section renders with placeholder when no photo URL provided
- About section switches between read and edit modes
- Tab navigation updates active tab state
- Settings menu renders all options with correct icons
- Photo upload validates file formats correctly
- Error messages display for various failure scenarios

### Property-Based Tests

Property-based tests will verify universal properties across all inputs using **fast-check** (JavaScript property testing library):

- **Property 1-17**: Each correctness property will be implemented as a property-based test
- **Configuration**: Minimum 100 iterations per test
- **Tagging**: Each test tagged with `Feature: user-profile-redesign, Property N: [property text]`

**Example Property Test Structure**:
```typescript
// Feature: user-profile-redesign, Property 1: Placeholder Display
it('should display placeholder for profiles without photo URL', () => {
  fc.assert(
    fc.property(
      fc.record({
        username: fc.string(),
        aboutText: fc.string(),
        photoUrl: fc.constant(null)
      }),
      (profile) => {
        const { getByTestId } = render(<HeroSection {...profile} />);
        const image = getByTestId('profile-image');
        expect(image.props.source.uri).toContain('placeholder');
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Tests

- Test complete user flows: photo upload → save → reload
- Test tab switching with content updates
- Test edit → save → display flow for about text
- Test error recovery scenarios

### Accessibility Tests

- Verify all touch targets meet 44pt minimum
- Verify all interactive elements have accessibility labels
- Verify screen reader announcements for state changes
- Test with React Native Testing Library accessibility queries

## Performance Considerations

### Image Optimization

- Compress images to max 1000x1000px before upload
- Use JPEG format with 0.8 quality for photos
- Implement progressive loading for profile images
- Cache uploaded images locally

### Rendering Optimization

- Use React.memo for static components (FollowersCard, StatisticsCard)
- Implement lazy loading for tab content
- Debounce about text input to reduce re-renders
- Use FlatList for settings menu if list grows

### Network Optimization

- Batch statistics requests
- Implement optimistic UI updates for about text saves
- Cache profile data with 5-minute TTL
- Use image CDN for profile photos

## Styling Guidelines

### Colors

- **Primary**: Theme primary color
- **Surface**: Theme surface color (cards)
- **Text**: Theme text color
- **Text Secondary**: Theme textSecondary color
- **Error**: #EF4444 (red for logout and errors)
- **Success**: #10B981 (green for success states)

### Typography

- **Hero Username**: 24pt, Poppins-Bold, white
- **Section Titles**: 20pt, Poppins-Bold
- **Body Text**: 16pt, Inter-Regular
- **Tab Text**: 16pt, Inter-Medium (active: Inter-SemiBold)
- **Statistics**: 20pt, Poppins-Bold

### Spacing

- **Section Padding**: 20pt horizontal, 20pt vertical
- **Card Padding**: 20pt all sides
- **Card Margin**: 16pt bottom
- **Element Gap**: 8-12pt between related elements

### Shadows

- **Cards**: shadowOpacity 0.1, shadowRadius 8, elevation 3
- **Hero Buttons**: shadowOpacity 0.3, shadowRadius 4

## Implementation Notes

### Photo Picker Integration

Use `react-native-image-picker` library:
```typescript
import { launchImageLibrary } from 'react-native-image-picker';

const handleImagePicker = () => {
  launchImageLibrary({
    mediaType: 'photo',
    quality: 0.8,
    maxWidth: 1000,
    maxHeight: 1000,
  }, (response) => {
    if (response.assets && response.assets[0]) {
      handlePhotoUpload(response.assets[0].uri);
    }
  });
};
```

### Accessibility Implementation

```typescript
<TouchableOpacity
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel="Edit about me"
  accessibilityHint="Double tap to edit your about me text"
  onPress={handleEditPress}
>
  <Icon name="create-outline" size={20} />
</TouchableOpacity>
```

### Tab Animation

Use `react-native-reanimated` for smooth tab transitions:
```typescript
const contentOpacity = useSharedValue(1);

const animatedStyle = useAnimatedStyle(() => ({
  opacity: contentOpacity.value,
}));

const handleTabChange = (tab: TabType) => {
  contentOpacity.value = withTiming(0, { duration: 150 }, () => {
    runOnJS(setActiveTab)(tab);
    contentOpacity.value = withTiming(1, { duration: 150 });
  });
};
```

## Future Enhancements

- Photo cropping and filters
- Multiple photo gallery
- Video profile support
- Custom themes and backgrounds
- Social sharing integrations
- Profile badges and achievements
