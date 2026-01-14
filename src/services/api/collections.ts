import { supabase } from '../../lib/supabase';
import type {
  Collection,
  CollectionCreate,
  CollectionUpdate,
  VenueOrder,
} from '../../types/social.types';
import type { Venue } from '../../types/venue.types';
import { cacheManager, CACHE_TTL } from '../../utils/cache/CacheManager';

/**
 * CollectionsService - Handles all collection-related operations
 * Implements collection CRUD, venue management, and privacy filtering
 */
export class CollectionsService {
  // ============================================================================
  // Collection CRUD Methods
  // ============================================================================

  /**
   * Create a new collection
   * @param data - Collection creation data
   * @returns The created collection
   * @throws Error if creation fails
   */
  static async createCollection(data: CollectionCreate): Promise<Collection> {
    try {
      const { data: collection, error } = await supabase
        .from('collections')
        .insert({
          user_id: data.user_id,
          name: data.name,
          description: data.description || null,
          privacy_level: data.privacy_level || 'friends',
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create collection: ${error.message}`);
      }

      // Invalidate user's collections cache
      this.invalidateCollectionsCache(data.user_id);

      console.log('✅ Collection created successfully:', collection);
      return collection;
    } catch (error) {
      console.error('Error creating collection:', error);
      throw error;
    }
  }

  /**
   * Update an existing collection
   * @param collectionId - ID of the collection to update
   * @param data - Collection update data
   * @returns The updated collection
   * @throws Error if update fails or collection not found
   */
  static async updateCollection(
    collectionId: string,
    data: CollectionUpdate
  ): Promise<Collection> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.privacy_level !== undefined) updateData.privacy_level = data.privacy_level;
      if (data.cover_image_url !== undefined) updateData.cover_image_url = data.cover_image_url;

      const { data: collection, error } = await supabase
        .from('collections')
        .update(updateData)
        .eq('id', collectionId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update collection: ${error.message}`);
      }

      // Invalidate caches
      this.invalidateCollectionCache(collectionId);
      this.invalidateCollectionsCache(collection.user_id);

      console.log('✅ Collection updated successfully:', collection);
      return collection;
    } catch (error) {
      console.error('Error updating collection:', error);
      throw error;
    }
  }

  /**
   * Delete a collection
   * @param collectionId - ID of the collection to delete
   * @throws Error if deletion fails
   */
  static async deleteCollection(collectionId: string): Promise<void> {
    try {
      // Get collection to find user_id for cache invalidation
      const { data: collection } = await supabase
        .from('collections')
        .select('user_id')
        .eq('id', collectionId)
        .single();

      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', collectionId);

      if (error) {
        throw new Error(`Failed to delete collection: ${error.message}`);
      }

      // Invalidate caches
      if (collection) {
        this.invalidateCollectionCache(collectionId);
        this.invalidateCollectionsCache(collection.user_id);
      }

      console.log('✅ Collection deleted successfully');
    } catch (error) {
      console.error('Error deleting collection:', error);
      throw error;
    }
  }

  /**
   * Get a single collection by ID with privacy check
   * @param collectionId - ID of the collection to retrieve
   * @param viewerId - ID of the user viewing the collection (optional)
   * @returns The collection or null if not found/not accessible
   */
  static async getCollection(
    collectionId: string,
    viewerId?: string
  ): Promise<Collection | null> {
    try {
      // Get the collection first
      const { data: collection, error } = await supabase
        .from('collections')
        .select('*')
        .eq('id', collectionId)
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to get collection: ${error.message}`);
      }

      if (!collection) {
        return null;
      }

      // Check privacy access if viewer is not the owner
      if (viewerId && viewerId !== collection.user_id) {
        const hasAccess = await this.checkPrivacyAccess(
          collection.user_id,
          viewerId,
          collection.privacy_level
        );

        if (!hasAccess) {
          return null;
        }
      }

      // Get venue count
      const { count: venueCount, error: countError } = await supabase
        .from('collection_venues')
        .select('*', { count: 'exact', head: true })
        .eq('collection_id', collectionId);

      if (countError) {
        console.warn('Warning: Failed to get venue count:', countError.message);
      }

      // Get follower count
      const { count: followerCount, error: followerError } = await supabase
        .from('collection_follows')
        .select('*', { count: 'exact', head: true })
        .eq('collection_id', collectionId);

      if (followerError) {
        console.warn('Warning: Failed to get follower count:', followerError.message);
      }

      // Check if viewer is following (if viewerId provided)
      let isFollowing = false;
      if (viewerId) {
        const { data: followData, error: followError } = await supabase
          .from('collection_follows')
          .select('id')
          .eq('collection_id', collectionId)
          .eq('user_id', viewerId)
          .maybeSingle();

        if (followError) {
          console.warn('Warning: Failed to check follow status:', followError.message);
        }

        isFollowing = !!followData;
      }

      return {
        ...collection,
        venue_count: venueCount || 0,
        follower_count: followerCount || 0,
        is_following: isFollowing,
      };
    } catch (error) {
      console.error('Error getting collection:', error);
      throw error;
    }
  }

  /**
   * Check if a viewer has access to content based on privacy level and relationship
   * @param ownerId - ID of the content owner
   * @param viewerId - ID of the viewer
   * @param privacyLevel - Privacy level of the content
   * @returns True if viewer has access, false otherwise
   */
  private static async checkPrivacyAccess(
    ownerId: string,
    viewerId: string,
    privacyLevel: string
  ): Promise<boolean> {
    // Owner can always see their own content
    if (ownerId === viewerId) {
      return true;
    }

    // Private content is never visible to others
    if (privacyLevel === 'private') {
      return false;
    }

    // Public content is visible to everyone
    if (privacyLevel === 'public') {
      return true;
    }

    // For friends and close_friends, check friendship status
    const [orderedId1, orderedId2] =
      ownerId < viewerId ? [ownerId, viewerId] : [viewerId, ownerId];

    const { data: friendship, error } = await supabase
      .from('friendships')
      .select('is_close_friend_1, is_close_friend_2')
      .eq('user_id_1', orderedId1)
      .eq('user_id_2', orderedId2)
      .maybeSingle();

    if (error) {
      console.warn('Warning: Failed to check friendship:', error.message);
      return false;
    }

    // Not friends
    if (!friendship) {
      return false;
    }

    // For friends privacy, any friendship is enough
    if (privacyLevel === 'friends') {
      return true;
    }

    // For close_friends privacy, check if owner has marked viewer as close friend
    if (privacyLevel === 'close_friends') {
      // Determine which field to check based on who is the owner
      const isCloseFriend =
        ownerId === orderedId1
          ? friendship.is_close_friend_1 // owner is user_id_1, check if they marked user_id_2 as close
          : friendship.is_close_friend_2; // owner is user_id_2, check if they marked user_id_1 as close
      return isCloseFriend;
    }

    return false;
  }

  /**
   * Get all collections for a user with privacy filtering
   * @param userId - ID of the user whose collections to retrieve
   * @param viewerId - ID of the user viewing the collections (optional)
   * @returns Array of collections accessible to the viewer
   */
  static async getUserCollections(
    userId: string,
    viewerId?: string
  ): Promise<Collection[]> {
    try {
      // Check cache first
      const cacheKey = `collections:user:${userId}:${viewerId || 'public'}`;
      const cached = cacheManager.get<Collection[]>(cacheKey);
      if (cached) {
        console.log('✅ Returning cached collections');
        return cached;
      }

      // RLS policies will handle privacy filtering automatically
      // Select only needed columns for better performance
      const { data: collections, error } = await supabase
        .from('collections')
        .select('id, user_id, name, description, privacy_level, cover_image_url, created_at, updated_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get user collections: ${error.message}`);
      }

      if (!collections || collections.length === 0) {
        return [];
      }

      // Batch count queries for better performance
      const collectionIds = collections.map((c) => c.id);

      // Get venue counts for all collections in one query
      const { data: venueCounts } = await supabase
        .from('collection_venues')
        .select('collection_id')
        .in('collection_id', collectionIds);

      // Get follower counts for all collections in one query
      const { data: followerCounts } = await supabase
        .from('collection_follows')
        .select('collection_id')
        .in('collection_id', collectionIds);

      // Get viewer's follows if viewerId provided
      let viewerFollows: Set<string> = new Set();
      if (viewerId) {
        const { data: follows } = await supabase
          .from('collection_follows')
          .select('collection_id')
          .eq('user_id', viewerId)
          .in('collection_id', collectionIds);

        viewerFollows = new Set((follows || []).map((f) => f.collection_id));
      }

      // Count venues and followers per collection
      const venueCountMap = new Map<string, number>();
      (venueCounts || []).forEach((vc) => {
        venueCountMap.set(vc.collection_id, (venueCountMap.get(vc.collection_id) || 0) + 1);
      });

      const followerCountMap = new Map<string, number>();
      (followerCounts || []).forEach((fc) => {
        followerCountMap.set(fc.collection_id, (followerCountMap.get(fc.collection_id) || 0) + 1);
      });

      // Enrich collections with counts
      const enrichedCollections = collections.map((collection) => ({
        ...collection,
        venue_count: venueCountMap.get(collection.id) || 0,
        follower_count: followerCountMap.get(collection.id) || 0,
        is_following: viewerFollows.has(collection.id),
      }));

      // Cache the result
      cacheManager.set(cacheKey, enrichedCollections, CACHE_TTL.COLLECTIONS);

      return enrichedCollections;
    } catch (error) {
      console.error('Error getting user collections:', error);
      throw error;
    }
  }

  // ============================================================================
  // Venue Management Methods
  // ============================================================================

  /**
   * Add a venue to a collection
   * @param collectionId - ID of the collection
   * @param venueId - ID of the venue to add
   * @param order - Optional order position (defaults to end of list)
   * @throws Error if addition fails
   */
  static async addVenueToCollection(
    collectionId: string,
    venueId: string,
    order?: number
  ): Promise<void> {
    try {
      // Check if venue already exists in collection
      const { data: existing, error: checkError } = await supabase
        .from('collection_venues')
        .select('id')
        .eq('collection_id', collectionId)
        .eq('venue_id', venueId)
        .maybeSingle();

      if (checkError) {
        throw new Error(`Failed to check existing venue: ${checkError.message}`);
      }

      if (existing) {
        throw new Error('Venue already exists in this collection');
      }

      // If no order specified, get the max order and add 1
      let finalOrder = order;
      if (finalOrder === undefined) {
        const { data: maxOrderData, error: maxError } = await supabase
          .from('collection_venues')
          .select('order')
          .eq('collection_id', collectionId)
          .order('order', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (maxError) {
          console.warn('Warning: Failed to get max order:', maxError.message);
        }

        finalOrder = maxOrderData ? maxOrderData.order + 1 : 0;
      }

      const { error } = await supabase
        .from('collection_venues')
        .insert({
          collection_id: collectionId,
          venue_id: venueId,
          order: finalOrder,
          added_at: new Date().toISOString(),
        });

      if (error) {
        throw new Error(`Failed to add venue to collection: ${error.message}`);
      }

      // Update collection's updated_at timestamp
      await supabase
        .from('collections')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', collectionId);

      // Invalidate cache
      this.invalidateCollectionCache(collectionId);

      console.log('✅ Venue added to collection successfully');
    } catch (error) {
      console.error('Error adding venue to collection:', error);
      throw error;
    }
  }

  /**
   * Remove a venue from a collection
   * @param collectionId - ID of the collection
   * @param venueId - ID of the venue to remove
   * @throws Error if removal fails
   */
  static async removeVenueFromCollection(
    collectionId: string,
    venueId: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('collection_venues')
        .delete()
        .eq('collection_id', collectionId)
        .eq('venue_id', venueId);

      if (error) {
        throw new Error(`Failed to remove venue from collection: ${error.message}`);
      }

      // Update collection's updated_at timestamp
      await supabase
        .from('collections')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', collectionId);

      // Invalidate cache
      this.invalidateCollectionCache(collectionId);

      console.log('✅ Venue removed from collection successfully');
    } catch (error) {
      console.error('Error removing venue from collection:', error);
      throw error;
    }
  }

  /**
   * Reorder venues in a collection
   * @param collectionId - ID of the collection
   * @param venueOrders - Array of venue IDs with their new order positions
   * @throws Error if reordering fails
   */
  static async reorderVenues(
    collectionId: string,
    venueOrders: VenueOrder[]
  ): Promise<void> {
    try {
      // Update each venue's order
      const updatePromises = venueOrders.map((vo) =>
        supabase
          .from('collection_venues')
          .update({ order: vo.order })
          .eq('collection_id', collectionId)
          .eq('venue_id', vo.venue_id)
      );

      const results = await Promise.all(updatePromises);

      // Check for errors
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) {
        throw new Error(`Failed to reorder venues: ${errors[0].error?.message}`);
      }

      // Update collection's updated_at timestamp
      await supabase
        .from('collections')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', collectionId);

      // Invalidate cache
      this.invalidateCollectionCache(collectionId);

      console.log('✅ Venues reordered successfully');
    } catch (error) {
      console.error('Error reordering venues:', error);
      throw error;
    }
  }

  /**
   * Get all venues in a collection
   * @param collectionId - ID of the collection
   * @returns Array of venues in the collection, ordered by the order field
   */
  static async getCollectionVenues(collectionId: string): Promise<Venue[]> {
    try {
      // Get collection_venues with venue data
      const { data: collectionVenues, error } = await supabase
        .from('collection_venues')
        .select('venue_id, order, venues(*)')
        .eq('collection_id', collectionId)
        .order('order', { ascending: true });

      if (error) {
        throw new Error(`Failed to get collection venues: ${error.message}`);
      }

      if (!collectionVenues || collectionVenues.length === 0) {
        return [];
      }

      // Extract and return venues
      const venues = collectionVenues
        .map((cv: any) => cv.venues)
        .filter((v: any) => v !== null);

      return venues;
    } catch (error) {
      console.error('Error getting collection venues:', error);
      throw error;
    }
  }

  // ============================================================================
  // Cache Management Methods
  // ============================================================================

  /**
   * Invalidate cache for a specific collection
   * @param collectionId - ID of the collection whose cache to invalidate
   */
  private static invalidateCollectionCache(collectionId: string): void {
    cacheManager.invalidatePattern(`collection:${collectionId}:*`);
    console.log(`✅ Invalidated collection cache for: ${collectionId}`);
  }

  /**
   * Invalidate all collections cache for a user
   * @param userId - ID of the user whose collections cache to invalidate
   */
  private static invalidateCollectionsCache(userId: string): void {
    cacheManager.invalidatePattern(`collections:user:${userId}:*`);
    console.log(`✅ Invalidated collections cache for user: ${userId}`);
  }
}
