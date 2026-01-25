/**
 * Unit Tests for Collection Query Hooks
 * 
 * Tests verify basic functionality of collection query hooks.
 */

import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCollectionsQuery } from '../useCollectionsQuery';
import { useCollectionQuery } from '../useCollectionQuery';
import { CollectionsService } from '../../../services/api/collections';
import type { Collection } from '../../../types/social.types';
import React from 'react';

// Mock the service
jest.mock('../../../services/api/collections');

const mockCollectionsService = CollectionsService as jest.Mocked<typeof CollectionsService>;

// Helper to create a wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return {
    queryClient,
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    ),
  };
}

describe('useCollectionsQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch user collections successfully', async () => {
    const mockCollections: Collection[] = [
      {
        id: 'collection-1',
        user_id: 'user-123',
        name: 'My Favorites',
        description: 'My favorite venues',
        privacy_level: 'friends',
        cover_image_url: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        venue_count: 5,
        follower_count: 10,
      },
      {
        id: 'collection-2',
        user_id: 'user-123',
        name: 'Coffee Shops',
        description: 'Best coffee in town',
        privacy_level: 'public',
        cover_image_url: null,
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        venue_count: 3,
        follower_count: 5,
      },
    ];

    mockCollectionsService.getUserCollections.mockResolvedValue(mockCollections);

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useCollectionsQuery({ userId: 'user-123' }),
      { wrapper }
    );

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockCollections);
    expect(result.current.isLoading).toBe(false);
    expect(mockCollectionsService.getUserCollections).toHaveBeenCalledWith('user-123', undefined);
  });

  it('should fetch collections with viewerId', async () => {
    const mockCollections: Collection[] = [];
    mockCollectionsService.getUserCollections.mockResolvedValue(mockCollections);

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useCollectionsQuery({ userId: 'user-123', viewerId: 'viewer-456' }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockCollectionsService.getUserCollections).toHaveBeenCalledWith('user-123', 'viewer-456');
  });

  it('should handle errors when fetching collections', async () => {
    const error = new Error('Failed to fetch collections');
    mockCollectionsService.getUserCollections.mockRejectedValue(error);

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useCollectionsQuery({ userId: 'user-123' }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });

  it('should not fetch when enabled is false', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useCollectionsQuery({ userId: 'user-123', enabled: false }),
      { wrapper }
    );

    // Should not be loading or fetching
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(false);
    expect(mockCollectionsService.getUserCollections).not.toHaveBeenCalled();
  });

  it('should return empty array when no collections exist', async () => {
    mockCollectionsService.getUserCollections.mockResolvedValue([]);

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useCollectionsQuery({ userId: 'user-123' }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });
});

describe('useCollectionQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch single collection successfully', async () => {
    const mockCollection: Collection = {
      id: 'collection-123',
      user_id: 'user-456',
      name: 'My Collection',
      description: 'Test description',
      privacy_level: 'friends',
      cover_image_url: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      venue_count: 5,
      follower_count: 10,
      is_following: false,
    };

    mockCollectionsService.getCollection.mockResolvedValue(mockCollection);

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useCollectionQuery({ collectionId: 'collection-123' }),
      { wrapper }
    );

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockCollection);
    expect(result.current.isLoading).toBe(false);
    expect(mockCollectionsService.getCollection).toHaveBeenCalledWith('collection-123', undefined);
  });

  it('should fetch collection with viewerId', async () => {
    const mockCollection: Collection = {
      id: 'collection-123',
      user_id: 'user-456',
      name: 'My Collection',
      description: 'Test description',
      privacy_level: 'friends',
      cover_image_url: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      venue_count: 5,
      follower_count: 10,
      is_following: true,
    };

    mockCollectionsService.getCollection.mockResolvedValue(mockCollection);

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useCollectionQuery({ collectionId: 'collection-123', viewerId: 'viewer-789' }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockCollectionsService.getCollection).toHaveBeenCalledWith('collection-123', 'viewer-789');
  });

  it('should return null when collection not found', async () => {
    mockCollectionsService.getCollection.mockResolvedValue(null);

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useCollectionQuery({ collectionId: 'collection-123' }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeNull();
  });

  it('should handle errors when fetching collection', async () => {
    const error = new Error('Failed to fetch collection');
    mockCollectionsService.getCollection.mockRejectedValue(error);

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useCollectionQuery({ collectionId: 'collection-123' }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });

  it('should not fetch when enabled is false', async () => {
    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useCollectionQuery({ collectionId: 'collection-123', enabled: false }),
      { wrapper }
    );

    // Should not be loading or fetching
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(false);
    expect(mockCollectionsService.getCollection).not.toHaveBeenCalled();
  });

  it('should handle privacy restrictions (null return)', async () => {
    // When user doesn't have access, service returns null
    mockCollectionsService.getCollection.mockResolvedValue(null);

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useCollectionQuery({ collectionId: 'private-collection', viewerId: 'unauthorized-user' }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeNull();
  });
});
