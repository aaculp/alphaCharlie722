// Request and Response Types

export interface EdgeFunctionRequest {
  offerId: string;
  dryRun?: boolean;
}

export interface EdgeFunctionResponse {
  success: boolean;
  targetedUserCount: number;
  sentCount: number;
  failedCount: number;
  errors: Array<{
    token: string;
    error: string;
  }>;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: unknown;
}

// Database Types

export interface FlashOffer {
  id: string;
  venue_id: string;
  title: string;
  description: string;
  discount_percentage: number;
  max_claims: number;
  current_claims: number;
  expires_at: string;
  push_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface Venue {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  subscription_tier?: 'free' | 'core' | 'pro' | 'revenue'; // Optional for now, will be added in future migration
}

export interface DeviceToken {
  id: string;
  user_id: string;
  token: string;
  platform: 'ios' | 'android';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  user_id: string;
  flash_offers_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  timezone: string;
  max_distance_miles: number | null;
  created_at: string;
  updated_at: string;
}

export interface RateLimit {
  id: string;
  venue_id: string | null;
  user_id: string | null;
  limit_type: 'venue_send' | 'user_receive';
  count: number;
  window_start: string;
  expires_at: string;
  created_at: string;
}

// FCM Types

export interface FCMPayload {
  notification: {
    title: string;
    body: string;
  };
  data: {
    offer_id: string;
    venue_id: string;
    type: string;
  };
  android: {
    priority: 'high';
    channelId: string;
  };
  apns: {
    payload: {
      aps: {
        'content-available': number;
        sound: string;
      };
    };
  };
}

export interface FCMBatchResult {
  successCount: number;
  failureCount: number;
  errors: Array<{
    token: string;
    error: string;
  }>;
}

// Error Codes

export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'INVALID_REQUEST'
  | 'OFFER_NOT_FOUND'
  | 'VENUE_NOT_FOUND'
  | 'RATE_LIMIT_EXCEEDED'
  | 'PUSH_ALREADY_SENT'
  | 'FIREBASE_INIT_FAILED'
  | 'DATABASE_ERROR'
  | 'FCM_QUOTA_EXCEEDED'
  | 'INTERNAL_ERROR';

// Environment Variables

export interface EnvironmentVariables {
  FIREBASE_SERVICE_ACCOUNT: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_URL: string;
}
