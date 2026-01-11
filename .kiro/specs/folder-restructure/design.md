# Design Document

## Overview

This design outlines the reorganization of the OTW application's folder structure from a flat, type-based organization to a domain-driven, feature-based architecture. The refactoring will improve code discoverability, maintainability, and scalability.

## Architecture

### Current Structure (Simplified)
```
src/
├── components/          # Flat list of all components
├── screens/            # Flat list of all screens
├── services/           # Flat list of all services
├── utils/              # Flat list of utilities
├── contexts/
├── navigation/
├── hooks/
└── lib/
```

### Target Structure
```
src/
├── components/
│   ├── ui/            # Reusable UI primitives
│   ├── venue/         # Venue-specific components
│   ├── checkin/       # Check-in components
│   ├── navigation/    # Navigation components
│   └── shared/        # Shared components
├── screens/
│   ├── customer/      # Customer-facing screens
│   ├── venue/         # Venue owner screens
│   └── auth/          # Authentication screens
├── types/             # Centralized type definitions
├── services/
│   └── api/           # API layer services
├── utils/
│   ├── formatting/    # Formatting utilities
│   ├── validation/    # Validation utilities
│   └── constants/     # Constants
├── contexts/          # (unchanged)
├── navigation/        # (unchanged)
├── hooks/             # (unchanged)
├── lib/               # (unchanged)
└── assets/            # (unchanged)
```

### Design Principles

1. **Domain-Driven Organization**: Group by feature/domain, not by type
2. **Discoverability**: Related code lives together
3. **Scalability**: Easy to add new features
4. **Separation of Concerns**: Clear boundaries between layers
5. **Minimal Disruption**: Keep working directories unchanged

## Components and Interfaces

### 1. Component Organization

#### UI Components (`src/components/ui/`)
**Purpose**: Reusable, presentational components with no business logic

**Components to Move**:
- Button variants (if created)
- Card variants (if created)
- Chip variants (if created)
- Input components (if created)
- Typography components (if created)

**Structure**:
```
src/components/ui/
├── index.ts
└── (future UI primitives)
```

#### Venue Components (`src/components/venue/`)
**Purpose**: Venue-specific components

**Components to Move**:
- `TestVenueCard.tsx`
- `VenueCustomerCount.tsx`
- `ModernVenueCards.tsx`
- `VenueInfoComponents.tsx`
- `CompactParking.tsx`

**Structure**:
```
src/components/venue/
├── TestVenueCard.tsx
├── VenueCustomerCount.tsx
├── ModernVenueCards.tsx
├── VenueInfoComponents.tsx
├── CompactParking.tsx
└── index.ts
```

#### Check-In Components (`src/components/checkin/`)
**Purpose**: Check-in related components

**Components to Move**:
- `CheckInButton.tsx`
- `CheckInModal.tsx`
- `UserFeedback.tsx`
- `PulseLikeButton.tsx`

**Structure**:
```
src/components/checkin/
├── CheckInButton.tsx
├── CheckInModal.tsx
├── UserFeedback.tsx
├── PulseLikeButton.tsx
└── index.ts
```

#### Navigation Components (`src/components/navigation/`)
**Purpose**: Navigation-specific components

**Components to Move**:
- `NewFloatingTabBar.tsx`
- `AnimatedTabBar.tsx`

**Structure**:
```
src/components/navigation/
├── NewFloatingTabBar.tsx
├── AnimatedTabBar.tsx
└── index.ts
```

#### Shared Components (`src/components/shared/`)
**Purpose**: Components used across multiple features

**Components to Move**:
- `OTWLogo.tsx`

**Structure**:
```
src/components/shared/
├── OTWLogo.tsx
└── index.ts
```

### 2. Screen Organization

#### Customer Screens (`src/screens/customer/`)
**Screens to Move**:
- `HomeScreen.tsx`
- `SearchScreen.tsx`
- `VenueDetailScreen.tsx`
- `FavoritesScreen.tsx`
- `SettingsScreen.tsx`
- `QuickPicksScreen.tsx`

**Structure**:
```
src/screens/customer/
├── HomeScreen.tsx
├── SearchScreen.tsx
├── VenueDetailScreen.tsx
├── FavoritesScreen.tsx
├── SettingsScreen.tsx
├── QuickPicksScreen.tsx
└── index.ts
```

#### Venue Screens (`src/screens/venue/`)
**Screens to Move**:
- `VenueDashboardScreen.tsx`
- (future venue owner screens)

**Structure**:
```
src/screens/venue/
├── VenueDashboardScreen.tsx
└── index.ts
```

#### Auth Screens (`src/screens/auth/`)
**Screens to Move**:
- `AuthScreen.tsx`
- `SplashScreen.tsx`

**Structure**:
```
src/screens/auth/
├── AuthScreen.tsx
├── SplashScreen.tsx
└── index.ts
```

### 3. Type Definitions

#### Type Organization (`src/types/`)

**venue.types.ts**:
```typescript
export type Venue = Database['public']['Tables']['venues']['Row'];
export type VenueInsert = Database['public']['Tables']['venues']['Insert'];
export interface VenueQueryOptions {
  search?: string;
  category?: string;
  location?: string;
  limit?: number;
  offset?: number;
}
```

**user.types.ts**:
```typescript
export type User = Database['public']['Tables']['profiles']['Row'];
export type UserType = 'customer' | 'venue_owner';
```

**navigation.types.ts**:
```typescript
export type RootTabParamList = {
  Home: undefined;
  QuickPicks: undefined;
  Search: undefined;
  Settings: undefined;
};
// ... other navigation types
```

**checkin.types.ts**:
```typescript
export interface CheckIn {
  id: string;
  venue_id: string;
  user_id: string;
  checked_in_at: string;
  checked_out_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VenueCheckInStats {
  venue_id: string;
  active_checkins: number;
  recent_checkins: number;
  user_is_checked_in: boolean;
  user_checkin_id?: string;
  user_checkin_time?: string;
}
```

### 4. Service Organization

#### API Services (`src/services/api/`)

**Structure**:
```
src/services/api/
├── venues.ts          # VenueService
├── checkins.ts        # CheckInService
├── auth.ts            # AuthService
├── favorites.ts       # FavoriteService
├── feedback.ts        # UserFeedbackService
└── index.ts
```

**Naming Convention**: Keep class names but organize by domain

### 5. Utility Organization

#### Formatting Utilities (`src/utils/formatting/`)

**date.ts**:
```typescript
export const formatDate = (date: Date): string => { /* ... */ };
export const formatTime = (date: Date): string => { /* ... */ };
export const formatRelativeTime = (date: Date): string => { /* ... */ };
```

**activity.ts**:
```typescript
export const getActivityLevel = (count: number, capacity: number) => { /* ... */ };
```

**Structure**:
```
src/utils/formatting/
├── date.ts
├── activity.ts
└── index.ts
```

#### Constants (`src/utils/constants/`)

**colors.ts**:
```typescript
export const ACTIVITY_COLORS = {
  LOW: '#10B981',
  MODERATE: '#F59E0B',
  HIGH: '#EF4444',
  // ...
};
```

**spacing.ts**:
```typescript
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
```

**Structure**:
```
src/utils/constants/
├── colors.ts
├── spacing.ts
└── index.ts
```

## Data Models

All data models will be centralized in `src/types/` directory. No changes to actual data structures, only organization.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Import Path Correctness
*For any* file in the refactored structure, all import statements should resolve to valid file paths.
**Validates: Requirements 7.10**

### Property 2: Export Completeness
*For any* index.ts file, all exports should reference existing files in the same directory.
**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

### Property 3: Functional Equivalence
*For any* moved file, the functionality should be identical to the original implementation.
**Validates: Requirements 9.1, 9.2, 9.3**

### Property 4: Navigation Route Preservation
*For any* navigation route, the route should resolve to the correct screen after refactoring.
**Validates: Requirements 9.4**

### Property 5: Type Safety Preservation
*For any* TypeScript file, the type checking should pass without errors after refactoring.
**Validates: Requirements 3.10, 9.5**

### Property 6: No Broken Imports
*For any* file with imports, running the application should not produce "module not found" errors.
**Validates: Requirements 7.10, 9.9**

## Error Handling

### Migration Error Handling

1. **Broken Imports**: Verify all imports before committing
2. **Missing Exports**: Ensure all index files export correctly
3. **Type Errors**: Run TypeScript compiler after each move
4. **Runtime Errors**: Test application after each major change
5. **Rollback Plan**: Keep git history clean for easy rollback

### Validation Steps

1. **TypeScript Compilation**: `npx tsc --noEmit`
2. **Import Verification**: Search for import errors
3. **Runtime Testing**: Run app and test all screens
4. **Console Check**: Verify no console errors
5. **Navigation Testing**: Test all navigation routes

## Testing Strategy

### Manual Testing Checklist

**After Component Migration**:
- [ ] All screens render correctly
- [ ] All components display properly
- [ ] No console errors
- [ ] TypeScript compiles without errors

**After Screen Migration**:
- [ ] All navigation routes work
- [ ] All screens accessible
- [ ] No broken imports
- [ ] TypeScript compiles without errors

**After Type Migration**:
- [ ] All type imports resolve
- [ ] TypeScript compiles without errors
- [ ] No type errors in IDE

**After Service Migration**:
- [ ] All API calls work
- [ ] Data fetching works
- [ ] Error handling works
- [ ] TypeScript compiles without errors

**After Utility Migration**:
- [ ] All utility functions work
- [ ] No broken imports
- [ ] TypeScript compiles without errors

### Integration Testing

**Test Scenarios**:
1. Navigate through all screens
2. Perform check-in/check-out
3. Toggle favorites
4. Search venues
5. View venue details
6. Test all user interactions

### Automated Testing

**TypeScript Compilation**:
```bash
npx tsc --noEmit
```

**Linting**:
```bash
npm run lint
```

**Build Test**:
```bash
npm run android  # or npm run ios
```

## Implementation Notes

### Migration Strategy

**Phase 1: Components**
1. Create new component directories
2. Move components one domain at a time
3. Create index files
4. Update imports
5. Test each domain

**Phase 2: Screens**
1. Create new screen directories
2. Move screens by user type
3. Create index files
4. Update navigation imports
5. Test navigation

**Phase 3: Types**
1. Create types directory
2. Extract types from files
3. Create type files
4. Update type imports
5. Verify TypeScript compilation

**Phase 4: Services**
1. Create api directory
2. Move services
3. Create index file
4. Update service imports
5. Test API calls

**Phase 5: Utils**
1. Create utility directories
2. Move utilities
3. Extract constants
4. Create index files
5. Update utility imports

### Git Strategy

1. **Commit After Each Phase**: Don't mix phases in one commit
2. **Descriptive Messages**: "refactor: move venue components to domain folder"
3. **Test Before Commit**: Ensure app works before committing
4. **Small Commits**: One domain/feature at a time
5. **Rollback Ready**: Keep commits atomic for easy rollback

### Import Path Conventions

**Relative Imports** (within same feature):
```typescript
import { VenueCard } from './VenueCard';
```

**Absolute Imports** (from src root):
```typescript
import { VenueCard } from '@/components/venue';
import { useVenues } from '@/hooks';
```

**Note**: May need to configure TypeScript paths in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### Performance Considerations

1. **Tree Shaking**: Use named exports for better tree shaking
2. **Import Optimization**: Import only what's needed
3. **Bundle Size**: Monitor bundle size after refactoring
4. **Lazy Loading**: Consider lazy loading for large features

### Documentation Updates

1. **README.md**: Update project structure section
2. **Component Docs**: Add usage examples
3. **Type Docs**: Document type definitions
4. **Service Docs**: Document API patterns
5. **Migration Guide**: Help future developers
