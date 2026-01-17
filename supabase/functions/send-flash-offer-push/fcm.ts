/**
 * FCM Batch Sending Module
 * 
 * This module handles sending push notifications via Firebase Cloud Messaging (FCM)
 * in batches, with proper error handling and token management.
 * 
 * Requirements:
 * - 2.2: Use Firebase_Admin_SDK's multicast messaging API
 * - 2.3: Batch requests in groups of 500 (FCM limit)
 * - 2.4: Categorize FCM errors
 * - 2.5: Mark invalid tokens as inactive in database
 */

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { Messaging, MulticastMessage, BatchResponse } from 'npm:firebase-admin@^12.0.0/messaging';
import type { FCMPayload, FCMBatchResult } from './types.ts';

/**
 * FCM Error Categories
 * Used to categorize errors returned by FCM for proper handling
 */
export enum FCMErrorCategory {
  INVALID_TOKEN = 'invalid_token',
  QUOTA_EXCEEDED = 'quota_exceeded',
  SERVER_ERROR = 'server_error',
  UNAVAILABLE = 'unavailable',
  UNKNOWN = 'unknown',
}

/**
 * Split an array of tokens into batches of specified size
 * 
 * Requirement 2.3: Batch requests in groups of 500 (FCM limit)
 * 
 * @param tokens - Array of device tokens
 * @param batchSize - Maximum size of each batch (default: 500)
 * @returns Array of token batches
 */
export function splitIntoBatches(tokens: string[], batchSize: number = 500): string[][] {
  const batches: string[][] = [];
  
  for (let i = 0; i < tokens.length; i += batchSize) {
    batches.push(tokens.slice(i, i + batchSize));
  }
  
  return batches;
}

/**
 * Categorize FCM error code into a known error category
 * 
 * Requirement 2.4: Categorize FCM errors
 * 
 * @param errorCode - FCM error code from the response
 * @returns Categorized error type
 */
export function categorizeError(errorCode: string): FCMErrorCategory {
  // Invalid token errors - token should be marked inactive
  if (
    errorCode === 'messaging/invalid-registration-token' ||
    errorCode === 'messaging/registration-token-not-registered' ||
    errorCode === 'messaging/invalid-argument'
  ) {
    return FCMErrorCategory.INVALID_TOKEN;
  }
  
  // Quota exceeded errors - rate limiting
  if (
    errorCode === 'messaging/quota-exceeded' ||
    errorCode === 'messaging/too-many-requests'
  ) {
    return FCMErrorCategory.QUOTA_EXCEEDED;
  }
  
  // Server errors - FCM internal issues
  if (
    errorCode === 'messaging/internal-error' ||
    errorCode === 'messaging/server-unavailable'
  ) {
    return FCMErrorCategory.SERVER_ERROR;
  }
  
  // Service unavailable - temporary issue
  if (errorCode === 'messaging/unavailable') {
    return FCMErrorCategory.UNAVAILABLE;
  }
  
  // Unknown error
  return FCMErrorCategory.UNKNOWN;
}

/**
 * Mark invalid device tokens as inactive in the database
 * 
 * Requirement 2.5: Mark invalid tokens as inactive in database
 * 
 * @param supabase - Supabase client with service role key
 * @param tokens - Array of invalid device tokens
 * @returns Number of tokens marked as inactive
 */
export async function markTokensInactive(
  supabase: SupabaseClient,
  tokens: string[]
): Promise<number> {
  if (tokens.length === 0) {
    return 0;
  }

  try {
    console.log(`Marking ${tokens.length} tokens as inactive`);
    
    const { error, count } = await supabase
      .from('device_tokens')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .in('token', tokens);

    if (error) {
      console.error('Error marking tokens as inactive:', error);
      return 0;
    }

    console.log(`Successfully marked ${count || 0} tokens as inactive`);
    return count || 0;
  } catch (error) {
    console.error('Exception marking tokens as inactive:', error);
    return 0;
  }
}

/**
 * Send a batch of notifications via FCM multicast API
 * 
 * Requirement 2.2: Use Firebase_Admin_SDK's multicast messaging API
 * 
 * @param messaging - Firebase Messaging instance
 * @param tokens - Array of device tokens (max 500)
 * @param payload - FCM notification payload
 * @param supabase - Supabase client for marking invalid tokens
 * @returns Batch result with success/failure counts and errors
 */
export async function sendBatch(
  messaging: Messaging,
  tokens: string[],
  payload: FCMPayload,
  supabase: SupabaseClient
): Promise<FCMBatchResult> {
  // Validate batch size
  if (tokens.length > 500) {
    throw new Error(`Batch size ${tokens.length} exceeds FCM limit of 500`);
  }

  if (tokens.length === 0) {
    return {
      successCount: 0,
      failureCount: 0,
      errors: [],
    };
  }

  try {
    console.log(`Sending batch of ${tokens.length} notifications`);

    // Build multicast message
    const message: MulticastMessage = {
      tokens,
      notification: payload.notification,
      data: payload.data,
      android: payload.android,
      apns: payload.apns,
    };

    // Send via FCM multicast API
    const response: BatchResponse = await messaging.sendEachForMulticast(message);

    console.log(`Batch sent: ${response.successCount} succeeded, ${response.failureCount} failed`);

    // Process errors and categorize them
    const errors: Array<{ token: string; error: string }> = [];
    const invalidTokens: string[] = [];

    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success && resp.error) {
          const token = tokens[idx];
          const errorCode = resp.error.code;
          const category = categorizeError(errorCode);

          // Log the error
          console.error(`Token ${token} failed: ${errorCode} (${category})`);

          // Add to errors array
          errors.push({
            token,
            error: `${errorCode} (${category})`,
          });

          // Collect invalid tokens for database update
          if (category === FCMErrorCategory.INVALID_TOKEN) {
            invalidTokens.push(token);
          }
        }
      });

      // Mark invalid tokens as inactive in database
      // Requirement 2.5
      if (invalidTokens.length > 0) {
        await markTokensInactive(supabase, invalidTokens);
      }
    }

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      errors,
    };
  } catch (error) {
    console.error('Error sending batch:', error);
    
    // If the entire batch fails, return all tokens as failed
    return {
      successCount: 0,
      failureCount: tokens.length,
      errors: tokens.map(token => ({
        token,
        error: error instanceof Error ? error.message : 'Unknown error',
      })),
    };
  }
}

/**
 * Send notifications to multiple users in batches
 * 
 * This is the main entry point for sending push notifications.
 * It splits tokens into batches and sends them via FCM.
 * 
 * Requirements: 2.2, 2.3, 2.4, 2.5
 * 
 * @param messaging - Firebase Messaging instance
 * @param tokens - Array of device tokens
 * @param payload - FCM notification payload
 * @param supabase - Supabase client for marking invalid tokens
 * @returns Aggregated result with total success/failure counts and errors
 */
export async function sendNotifications(
  messaging: Messaging,
  tokens: string[],
  payload: FCMPayload,
  supabase: SupabaseClient
): Promise<FCMBatchResult> {
  console.log(`Sending notifications to ${tokens.length} devices`);

  // Split tokens into batches of 500
  const batches = splitIntoBatches(tokens, 500);
  console.log(`Split into ${batches.length} batches`);

  // Send all batches and collect results
  const results: FCMBatchResult[] = [];
  
  for (let i = 0; i < batches.length; i++) {
    console.log(`Sending batch ${i + 1}/${batches.length}`);
    const result = await sendBatch(messaging, batches[i], payload, supabase);
    results.push(result);
  }

  // Aggregate results from all batches
  const aggregatedResult: FCMBatchResult = {
    successCount: results.reduce((sum, r) => sum + r.successCount, 0),
    failureCount: results.reduce((sum, r) => sum + r.failureCount, 0),
    errors: results.flatMap(r => r.errors),
  };

  console.log(
    `Total: ${aggregatedResult.successCount} succeeded, ${aggregatedResult.failureCount} failed`
  );

  return aggregatedResult;
}
