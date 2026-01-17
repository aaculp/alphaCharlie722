/**
 * FlashOfferAnalyticsService
 * 
 * Service for tracking and analyzing flash offer events.
 * Handles event tracking (push_sent, view, claim, redeem) and analytics queries.
 * 
 * Requirements: Flash Offers MVP - Analytics & Tracking (Task 14)
 */

import { supabase } from '../../lib/supabase';

/**
 * Event types for flash offer analytics
 */
export type FlashOfferEventType = 'push_sent' | 'view' | 'claim' | 'redeem';

/**
 * Flash offer event interface
 */
export interface FlashOfferEvent {
  id: string;
  offer_id: string;
  user_id: string | null;
  event_type: FlashOfferEventType;
  metadata: Record<string, any> | null;
  created_at: string;
}

/**
 * Analytics metrics for a flash offer
 */
export interface FlashOfferAnalytics {
  offer_id: string;
  push_sent_count: number;
  views_count: number;
  claims_count: number;
  redemptions_count: number;
  open_rate: number; // views / push_sent (percentage)
  claim_rate: number; // claims / views (percentage)
  redemption_rate: number; // redemptions / claims (percentage)
  time_to_full_minutes: number | null; // Time taken to reach max_claims
}

/**
 * Time-series data point for analytics charts
 */
export interface TimeSeriesDataPoint {
  timestamp: string;
  event_type: FlashOfferEventType;
  count: number;
}

export class FlashOfferAnalyticsService {
  /**
   * Track a push_sent event when notification is sent
   * 
   * @param offerId - ID of the flash offer
   * @param recipientCount - Number of users who received the push
   */
  static async trackPushSent(
    offerId: string,
    recipientCount: number
  ): Promise<void> {
    try {
      const { error } = await supabase.from('flash_offer_events').insert({
        offer_id: offerId,
        user_id: null, // System event
        event_type: 'push_sent',
        metadata: {
          recipient_count: recipientCount,
          sent_at: new Date().toISOString(),
        },
      });

      if (error) {
        console.error('Error tracking push_sent event:', error);
        throw error;
      }

      console.log('✅ Tracked push_sent event for offer:', offerId);
    } catch (error) {
      console.error('Error tracking push_sent event:', error);
      // Don't throw - analytics failures shouldn't break the main flow
    }
  }

  /**
   * Track a view event when user views offer detail
   * 
   * @param offerId - ID of the flash offer
   * @param userId - ID of the user viewing the offer
   */
  static async trackView(offerId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase.from('flash_offer_events').insert({
        offer_id: offerId,
        user_id: userId,
        event_type: 'view',
        metadata: {
          viewed_at: new Date().toISOString(),
        },
      });

      if (error) {
        console.error('Error tracking view event:', error);
        throw error;
      }

      console.log('✅ Tracked view event for offer:', offerId);
    } catch (error) {
      console.error('Error tracking view event:', error);
      // Don't throw - analytics failures shouldn't break the main flow
    }
  }

  /**
   * Track a claim event when user claims offer
   * 
   * @param offerId - ID of the flash offer
   * @param userId - ID of the user claiming the offer
   * @param claimId - ID of the created claim
   */
  static async trackClaim(
    offerId: string,
    userId: string,
    claimId: string
  ): Promise<void> {
    try {
      const { error } = await supabase.from('flash_offer_events').insert({
        offer_id: offerId,
        user_id: userId,
        event_type: 'claim',
        metadata: {
          claim_id: claimId,
          claimed_at: new Date().toISOString(),
        },
      });

      if (error) {
        console.error('Error tracking claim event:', error);
        throw error;
      }

      console.log('✅ Tracked claim event for offer:', offerId);
    } catch (error) {
      console.error('Error tracking claim event:', error);
      // Don't throw - analytics failures shouldn't break the main flow
    }
  }

  /**
   * Track a redeem event when staff redeems token
   * 
   * @param offerId - ID of the flash offer
   * @param userId - ID of the user whose claim is being redeemed
   * @param claimId - ID of the claim being redeemed
   * @param staffUserId - ID of the staff member redeeming the claim
   */
  static async trackRedeem(
    offerId: string,
    userId: string,
    claimId: string,
    staffUserId: string
  ): Promise<void> {
    try {
      const { error } = await supabase.from('flash_offer_events').insert({
        offer_id: offerId,
        user_id: userId,
        event_type: 'redeem',
        metadata: {
          claim_id: claimId,
          staff_user_id: staffUserId,
          redeemed_at: new Date().toISOString(),
        },
      });

      if (error) {
        console.error('Error tracking redeem event:', error);
        throw error;
      }

      console.log('✅ Tracked redeem event for offer:', offerId);
    } catch (error) {
      console.error('Error tracking redeem event:', error);
      // Don't throw - analytics failures shouldn't break the main flow
    }
  }

  /**
   * Get aggregated analytics for a flash offer
   * Calculates conversion rates and performance metrics
   * 
   * @param offerId - ID of the flash offer
   * @returns Analytics metrics for the offer
   */
  static async getOfferAnalytics(offerId: string): Promise<FlashOfferAnalytics> {
    try {
      // Get all events for this offer
      const { data: events, error: eventsError } = await supabase
        .from('flash_offer_events')
        .select('event_type, created_at, metadata')
        .eq('offer_id', offerId);

      if (eventsError) {
        throw new Error(`Failed to fetch events: ${eventsError.message}`);
      }

      // Count events by type
      const pushSentCount = events?.filter(e => e.event_type === 'push_sent').length || 0;
      const viewsCount = events?.filter(e => e.event_type === 'view').length || 0;
      const claimsCount = events?.filter(e => e.event_type === 'claim').length || 0;
      const redemptionsCount = events?.filter(e => e.event_type === 'redeem').length || 0;

      // Calculate conversion rates
      const openRate = pushSentCount > 0 ? (viewsCount / pushSentCount) * 100 : 0;
      const claimRate = viewsCount > 0 ? (claimsCount / viewsCount) * 100 : 0;
      const redemptionRate = claimsCount > 0 ? (redemptionsCount / claimsCount) * 100 : 0;

      // Calculate time to full
      let timeToFullMinutes: number | null = null;
      
      // Get the offer to check if it's full
      const { data: offer, error: offerError } = await supabase
        .from('flash_offers')
        .select('status, created_at, claimed_count, max_claims')
        .eq('id', offerId)
        .single();

      if (!offerError && offer && offer.status === 'full') {
        // Find the timestamp of the last claim that made it full
        const claimEvents = events?.filter(e => e.event_type === 'claim') || [];
        if (claimEvents.length >= offer.max_claims) {
          const lastClaimEvent = claimEvents[offer.max_claims - 1];
          const offerCreatedAt = new Date(offer.created_at);
          const lastClaimAt = new Date(lastClaimEvent.created_at);
          timeToFullMinutes = Math.round((lastClaimAt.getTime() - offerCreatedAt.getTime()) / (1000 * 60));
        }
      }

      return {
        offer_id: offerId,
        push_sent_count: pushSentCount,
        views_count: viewsCount,
        claims_count: claimsCount,
        redemptions_count: redemptionsCount,
        open_rate: Math.round(openRate * 100) / 100, // Round to 2 decimal places
        claim_rate: Math.round(claimRate * 100) / 100,
        redemption_rate: Math.round(redemptionRate * 100) / 100,
        time_to_full_minutes: timeToFullMinutes,
      };
    } catch (error) {
      console.error('Error getting offer analytics:', error);
      throw error;
    }
  }

  /**
   * Get time-series data for analytics charts
   * Groups events by hour for visualization
   * 
   * @param offerId - ID of the flash offer
   * @returns Array of time-series data points
   */
  static async getTimeSeriesData(offerId: string): Promise<TimeSeriesDataPoint[]> {
    try {
      const { data: events, error } = await supabase
        .from('flash_offer_events')
        .select('event_type, created_at')
        .eq('offer_id', offerId)
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch events: ${error.message}`);
      }

      if (!events || events.length === 0) {
        return [];
      }

      // Group events by hour and type
      const groupedData = new Map<string, Map<FlashOfferEventType, number>>();

      events.forEach(event => {
        const timestamp = new Date(event.created_at);
        // Round to nearest hour
        timestamp.setMinutes(0, 0, 0);
        const hourKey = timestamp.toISOString();

        if (!groupedData.has(hourKey)) {
          groupedData.set(hourKey, new Map());
        }

        const hourData = groupedData.get(hourKey)!;
        const currentCount = hourData.get(event.event_type as FlashOfferEventType) || 0;
        hourData.set(event.event_type as FlashOfferEventType, currentCount + 1);
      });

      // Convert to array format
      const timeSeriesData: TimeSeriesDataPoint[] = [];
      groupedData.forEach((eventCounts, timestamp) => {
        eventCounts.forEach((count, eventType) => {
          timeSeriesData.push({
            timestamp,
            event_type: eventType,
            count,
          });
        });
      });

      return timeSeriesData.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    } catch (error) {
      console.error('Error getting time-series data:', error);
      throw error;
    }
  }

  /**
   * Get event counts aggregated by type
   * Useful for simple bar charts or summary displays
   * 
   * @param offerId - ID of the flash offer
   * @returns Object with counts for each event type
   */
  static async getEventCounts(
    offerId: string
  ): Promise<Record<FlashOfferEventType, number>> {
    try {
      const { data: events, error } = await supabase
        .from('flash_offer_events')
        .select('event_type')
        .eq('offer_id', offerId);

      if (error) {
        throw new Error(`Failed to fetch events: ${error.message}`);
      }

      const counts: Record<FlashOfferEventType, number> = {
        push_sent: 0,
        view: 0,
        claim: 0,
        redeem: 0,
      };

      events?.forEach(event => {
        const eventType = event.event_type as FlashOfferEventType;
        counts[eventType] = (counts[eventType] || 0) + 1;
      });

      return counts;
    } catch (error) {
      console.error('Error getting event counts:', error);
      throw error;
    }
  }
}
