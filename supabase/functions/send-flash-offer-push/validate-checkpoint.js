#!/usr/bin/env node

/**
 * Checkpoint Validation Script - Task 15
 * 
 * This script validates the Edge Function implementation without requiring
 * Supabase CLI or Deno. It checks:
 * - All required files exist
 * - Code structure is correct
 * - Environment variable validation logic is present
 * - Error handling is implemented
 * - Security measures are in place
 * 
 * Usage: node validate-checkpoint.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

function checkCodeContains(filePath, patterns, description) {
  const fullPath = path.join(__dirname, filePath);
  const content = readFile(fullPath);
  if (!content) {
    log(`  ❌ ${description}: File not found`, 'red');
    return false;
  }

  const results = patterns.map(pattern => {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    return regex.test(content);
  });

  if (results.every(r => r)) {
    log(`  ✅ ${description}`, 'green');
    return true;
  } else {
    log(`  ❌ ${description}: Missing required code`, 'red');
    return false;
  }
}

function validateCheckpoint() {
  log('\n🧪 Validating Edge Function Implementation - Task 15 Checkpoint\n', 'cyan');

  let totalChecks = 0;
  let passedChecks = 0;

  // Check 1: Required files exist
  log('📁 Checking Required Files...', 'blue');
  const requiredFiles = [
    'index.ts',
    'types.ts',
    'firebase.ts',
    'database.ts',
    'payload.ts',
    'fcm.ts',
    'analytics.ts',
    'rateLimit.ts',
    'security.ts',
    'index.test.ts',
    'TEST_README.md',
    'CHECKPOINT_TESTING.md',
  ];

  requiredFiles.forEach(file => {
    totalChecks++;
    const filePath = path.join(__dirname, file);
    if (checkFileExists(filePath)) {
      log(`  ✅ ${file}`, 'green');
      passedChecks++;
    } else {
      log(`  ❌ ${file} - Missing`, 'red');
    }
  });

  // Check 2: Main handler implementation
  log('\n🔧 Checking Main Handler (index.ts)...', 'blue');
  const indexChecks = [
    { patterns: ['validateEnvironment', 'requiredEnvVars'], desc: 'Environment validation' },
    { patterns: ['authenticateRequest', 'Authorization'], desc: 'JWT authentication' },
    { patterns: ['initializeFirebase'], desc: 'Firebase initialization' },
    { patterns: ['getOfferDetails', 'getVenueDetails', 'getTargetedUsers'], desc: 'Database queries' },
    { patterns: ['checkVenueRateLimit', 'filterUsersByRateLimit'], desc: 'Rate limiting' },
    { patterns: ['filterUsersByPreferences'], desc: 'User preference filtering' },
    { patterns: ['buildNotificationPayload'], desc: 'Payload building' },
    { patterns: ['sendNotifications'], desc: 'FCM sending' },
    { patterns: ['trackPushSent'], desc: 'Analytics tracking' },
    { patterns: ['dryRun'], desc: 'Dry-run mode' },
    { patterns: ['withTimeout', '30000'], desc: 'Timeout handling' },
    { patterns: ['retryDatabaseOperation'], desc: 'Database retry logic' },
    { patterns: ['createErrorResponse'], desc: 'Error response creation' },
    { patterns: ['validateOfferId', 'sanitizeObject'], desc: 'Input validation' },
  ];

  indexChecks.forEach(check => {
    totalChecks++;
    if (checkCodeContains('index.ts', check.patterns, check.desc)) {
      passedChecks++;
    }
  });

  // Check 3: Security implementation
  log('\n🔒 Checking Security Measures (security.ts)...', 'blue');
  const securityChecks = [
    { patterns: ['validateOfferId', 'UUID'], desc: 'Offer ID validation' },
    { patterns: ['sanitizeObject'], desc: 'Object sanitization' },
    { patterns: ['validateResponseBody'], desc: 'Response validation' },
    { patterns: ['createSafeLogger'], desc: 'Safe logging' },
    { patterns: ['FIREBASE_SERVICE_ACCOUNT|service_role|validateNoCredentials'], desc: 'Credential detection' },
  ];

  securityChecks.forEach(check => {
    totalChecks++;
    if (checkCodeContains('security.ts', check.patterns, check.desc)) {
      passedChecks++;
    }
  });

  // Check 4: Firebase integration
  log('\n🔥 Checking Firebase Integration (firebase.ts)...', 'blue');
  const firebaseChecks = [
    { patterns: ['initializeFirebase', 'credential'], desc: 'Firebase initialization' },
    { patterns: ['getFirebaseMessaging'], desc: 'Messaging instance' },
    { patterns: ['FIREBASE_SERVICE_ACCOUNT'], desc: 'Service account loading' },
  ];

  firebaseChecks.forEach(check => {
    totalChecks++;
    if (checkCodeContains('firebase.ts', check.patterns, check.desc)) {
      passedChecks++;
    }
  });

  // Check 5: Database functions
  log('\n💾 Checking Database Functions (database.ts)...', 'blue');
  const databaseChecks = [
    { patterns: ['getOfferDetails'], desc: 'Get offer details' },
    { patterns: ['getVenueDetails'], desc: 'Get venue details' },
    { patterns: ['getTargetedUsers'], desc: 'Get targeted users' },
    { patterns: ['filterUsersByPreferences'], desc: 'Filter by preferences' },
  ];

  databaseChecks.forEach(check => {
    totalChecks++;
    if (checkCodeContains('database.ts', check.patterns, check.desc)) {
      passedChecks++;
    }
  });

  // Check 6: Rate limiting
  log('\n⏱️  Checking Rate Limiting (rateLimit.ts)...', 'blue');
  const rateLimitChecks = [
    { patterns: ['checkVenueRateLimit'], desc: 'Check venue rate limit' },
    { patterns: ['incrementVenueRateLimit'], desc: 'Increment venue rate limit' },
    { patterns: ['filterUsersByRateLimit'], desc: 'Filter users by rate limit' },
    { patterns: ['incrementUserRateLimits'], desc: 'Increment user rate limits' },
  ];

  rateLimitChecks.forEach(check => {
    totalChecks++;
    if (checkCodeContains('rateLimit.ts', check.patterns, check.desc)) {
      passedChecks++;
    }
  });

  // Check 7: FCM integration
  log('\n📱 Checking FCM Integration (fcm.ts)...', 'blue');
  const fcmChecks = [
    { patterns: ['sendNotifications'], desc: 'Send notifications function' },
    { patterns: ['splitIntoBatches', '500'], desc: 'Batch splitting (500 limit)' },
    { patterns: ['sendEachForMulticast|sendMulticast'], desc: 'FCM multicast API' },
    { patterns: ['invalid.*token', 'is_active.*false'], desc: 'Invalid token handling' },
  ];

  fcmChecks.forEach(check => {
    totalChecks++;
    if (checkCodeContains('fcm.ts', check.patterns, check.desc)) {
      passedChecks++;
    }
  });

  // Check 8: Payload building
  log('\n📦 Checking Payload Building (payload.ts)...', 'blue');
  const payloadChecks = [
    { patterns: ['buildNotificationPayload'], desc: 'Build payload function' },
    { patterns: ['title', 'body', 'data'], desc: 'Required payload fields' },
    { patterns: ['android', 'channelId|channel_id'], desc: 'Android channel ID' },
    { patterns: ['apns', 'aps'], desc: 'iOS APS payload' },
    { patterns: ['priority.*high'], desc: 'High priority setting' },
  ];

  payloadChecks.forEach(check => {
    totalChecks++;
    if (checkCodeContains('payload.ts', check.patterns, check.desc)) {
      passedChecks++;
    }
  });

  // Check 9: Analytics tracking
  log('\n📊 Checking Analytics (analytics.ts)...', 'blue');
  const analyticsChecks = [
    { patterns: ['trackPushSent'], desc: 'Track push sent function' },
    { patterns: ['successCount', 'failureCount'], desc: 'Success/failure tracking' },
    { patterns: ['flash_offer_analytics|analytics_events', 'insert'], desc: 'Analytics table insert' },
  ];

  analyticsChecks.forEach(check => {
    totalChecks++;
    if (checkCodeContains('analytics.ts', check.patterns, check.desc)) {
      passedChecks++;
    }
  });

  // Check 10: Error handling patterns
  log('\n⚠️  Checking Error Handling...', 'blue');
  const errorChecks = [
    { patterns: ['UNAUTHORIZED', '401'], desc: 'Authentication errors' },
    { patterns: ['OFFER_NOT_FOUND', '404'], desc: 'Not found errors' },
    { patterns: ['RATE_LIMIT_EXCEEDED', '429'], desc: 'Rate limit errors' },
    { patterns: ['INTERNAL_ERROR', '500'], desc: 'Server errors' },
    { patterns: ['FIREBASE_INIT_FAILED'], desc: 'Firebase init errors' },
    { patterns: ['DATABASE_ERROR'], desc: 'Database errors' },
    { patterns: ['FCM_QUOTA_EXCEEDED'], desc: 'FCM quota errors' },
  ];

  errorChecks.forEach(check => {
    totalChecks++;
    if (checkCodeContains('index.ts', check.patterns, check.desc)) {
      passedChecks++;
    }
  });

  // Check 11: Test files
  log('\n🧪 Checking Test Files...', 'blue');
  const testFiles = [
    { file: 'index.test.ts', desc: 'Main handler tests' },
    { file: 'firebase.test.ts', desc: 'Firebase tests' },
    { file: 'fcm.test.ts', desc: 'FCM tests' },
    { file: 'payload.test.ts', desc: 'Payload tests' },
    { file: 'analytics.test.ts', desc: 'Analytics tests' },
    { file: 'security.test.ts', desc: 'Security tests' },
  ];

  testFiles.forEach(test => {
    totalChecks++;
    if (checkFileExists(path.join(__dirname, test.file))) {
      log(`  ✅ ${test.desc}`, 'green');
      passedChecks++;
    } else {
      log(`  ❌ ${test.desc} - Missing`, 'red');
    }
  });

  // Check 12: Documentation
  log('\n📚 Checking Documentation...', 'blue');
  const docFiles = [
    { file: 'TEST_README.md', desc: 'Test documentation' },
    { file: 'CHECKPOINT_TESTING.md', desc: 'Checkpoint testing guide' },
    { file: 'ERROR_HANDLING.md', desc: 'Error handling documentation' },
    { file: 'SECURITY_IMPLEMENTATION.md', desc: 'Security documentation' },
  ];

  docFiles.forEach(doc => {
    totalChecks++;
    if (checkFileExists(path.join(__dirname, doc.file))) {
      log(`  ✅ ${doc.desc}`, 'green');
      passedChecks++;
    } else {
      log(`  ❌ ${doc.desc} - Missing`, 'red');
    }
  });

  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  const percentage = Math.round((passedChecks / totalChecks) * 100);
  const status = percentage === 100 ? '✅ PASSED' : percentage >= 80 ? '⚠️  MOSTLY PASSED' : '❌ FAILED';
  
  log(`\n${status}`, percentage === 100 ? 'green' : percentage >= 80 ? 'yellow' : 'red');
  log(`\nResults: ${passedChecks}/${totalChecks} checks passed (${percentage}%)`, 'cyan');

  if (percentage === 100) {
    log('\n🎉 All validation checks passed!', 'green');
    log('✅ Edge Function implementation is complete and ready for local testing.', 'green');
    log('\nNext Steps:', 'blue');
    log('  1. Install Supabase CLI: npm install -g supabase', 'reset');
    log('  2. Follow CHECKPOINT_TESTING.md for local testing', 'reset');
    log('  3. Run: supabase start', 'reset');
    log('  4. Deploy function: supabase functions deploy send-flash-offer-push', 'reset');
    log('  5. Test with: ./test-function.sh local <jwt> <offer_id>', 'reset');
  } else if (percentage >= 80) {
    log('\n⚠️  Most checks passed, but some items need attention.', 'yellow');
    log('Review the failed checks above and complete missing items.', 'yellow');
  } else {
    log('\n❌ Implementation incomplete. Review failed checks above.', 'red');
  }

  log('\n' + '='.repeat(60) + '\n', 'cyan');

  return percentage === 100 ? 0 : 1;
}

// Run validation
const exitCode = validateCheckpoint();
process.exit(exitCode);
