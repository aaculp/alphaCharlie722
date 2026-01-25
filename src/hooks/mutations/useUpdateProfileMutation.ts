/**
 * useUpdateProfileMutation Hook
 * 
 * React Query mutation hook for updating user profile.
 * Automatically invalidates user profile query on success.
 * 
 * Validates: Requirements 5.4
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { ProfileService } from '../../services/api/profile';
import type { Profile, ProfileUpdate } from '../../types/user.types';

/**
 * Data required for profile update mutation
 */
export interface UpdateProfileData {
  userId: string;
  updates: ProfileUpdate;
}

/**
 * Options for useUpdateProfileMutation hook
 */
export interface UseUpdateProfileMutationOptions {
  onSuccess?: (data: Profile | null, variables: UpdateProfileData) => void;
  onError?: (error: Error, variables: UpdateProfileData) => void;
}

/**
 * Update user profile
 * 
 * @param data - Profile update data including userId and updates
 * @returns Updated profile or null
 */
async function updateProfile(data: UpdateProfileData): Promise<Profile | null> {
  const { userId, updates } = data;
  const result = await ProfileService.updateProfile(userId, updates);
  
  if (!result) {
    throw new Error('Failed to update profile');
  }
  
  return result;
}

/**
 * Hook for updating user profile
 * 
 * Features:
 * - Automatic query invalidation on success
 * - Error handling with callbacks
 * - Loading state management
 * - Type-safe mutation
 * 
 * Invalidation Strategy:
 * - Invalidates user profile query for the updated user
 * - Triggers background refetch to ensure UI shows latest data
 * 
 * @param options - Mutation options including success/error callbacks
 * @returns Mutation result with mutate function and states
 * 
 * @example
 * ```tsx
 * const updateProfile = useUpdateProfileMutation({
 *   onSuccess: (profile) => {
 *     console.log('Profile updated:', profile);
 *     showSuccessToast('Profile updated successfully');
 *   },
 *   onError: (error) => {
 *     console.error('Update failed:', error);
 *     showErrorToast(error.message);
 *   },
 * });
 * 
 * // Update profile
 * updateProfile.mutate({
 *   userId: 'user-123',
 *   updates: {
 *     name: 'John Doe',
 *     bio: 'Coffee enthusiast',
 *   },
 * });
 * ```
 */
export function useUpdateProfileMutation(
  options?: UseUpdateProfileMutationOptions
): UseMutationResult<Profile | null, Error, UpdateProfileData> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (data, variables) => {
      // Invalidate user profile query to trigger refetch
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.profile(variables.userId),
      });

      // Call custom success callback if provided
      options?.onSuccess?.(data, variables);
    },
    onError: (error, variables) => {
      console.error('Profile update error:', error);
      
      // Call custom error callback if provided
      options?.onError?.(error, variables);
    },
  });
}
