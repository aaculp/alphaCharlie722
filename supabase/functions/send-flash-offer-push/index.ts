import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { SupabaseClient, User } from 'https://esm.sh/@supabase/supabase-js@2';
import type {
  EdgeFunctionRequest,
  EdgeFunctionResponse,
  ErrorResponse,
} from './types.ts';
import { initializeFirebase, getFirebaseMessaging } from './firebase.ts';
import { 
  validateOfferId, 
  sanitizeObject, 
  validateResponseBody,
  createSafeLogger 
} from './security.ts';
import { monitoringService } from './monitoring.ts';

// Environment variable validation
const requiredEnvVars = [
  'FIREBASE_SERVICE_ACCOUNT',
  // Note: SUPABASE_SERVICE_ROLE_KEY and SUPABASE_URL are automatically provided by Supabase
];

// Create safe logger that sanitizes all output
const safeLogger = createSafeLogger();

function validateEnvironment(): { valid: boolean; missing: string[] } {
  const missing = requiredEnvVars.filter((varName) => !Deno.env.get(varName));
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * JWT Authentication Middleware
 * Extracts and validates JWT token from Authorization header
 * Returns authenticated user or error response
 */
async function authenticateRequest(
  req: Request,
  supabase: SupabaseClient
): Promise<{ user: User | null; error: Response | null }> {
  // Extract JWT from Authorization header
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader) {
    return {
      user: null,
      error: new Response(
        JSON.stringify({
          success: false,
          error: 'Missing authorization token',
          code: 'UNAUTHORIZED',
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      ),
    };
  }

  if (!authHeader.startsWith('Bearer ')) {
    return {
      user: null,
      error: new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid authorization header format. Expected: Bearer <token>',
          code: 'UNAUTHORIZED',
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      ),
    };
  }

  const jwt = authHeader.replace('Bearer ', '');

  // Validate JWT signature using Supabase
  const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
  
  if (authError || !user) {
    return {
      user: null,
      error: new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid or expired authorization token',
          code: 'UNAUTHORIZED',
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      ),
    };
  }

  // Return authenticated user context
  return {
    user,
    error: null,
  };
}

/**
 * Execute a function with timeout
 * Requirement 7.6: Edge Function timeout of 30 seconds maximum
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * Retry a database operation once on failure
 * Requirement 7.2: Retry database queries once on connection failure
 */
async function retryDatabaseOperation<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.warn(`${operationName} failed, retrying once:`, error);
    
    // Wait 500ms before retry
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      return await operation();
    } catch (retryError) {
      console.error(`${operationName} failed after retry:`, retryError);
      throw retryError;
    }
  }
}

/**
 * Create standardized error response
 * Validates that no credentials are exposed in error responses
 */
function createErrorResponse(
  status: number,
  error: string,
  code: string,
  details?: unknown
): Response {
  const body: ErrorResponse = {
    success: false,
    error,
    code,
    ...(details && { details }),
  };
  
  // Validate response for credential exposure
  // Requirement 3.4: Validate no credentials in responses
  const responseValidation = validateResponseBody(body);
  if (!responseValidation.safe) {
    console.error('[SECURITY] Error response contains credentials:', {
      violations: responseValidation.violations,
      timestamp: new Date().toISOString(),
    });
    // Use sanitized version
    return new Response(JSON.stringify(responseValidation.sanitized), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// Main handler function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  const startTime = Date.now();
  let offerId: string | undefined;

  try {
    // Requirement 7.6: Wrap entire handler in 30-second timeout
    return await withTimeout(
      (async () => {
        // Validate environment variables
        const envCheck = validateEnvironment();
        if (!envCheck.valid) {
          console.error('[ERROR] Missing required environment variables:', {
            missing: envCheck.missing,
            timestamp: new Date().toISOString(),
          });
          return createErrorResponse(
            500,
            'Server configuration error',
            'INTERNAL_ERROR',
            { missingVariables: envCheck.missing }
          );
        }

        // Initialize Firebase Admin SDK
        // Requirement 7.3: Handle Firebase init errors
        try {
          initializeFirebase();
        } catch (error) {
          console.error('[ERROR] Firebase initialization failed:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString(),
          });
          return createErrorResponse(
            500,
            'Failed to initialize push notification service',
            'FIREBASE_INIT_FAILED'
          );
        }

        // Initialize Supabase client for JWT validation (use anon key)
        // Supabase automatically provides these environment variables in Edge Functions
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://cznhaaigowjhqdjtfeyz.supabase.co';
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
        const supabaseForAuth = createClient(supabaseUrl, supabaseAnonKey);

        // Authenticate request using middleware
        const { user, error: authError } = await authenticateRequest(req, supabaseForAuth);
        if (authError) {
          return authError;
        }

        // Initialize Supabase client with service role key for database operations
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

        // Parse request body
        let body: EdgeFunctionRequest;
        try {
          body = await req.json();
        } catch (error) {
          console.error('[ERROR] Failed to parse request body:', {
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString(),
          });
          return createErrorResponse(
            400,
            'Invalid JSON in request body',
            'INVALID_REQUEST'
          );
        }

        const { offerId: requestOfferId, dryRun = false } = body;
        offerId = requestOfferId;

        // Validate and sanitize offer ID
        // Requirement 3.4: Validate offer ID format (UUID) and sanitize input
        const offerIdValidation = validateOfferId(offerId);
        if (!offerIdValidation.valid) {
          console.error('[ERROR] Invalid offer ID:', {
            error: offerIdValidation.error,
            timestamp: new Date().toISOString(),
          });
          return createErrorResponse(
            400,
            offerIdValidation.error!,
            'INVALID_REQUEST'
          );
        }
        
        // Use sanitized offer ID for all subsequent operations
        offerId = offerIdValidation.sanitized!;

        // Import database functions (dynamic import for Edge Functions)
        const { getOfferDetails, getVenueDetails, getTargetedUsers, filterUsersByPreferences } = await import('./database.ts');
        
        // Import rate limiting functions
        const { checkVenueRateLimit, incrementVenueRateLimit, filterUsersByRateLimit, incrementUserRateLimits } = await import('./rateLimit.ts');

        // Get offer details with retry
        // Requirement 7.2: Retry database queries once on connection failure
        // Requirement 7.4: Handle offer not found (404)
        let offer: any;
        try {
          offer = await retryDatabaseOperation(
            () => getOfferDetails(supabase, offerId!),
            'getOfferDetails'
          );
        } catch (error) {
          console.error('[ERROR] Database error fetching offer:', {
            offerId,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString(),
          });
          return createErrorResponse(
            500,
            'Database error while fetching offer details',
            'DATABASE_ERROR'
          );
        }

        if (!offer) {
          console.warn('[WARN] Offer not found:', {
            offerId,
            timestamp: new Date().toISOString(),
          });
          return createErrorResponse(
            404,
            'Flash offer not found',
            'OFFER_NOT_FOUND'
          );
        }

        // Check if push has already been sent (idempotency)
        // Requirement 7.5: Return success without re-sending if already sent
        if (offer.push_sent && !dryRun) {
          console.log('[INFO] Push already sent for offer, returning success:', {
            offerId,
            timestamp: new Date().toISOString(),
          });
          
          const idempotentResponse = {
            success: true,
            targetedUserCount: 0,
            sentCount: 0,
            failedCount: 0,
            errors: [],
            message: 'Push notification already sent for this offer',
          };
          
          // Validate response for credential exposure
          const responseValidation = validateResponseBody(idempotentResponse);
          
          return new Response(
            JSON.stringify(responseValidation.safe ? idempotentResponse : responseValidation.sanitized),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
            }
          );
        }

        // Get venue details with retry
        // Requirement 7.2: Retry database queries once on connection failure
        let venue: any;
        try {
          venue = await retryDatabaseOperation(
            () => getVenueDetails(supabase, offer.venue_id),
            'getVenueDetails'
          );
        } catch (error) {
          console.error('[ERROR] Database error fetching venue:', {
            offerId,
            venueId: offer.venue_id,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString(),
          });
          return createErrorResponse(
            500,
            'Database error while fetching venue details',
            'DATABASE_ERROR'
          );
        }

        if (!venue) {
          console.warn('[WARN] Venue not found:', {
            offerId,
            venueId: offer.venue_id,
            timestamp: new Date().toISOString(),
          });
          return createErrorResponse(
            404,
            'Venue not found',
            'VENUE_NOT_FOUND'
          );
        }

        // Check venue rate limit
        // Requirements: 11.1, 11.2, 11.8
        // Requirement 7.1: Handle rate limit exceeded (429)
        const venueTier = venue.subscription_tier || 'free';
        let venueRateLimit: any;
        try {
          venueRateLimit = await retryDatabaseOperation(
            () => checkVenueRateLimit(supabase, offer.venue_id, venueTier),
            'checkVenueRateLimit'
          );
        } catch (error) {
          console.error('[ERROR] Database error checking venue rate limit:', {
            offerId,
            venueId: offer.venue_id,
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString(),
          });
          return createErrorResponse(
            500,
            'Database error while checking rate limits',
            'DATABASE_ERROR'
          );
        }
        
        if (!venueRateLimit.allowed) {
          console.warn('[WARN] Venue rate limit exceeded:', {
            offerId,
            venueId: offer.venue_id,
            currentCount: venueRateLimit.currentCount,
            limit: venueRateLimit.limit,
            tier: venueTier,
            timestamp: new Date().toISOString(),
          });
          
          // Record rate limit violation metric
          monitoringService.recordMetric('rate_limit_violations', 1, {
            offerId: offerId,
            venueId: offer.venue_id,
            limitType: 'venue_send',
            tier: venueTier,
          });
          
          return new Response(
            JSON.stringify({
              success: false,
              error: `Rate limit exceeded. You have sent ${venueRateLimit.currentCount} of ${venueRateLimit.limit} allowed offers in the last 24 hours.`,
              code: 'RATE_LIMIT_EXCEEDED',
              details: {
                currentCount: venueRateLimit.currentCount,
                limit: venueRateLimit.limit,
                resetsAt: venueRateLimit.resetsAt,
              },
            }),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Retry-After': venueRateLimit.resetsAt ? Math.ceil((new Date(venueRateLimit.resetsAt).getTime() - Date.now()) / 1000).toString() : '86400',
              },
            }
          );
        }

        // Validate venue has location data
        if (!venue.latitude || !venue.longitude) {
          console.error('[ERROR] Venue missing location data:', {
            offerId,
            venueId: offer.venue_id,
            timestamp: new Date().toISOString(),
          });
          return createErrorResponse(
            400,
            'Venue location not available',
            'INVALID_REQUEST'
          );
        }

        // Get targeted users with retry
        let targetedUsers: any[];
        try {
          targetedUsers = await retryDatabaseOperation(
            () => getTargetedUsers(
              supabase,
              offer.venue_id,
              venue.latitude,
              venue.longitude,
              offer.radius_miles || 1.0,
              offer.target_favorites_only || false
            ),
            'getTargetedUsers'
          );
        } catch (error) {
          console.error('[ERROR] Database error getting targeted users:', {
            offerId,
            venueId: offer.venue_id,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString(),
          });
          return createErrorResponse(
            500,
            'Database error while fetching targeted users',
            'DATABASE_ERROR'
          );
        }

        console.log(`[INFO] Found ${targetedUsers.length} targeted users for offer ${offerId}`);

        // Filter users by notification preferences
        // Requirements: 12.4, 12.5, 12.6, 12.8, 12.9
        const filteredUsers = filterUsersByPreferences(
          targetedUsers,
          venue.latitude,
          venue.longitude
        );

        console.log(`[INFO] After preference filtering: ${filteredUsers.length} users`);

        // Filter users by rate limits with retry
        // Requirements: 11.3, 11.4
        const userIds = filteredUsers.map(u => u.user_id);
        let allowedUserIds: string[];
        try {
          allowedUserIds = await retryDatabaseOperation(
            () => filterUsersByRateLimit(supabase, userIds),
            'filterUsersByRateLimit'
          );
        } catch (error) {
          console.error('[ERROR] Database error filtering users by rate limit:', {
            offerId,
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString(),
          });
          return createErrorResponse(
            500,
            'Database error while checking user rate limits',
            'DATABASE_ERROR'
          );
        }
        
        // Filter the user list to only include allowed users
        const rateLimitedUsers = filteredUsers.filter(u => allowedUserIds.includes(u.user_id));
        
        console.log(`[INFO] After rate limit filtering: ${rateLimitedUsers.length} users`);

        // Increment venue rate limit counter with retry
        // Requirement 11.2
        try {
          await retryDatabaseOperation(
            () => incrementVenueRateLimit(supabase, offer.venue_id),
            'incrementVenueRateLimit'
          );
        } catch (error) {
          console.error('[ERROR] Failed to increment venue rate limit:', {
            offerId,
            venueId: offer.venue_id,
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString(),
          });
          // Don't fail the request, just log the error
        }

        // Increment user rate limit counters with retry
        // Requirement 11.4
        try {
          const incrementedCount = await retryDatabaseOperation(
            () => incrementUserRateLimits(supabase, allowedUserIds),
            'incrementUserRateLimits'
          );
          console.log(`[INFO] Incremented rate limit counters for ${incrementedCount} users`);
        } catch (error) {
          console.error('[ERROR] Failed to increment user rate limits:', {
            offerId,
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString(),
          });
          // Don't fail the request, just log the error
        }

        // Build FCM notification payload
        // Requirements: 2.6, 2.7
        const { buildNotificationPayload } = await import('./payload.ts');
        const notificationPayload = buildNotificationPayload(offer, venue.name);
        
        console.log(`[INFO] Built notification payload for offer ${offer.id}`);

        // Send notifications via FCM in batches
        // Requirements: 2.2, 2.3, 2.4, 2.5
        // Requirement 7.1: Handle FCM quota exceeded (429)
        const { sendNotifications } = await import('./fcm.ts');
        const messaging = getFirebaseMessaging();
        
        // Extract device tokens from filtered users
        const deviceTokens = rateLimitedUsers.map(u => u.device_token);
        
        console.log(`[INFO] Sending to ${deviceTokens.length} devices`);
        
        let fcmResult: { successCount: number; failureCount: number; errors: Array<{ token: string; error: string }> };
        
        // Check if this is a dry-run
        // Requirement 8.4: Execute all logic except FCM sending in dry-run mode
        if (dryRun) {
          console.log('[INFO] DRY RUN MODE: Skipping actual FCM send');
          fcmResult = {
            successCount: deviceTokens.length,
            failureCount: 0,
            errors: [],
          };
          console.log(`[INFO] DRY RUN: Would send to ${deviceTokens.length} devices`);
        } else {
          // Send notifications via FCM
          try {
            fcmResult = await sendNotifications(
              messaging,
              deviceTokens,
              notificationPayload,
              supabase
            );

            console.log(`[INFO] FCM send complete: ${fcmResult.successCount} succeeded, ${fcmResult.failureCount} failed`);

            // Record FCM failure rate metric
            const totalFcmSends = fcmResult.successCount + fcmResult.failureCount;
            if (totalFcmSends > 0) {
              const fcmFailureRate = fcmResult.failureCount / totalFcmSends;
              monitoringService.recordMetric('fcm_failure_rate', fcmFailureRate, {
                offerId: offerId,
                successCount: fcmResult.successCount,
                failureCount: fcmResult.failureCount,
              });
            }

            // Check for FCM quota exceeded errors
            // Requirement 7.1: Handle FCM quota exceeded (429)
            const quotaExceededErrors = fcmResult.errors.filter(e => 
              e.error.includes('quota_exceeded') || e.error.includes('too-many-requests')
            );

            if (quotaExceededErrors.length > 0) {
              console.error('[ERROR] FCM quota exceeded:', {
                offerId,
                quotaExceededCount: quotaExceededErrors.length,
                totalErrors: fcmResult.errors.length,
                timestamp: new Date().toISOString(),
              });
              
              // If all or most sends failed due to quota, return 429
              if (quotaExceededErrors.length > fcmResult.errors.length * 0.5) {
                return createErrorResponse(
                  429,
                  'FCM quota exceeded. Please try again later.',
                  'FCM_QUOTA_EXCEEDED',
                  {
                    successCount: fcmResult.successCount,
                    failureCount: fcmResult.failureCount,
                  }
                );
              }
            }
          } catch (error) {
            console.error('[ERROR] FCM send failed:', {
              offerId,
              error: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
              timestamp: new Date().toISOString(),
            });
            
            // Check if it's a quota error
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage.includes('quota') || errorMessage.includes('too-many-requests')) {
              return createErrorResponse(
                429,
                'FCM quota exceeded. Please try again later.',
                'FCM_QUOTA_EXCEEDED'
              );
            }
            
            // Otherwise, return generic error
            return createErrorResponse(
              500,
              'Failed to send push notifications',
              'INTERNAL_ERROR'
            );
          }

          // Mark offer as push_sent
          // Requirement 1.7: Mark the offer as push_sent in the database
          try {
            const { error: updateError } = await supabase
              .from('flash_offers')
              .update({ 
                push_sent: true,
                updated_at: new Date().toISOString()
              })
              .eq('id', offerId);

            if (updateError) {
              console.error('[ERROR] Error marking offer as push_sent:', {
                offerId,
                error: updateError,
                timestamp: new Date().toISOString(),
              });
              // Don't fail the request, just log the error
            } else {
              console.log(`[INFO] Marked offer ${offerId} as push_sent`);
            }
          } catch (error) {
            console.error('[ERROR] Exception marking offer as push_sent:', {
              offerId,
              error: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
              timestamp: new Date().toISOString(),
            });
            // Don't fail the request, just log the error
          }

          // Track analytics
          // Requirements: 6.1, 6.2, 6.3, 6.5
          try {
            const { trackPushSent } = await import('./analytics.ts');
            await trackPushSent(supabase, {
              offerId: offerId!,
              venueId: offer.venue_id,
              targetedCount: rateLimitedUsers.length,
              successCount: fcmResult.successCount,
              failureCount: fcmResult.failureCount,
              errors: fcmResult.errors,
            });
          } catch (error) {
            console.error('[ERROR] Failed to track analytics:', {
              offerId,
              error: error instanceof Error ? error.message : String(error),
              timestamp: new Date().toISOString(),
            });
            // Don't fail the request, just log the error
          }
        }

        // Log execution time
        const executionTime = Date.now() - startTime;
        console.log(`[INFO] Request completed in ${executionTime}ms`);
        
        // Record execution time metric
        monitoringService.recordMetric('execution_time', executionTime, {
          offerId: offerId,
          targetedUserCount: rateLimitedUsers.length,
          sentCount: fcmResult.successCount,
        });
        
        // Requirement 9.6: Log warning if execution time exceeds 25 seconds
        if (executionTime > 25000) {
          console.warn('[WARN] Execution time exceeded 25 seconds:', {
            offerId,
            executionTime,
            timestamp: new Date().toISOString(),
          });
        }

        // Return results
        const responseBody = {
          success: true,
          targetedUserCount: rateLimitedUsers.length,
          sentCount: fcmResult.successCount,
          failedCount: fcmResult.failureCount,
          errors: fcmResult.errors,
          ...(dryRun && { dryRun: true }),
        };
        
        // Validate response for credential exposure
        // Requirement 3.4: Validate no credentials in responses
        const responseValidation = validateResponseBody(responseBody);
        if (!responseValidation.safe) {
          console.error('[SECURITY] Response contains credentials:', {
            violations: responseValidation.violations,
            timestamp: new Date().toISOString(),
          });
          // Use sanitized version
          return new Response(
            JSON.stringify(responseValidation.sanitized),
            {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
            }
          );
        }
        
        return new Response(
          JSON.stringify(responseBody),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      })(),
      30000, // 30 second timeout
      'Edge Function execution timeout (30 seconds)'
    );
  } catch (error) {
    // Requirement 7.7: Handle timeout errors
    const executionTime = Date.now() - startTime;
    
    // Record error metric
    monitoringService.recordMetric('error_rate', 1, {
      offerId: offerId,
      errorType: error instanceof Error && error.message.includes('timeout') ? 'timeout' : 'unexpected',
      executionTime: executionTime,
    });
    
    if (error instanceof Error && error.message.includes('timeout')) {
      console.error('[ERROR] Request timeout:', {
        offerId,
        executionTime,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      return createErrorResponse(
        500,
        'Request timeout. The operation took longer than 30 seconds.',
        'INTERNAL_ERROR',
        { executionTime }
      );
    }

    // Log all errors with full context
    console.error('[ERROR] Unexpected error in Edge Function:', {
      offerId,
      executionTime,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    
    return createErrorResponse(
      500,
      'Internal server error',
      'INTERNAL_ERROR'
    );
  }
});
