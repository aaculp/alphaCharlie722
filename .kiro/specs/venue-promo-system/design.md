# Design Document: Venue Promo System

## Overview

The Venue Promo System is a comprehensive promotional offer management platform that enables venue owners to create, manage, and track promotional campaigns while allowing customers to discover and claim offers through QR code scanning. The system integrates with the existing React Native mobile application, Supabase backend, and venue business account infrastructure.

The design follows a bidirectional QR code flow: venues generate QR codes for promos that customers scan to claim, and customers receive claim verification codes that venues scan to confirm redemption. This dual-verification approach prevents fraud while maintaining a smooth user experience.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile Application                       │
├─────────────────────────────────────────────────────────────┤
│  Customer Screens          │  Venue Owner Screens           │
│  - Active Promos Feed      │  - Promo Creation Form         │
│  - QR Scanner (Claim)      │  - Promo Management List       │
│  - Claim History           │  - QR Code Display             │
│  - Venue Detail (Promos)   │  - QR Scanner (Verification)   │
│                            │  - Promo Analytics Dashboard   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Service Layer                            │
├─────────────────────────────────────────────────────────────┤
│  - PromoService            │  - QRCodeService               │
│  - ClaimService            │  - NotificationService         │
│  - AnalyticsService        │  - ValidationService           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Supabase Backend                           │
├─────────────────────────────────────────────────────────────┤
│  Tables:                   │  Functions:                     │
│  - promos                  │  - expire_old_promos()         │
│  - promo_claims            │  - get_active_promos_nearby()  │
│  - promo_analytics         │  - verify_claim_code()         │
│                            │                                 │
│  RLS Policies:             │  Triggers:                      │
│  - Venue owner access      │  - update_claim_count          │
│  - Customer claim access   │  - check_claim_limit           │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend**: React Native, TypeScript, React Navigation
- **Backend**: Supabase (PostgreSQL, Row Level Security, Edge Functions)
- **QR Code**: react-native-qrcode-svg (generation), react-native-camera (scanning)
- **State Management**: React Context API (existing AuthContext, new PromoContext)
- **Push Notifications**: Firebase Cloud Messaging (existing infrastructure)

## Components and Interfaces

### Database Schema

#### promos Table

```typescript
interface Promo {
  id: string;                    // UUID, primary key
  venue_id: string;              // Foreign key to venues table
  business_account_id: string;   // Foreign key to venue_business_accounts
  title: string;                 // Max 100 characters
  description: string;           // Max 500 characters
  terms: string;                 // Max 1000 characters
  status: PromoStatus;           // 'active' | 'inactive' | 'expired' | 'claimed_out'
  created_at: timestamp;
  expires_at: timestamp;
  claim_limit: number | null;    // Null = unlimited
  claim_count: number;           // Denormalized for performance
  qr_code_data: string;          // Encoded promo ID
}

type PromoStatus = 'active' | 'inactive' | 'expired' | 'claimed_out';
```

#### promo_claims Table

```typescript
interface PromoClaim {
  id: string;                    // UUID, primary key
  promo_id: string;              // Foreign key to promos
  user_id: string;               // Foreign key to profiles
  venue_id: string;              // Denormalized for queries
  claim_code: string;            // Unique 8-character verification code
  claimed_at: timestamp;
  redeemed_at: timestamp | null;
  redeemed_by: string | null;   // User ID of venue owner who verified
  status: ClaimStatus;           // 'pending' | 'redeemed' | 'expired'
}

type ClaimStatus = 'pending' | 'redeemed' | 'expired';
```

#### promo_analytics Table (Materialized View)

```typescript
interface PromoAnalytics {
  promo_id: string;
  total_claims: number;
  unique_claimers: number;
  total_redemptions: number;
  redemption_rate: number;       // Calculated: redemptions / claims
  claims_by_day: Record<string, number>;  // JSON object
  last_updated: timestamp;
}
```

### Service Interfaces

#### PromoService

```typescript
interface PromoService {
  // Venue owner operations
  createPromo(data: CreatePromoInput): Promise<Promo>;
  updatePromo(promoId: string, data: UpdatePromoInput): Promise<Promo>;
  deactivatePromo(promoId: string): Promise<void>;
  getVenuePromos(venueId: string): Promise<Promo[]>;
  getPromoAnalytics(promoId: string): Promise<PromoAnalytics>;
  
  // Customer operations
  getActivePromosNearby(latitude: number, longitude: number, radiusMiles: number): Promise<Promo[]>;
  getPromoDetails(promoId: string): Promise<Promo>;
  
  // System operations
  expireOldPromos(): Promise<number>; // Returns count of expired promos
}

interface CreatePromoInput {
  venue_id: string;
  title: string;
  description: string;
  terms: string;
  expires_at: Date;
  claim_limit?: number;
  send_notification?: boolean;
}

interface UpdatePromoInput {
  title?: string;
  description?: string;
  terms?: string;
  expires_at?: Date;
  claim_limit?: number;
}
```

#### ClaimService

```typescript
interface ClaimService {
  // Customer operations
  claimPromo(promoId: string, userId: string): Promise<PromoClaim>;
  getUserClaims(userId: string): Promise<PromoClaim[]>;
  getClaimDetails(claimId: string): Promise<PromoClaim>;
  
  // Venue owner operations
  verifyClaimCode(claimCode: string, venueOwnerId: string): Promise<PromoClaim>;
  redeemClaim(claimId: string, venueOwnerId: string): Promise<PromoClaim>;
  
  // Validation
  canUserClaimPromo(promoId: string, userId: string): Promise<boolean>;
  hasUserClaimedPromo(promoId: string, userId: string): Promise<boolean>;
}
```

#### QRCodeService

```typescript
interface QRCodeService {
  // Generation
  generatePromoQRCode(promoId: string): Promise<string>; // Returns SVG string
  generateClaimQRCode(claimCode: string): Promise<string>;
  
  // Parsing
  parsePromoQRCode(qrData: string): Promise<string>; // Returns promo ID
  parseClaimQRCode(qrData: string): Promise<string>; // Returns claim code
  
  // Validation
  validateQRCodeFormat(qrData: string): boolean;
}
```

### React Components

#### Customer Components

```typescript
// Active Promos Feed Section (Home Screen)
interface ActivePromosFeedProps {
  userLocation: { latitude: number; longitude: number };
}

// Promo Card (in horizontal scroll)
interface PromoCardProps {
  promo: Promo;
  venue: Venue;
  onPress: () => void;
}

// QR Scanner Screen (Claim)
interface PromoQRScannerProps {
  onScanSuccess: (promoId: string) => void;
  onScanError: (error: Error) => void;
}

// Claim Confirmation Screen
interface ClaimConfirmationProps {
  claim: PromoClaim;
  promo: Promo;
  venue: Venue;
}

// Claim History Screen
interface ClaimHistoryProps {
  userId: string;
}

// Claim Detail Screen
interface ClaimDetailProps {
  claim: PromoClaim;
  promo: Promo;
  venue: Venue;
}
```

#### Venue Owner Components

```typescript
// Promo Creation Form
interface PromoCreationFormProps {
  venueId: string;
  businessAccountId: string;
  onSuccess: (promo: Promo) => void;
}

// Promo Management List
interface PromoManagementListProps {
  venueId: string;
}

// Promo Card (Management View)
interface PromoManagementCardProps {
  promo: Promo;
  onEdit: () => void;
  onDeactivate: () => void;
  onViewAnalytics: () => void;
}

// QR Code Display Modal
interface PromoQRDisplayProps {
  promo: Promo;
  onDownload: () => void;
}

// Claim Verification Scanner
interface ClaimVerificationScannerProps {
  venueId: string;
  onVerifySuccess: (claim: PromoClaim) => void;
  onVerifyError: (error: Error) => void;
}

// Promo Analytics Dashboard
interface PromoAnalyticsDashboardProps {
  promo: Promo;
  analytics: PromoAnalytics;
}
```

## Data Models

### Promo Lifecycle States

```
┌─────────┐
│ Created │
└────┬────┘
     │
     ▼
┌─────────┐     Deactivate      ┌──────────┐
│ Active  │ ──────────────────> │ Inactive │
└────┬────┘                     └──────────┘
     │
     ├─── Expiration Date Reached ──> ┌─────────┐
     │                                 │ Expired │
     │                                 └─────────┘
     │
     └─── Claim Limit Reached ──────> ┌─────────────┐
                                       │ Claimed Out │
                                       └─────────────┘
```

### Claim Lifecycle States

```
┌─────────┐
│ Claimed │
└────┬────┘
     │
     ├─── Venue Scans Claim Code ──> ┌──────────┐
     │                                │ Redeemed │
     │                                └──────────┘
     │
     └─── Promo Expires ───────────> ┌─────────┐
                                      │ Expired │
                                      └─────────┘
```

### QR Code Data Format

**Promo QR Code:**
```
otw://promo/{promo_id}
```

**Claim Verification QR Code:**
```
otw://claim/{claim_code}
```

### Validation Rules

```typescript
const VALIDATION_RULES = {
  promo: {
    title: {
      minLength: 3,
      maxLength: 100,
      required: true
    },
    description: {
      minLength: 10,
      maxLength: 500,
      required: true
    },
    terms: {
      minLength: 10,
      maxLength: 1000,
      required: true
    },
    expires_at: {
      mustBeFuture: true,
      maxDaysInFuture: 90,
      required: true
    },
    claim_limit: {
      min: 1,
      max: 10000,
      required: false
    }
  },
  claim: {
    claim_code: {
      length: 8,
      format: /^[A-Z0-9]{8}$/,
      required: true
    }
  }
};
```

## Correctness Properties


*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Required Fields Validation

*For any* promo creation request, if it is missing title, description, terms, or expiration date, then the system should reject the request with a validation error.

**Validates: Requirements 1.1**

### Property 2: QR Code Generation and Uniqueness

*For any* created promo, the system should generate a unique QR code that encodes the promo ID, and no two promos should have the same QR code.

**Validates: Requirements 1.2, 3.1**

### Property 3: Future Date Validation

*For any* expiration date provided during promo creation or update, if the date is not in the future, then the system should reject the request with a validation error.

**Validates: Requirements 1.3**

### Property 4: Initial Promo Status

*For any* successfully created promo, the initial status should be "active".

**Validates: Requirements 1.4**

### Property 5: Claim Limit Enforcement

*For any* promo with a claim limit, when the number of claims reaches the limit, then subsequent claim attempts should be rejected and the promo status should be set to "claimed_out".

**Validates: Requirements 1.5, 5.4**

### Property 6: Venue Promo Retrieval Completeness

*For any* venue with promos, querying for that venue's promos should return all promos associated with that venue, including their current status and claim counts.

**Validates: Requirements 2.1**

### Property 7: Promo Update Persistence

*For any* promo and any valid update to its title, description, terms, or expiration date, the changes should be persisted and reflected in subsequent queries.

**Validates: Requirements 2.2**

### Property 8: Deactivation State Transition

*For any* active promo, when deactivated by the venue owner, the status should change to "inactive" and subsequent claim attempts should be rejected.

**Validates: Requirements 2.3**

### Property 9: Automatic Expiration

*For any* promo with an expiration date in the past, the system should automatically set the status to "expired" and prevent new claims.

**Validates: Requirements 2.4, 10.1**

### Property 10: QR Code Round Trip

*For any* promo ID, encoding it into a QR code and then parsing that QR code should return the original promo ID.

**Validates: Requirements 3.4**

### Property 11: QR Code Validation

*For any* scanned QR code, if the encoded promo ID does not exist in the database, then the system should reject the scan with a validation error.

**Validates: Requirements 3.5**

### Property 12: Active Promo Filtering

*For any* query for active promos, the results should include only promos with status "active" and expiration dates in the future.

**Validates: Requirements 4.2**

### Property 13: Location-Based Promo Discovery

*For any* customer location and venue location, if the distance between them is less than or equal to 10 miles and the venue has active promos, then that venue should be included in the Active Promos feed.

**Validates: Requirements 4.3**

### Property 14: Promo Display Completeness

*For any* promo displayed to a customer, the output should include the title, description, expiration date, and venue name.

**Validates: Requirements 4.5**

### Property 15: Claim Validation

*For any* claim attempt, if the promo is not active or is expired, then the claim should be rejected with a validation error.

**Validates: Requirements 5.1**

### Property 16: Claim Record Creation

*For any* valid claim attempt, the system should create a claim record that links the customer ID to the promo ID with a unique claim code.

**Validates: Requirements 5.2**

### Property 17: Duplicate Claim Prevention

*For any* customer and promo, if the customer has already claimed that promo, then subsequent claim attempts should be rejected.

**Validates: Requirements 5.3**

### Property 18: Claim Confirmation Data

*For any* successful claim, the response should include the promo details and a unique claim verification code.

**Validates: Requirements 5.5**

### Property 19: Claim Code Uniqueness

*For any* set of claims, all claim verification codes should be unique across the entire system.

**Validates: Requirements 6.1**

### Property 20: Claim Code Validation

*For any* claim verification code, if it does not exist in the database or does not belong to the venue being verified, then the verification should be rejected.

**Validates: Requirements 6.2**

### Property 21: Redemption State Transition

*For any* valid claim verification, the claim status should change to "redeemed" and a redemption timestamp should be recorded.

**Validates: Requirements 6.3**

### Property 22: Duplicate Redemption Prevention

*For any* claim, if it has already been redeemed, then subsequent redemption attempts should be rejected.

**Validates: Requirements 6.4**

### Property 23: Invalid Claim Code Rejection

*For any* claim verification code that does not match the expected format or does not exist, the system should reject it with an appropriate error.

**Validates: Requirements 6.5**

### Property 24: Claim History Sorting

*For any* customer's claim history, the claims should be sorted by claim date in descending order (most recent first).

**Validates: Requirements 7.1**

### Property 25: Claim Display Completeness

*For any* claimed promo in the history view, the display should include the promo title, venue name, claim date, and redemption status.

**Validates: Requirements 7.2**

### Property 26: Unredeemed Claim Code Display

*For any* claim that has not been redeemed, the claim verification code should be included in the display data.

**Validates: Requirements 7.3**

### Property 27: Redeemed Claim Timestamp Display

*For any* claim that has been redeemed, the redemption timestamp should be included in the display data.

**Validates: Requirements 7.4**

### Property 28: Claim Count Accuracy

*For any* promo, the total claims count in analytics should equal the actual number of claim records for that promo.

**Validates: Requirements 8.1**

### Property 29: Redemption Rate Calculation

*For any* promo with claims, the redemption rate should equal (number of redeemed claims / total number of claims).

**Validates: Requirements 8.2**

### Property 30: Unique Claimers Count

*For any* promo, the unique customers count in analytics should equal the number of distinct user IDs who have claimed that promo.

**Validates: Requirements 8.4**

### Property 31: Notification Targeting

*For any* promo notification, the system should target only customers whose location is within the venue's notification radius.

**Validates: Requirements 9.2**

### Property 32: Notification Content Completeness

*For any* promo notification sent to a customer, the notification should include the promo title and a deep link to the venue detail page.

**Validates: Requirements 9.3**

### Property 33: Credit Deduction

*For any* promo notification sent, the venue's push notification credit count should decrease by 1.

**Validates: Requirements 9.4**

### Property 34: Insufficient Credits Prevention

*For any* venue with zero push notification credits, attempting to send a promo notification should be rejected with an error.

**Validates: Requirements 9.5**

### Property 35: Expired Promo Exclusion

*For any* query for active promos, expired promos should not be included in the results.

**Validates: Requirements 10.2**

### Property 36: Expired Promo Claim Prevention

*For any* promo with status "expired", claim attempts should be rejected with an error.

**Validates: Requirements 10.3**

### Property 37: Expired Promo Data Completeness

*For any* expired promo viewed by a venue owner, the display should include the expiration date and final claim statistics.

**Validates: Requirements 10.4**

## Error Handling

### Error Categories

```typescript
enum PromoErrorCode {
  // Validation Errors
  INVALID_PROMO_DATA = 'INVALID_PROMO_DATA',
  INVALID_EXPIRATION_DATE = 'INVALID_EXPIRATION_DATE',
  INVALID_CLAIM_LIMIT = 'INVALID_CLAIM_LIMIT',
  INVALID_QR_CODE = 'INVALID_QR_CODE',
  INVALID_CLAIM_CODE = 'INVALID_CLAIM_CODE',
  
  // Business Logic Errors
  PROMO_NOT_FOUND = 'PROMO_NOT_FOUND',
  PROMO_EXPIRED = 'PROMO_EXPIRED',
  PROMO_INACTIVE = 'PROMO_INACTIVE',
  PROMO_CLAIMED_OUT = 'PROMO_CLAIMED_OUT',
  DUPLICATE_CLAIM = 'DUPLICATE_CLAIM',
  CLAIM_NOT_FOUND = 'CLAIM_NOT_FOUND',
  CLAIM_ALREADY_REDEEMED = 'CLAIM_ALREADY_REDEEMED',
  
  // Authorization Errors
  UNAUTHORIZED_VENUE_ACCESS = 'UNAUTHORIZED_VENUE_ACCESS',
  UNAUTHORIZED_CLAIM_ACCESS = 'UNAUTHORIZED_CLAIM_ACCESS',
  
  // System Errors
  INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS',
  QR_CODE_GENERATION_FAILED = 'QR_CODE_GENERATION_FAILED',
  DATABASE_ERROR = 'DATABASE_ERROR',
}

interface PromoError {
  code: PromoErrorCode;
  message: string;
  details?: Record<string, any>;
}
```

### Error Handling Strategy

1. **Validation Errors**: Return immediately with descriptive error messages
2. **Business Logic Errors**: Check preconditions before operations, return specific errors
3. **Authorization Errors**: Verify user permissions using RLS policies
4. **System Errors**: Log errors, return generic messages to users, alert monitoring
5. **Transactional Integrity**: Use database transactions for multi-step operations (claim + update count)

### Example Error Responses

```typescript
// Expired promo claim attempt
{
  code: 'PROMO_EXPIRED',
  message: 'This promo has expired and can no longer be claimed',
  details: {
    promo_id: 'abc123',
    expired_at: '2024-01-15T10:00:00Z'
  }
}

// Duplicate claim attempt
{
  code: 'DUPLICATE_CLAIM',
  message: 'You have already claimed this promo',
  details: {
    promo_id: 'abc123',
    existing_claim_id: 'xyz789',
    claimed_at: '2024-01-10T14:30:00Z'
  }
}

// Insufficient credits
{
  code: 'INSUFFICIENT_CREDITS',
  message: 'Insufficient push notification credits. Please upgrade your subscription.',
  details: {
    current_credits: 0,
    required_credits: 1,
    subscription_tier: 'free'
  }
}
```

## Testing Strategy

### Dual Testing Approach

The Venue Promo System will be validated using both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

Both testing approaches are complementary and necessary for comprehensive coverage. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Property-Based Testing

We will use **fast-check** (JavaScript/TypeScript property-based testing library) to implement the correctness properties defined above. Each property test will:

- Run a minimum of 100 iterations with randomly generated inputs
- Be tagged with a comment referencing the design property number
- Test the universal behavior across all valid input combinations

**Tag Format:**
```typescript
// Feature: venue-promo-system, Property 5: Claim Limit Enforcement
```

### Unit Testing Focus Areas

Unit tests will focus on:

1. **Specific Examples**:
   - Creating a promo with valid data succeeds
   - Claiming a promo with valid QR code succeeds
   - Redeeming a claim with valid code succeeds

2. **Edge Cases**:
   - Promo with expiration date exactly at current time
   - Promo with claim limit of 1
   - Claim code with special characters
   - Location exactly 10 miles away

3. **Error Conditions**:
   - Creating promo with missing required fields
   - Claiming expired promo
   - Redeeming already-redeemed claim
   - Insufficient push notification credits

4. **Integration Points**:
   - Promo creation triggers QR code generation
   - Claim creation updates promo claim count
   - Notification sending deducts credits
   - Expiration job updates promo statuses

### Test Data Generators

For property-based testing, we'll create generators for:

```typescript
// Promo generators
const validPromoDataGenerator = fc.record({
  title: fc.string({ minLength: 3, maxLength: 100 }),
  description: fc.string({ minLength: 10, maxLength: 500 }),
  terms: fc.string({ minLength: 10, maxLength: 1000 }),
  expires_at: fc.date({ min: new Date() }), // Future dates only
  claim_limit: fc.option(fc.integer({ min: 1, max: 10000 }))
});

// Location generators
const locationGenerator = fc.record({
  latitude: fc.double({ min: -90, max: 90 }),
  longitude: fc.double({ min: -180, max: 180 })
});

// Claim code generator
const claimCodeGenerator = fc.stringOf(
  fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'),
  { minLength: 8, maxLength: 8 }
);

// Date generators
const pastDateGenerator = fc.date({ max: new Date() });
const futureDateGenerator = fc.date({ min: new Date() });
```

### Testing Workflow

1. **Development**: Write property tests alongside implementation
2. **Continuous Integration**: Run all tests on every commit
3. **Pre-deployment**: Ensure 100% property test pass rate
4. **Monitoring**: Track test execution time and failure patterns

### Coverage Goals

- **Line Coverage**: Minimum 80%
- **Branch Coverage**: Minimum 75%
- **Property Test Coverage**: All 37 correctness properties implemented
- **Critical Path Coverage**: 100% (promo creation, claiming, redemption)
