import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';

type VenueBusinessAccount = Database['public']['Tables']['venue_business_accounts']['Row'];
// type VenueBusinessAccountInsert = Database['public']['Tables']['venue_business_accounts']['Insert'];
type VenueBusinessAccountUpdate = Database['public']['Tables']['venue_business_accounts']['Update'];

export class VenueBusinessService {
  /**
   * Get business account for a venue owner
   */
  static async getBusinessAccount(userId: string): Promise<VenueBusinessAccount | null> {
    try {
      console.log('🔍 VenueBusinessService: Fetching business account for user:', userId);
      
      const { data, error } = await supabase
        .from('venue_business_accounts')
        .select(`
          *,
          venues (
            id,
            name,
            description,
            category,
            location,
            address,
            phone,
            website,
            rating,
            review_count,
            image_url
          )
        `)
        .eq('owner_user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No business account found - this is normal for regular customers
          console.log('ℹ️ VenueBusinessService: No business account found (user is customer)');
          return null;
        }
        console.error('❌ VenueBusinessService: Error fetching business account:', error);
        return null;
      }

      console.log('✅ VenueBusinessService: Business account found:', data?.id);
      return data;
    } catch (error) {
      console.error('❌ VenueBusinessService: Unexpected error fetching business account:', error);
      return null;
    }
  }

  /**
   * Get all business accounts for a user (in case they have multiple venues)
   */
  static async getUserBusinessAccounts(userId: string): Promise<VenueBusinessAccount[]> {
    try {
      const { data, error } = await supabase
        .from('venue_business_accounts')
        .select(`
          *,
          venues (
            id,
            name,
            description,
            category,
            location,
            address,
            phone,
            website,
            rating,
            review_count,
            image_url
          )
        `)
        .eq('owner_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching business accounts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Unexpected error fetching business accounts:', error);
      return [];
    }
  }

  /**
   * Update subscription tier
   */
  static async updateSubscriptionTier(
    businessAccountId: string,
    userId: string,
    tier: 'free' | 'core' | 'pro' | 'revenue'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('venue_business_accounts')
        .update({
          subscription_tier: tier,
          subscription_start_date: new Date().toISOString()
        })
        .eq('id', businessAccountId)
        .eq('owner_user_id', userId);

      if (error) {
        console.error('❌ Error updating subscription tier:', error);
        return { success: false, error: 'Failed to update subscription' };
      }

      console.log(`✅ Subscription updated to ${tier} for account ${businessAccountId}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Unexpected error updating subscription:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Add push notification credits
   */
  static async addPushCredits(
    businessAccountId: string,
    userId: string,
    credits: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current credits
      const { data: account, error: fetchError } = await supabase
        .from('venue_business_accounts')
        .select('push_credits_remaining')
        .eq('id', businessAccountId)
        .eq('owner_user_id', userId)
        .single();

      if (fetchError || !account) {
        return { success: false, error: 'Business account not found' };
      }

      // Update credits
      const { error } = await supabase
        .from('venue_business_accounts')
        .update({
          push_credits_remaining: account.push_credits_remaining + credits
        })
        .eq('id', businessAccountId)
        .eq('owner_user_id', userId);

      if (error) {
        console.error('❌ Error adding push credits:', error);
        return { success: false, error: 'Failed to add credits' };
      }

      console.log(`✅ Added ${credits} push credits to account ${businessAccountId}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Unexpected error adding push credits:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Use push notification credits
   */
  static async usePushCredits(
    businessAccountId: string,
    userId: string,
    credits: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current credits
      const { data: account, error: fetchError } = await supabase
        .from('venue_business_accounts')
        .select('push_credits_remaining, push_credits_used')
        .eq('id', businessAccountId)
        .eq('owner_user_id', userId)
        .single();

      if (fetchError || !account) {
        return { success: false, error: 'Business account not found' };
      }

      if (account.push_credits_remaining < credits) {
        return { success: false, error: 'Insufficient push credits' };
      }

      // Update credits
      const { error } = await supabase
        .from('venue_business_accounts')
        .update({
          push_credits_remaining: account.push_credits_remaining - credits,
          push_credits_used: account.push_credits_used + credits
        })
        .eq('id', businessAccountId)
        .eq('owner_user_id', userId);

      if (error) {
        console.error('❌ Error using push credits:', error);
        return { success: false, error: 'Failed to use credits' };
      }

      console.log(`✅ Used ${credits} push credits from account ${businessAccountId}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Unexpected error using push credits:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Update business account settings
   */
  static async updateSettings(
    businessAccountId: string,
    userId: string,
    settings: Record<string, any>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('venue_business_accounts')
        .update({ settings })
        .eq('id', businessAccountId)
        .eq('owner_user_id', userId);

      if (error) {
        console.error('❌ Error updating business settings:', error);
        return { success: false, error: 'Failed to update settings' };
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Unexpected error updating settings:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Update billing information
   */
  static async updateBillingInfo(
    businessAccountId: string,
    userId: string,
    billingEmail?: string,
    billingAddress?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updates: VenueBusinessAccountUpdate = {};
      if (billingEmail !== undefined) updates.billing_email = billingEmail;
      if (billingAddress !== undefined) updates.billing_address = billingAddress;

      const { error } = await supabase
        .from('venue_business_accounts')
        .update(updates)
        .eq('id', businessAccountId)
        .eq('owner_user_id', userId);

      if (error) {
        console.error('❌ Error updating billing info:', error);
        return { success: false, error: 'Failed to update billing information' };
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Unexpected error updating billing info:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get subscription tier limits
   */
  static getSubscriptionLimits(tier: 'free' | 'core' | 'pro' | 'revenue') {
    const limits = {
      free: {
        pushNotificationsPerMonth: 0,
        features: ['venue_profile', 'live_activity_indicator', 'public_visibility'],
        price: 0
      },
      core: {
        pushNotificationsPerMonth: 20,
        features: ['venue_profile', 'live_activity_indicator', 'public_visibility', 'push_notifications', 'geo_targeting', 'basic_scheduling', 'analytics'],
        price: 79
      },
      pro: {
        pushNotificationsPerMonth: 60,
        features: ['venue_profile', 'live_activity_indicator', 'public_visibility', 'push_notifications', 'geo_targeting', 'basic_scheduling', 'analytics', 'flash_offers', 'time_capacity_triggers', 'geo_expansion', 'conversion_analytics'],
        price: 179
      },
      revenue: {
        pushNotificationsPerMonth: -1, // Unlimited
        features: ['venue_profile', 'live_activity_indicator', 'public_visibility', 'push_notifications', 'geo_targeting', 'basic_scheduling', 'analytics', 'flash_offers', 'time_capacity_triggers', 'geo_expansion', 'conversion_analytics', 'automation_rules', 'advanced_targeting', 'revenue_attribution', 'priority_support'],
        price: 299
      }
    };

    return limits[tier];
  }

  /**
   * Check if business account can use a feature
   */
  static async canUseFeature(
    businessAccountId: string,
    userId: string,
    feature: string
  ): Promise<boolean> {
    try {
      const { data: account, error } = await supabase
        .from('venue_business_accounts')
        .select('subscription_tier, account_status')
        .eq('id', businessAccountId)
        .eq('owner_user_id', userId)
        .single();

      if (error || !account) {
        return false;
      }

      if (account.account_status !== 'active') {
        return false;
      }

      const limits = this.getSubscriptionLimits(account.subscription_tier);
      return limits.features.includes(feature);
    } catch (error) {
      console.error('❌ Error checking feature access:', error);
      return false;
    }
  }
}