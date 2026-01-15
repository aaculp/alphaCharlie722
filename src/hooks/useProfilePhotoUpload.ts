import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { usePhotoSelection } from './usePhotoSelection';
import { ProfileService, PhotoUploadProgress } from '../services/api/profile';

export interface UseProfilePhotoUploadOptions {
  userId: string;
  onUploadSuccess?: (photoUrl: string) => void;
  onUploadError?: (error: string) => void;
}

export interface UseProfilePhotoUploadReturn {
  selectedPhotoUri: string | null;
  isSelecting: boolean;
  isUploading: boolean;
  uploadProgress: PhotoUploadProgress | null;
  selectAndUploadPhoto: () => Promise<void>;
  clearPhoto: () => void;
}

/**
 * Custom hook for handling profile photo selection and upload
 * 
 * Combines photo selection with backend upload functionality
 * Validates: Requirements 1.3, 1.4, 6.1, 6.2, 6.3, 6.4, 6.7
 */
export const useProfilePhotoUpload = (
  options: UseProfilePhotoUploadOptions
): UseProfilePhotoUploadReturn => {
  const { userId, onUploadSuccess, onUploadError } = options;

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<PhotoUploadProgress | null>(null);

  /**
   * Handle photo upload after selection
   * 
   * Enhanced error handling for:
   * - Network errors
   * - Invalid format errors
   * - File size errors
   * - Server errors
   * 
   * Validates: Requirement 6.7
   */
  const handlePhotoSelected = useCallback(
    async (uri: string) => {
      setIsUploading(true);
      setUploadProgress({ loaded: 0, total: 100, percentage: 0 });

      try {
        // Extract file name from URI
        const fileName = uri.split('/').pop() || 'photo.jpg';

        // Upload photo (Requirements 6.3, 6.4)
        const result = await ProfileService.uploadProfilePhoto(
          userId,
          uri,
          fileName,
          (progress) => {
            setUploadProgress(progress);
          }
        );

        if (result.success && result.photoUrl) {
          onUploadSuccess?.(result.photoUrl);
          Alert.alert('Success', 'Profile photo updated successfully');
        } else {
          // Handle upload error with specific error messages (Requirement 6.7)
          const errorMsg = result.error || 'Failed to upload photo';
          
          // Categorize error and provide user-friendly message
          let userMessage = errorMsg;
          
          // Network errors
          if (errorMsg.toLowerCase().includes('network') || 
              errorMsg.toLowerCase().includes('connection') ||
              errorMsg.toLowerCase().includes('timeout')) {
            userMessage = 'Failed to upload photo. Check your connection.';
          }
          // Invalid format errors
          else if (errorMsg.toLowerCase().includes('format') || 
                   errorMsg.toLowerCase().includes('type') ||
                   errorMsg.toLowerCase().includes('invalid image')) {
            userMessage = 'Please select a valid image file (JPEG, PNG, GIF, WEBP)';
          }
          // File size errors
          else if (errorMsg.toLowerCase().includes('size') || 
                   errorMsg.toLowerCase().includes('too large') ||
                   errorMsg.toLowerCase().includes('exceeds')) {
            userMessage = 'Image is too large. Please select a smaller image.';
          }
          // Server errors
          else if (errorMsg.toLowerCase().includes('server') || 
                   errorMsg.toLowerCase().includes('500') ||
                   errorMsg.toLowerCase().includes('503')) {
            userMessage = 'Upload failed. Please try again later.';
          }
          
          onUploadError?.(userMessage);
          Alert.alert('Upload Failed', userMessage);
        }
      } catch (error) {
        // Handle unexpected errors (Requirement 6.7)
        let errorMsg = 'Failed to upload photo';
        
        if (error instanceof Error) {
          // Network errors
          if (error.message.toLowerCase().includes('network') || 
              error.message.toLowerCase().includes('connection') ||
              error.message.toLowerCase().includes('timeout')) {
            errorMsg = 'Failed to upload photo. Check your connection.';
          }
          // File size errors
          else if (error.message.toLowerCase().includes('size') || 
                   error.message.toLowerCase().includes('too large')) {
            errorMsg = 'Image is too large. Please select a smaller image.';
          }
          // Generic error with message
          else if (error.message) {
            errorMsg = error.message;
          }
        }
        
        onUploadError?.(errorMsg);
        Alert.alert('Upload Failed', errorMsg);
      } finally {
        setIsUploading(false);
        setUploadProgress(null);
      }
    },
    [userId, onUploadSuccess, onUploadError]
  );

  /**
   * Handle photo selection error
   */
  const handlePhotoError = useCallback(
    (error: string) => {
      onUploadError?.(error);
    },
    [onUploadError]
  );

  // Use photo selection hook (Requirements 1.3, 1.4, 6.1)
  const {
    selectedPhotoUri,
    isSelecting,
    showPhotoOptions,
    clearPhoto,
  } = usePhotoSelection({
    onPhotoSelected: handlePhotoSelected,
    onError: handlePhotoError,
    maxWidth: 1000,
    maxHeight: 1000,
    quality: 0.8,
  });

  /**
   * Select and upload photo in one action
   */
  const selectAndUploadPhoto = useCallback(async () => {
    showPhotoOptions();
  }, [showPhotoOptions]);

  return {
    selectedPhotoUri,
    isSelecting,
    isUploading,
    uploadProgress,
    selectAndUploadPhoto,
    clearPhoto,
  };
};
