# Design Document

## Overview

This design implements a username system with @ prefix search functionality. Users will have unique usernames (handles) that can be used for discovery and identification. The search bar will support @ prefix to search for users by username, providing a unified search experience similar to Twitter/Instagram.

## Architecture

### High-Level Flow

```
User Input → Search Detection → Route to Handler → Display Results
    ↓              ↓                    ↓                ↓
  "@john"    Detect @prefix      User Search      User Results
  "coffee"   No @prefix          Venue Search     Venue Results
```

### Components

1. **Database Layer** - Store username and bio fields
2. **Validation Layer** - Validate username format and availability
3. **Search Service** - Handle username search queries
4. **UI Layer** - Display usernames and handle @ prefix detection
5. **Migration Service** - Handle existing user migration

## Components and Interfaces

### 1. Database Schema Changes

**profiles table:**
```sql
ALTER TABLE profiles 
ADD COLUMN username VARCHAR(30) UNIQUE,
ADD COLUMN bio TEXT;

-- Constraints
ALTER TABLE profiles
ADD CONSTRAINT username_format 
CHECK (username ~ '^[a-zA-Z0-9_]{3,30}$');

-- Indexes
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_username_lower ON profiles(LOWER(username));
```

### 2. Type Definitions

**Update Database types:**
```typescript
// src/lib/supabase.ts
profiles: {
  Row: {
    id: string;
    email: string;
    name: string | null;
    username: string | null;  // NEW
    bio: string | null;       // NEW
    avatar_url: string | null;
    preferences: Record<string, any> | null;
    created_at: string;
    updated_at: string;
  };
}
```

**SocialProfile already has these fields** - just need to populate them from DB.

### 3. Username Validation Service

**Location:** `src/utils/validation/username.ts` (new file)

```typescript
export interface UsernameValidationResult {
  isValid: boolean;
  error?: string;
}

export class UsernameValidator {
  static readonly MIN_LENGTH = 3;
  static readonly MAX_LENGTH = 30;
  static readonly PATTERN = /^[a-zA-Z0-9_]{3,30}$/;
  
  static validate(username: string): UsernameValidationResult {
    if (!username || username.length < this.MIN_LENGTH) {
      return { isValid: false, error: 'Username must be at least 3 characters' };
    }
    if (username.length > this.MAX_LENGTH) {
      return { isValid: false, error: 'Username must be 30 characters or less' };
    }
    if (!this.PATTERN.test(username)) {
      return { 
        isValid: false, 
        error: 'Username can only contain letters, numbers, and underscores' 
      };
    }
    return { isValid: true };
  }
  
  static async checkAvailability(username: string): Promise<boolean> {
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .ilike('username', username)
      .maybeSingle();
    return !data;
  }
}
```

### 4. Updated Friend Search Service

**Location:** `src/services/api/friends.ts`

```typescript
static async searchUsers(
  query: string,
  currentUserId: string
): Promise<SocialProfile[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  // Detect @ prefix for username-specific search
  const isUsernameSearch = query.startsWith('@');
  const searchTerm = isUsernameSearch ? query.substring(1) : query;

  // Get blocked users
  const { data: blockedUsers } = await supabase
    .from('blocked_users')
    .select('blocked_id')
    .eq('blocker_id', currentUserId);
  const blockedIds = blockedUsers?.map((b) => b.blocked_id) || [];

  const { data: blockedByUsers } = await supabase
    .from('blocked_users')
    .select('blocker_id')
    .eq('blocked_id', currentUserId);
  const blockedByIds = blockedByUsers?.map((b) => b.blocker_id) || [];
  const allBlockedIds = [...new Set([...blockedIds, ...blockedByIds])];

  // Build search query
  let searchQuery = supabase
    .from('profiles')
    .select('id, email, name, username, bio, avatar_url, created_at')
    .neq('id', currentUserId)
    .limit(20);

  if (isUsernameSearch) {
    // Search username only
    searchQuery = searchQuery.ilike('username', `%${searchTerm}%`);
  } else {
    // Search name, username, or email
    searchQuery = searchQuery.or(
      `name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
    );
  }

  // Filter blocked users
  if (allBlockedIds.length > 0) {
    searchQuery = searchQuery.not('id', 'in', `(${allBlockedIds.join(',')})`);
  }

  const { data: profiles, error } = await searchQuery;
  if (error) throw new Error(`Failed to search users: ${error.message}`);

  return (profiles || []).map((profile) => ({
    id: profile.id,
    email: profile.email,
    name: profile.name,
    username: profile.username,
    bio: profile.bio,
    avatar_url: profile.avatar_url,
    created_at: profile.created_at,
  }));
}
```


### 5. Search Screen Updates

**Location:** `src/screens/customer/SearchScreen.tsx`

**Add state for search mode:**
```typescript
const [searchMode, setSearchMode] = useState<'venues' | 'users'>('venues');
const [userResults, setUserResults] = useState<SocialProfile[]>([]);
const [searchingUsers, setSearchingUsers] = useState(false);
```

**Detect @ prefix and route search:**
```typescript
const handleSearchQueryChange = useCallback((query: string) => {
  setSearchQuery(query);
  
  // Detect @ prefix for user search
  if (query.startsWith('@')) {
    setSearchMode('users');
    searchUsersDebounced(query);
  } else {
    setSearchMode('venues');
    // Existing venue search logic
  }
}, []);

const searchUsersDebounced = useDebounce(async (query: string) => {
  if (!user?.id) return;
  
  setSearchingUsers(true);
  try {
    const results = await searchUsers(query);
    setUserResults(results);
  } catch (error) {
    console.error('User search error:', error);
  } finally {
    setSearchingUsers(false);
  }
}, 300);
```

**Render user results:**
```typescript
const renderUserItem = ({ item }: { item: SocialProfile }) => (
  <TouchableOpacity
    style={[styles.userItem, { backgroundColor: theme.colors.surface }]}
    onPress={() => handleUserPress(item)}
  >
    {/* Avatar */}
    {item.avatar_url ? (
      <Image source={{ uri: item.avatar_url }} style={styles.userAvatar} />
    ) : (
      <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primary + '30' }]}>
        <Icon name="person" size={24} color={theme.colors.primary} />
      </View>
    )}
    
    {/* User Info */}
    <View style={styles.userInfo}>
      <Text style={[styles.userName, { color: theme.colors.text }]}>
        {item.name || 'Unknown User'}
      </Text>
      {item.username && (
        <Text style={[styles.userUsername, { color: theme.colors.textSecondary }]}>
          @{item.username}
        </Text>
      )}
      {item.bio && (
        <Text style={[styles.userBio, { color: theme.colors.textSecondary }]} numberOfLines={1}>
          {item.bio}
        </Text>
      )}
    </View>
    
    {/* Friendship Status Badge */}
    <FriendshipStatusBadge userId={item.id} />
    
    <Icon name="chevron-forward" size={20} color={theme.colors.textSecondary} />
  </TouchableOpacity>
);
```

### 6. Sign-Up Form Updates

**Location:** `src/components/UserSignUpForm.tsx`

**Add username field:**
```typescript
const [username, setUsername] = useState('');
const [usernameError, setUsernameError] = useState<string | null>(null);
const [checkingUsername, setCheckingUsername] = useState(false);

const validateUsername = useCallback(async (value: string) => {
  // Format validation
  const validation = UsernameValidator.validate(value);
  if (!validation.isValid) {
    setUsernameError(validation.error);
    return false;
  }
  
  // Availability check
  setCheckingUsername(true);
  try {
    const isAvailable = await UsernameValidator.checkAvailability(value);
    if (!isAvailable) {
      setUsernameError('Username is already taken');
      return false;
    }
    setUsernameError(null);
    return true;
  } catch (error) {
    setUsernameError('Failed to check username availability');
    return false;
  } finally {
    setCheckingUsername(false);
  }
}, []);

// Debounced validation
const debouncedValidateUsername = useDebounce(validateUsername, 500);
```

**Username input field:**
```typescript
<View style={styles.inputContainer}>
  <Text style={styles.label}>Username</Text>
  <View style={styles.usernameInputWrapper}>
    <Text style={styles.atSymbol}>@</Text>
    <TextInput
      style={styles.usernameInput}
      value={username}
      onChangeText={(text) => {
        setUsername(text.toLowerCase());
        debouncedValidateUsername(text.toLowerCase());
      }}
      placeholder="username"
      autoCapitalize="none"
      autoCorrect={false}
    />
    {checkingUsername && <ActivityIndicator size="small" />}
  </View>
  {usernameError && (
    <Text style={styles.errorText}>{usernameError}</Text>
  )}
  <Text style={styles.helperText}>
    3-30 characters, letters, numbers, and underscores only
  </Text>
</View>
```

### 7. Profile Display Updates

**Update all components that display user info:**

- `FriendRequestCard.tsx` - Add username display
- `FriendActivityFeed.tsx` - Add username display
- `ProfileScreen.tsx` - Add username and bio display
- `FollowersCard.tsx` - Add username display

**Example update:**
```typescript
<View style={styles.userInfo}>
  <Text style={styles.userName}>{user.name}</Text>
  {user.username && (
    <Text style={styles.username}>@{user.username}</Text>
  )}
  {user.bio && (
    <Text style={styles.bio}>{user.bio}</Text>
  )}
</View>
```

## Data Models

### Profile Model (Updated)

```typescript
interface Profile {
  id: string;
  email: string;
  name: string | null;
  username: string | null;      // NEW - unique handle
  bio: string | null;           // NEW - user bio
  avatar_url: string | null;
  preferences: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}
```

### Search Result Model

```typescript
interface SearchResult {
  type: 'venue' | 'user';
  data: Venue | SocialProfile;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Username Uniqueness
*For any* two different users, their usernames must be different (case-insensitive)
**Validates: Requirements 1.2**

### Property 2: Username Format Validation
*For any* username stored in the database, it must match the pattern `^[a-zA-Z0-9_]{3,30}$`
**Validates: Requirements 1.3, 1.4**

### Property 3: Search Prefix Detection
*For any* search query starting with @, the system must route to user search
**Validates: Requirements 5.1, 5.2**

### Property 4: Search Result Filtering
*For any* user search, results must exclude the current user and all blocked users
**Validates: Requirements 4.4, 4.5**

### Property 5: Username Availability Check
*For any* username availability check, it must return false if the username exists (case-insensitive)
**Validates: Requirements 2.3, 2.4**

### Property 6: @ Prefix Removal
*For any* search query starting with @, the @ must be removed before searching
**Validates: Requirements 5.2**

### Property 7: Case-Insensitive Search
*For any* username search, it must match usernames regardless of case
**Validates: Requirements 4.2**

### Property 8: Search Result Limit
*For any* username search, results must not exceed 20 users
**Validates: Requirements 4.6**

## Error Handling

### Username Validation Errors
- **Invalid format** - Display specific format requirements
- **Too short** - "Username must be at least 3 characters"
- **Too long** - "Username must be 30 characters or less"
- **Invalid characters** - "Username can only contain letters, numbers, and underscores"

### Username Availability Errors
- **Already taken** - "Username is already taken"
- **Network error** - "Failed to check username availability. Please try again."

### Search Errors
- **Network error** - "Failed to search users. Please check your connection."
- **Empty results** - "No users found matching '@username'"

### Database Errors
- **Constraint violation** - Log error, show generic message to user
- **Index creation failure** - Log error, continue without index (degraded performance)

## Testing Strategy

### Unit Tests
- Username validation (format, length, characters)
- @ prefix detection
- Username availability checking
- Search query routing

### Property-Based Tests
- Username uniqueness across random inputs
- Format validation for all valid/invalid patterns
- Search filtering for random user sets
- Case-insensitive matching for random queries

### Integration Tests
- Sign-up flow with username
- Search flow with @ prefix
- Profile display with username
- Existing user migration flow

### Manual Testing
- Test username input during sign-up
- Test @ prefix search in SearchScreen
- Test username display in all components
- Test existing user migration prompt
- Test username availability checking
- Test error states and messages
