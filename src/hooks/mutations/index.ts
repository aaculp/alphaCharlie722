/**
 * Mutation Hooks
 * 
 * React Query mutation hooks for data modification operations.
 * All mutations include optimistic updates and automatic cache invalidation.
 */

export { useCheckInMutation } from './useCheckInMutation';
export type { CheckInMutationData, UseCheckInMutationOptions } from './useCheckInMutation';

export { useCheckOutMutation } from './useCheckOutMutation';
export type { CheckOutMutationData, UseCheckOutMutationOptions } from './useCheckOutMutation';

export { useSubmitReviewMutation } from './useSubmitReviewMutation';
export type { SubmitReviewMutationData, UseSubmitReviewMutationOptions } from './useSubmitReviewMutation';

export { useUpdateProfileMutation } from './useUpdateProfileMutation';
export type { UpdateProfileMutationData, UseUpdateProfileMutationOptions } from './useUpdateProfileMutation';

export { useAddFriendMutation } from './useAddFriendMutation';
export type { AddFriendMutationData, UseAddFriendMutationOptions } from './useAddFriendMutation';

export { useClaimFlashOfferMutation } from './useClaimFlashOfferMutation';
export type { ClaimFlashOfferMutationData, UseClaimFlashOfferMutationOptions } from './useClaimFlashOfferMutation';

export { useAddVenueToCollectionMutation } from './useAddVenueToCollectionMutation';
export type { AddVenueToCollectionData, UseAddVenueToCollectionMutationOptions } from './useAddVenueToCollectionMutation';

export {
  useCreateCollectionMutation,
  useDeleteCollectionMutation,
  useFollowCollectionMutation,
  useUnfollowCollectionMutation,
} from './useCollectionMutations';
export type {
  CreateCollectionData,
  UseCreateCollectionMutationOptions,
  DeleteCollectionData,
  UseDeleteCollectionMutationOptions,
  FollowCollectionData,
  UseFollowCollectionMutationOptions,
  UnfollowCollectionData,
  UseUnfollowCollectionMutationOptions,
} from './useCollectionMutations';
