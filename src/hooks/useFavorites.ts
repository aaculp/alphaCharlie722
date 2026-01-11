import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FavoriteService } from '../services/api/favorites';

export interface UseFavoritesReturn {
  favorites: Set<string>;
  loading: boolean;
  error: Error | null;
  toggleFavorite: (venueId: string) => Promise<boolean>;
  isFavorite: (venueId: string) => boolean;
}

/**
 * Custom hook for managing user favorites
 * 
 * @returns Favorites set, loading state, error state, toggle function, and helper
 * 
 * @example
 * ```tsx
 * const { favorites, loading, toggleFavorite, isFavorite } = useFavorites();
 * 
 * const handleToggle = async () => {
 *   const success = await toggleFavorite(venueId);
 *   if (success) {
 *     console.log('Favorite toggled!');
 *   }
 * };
 * 
 * const isVenueFavorited = isFavorite(venueId);
 * ```
 */
export function useFavorites(): UseFavoritesReturn {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Load user favorites
  useEffect(() => {
    const loadFavorites = async () => {
      if (!user) {
        setFavorites(new Set());
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const userFavorites = await FavoriteService.getUserFavorites(user.id);
        setFavorites(new Set(userFavorites.map(fav => fav.venue_id)));
      } catch (err) {
        const loadError = err instanceof Error ? err : new Error('Failed to load favorites');
        setError(loadError);
        console.error('Error loading favorites:', loadError);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, [user]);

  // Toggle favorite with optimistic updates
  const toggleFavorite = useCallback(async (venueId: string): Promise<boolean> => {
    if (!user) {
      console.warn('User must be logged in to toggle favorites');
      return false;
    }

    // Store previous state for rollback
    const wasFavorite = favorites.has(venueId);
    
    // Optimistic update
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (wasFavorite) {
        newFavorites.delete(venueId);
      } else {
        newFavorites.add(venueId);
      }
      return newFavorites;
    });

    try {
      // Call API
      await FavoriteService.toggleFavorite(user.id, venueId);
      return true;
    } catch (err) {
      // Rollback on error
      setFavorites(prev => {
        const newFavorites = new Set(prev);
        if (wasFavorite) {
          newFavorites.add(venueId);
        } else {
          newFavorites.delete(venueId);
        }
        return newFavorites;
      });
      
      const toggleError = err instanceof Error ? err : new Error('Failed to toggle favorite');
      console.error('Error toggling favorite:', toggleError);
      return false;
    }
  }, [user, favorites]);

  // Helper to check if a venue is favorited
  const isFavorite = useCallback((venueId: string): boolean => {
    return favorites.has(venueId);
  }, [favorites]);

  return {
    favorites,
    loading,
    error,
    toggleFavorite,
    isFavorite,
  };
}
