/**
 * Unit Tests for Collection Mutation Hooks
 * 
 * Tests verify basic functionality of collection mutation hooks.
 */

import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useCreateCollectionMutation,
  useDeleteCollectionMutation,
  useFollowCollectionMutation,
  useUnfollowCollectionMutation,
} from '../useCollectionMutations';
import { useAddVenueToCollectionMutation } from '../useAddVenueToCollectionMutation';
import { CollectionsService } from '../../../services/api/collections';
import { supabase } from '../../../lib/supabase';
import type { Collection } from '../../../types/social.types';
import React from 'react';

// Mock the services
jest.mock('../../../services/api/collections');
jest.mock('../../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const mockCollectionsService = CollectionsService as jest.Mocked<typeof CollectionsService>;
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

// Helper to create a wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
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

describe('useCreateCollectionMutation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a collection successfully', async () => {
    const mockCollection: Collection = {
      id: 'collection-123',
      user_id: 'user-456',
      name: 'My Collection',
      description: 'Test description',
      privacy_level: 'friends',
      cover_image_url: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      venue_count: 0,
      follower_count: 0,
    };

    mockCollectionsService.createCollection.mockResolvedValue(mockCollection);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateCollectionMutation(), { wrapper });

    act(() => {
      result.current.mutate({
        userId: 'user-456',
        name: 'My Collection',
        description: 'Test description',
        privacy_level: 'friends',
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockCollection);
    expect(mockCollectionsService.createCollection).toHaveBeenCalledWith({
      user_id: 'user-456',
      name: 'My Collection',
      description: 'Test description',
      privacy_level: 'friends',
    });
  });

  it('should handle errors when creating collection', async () => {
    const error = new Error('Failed to create collection');
    mockCollectionsService.createCollection.mockRejectedValue(error);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateCollectionMutation(), { wrapper });

    act(() => {
      result.current.mutate({
        userId: 'user-456',
        name: 'My Collection',
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });
});

describe('useDeleteCollectionMutation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete a collection successfully', async () => {
    mockCollectionsService.deleteCollection.mockResolvedValue(undefined);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteCollectionMutation(), { wrapper });

    act(() => {
      result.current.mutate({
        collectionId: 'collection-123',
        userId: 'user-456',
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockCollectionsService.deleteCollection).toHaveBeenCalledWith('collection-123');
  });
});

describe('useAddVenueToCollectionMutation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add venue to collection successfully', async () => {
    mockCollectionsService.addVenueToCollection.mockResolvedValue(undefined);

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useAddVenueToCollectionMutation(), { wrapper });

    act(() => {
      result.current.mutate({
        collectionId: 'collection-123',
        venueId: 'venue-456',
        userId: 'user-789',
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockCollectionsService.addVenueToCollection).toHaveBeenCalledWith(
      'collection-123',
      'venue-456',
      undefined
    );
  });
});

describe('useFollowCollectionMutation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should follow a collection successfully', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ error: null });
    mockSupabase.from = jest.fn().mockReturnValue({
      insert: mockInsert,
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useFollowCollectionMutation(), { wrapper });

    act(() => {
      result.current.mutate({
        collectionId: 'collection-123',
        userId: 'user-456',
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('collection_follows');
  });
});

describe('useUnfollowCollectionMutation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should unfollow a collection successfully', async () => {
    const mockEq2 = jest.fn().mockResolvedValue({ error: null });
    const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
    const mockDelete = jest.fn().mockReturnValue({ eq: mockEq1 });
    mockSupabase.from = jest.fn().mockReturnValue({
      delete: mockDelete,
    });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUnfollowCollectionMutation(), { wrapper });

    act(() => {
      result.current.mutate({
        collectionId: 'collection-123',
        userId: 'user-456',
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('collection_follows');
  });
});
