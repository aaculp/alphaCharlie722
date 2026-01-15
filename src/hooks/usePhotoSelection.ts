import { useState, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import {
  selectPhotoFromLibrary,
  takePhotoWithCamera,
  isValidImageFormat,
  PhotoPickerResult,
} from '../utils/photoPicker';

export interface UsePhotoSelectionOptions {
  onPhotoSelected?: (uri: string) => void;
  onError?: (error: string) => void;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export interface UsePhotoSelectionReturn {
  selectedPhotoUri: string | null;
  isSelecting: boolean;
  selectPhoto: () => Promise<void>;
  takePhoto: () => Promise<void>;
  showPhotoOptions: () => void;
  clearPhoto: () => void;
}

/**
 * Custom hook for handling photo selection from library or camera
 * 
 * Validates: Requirements 1.3, 1.4, 6.1
 */
export const usePhotoSelection = (
  options: UsePhotoSelectionOptions = {}
): UsePhotoSelectionReturn => {
  const {
    onPhotoSelected,
    onError,
    maxWidth = 1000,
    maxHeight = 1000,
    quality = 0.8,
  } = options;

  const [selectedPhotoUri, setSelectedPhotoUri] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  /**
   * Handle photo selection result
   * 
   * Enhanced error handling for:
   * - Invalid format errors
   * - User cancellation
   * - Permission errors
   * 
   * Validates: Requirement 6.7
   */
  const handlePhotoResult = useCallback(
    (result: PhotoPickerResult) => {
      if (!result.success) {
        if (result.error && result.error !== 'User cancelled image selection') {
          // Categorize errors for better user messages (Requirement 6.7)
          let userMessage = result.error;
          
          // Permission errors
          if (result.error.toLowerCase().includes('permission')) {
            userMessage = 'Camera or photo library permission denied. Please enable it in Settings.';
          }
          // Camera errors
          else if (result.error.toLowerCase().includes('camera')) {
            userMessage = 'Failed to access camera. Please try again.';
          }
          
          onError?.(userMessage);
          Alert.alert('Error', userMessage);
        }
        return;
      }

      // Validate image format (Requirement 6.1, 6.7)
      if (!isValidImageFormat(result.type)) {
        const errorMsg = 'Please select a valid image file (JPEG, PNG, GIF, WEBP)';
        onError?.(errorMsg);
        Alert.alert('Invalid Format', errorMsg);
        return;
      }

      // Update selected photo URI (Requirement 1.4)
      if (result.uri) {
        setSelectedPhotoUri(result.uri);
        onPhotoSelected?.(result.uri);
      }
    },
    [onPhotoSelected, onError]
  );

  /**
   * Select photo from library (Requirement 1.3)
   */
  const selectPhoto = useCallback(async () => {
    setIsSelecting(true);
    try {
      const result = await selectPhotoFromLibrary({
        mediaType: 'photo',
        quality,
        maxWidth,
        maxHeight,
        includeBase64: false,
      });
      handlePhotoResult(result);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to select photo';
      onError?.(errorMsg);
      Alert.alert('Error', errorMsg);
    } finally {
      setIsSelecting(false);
    }
  }, [quality, maxWidth, maxHeight, handlePhotoResult, onError]);

  /**
   * Take photo with camera (Requirement 1.3)
   */
  const takePhoto = useCallback(async () => {
    setIsSelecting(true);
    try {
      const result = await takePhotoWithCamera({
        mediaType: 'photo',
        quality,
        maxWidth,
        maxHeight,
        includeBase64: false,
      });
      handlePhotoResult(result);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to take photo';
      onError?.(errorMsg);
      Alert.alert('Error', errorMsg);
    } finally {
      setIsSelecting(false);
    }
  }, [quality, maxWidth, maxHeight, handlePhotoResult, onError]);

  /**
   * Show options to select from library or take photo (Requirement 1.3)
   */
  const showPhotoOptions = useCallback(() => {
    Alert.alert(
      'Select Photo',
      'Choose a photo from your library or take a new one',
      [
        {
          text: 'Take Photo',
          onPress: takePhoto,
        },
        {
          text: 'Choose from Library',
          onPress: selectPhoto,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  }, [selectPhoto, takePhoto]);

  /**
   * Clear selected photo
   */
  const clearPhoto = useCallback(() => {
    setSelectedPhotoUri(null);
  }, []);

  return {
    selectedPhotoUri,
    isSelecting,
    selectPhoto,
    takePhoto,
    showPhotoOptions,
    clearPhoto,
  };
};
