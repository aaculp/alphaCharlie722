import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CollectionsService } from '../services/api/collections';
import type {
  Collection,
  CollectionCreate,
  CollectionUpdate,
  VenueOrder,
} from '../types/social.types';
import type { Venue } from '../types/venue.types';

export interface UseCollectionsOptions {
  userId?: string; // If not provided, uses current user
  autoLoad?: boolean;
}

export interface UseCollectionsReturn {
  collections: Collection[];
  loading: boolean;
  error: Error | null;
  createCollection: (data: Omit<CollectionCreate, 'user_id'>) => Promise<Collection | null>;
  updateCollection: (collectionId: string, data: CollectionUpdate) => Promise<boolean>;
  deleteCollection: (collectionId: string) => Promise<boolean>;
  addVenue: (collectionId: string, venueId: string, order?: number) => Promise<boolean>;
  removeVenue: (collectionId: string, venueId: string) => Promise<boolean>;
  reorderVenues: (collectionId: string, venueOrders: VenueOrder[]) => Promise<boolean>;
  getCollectionVenues: (collectionId: string) => Promise<Venue[]>;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for managing user collections
 * 
 * @param options - Configuration options
 * @returns Collections data, loading state, error state, and collection management functions
 * 
 * @example
 * ```tsx
 * const {
 *   collections,
 *   loading,
 *   createCollection,
 *   addVenue,
 *   deleteCollection,
 * } = useCollections();
 * 
 * // Create a new collection
 * const collection = await createCollection({
 *   name: 'Date Night Spots',
 *   description: 'Romantic venues for special occasions',
 *   privacy_level: 'friends',
 * });
 * 
 * // Add a venue to the collection
 * await addVenue(collection.id, 'venue-123');
 * 
 * // Delete a collection
 * await deleteCollection(collection.id);
 * ```
 */
export function useCollections(options: UseCollectionsOptions = {}): UseCollectionsReturn {
  const { userId: targetUserId, autoLoad = true } = options;
  const { user } = useAuth();

  // Use targetUserId if provided, otherwise use current user
  const userId = targetUserId || user?.id;

  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState<boolean>(autoLoad);
  const [error, setError] = useState<Error | null>(null);

  // Load user collections
  const loadCollections = useCallback(async () => {
    if (!userId) {
      setCollections([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const collectionsData = await CollectionsService.getUserCollections(
        userId,
        user?.id // Pass current user as viewer for privacy filtering
      );

      setCollections(collectionsData);
    } catch (err) {
      const loadError = err instanceof Error ? err : new Error('Failed to load collections');
      setError(loadError);
      console.error('Error loading collections:', loadError);
    } finally {
      setLoading(false);
    }
  }, [userId, user?.id]);

  // Auto-load on mount if enabled
  useEffect(() => {
    if (autoLoad) {
      loadCollections();
    }
  }, [autoLoad, loadCollections]);

  // Create a new collection
  const createCollection = useCallback(
    async (data: Omit<CollectionCreate, 'user_id'>): Promise<Collection | null> => {
      if (!user?.id) {
        console.warn('User must be logged in to create collections');
        return null;
      }

      try {
        const collection = await CollectionsService.createCollection({
          ...data,
          user_id: user.id,
        });

        // Add to collections list
        setCollections((prev) => [collection, ...prev]);
        return collection;
      } catch (err) {
        const createError = err instanceof Error ? err : new Error('Failed to create collection');
        setError(createError);
        console.error('Error creating collection:', createError);
        return null;
      }
    },
    [user]
  );

  // Update an existing collection
  const updateCollection = useCallback(
    async (collectionId: string, data: CollectionUpdate): Promise<boolean> => {
      if (!user?.id) {
        console.warn('User must be logged in to update collections');
        return false;
      }

      try {
        const updatedCollection = await CollectionsService.updateCollection(collectionId, data);

        // Update in collections list
        setCollections((prev) =>
          prev.map((col) => (col.id === collectionId ? updatedCollection : col))
        );
        return true;
      } catch (err) {
        const updateError = err instanceof Error ? err : new Error('Failed to update collection');
        setError(updateError);
        console.error('Error updating collection:', updateError);
        return false;
      }
    },
    [user]
  );

  // Delete a collection
  const deleteCollection = useCallback(
    async (collectionId: string): Promise<boolean> => {
      if (!user?.id) {
        console.warn('User must be logged in to delete collections');
        return false;
      }

      try {
        await CollectionsService.deleteCollection(collectionId);

        // Remove from collections list
        setCollections((prev) => prev.filter((col) => col.id !== collectionId));
        return true;
      } catch (err) {
        const deleteError = err instanceof Error ? err : new Error('Failed to delete collection');
        setError(deleteError);
        console.error('Error deleting collection:', deleteError);
        return false;
      }
    },
    [user]
  );

  // Add a venue to a collection
  const addVenue = useCallback(
    async (collectionId: string, venueId: string, order?: number): Promise<boolean> => {
      if (!user?.id) {
        console.warn('User must be logged in to add venues to collections');
        return false;
      }

      try {
        await CollectionsService.addVenueToCollection(collectionId, venueId, order);

        // Update venue count in collections list
        setCollections((prev) =>
          prev.map((col) =>
            col.id === collectionId
              ? { ...col, venue_count: (col.venue_count || 0) + 1 }
              : col
          )
        );
        return true;
      } catch (err) {
        const addError = err instanceof Error ? err : new Error('Failed to add venue to collection');
        setError(addError);
        console.error('Error adding venue to collection:', addError);
        return false;
      }
    },
    [user]
  );

  // Remove a venue from a collection
  const removeVenue = useCallback(
    async (collectionId: string, venueId: string): Promise<boolean> => {
      if (!user?.id) {
        console.warn('User must be logged in to remove venues from collections');
        return false;
      }

      try {
        await CollectionsService.removeVenueFromCollection(collectionId, venueId);

        // Update venue count in collections list
        setCollections((prev) =>
          prev.map((col) =>
            col.id === collectionId
              ? { ...col, venue_count: Math.max((col.venue_count || 0) - 1, 0) }
              : col
          )
        );
        return true;
      } catch (err) {
        const removeError = err instanceof Error ? err : new Error('Failed to remove venue from collection');
        setError(removeError);
        console.error('Error removing venue from collection:', removeError);
        return false;
      }
    },
    [user]
  );

  // Reorder venues in a collection
  const reorderVenues = useCallback(
    async (collectionId: string, venueOrders: VenueOrder[]): Promise<boolean> => {
      if (!user?.id) {
        console.warn('User must be logged in to reorder venues');
        return false;
      }

      try {
        await CollectionsService.reorderVenues(collectionId, venueOrders);
        return true;
      } catch (err) {
        const reorderError = err instanceof Error ? err : new Error('Failed to reorder venues');
        setError(reorderError);
        console.error('Error reordering venues:', reorderError);
        return false;
      }
    },
    [user]
  );

  // Get venues in a collection
  const getCollectionVenues = useCallback(
    async (collectionId: string): Promise<Venue[]> => {
      try {
        const venues = await CollectionsService.getCollectionVenues(collectionId);
        return venues;
      } catch (err) {
        const getError = err instanceof Error ? err : new Error('Failed to get collection venues');
        setError(getError);
        console.error('Error getting collection venues:', getError);
        return [];
      }
    },
    []
  );

  // Refetch collections
  const refetch = useCallback(async () => {
    await loadCollections();
  }, [loadCollections]);

  return {
    collections,
    loading,
    error,
    createCollection,
    updateCollection,
    deleteCollection,
    addVenue,
    removeVenue,
    reorderVenues,
    getCollectionVenues,
    refetch,
  };
}
