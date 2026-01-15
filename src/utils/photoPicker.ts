import {
  launchImageLibrary,
  launchCamera,
  ImagePickerResponse,
  Asset,
} from 'react-native-image-picker';
import { Platform, PermissionsAndroid } from 'react-native';

export interface PhotoPickerOptions {
  mediaType?: 'photo' | 'video' | 'mixed';
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  includeBase64?: boolean;
}

export interface PhotoPickerResult {
  success: boolean;
  uri?: string;
  fileName?: string;
  fileSize?: number;
  type?: string;
  base64?: string;
  error?: string;
}

/**
 * Request camera permission on Android
 */
const requestCameraPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'OTW needs access to your camera to take photos.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Camera permission error:', err);
      return false;
    }
  }
  return true;
};

/**
 * Process image picker response
 */
const processImagePickerResponse = (
  response: ImagePickerResponse
): PhotoPickerResult => {
  if (response.didCancel) {
    return {
      success: false,
      error: 'User cancelled image selection',
    };
  }

  if (response.errorCode) {
    return {
      success: false,
      error: response.errorMessage || 'Unknown error occurred',
    };
  }

  if (!response.assets || response.assets.length === 0) {
    return {
      success: false,
      error: 'No image selected',
    };
  }

  const asset: Asset = response.assets[0];

  if (!asset.uri) {
    return {
      success: false,
      error: 'Invalid image URI',
    };
  }

  return {
    success: true,
    uri: asset.uri,
    fileName: asset.fileName,
    fileSize: asset.fileSize,
    type: asset.type,
    base64: asset.base64,
  };
};

/**
 * Open image library to select a photo
 */
export const selectPhotoFromLibrary = async (
  options: PhotoPickerOptions = {}
): Promise<PhotoPickerResult> => {
  const {
    mediaType = 'photo',
    quality = 0.8,
    maxWidth = 1000,
    maxHeight = 1000,
    includeBase64 = false,
  } = options;

  try {
    const response = await launchImageLibrary({
      mediaType,
      quality,
      maxWidth,
      maxHeight,
      includeBase64,
    });

    return processImagePickerResponse(response);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to open image library',
    };
  }
};

/**
 * Open camera to take a photo
 */
export const takePhotoWithCamera = async (
  options: PhotoPickerOptions = {}
): Promise<PhotoPickerResult> => {
  const {
    mediaType = 'photo',
    quality = 0.8,
    maxWidth = 1000,
    maxHeight = 1000,
    includeBase64 = false,
  } = options;

  // Request camera permission on Android
  const hasPermission = await requestCameraPermission();
  if (!hasPermission) {
    return {
      success: false,
      error: 'Camera permission denied',
    };
  }

  try {
    const response = await launchCamera({
      mediaType,
      quality,
      maxWidth,
      maxHeight,
      includeBase64,
      saveToPhotos: true,
    });

    return processImagePickerResponse(response);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to open camera',
    };
  }
};

/**
 * Validate image format
 */
export const isValidImageFormat = (type?: string): boolean => {
  if (!type) return false;
  
  const validFormats = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ];
  
  return validFormats.includes(type.toLowerCase());
};
