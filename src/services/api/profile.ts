import { supabase } from '../../lib/supabase';
import type { Profile, ProfileUpdate } from '../../types/user.types';
import type { 
  UserProfile, 
  FetchUserProfileResponse,
  UpdateAboutTextResponse 
} from '../../types/profile.types';

export interface PhotoUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface PhotoUploadResult {
  success: boolean;
  photoUrl?: string;
  error?: string;
}

/**
 * Profile API Service
 * 
 * Handles profile-related operations including photo upload
 * Validates: Requirements 6.3, 6.4, 6.5
 */
export class ProfileService {
  /**
   * Upload profile photo to Supabase Storage
   * 
   * Enhanced error handling for:
   * - Network errors
   * - Invalid format errors
   * - File size errors (max 5MB)
   * - Server errors
   * 
   * @param userId - User ID
   * @param fileUri - Local file URI
   * @param fileName - File name
   * @param onProgress - Optional progress callback
   * @returns Upload result with photo URL
   * 
   * Validates: Requirements 6.3, 6.4, 6.7
   */
  static async uploadProfilePhoto(
    userId: string,
    fileUri: string,
    fileName: string,
    onProgress?: (progress: PhotoUploadProgress) => void
  ): Promise<PhotoUploadResult> {
    try {
      // Read file as blob
      const response = await fetch(fileUri);
      
      // Check if fetch was successful
      if (!response.ok) {
        return {
          success: false,
          error: 'Failed to read image file. Please try again.',
        };
      }
      
      const blob = await response.blob();
      
      // Validate file size (max 5MB) (Requirement 6.7)
      const maxSizeBytes = 5 * 1024 * 1024; // 5MB
      if (blob.size > maxSizeBytes) {
        return {
          success: false,
          error: 'Image is too large. Please select a smaller image (max 5MB).',
        };
      }
      
      // Validate image format (Requirement 6.7)
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(blob.type.toLowerCase())) {
        return {
          success: false,
          error: 'Please select a valid image file (JPEG, PNG, GIF, WEBP)',
        };
      }
      
      // Generate unique file name
      const fileExt = fileName.split('.').pop() || 'jpg';
      const uniqueFileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `profile-photos/${uniqueFileName}`;

      // Upload to Supabase Storage (Requirement 6.3)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          contentType: blob.type,
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        
        // Categorize upload errors (Requirement 6.7)
        let errorMessage = uploadError.message;
        
        // Network/connection errors
        if (errorMessage.toLowerCase().includes('network') || 
            errorMessage.toLowerCase().includes('connection') ||
            errorMessage.toLowerCase().includes('timeout')) {
          errorMessage = 'Failed to upload photo. Check your connection.';
        }
        // Storage quota errors
        else if (errorMessage.toLowerCase().includes('quota') || 
                 errorMessage.toLowerCase().includes('storage')) {
          errorMessage = 'Storage limit reached. Please contact support.';
        }
        // Server errors
        else if (errorMessage.toLowerCase().includes('500') || 
                 errorMessage.toLowerCase().includes('503')) {
          errorMessage = 'Upload failed. Please try again later.';
        }
        
        return {
          success: false,
          error: errorMessage,
        };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const photoUrl = urlData.publicUrl;

      // Update profile with new photo URL (Requirement 6.4)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: photoUrl })
        .eq('id', userId);

      if (updateError) {
        console.error('Profile update error:', updateError);
        
        // Categorize database errors (Requirement 6.7)
        let errorMessage = updateError.message;
        
        if (errorMessage.toLowerCase().includes('network') || 
            errorMessage.toLowerCase().includes('connection')) {
          errorMessage = 'Failed to update profile. Check your connection.';
        } else if (errorMessage.toLowerCase().includes('permission') || 
                   errorMessage.toLowerCase().includes('unauthorized')) {
          errorMessage = 'Permission denied. Please try logging in again.';
        }
        
        return {
          success: false,
          error: errorMessage,
        };
      }

      return {
        success: true,
        photoUrl,
      };
    } catch (error) {
      console.error('Photo upload error:', error);
      
      // Handle network and unexpected errors (Requirement 6.7)
      let errorMessage = 'Failed to upload photo';
      
      if (error instanceof Error) {
        // Network errors
        if (error.message.toLowerCase().includes('network') || 
            error.message.toLowerCase().includes('connection') ||
            error.message.toLowerCase().includes('timeout') ||
            error.message.toLowerCase().includes('fetch')) {
          errorMessage = 'Failed to upload photo. Check your connection.';
        }
        // File system errors
        else if (error.message.toLowerCase().includes('file') || 
                 error.message.toLowerCase().includes('read')) {
          errorMessage = 'Failed to read image file. Please try again.';
        }
        // Generic error with message
        else if (error.message) {
          errorMessage = error.message;
        }
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Fetch user profile data
   * 
   * @param userId - User ID
   * @returns User profile
   * 
   * Validates: Requirement 6.5
   */
  static async fetchUserProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Profile fetch error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Profile fetch error:', error);
      return null;
    }
  }

  /**
   * Fetch complete user profile with statistics
   * 
   * @param userId - User ID
   * @returns Complete user profile with statistics
   * 
   * Validates: Requirement 6.5
   */
  static async fetchCompleteUserProfile(userId: string): Promise<FetchUserProfileResponse> {
    try {
      // Fetch basic profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError || !profileData) {
        console.error('Profile fetch error:', profileError);
        return {
          success: false,
          error: profileError?.message || 'Profile not found',
        };
      }

      // Fetch check-ins count
      const { count: checkInsCount, error: checkInsError } = await supabase
        .from('check_ins')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (checkInsError) {
        console.warn('Check-ins count fetch error:', checkInsError);
      }

      // Fetch favorites count
      const { count: favoritesCount, error: favoritesError } = await supabase
        .from('favorites')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (favoritesError) {
        console.warn('Favorites count fetch error:', favoritesError);
      }

      // Fetch friends count (bidirectional)
      const { data: friendships, error: friendsError } = await supabase
        .from('friendships')
        .select('user_id_1, user_id_2', { count: 'exact', head: true })
        .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);

      if (friendsError) {
        console.warn('Friends count fetch error:', friendsError);
      }

      // Count followers (friend requests received and accepted)
      const { count: followerCount, error: followerError } = await supabase
        .from('friendships')
        .select('user_id_1, user_id_2', { count: 'exact', head: true })
        .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);

      if (followerError) {
        console.warn('Follower count fetch error:', followerError);
      }

      // Construct complete user profile
      const userProfile: UserProfile = {
        id: profileData.id,
        email: profileData.email || '',
        username: profileData.name || profileData.email?.split('@')[0] || 'User',
        profilePhotoUrl: profileData.avatar_url || null,
        aboutText: profileData.bio || '',
        followerCount: followerCount || 0,
        checkInsCount: checkInsCount || 0,
        favoritesCount: favoritesCount || 0,
        friendsCount: friendships?.length || 0,
        createdAt: profileData.created_at || new Date().toISOString(),
        updatedAt: profileData.updated_at || new Date().toISOString(),
      };

      return {
        success: true,
        profile: userProfile,
      };
    } catch (error) {
      console.error('Complete profile fetch error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch profile',
      };
    }
  }

  /**
   * Update user profile
   * 
   * @param userId - User ID
   * @param updates - Profile updates
   * @returns Updated profile
   */
  static async updateProfile(
    userId: string,
    updates: ProfileUpdate
  ): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Profile update error:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Profile update error:', error);
      return null;
    }
  }

  /**
   * Update user's about text
   * 
   * Enhanced error handling for:
   * - Validation errors (character limit)
   * - Network errors
   * - Database errors
   * 
   * @param userId - User ID
   * @param aboutText - New about text
   * @returns Success status with updated text
   * 
   * Validates: Requirements 2.4, 2.5, 6.7
   */
  static async updateAboutText(
    userId: string,
    aboutText: string
  ): Promise<UpdateAboutTextResponse> {
    try {
      // Validate text length (max 500 characters) (Requirement 6.7)
      if (aboutText.length > 500) {
        return {
          success: false,
          error: 'About text is too long (max 500 characters)',
        };
      }

      // Update profile with new about text (Requirement 2.4)
      const { data, error } = await supabase
        .from('profiles')
        .update({ bio: aboutText })
        .eq('id', userId)
        .select('bio')
        .single();

      if (error) {
        console.error('About text update error:', error);
        
        // Categorize database errors (Requirement 6.7)
        let errorMessage = error.message;
        
        // Network/connection errors
        if (errorMessage.toLowerCase().includes('network') || 
            errorMessage.toLowerCase().includes('connection') ||
            errorMessage.toLowerCase().includes('timeout')) {
          errorMessage = 'Failed to save. Check your connection.';
        }
        // Permission errors
        else if (errorMessage.toLowerCase().includes('permission') || 
                 errorMessage.toLowerCase().includes('unauthorized') ||
                 errorMessage.toLowerCase().includes('rls')) {
          errorMessage = 'Permission denied. Please try logging in again.';
        }
        // Server errors
        else if (errorMessage.toLowerCase().includes('500') || 
                 errorMessage.toLowerCase().includes('503')) {
          errorMessage = 'Save failed. Please try again later.';
        }
        // Row not found errors
        else if (errorMessage.toLowerCase().includes('not found') || 
                 errorMessage.toLowerCase().includes('no rows')) {
          errorMessage = 'Profile not found. Please try logging in again.';
        }
        
        return {
          success: false,
          error: errorMessage,
        };
      }

      // Return success with updated text (Requirement 2.5)
      return {
        success: true,
        aboutText: data.bio || '',
      };
    } catch (error) {
      console.error('About text update error:', error);
      
      // Handle network and unexpected errors (Requirement 6.7)
      let errorMessage = 'Failed to update about text';
      
      if (error instanceof Error) {
        // Network errors
        if (error.message.toLowerCase().includes('network') || 
            error.message.toLowerCase().includes('connection') ||
            error.message.toLowerCase().includes('timeout') ||
            error.message.toLowerCase().includes('fetch')) {
          errorMessage = 'Failed to save. Check your connection.';
        }
        // Generic error with message
        else if (error.message) {
          errorMessage = error.message;
        }
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Delete profile photo
   * 
   * @param userId - User ID
   * @param photoUrl - Current photo URL to delete
   * @returns Success status
   */
  static async deleteProfilePhoto(
    userId: string,
    photoUrl: string
  ): Promise<boolean> {
    try {
      // Extract file path from URL
      const urlParts = photoUrl.split('/');
      const filePath = `profile-photos/${urlParts[urlParts.length - 1]}`;

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([filePath]);

      if (deleteError) {
        console.error('Photo delete error:', deleteError);
        return false;
      }

      // Update profile to remove photo URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId);

      if (updateError) {
        console.error('Profile update error:', updateError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Photo delete error:', error);
      return false;
    }
  }
}
