# Security Guide: Social Push Notifications

## Overview

This document outlines the security measures implemented in the social push notification system to protect user data and ensure compliance with privacy regulations.

## Security Measures

### 1. Payload Validation

**Requirement:** 15.6 - Validate all notification payloads

**Implementation:** `src/utils/security/PayloadValidator.ts`

All notification payloads are validated before being sent to ensure:

- **Content Safety:** Payloads are checked for malicious content including:
  - Script tags (`<script>`, `<iframe>`)
  - JavaScript protocols (`javascript:`)
  - Event handlers (`onclick`, `onload`, etc.)
  - Misleading content patterns (e.g., "click here", "act now", "urgent")

- **Length Limits:**
  - Title: Maximum 100 characters
  - Body: Maximum 500 characters
  - Data keys: Maximum 50 characters
  - Data values: Maximum 1000 characters

- **Required Fields:**
  - Title, body, and data object are required
  - Data must include `type` and `navigationTarget`

- **URL Validation:**
  - Image URLs must use HTTPS protocol
  - URLs are validated for proper format

**Usage Example:**

```typescript
import { PayloadValidator } from '../utils/security';

// Validate social notification payload
const result = PayloadValidator.validateSocialPayload(payload);

if (!result.isValid) {
  console.error('Payload validation failed:', result.errors);
  throw new Error('Invalid notification payload');
}

// Sanitize user-provided content
const sanitizedTitle = PayloadValidator.sanitizeString(userProvidedTitle);
```

### 2. Device Token Encryption

**Requirement:** 15.6 - Encrypt device tokens at rest

**Implementation:** `src/utils/security/TokenEncryption.ts`

Device tokens are encrypted before being stored in the database:

- **Algorithm:** AES-256 encryption via CryptoJS
- **Key Management:** Encryption key should be stored in environment variables
- **Hashing:** Tokens can be hashed for comparison without decryption

**Configuration:**

Set the encryption key in your environment:

```bash
# .env or environment variables
DEVICE_TOKEN_ENCRYPTION_KEY=your-secure-encryption-key-here
```

**⚠️ IMPORTANT:** Never hardcode encryption keys in your source code. Always use environment variables or secure key management services (AWS Secrets Manager, Azure Key Vault, etc.).

**Usage Example:**

```typescript
import { TokenEncryption } from '../utils/security';

// Verify encryption is configured on app startup
TokenEncryption.verifyConfiguration();

// Encrypt token before storing
const encryptedToken = TokenEncryption.encrypt(plainTextToken);
await storeInDatabase(encryptedToken);

// Decrypt token when needed
const plainTextToken = TokenEncryption.decrypt(encryptedToken);

// Hash token for comparison
const tokenHash = TokenEncryption.hash(plainTextToken);
```

### 3. HTTPS Communication

**Requirement:** 15.6 - Use HTTPS for all API communication

**Implementation:** Supabase client configuration

All API communication uses HTTPS:

- **Supabase:** All Supabase API calls use HTTPS by default
  - URL: `https://cznhaaigowjhqdjtfeyz.supabase.co`
  - All database queries, authentication, and storage operations use encrypted connections

- **Firebase Cloud Messaging:** FCM uses HTTPS for all communication
  - Push notification delivery uses encrypted channels
  - Token registration and refresh use HTTPS

- **Image URLs:** All image URLs (avatars, etc.) are validated to use HTTPS protocol

**Verification:**

```typescript
// Supabase client automatically uses HTTPS
const supabaseUrl = 'https://cznhaaigowjhqdjtfeyz.supabase.co';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Payload validator ensures image URLs use HTTPS
const isValid = PayloadValidator.isValidUrl(imageUrl); // Returns false for http://
```

### 4. Privacy Data Handling

**Requirement:** 15.10 - Handle user privacy data according to regulations

**Implementation:** `src/utils/security/PrivacyDataHandler.ts`

User privacy data is handled in compliance with GDPR, CCPA, and other regulations:

- **Data Anonymization:** Personal data can be anonymized for analytics and logging
  - Email addresses: `user@example.com` → `u***r@example.com`
  - Names: `John Doe` → `J***`
  - Device tokens: Show only first and last 4 characters
  - User IDs: Hashed with consistent seed for analytics

- **Data Retention:** Automatic cleanup of old data
  - Device tokens: Deleted 30 days after becoming inactive
  - Notification logs: Retained for 90 days
  - User data: Retained for 365 days after account deletion

- **Data Export:** Users can export their data (GDPR right to data portability)
  - Includes notification preferences, device tokens (hashed), notification history
  - Formatted as JSON for easy portability

- **Compliance Validation:** Operations are validated for compliance
  - Consent required for collecting, processing, and storing data
  - Deletion always allowed (right to erasure)
  - No data sharing with third parties

**Usage Example:**

```typescript
import { PrivacyDataHandler, PrivacyDataType } from '../utils/security';

// Anonymize data for logging
const anonymizedEmail = PrivacyDataHandler.anonymize(
  'user@example.com',
  PrivacyDataType.EMAIL,
  { preserveFormat: true }
);

// Check if data should be retained
const shouldKeep = PrivacyDataHandler.shouldRetain('device_token', tokenCreatedAt);

// Prepare data for export (GDPR request)
const exportData = PrivacyDataHandler.prepareDataExport(userData);

// Validate compliance
const isCompliant = PrivacyDataHandler.validateCompliance(
  'collect',
  PrivacyDataType.DEVICE_TOKEN,
  userHasConsent
);
```

## Security Best Practices

### For Developers

1. **Never Log Sensitive Data:**
   ```typescript
   // ❌ BAD
   console.log('Device token:', token);
   
   // ✅ GOOD
   console.log('Device token:', token.substring(0, 20) + '...');
   ```

2. **Always Validate Payloads:**
   ```typescript
   // ✅ GOOD
   const validation = PayloadValidator.validateSocialPayload(payload);
   if (!validation.isValid) {
     throw new Error('Invalid payload');
   }
   ```

3. **Use Encryption for Sensitive Data:**
   ```typescript
   // ✅ GOOD
   const encrypted = TokenEncryption.encrypt(token);
   await database.store(encrypted);
   ```

4. **Respect User Privacy:**
   ```typescript
   // ✅ GOOD
   if (!userHasConsent) {
     return; // Don't collect data without consent
   }
   ```

### For System Administrators

1. **Secure Environment Variables:**
   - Store encryption keys in secure key management services
   - Rotate keys periodically
   - Never commit keys to version control

2. **Monitor Security Logs:**
   - Review validation failures
   - Monitor for suspicious patterns
   - Alert on high error rates

3. **Regular Security Audits:**
   - Review access logs
   - Audit data retention policies
   - Verify encryption is working

4. **Compliance Checks:**
   - Ensure consent is obtained before data collection
   - Verify data retention periods are enforced
   - Test data export functionality

## Compliance Checklist

- [x] Payload validation prevents malicious content
- [x] Device tokens encrypted at rest
- [x] All API communication uses HTTPS
- [x] User data can be anonymized
- [x] Data retention policies implemented
- [x] Data export functionality available
- [x] Consent validation in place
- [x] No data sharing with third parties
- [x] Right to erasure supported
- [x] Security logging enabled

## Incident Response

If a security issue is discovered:

1. **Immediate Actions:**
   - Disable affected functionality if necessary
   - Rotate encryption keys if compromised
   - Review logs for unauthorized access

2. **Investigation:**
   - Determine scope of impact
   - Identify affected users
   - Document timeline of events

3. **Notification:**
   - Notify affected users if required by law
   - Report to relevant authorities if necessary
   - Update security documentation

4. **Remediation:**
   - Fix security vulnerability
   - Update security measures
   - Conduct post-mortem review

## Additional Resources

- [GDPR Compliance Guide](https://gdpr.eu/)
- [CCPA Compliance Guide](https://oag.ca.gov/privacy/ccpa)
- [Firebase Security Best Practices](https://firebase.google.com/docs/rules/basics)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)

## Contact

For security concerns or questions:
- Email: security@yourapp.com
- Security Bug Bounty: [Link to program]
