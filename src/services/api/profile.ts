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
      console.log('🔍 ProfileService: Fetching profile for userId:', userId);
      
      // Fetch basic profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError || !profileData) {
        console.error('❌ ProfileService: Profile fetch error:', profileError);
        return {
          success: false,
          error: profileError?.message || 'Profile not found',
        };
      }

      console.log('✅ ProfileService: Profile data fetched:', {
        id: profileData.id,
        email: profileData.email,
        hasAvatar: !!profileData.avatar_url,
      });

      // Fetch check-ins count (with error handling)
      let checkInsCount = 0;
      try {
        const { count, error: checkInsError } = await supabase
          .from('check_ins')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId);

        if (checkInsError) {
          console.warn('⚠️ ProfileService: Check-ins count fetch error:', checkInsError.message);
        } else {
          checkInsCount = count || 0;
          console.log('📊 ProfileService: Check-ins count:', checkInsCount);
        }
      } catch (error) {
        console.warn('⚠️ ProfileService: Check-ins count exception:', error);
      }

      // Fetch unique venues count (with error handling)
      let uniqueVenuesCount = 0;
      try {
        const { data: venuesData, error: venuesError } = await supabase
          .from('check_ins')
          .select('venue_id')
          .eq('user_id', userId);

        if (venuesError) {
          console.warn('⚠️ ProfileService: Unique venues fetch error:', venuesError.message);
        } else if (venuesData) {
          const uniqueVenues = new Set(venuesData.map(item => item.venue_id));
          uniqueVenuesCount = uniqueVenues.size;
          console.log('📊 ProfileService: Unique venues count:', uniqueVenuesCount);
        }
      } catch (error) {
        console.warn('⚠️ ProfileService: Unique venues exception:', error);
      }

      // Fetch this month's check-ins count (with error handling)
      let monthlyCheckInsCount = 0;
      try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count, error: monthlyError } = await supabase
          .from('check_ins')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('checked_in_at', startOfMonth.toISOString());

        if (monthlyError) {
          console.warn('⚠️ ProfileService: Monthly check-ins fetch error:', monthlyError.message);
        } else {
          monthlyCheckInsCount = count || 0;
          console.log('📊 ProfileService: Monthly check-ins count:', monthlyCheckInsCount);
        }
      } catch (error) {
        console.warn('⚠️ ProfileService: Monthly check-ins exception:', error);
      }

      // Fetch favorites count (with error handling)
      let favoritesCount = 0;
      try {
        const { count, error: favoritesError } = await supabase
          .from('favorites')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId);

        if (favoritesError) {
          console.warn('⚠️ ProfileService: Favorites count fetch error:', favoritesError.message);
        } else {
          favoritesCount = count || 0;
          console.log('📊 ProfileService: Favorites count:', favoritesCount);
        }
      } catch (error) {
        console.warn('⚠️ ProfileService: Favorites count exception:', error);
      }

      // Fetch friends count (with error handling)
      let friendsCount = 0;
      try {
        const { data: friendships, error: friendsError } = await supabase
          .from('friendships')
          .select('user_id_1, user_id_2', { count: 'exact', head: false })
          .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);

        if (friendsError) {
          console.warn('⚠️ ProfileService: Friends count fetch error:', friendsError.message);
        } else {
          friendsCount = friendships?.length || 0;
          console.log('📊 ProfileService: Friends count:', friendsCount);
        }
      } catch (error) {
        console.warn('⚠️ ProfileService: Friends count exception:', error);
      }

      // Count followers (with error handling)
      let followerCount = 0;
      try {
        const { count, error: followerError } = await supabase
          .from('friendships')
          .select('user_id_1, user_id_2', { count: 'exact', head: true })
          .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);

        if (followerError) {
          console.warn('⚠️ ProfileService: Follower count fetch error:', followerError.message);
        } else {
          followerCount = count || 0;
          console.log('📊 ProfileService: Follower count:', followerCount);
        }
      } catch (error) {
        console.warn('⚠️ ProfileService: Follower count exception:', error);
      }

      // Fetch redeemed flash offers count (with error handling)
      let redeemedOffersCount = 0;
      try {
        const { count, error: redeemedError } = await supabase
          .from('flash_offer_claims')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('status', 'redeemed');

        if (redeemedError) {
          console.warn('⚠️ ProfileService: Redeemed offers fetch error:', redeemedError.message);
        } else {
          redeemedOffersCount = count || 0;
          console.log('📊 ProfileService: Redeemed offers count:', redeemedOffersCount);
        }
      } catch (error) {
        console.warn('⚠️ ProfileService: Redeemed offers exception:', error);
      }

      // Fetch total savings from redeemed offers (with error handling)
      let totalSavings = 0;
      let averageSavings = 0;
      let redeemedCount = 0;
      try {
        const { data: redeemedClaims, error: savingsError } = await supabase
          .from('flash_offer_claims')
          .select(`
            id,
            flash_offers!inner(claim_value)
          `)
          .eq('user_id', userId)
          .eq('status', 'redeemed');

        if (savingsError) {
          console.warn('⚠️ ProfileService: Total savings fetch error:', savingsError.message);
        } else if (redeemedClaims && redeemedClaims.length > 0) {
          redeemedCount = redeemedClaims.length;
          totalSavings = redeemedClaims.reduce((sum, claim: any) => {
            const offerValue = claim.flash_offers?.claim_value || 0;
            return sum + offerValue;
          }, 0);
          // Round to 2 decimal places
          totalSavings = Math.round(totalSavings * 100) / 100;
          // Calculate average
          averageSavings = Math.round((totalSavings / redeemedCount) * 100) / 100;
          console.log('📊 ProfileService: Total savings:', totalSavings, 'Average:', averageSavings);
        }
      } catch (error) {
        console.warn('⚠️ ProfileService: Total savings exception:', error);
      }

      // Fetch average rating given (with error handling)
      let averageRatingGiven = 0;
      try {
        const { data: ratingsData, error: ratingsError } = await supabase
          .from('reviews')
          .select('rating')
          .eq('user_id', userId);

        if (ratingsError) {
          console.warn('⚠️ ProfileService: Average rating fetch error:', ratingsError.message);
        } else if (ratingsData && ratingsData.length > 0) {
          const sum = ratingsData.reduce((acc, r) => acc + r.rating, 0);
          averageRatingGiven = Math.round((sum / ratingsData.length) * 10) / 10;
          console.log('📊 ProfileService: Average rating given:', averageRatingGiven);
        }
      } catch (error) {
        console.warn('⚠️ ProfileService: Average rating exception:', error);
      }

      // Fetch helpful votes received (with error handling)
      let helpfulVotesReceived = 0;
      try {
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select('id')
          .eq('user_id', userId);

        if (reviewsError) {
          console.warn('⚠️ ProfileService: Reviews fetch error:', reviewsError.message);
        } else if (reviewsData && reviewsData.length > 0) {
          const reviewIds = reviewsData.map(r => r.id);
          
          const { count, error: votesError } = await supabase
            .from('helpful_votes')
            .select('id', { count: 'exact', head: true })
            .in('review_id', reviewIds);

          if (votesError) {
            console.warn('⚠️ ProfileService: Helpful votes fetch error:', votesError.message);
          } else {
            helpfulVotesReceived = count || 0;
            console.log('📊 ProfileService: Helpful votes received:', helpfulVotesReceived);
          }
        }
      } catch (error) {
        console.warn('⚠️ ProfileService: Helpful votes exception:', error);
      }

      // Calculate streaks (with error handling)
      let currentStreak = 0;
      let longestStreak = 0;
      try {
        const { data: checkInsData, error: checkInsStreakError } = await supabase
          .from('check_ins')
          .select('checked_in_at')
          .eq('user_id', userId)
          .order('checked_in_at', { ascending: false });

        if (checkInsStreakError) {
          console.warn('⚠️ ProfileService: Check-ins streak fetch error:', checkInsStreakError.message);
        } else if (checkInsData && checkInsData.length > 0) {
          const streaks = this.calculateStreaks(checkInsData.map(c => c.checked_in_at));
          currentStreak = streaks.current;
          longestStreak = streaks.longest;
          console.log('📊 ProfileService: Current streak:', currentStreak, 'Longest:', longestStreak);
        }
      } catch (error) {
        console.warn('⚠️ ProfileService: Streaks calculation exception:', error);
      }

      // Fetch top venue (with error handling)
      let topVenue = null;
      try {
        const { data: venueCheckIns, error: topVenueError } = await supabase
          .from('check_ins')
          .select('venue_id, venues(id, name)')
          .eq('user_id', userId);

        if (topVenueError) {
          console.warn('⚠️ ProfileService: Top venue fetch error:', topVenueError.message);
        } else if (venueCheckIns && venueCheckIns.length > 0) {
          const venueCounts = new Map<string, { id: string; name: string; count: number }>();
          
          venueCheckIns.forEach(checkIn => {
            const venue = checkIn.venues as any;
            if (venue && venue.id) {
              const existing = venueCounts.get(venue.id);
              if (existing) {
                existing.count++;
              } else {
                venueCounts.set(venue.id, {
                  id: venue.id,
                  name: venue.name || 'Unknown Venue',
                  count: 1,
                });
              }
            }
          });

          if (venueCounts.size > 0) {
            const topEntry = Array.from(venueCounts.values()).sort((a, b) => b.count - a.count)[0];
            topVenue = {
              id: topEntry.id,
              name: topEntry.name,
              visitCount: topEntry.count,
            };
            console.log('📊 ProfileService: Top venue:', topVenue);
          }
        }
      } catch (error) {
        console.warn('⚠️ ProfileService: Top venue exception:', error);
      }

      // Calculate most active day and time (with error handling)
      let mostActiveDay = undefined;
      let mostActiveTime = undefined;
      try {
        const { data: checkInsTimeData, error: timeError } = await supabase
          .from('check_ins')
          .select('checked_in_at')
          .eq('user_id', userId);

        if (timeError) {
          console.warn('⚠️ ProfileService: Check-ins time fetch error:', timeError.message);
        } else if (checkInsTimeData && checkInsTimeData.length > 0) {
          const timeStats = this.calculateTimeStats(checkInsTimeData.map(c => c.checked_in_at));
          mostActiveDay = timeStats.day;
          mostActiveTime = timeStats.time;
          console.log('📊 ProfileService: Most active day:', mostActiveDay, 'time:', mostActiveTime);
        }
      } catch (error) {
        console.warn('⚠️ ProfileService: Time stats exception:', error);
      }

      // Construct complete user profile
      const userProfile: UserProfile = {
        id: profileData.id,
        email: profileData.email || '',
        username: profileData.username || profileData.name || profileData.email?.split('@')[0] || 'User',
        display_name: profileData.display_name || null,
        profilePhotoUrl: profileData.avatar_url || null,
        aboutText: profileData.bio || '',
        followerCount: followerCount,
        checkInsCount: checkInsCount,
        uniqueVenuesCount: uniqueVenuesCount,
        monthlyCheckInsCount: monthlyCheckInsCount,
        favoritesCount: favoritesCount,
        friendsCount: friendsCount,
        redeemedOffersCount: redeemedOffersCount,
        totalSavings: totalSavings,
        averageSavings: averageSavings,
        averageRatingGiven: averageRatingGiven,
        helpfulVotesReceived: helpfulVotesReceived,
        currentStreak: currentStreak,
        longestStreak: longestStreak,
        topVenue: topVenue,
        mostActiveDay: mostActiveDay,
        mostActiveTime: mostActiveTime,
        createdAt: profileData.created_at || new Date().toISOString(),
        updatedAt: profileData.updated_at || new Date().toISOString(),
      };

      console.log('✅ ProfileService: Complete profile constructed:', {
        username: userProfile.username,
        checkInsCount,
        uniqueVenuesCount,
        monthlyCheckInsCount,
        favoritesCount,
        friendsCount,
        redeemedOffersCount,
        totalSavings,
        averageRatingGiven,
        helpfulVotesReceived,
        currentStreak,
        longestStreak,
        topVenue: topVenue?.name,
        mostActiveDay,
        mostActiveTime,
      });

      return {
        success: true,
        profile: userProfile,
      };
    } catch (error) {
      console.error('❌ ProfileService: Complete profile fetch exception:', error);
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

  /**
   * Calculate current and longest streaks from check-in dates
   * 
   * @param checkInDates - Array of check-in timestamps (sorted descending)
   * @returns Object with current and longest streak counts
   */
  private static calculateStreaks(checkInDates: string[]): { current: number; longest: number } {
    if (checkInDates.length === 0) {
      return { current: 0, longest: 0 };
    }

    // Convert to dates and get unique days
    const uniqueDays = new Set<string>();
    checkInDates.forEach(dateStr => {
      const date = new Date(dateStr);
      const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      uniqueDays.add(dayKey);
    });

    // Sort unique days descending
    const sortedDays = Array.from(uniqueDays)
      .map(dayKey => {
        const [year, month, day] = dayKey.split('-').map(Number);
        return new Date(year, month, day);
      })
      .sort((a, b) => b.getTime() - a.getTime());

    if (sortedDays.length === 0) {
      return { current: 0, longest: 0 };
    }

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const mostRecentDay = sortedDays[0];
    mostRecentDay.setHours(0, 0, 0, 0);

    // Check if streak is still active (checked in today or yesterday)
    if (mostRecentDay.getTime() === today.getTime() || mostRecentDay.getTime() === yesterday.getTime()) {
      currentStreak = 1;
      let expectedDate = new Date(mostRecentDay);
      
      for (let i = 1; i < sortedDays.length; i++) {
        expectedDate.setDate(expectedDate.getDate() - 1);
        const checkDate = new Date(sortedDays[i]);
        checkDate.setHours(0, 0, 0, 0);
        
        if (checkDate.getTime() === expectedDate.getTime()) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    let longestStreak = 1;
    let tempStreak = 1;

    for (let i = 1; i < sortedDays.length; i++) {
      const prevDay = new Date(sortedDays[i - 1]);
      const currDay = new Date(sortedDays[i]);
      prevDay.setHours(0, 0, 0, 0);
      currDay.setHours(0, 0, 0, 0);

      const dayDiff = Math.floor((prevDay.getTime() - currDay.getTime()) / (1000 * 60 * 60 * 24));

      if (dayDiff === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    return { current: currentStreak, longest: longestStreak };
  }

  /**
   * Calculate most active day of week and time of day
   * 
   * @param checkInDates - Array of check-in timestamps
   * @returns Object with most active day and time period
   */
  private static calculateTimeStats(checkInDates: string[]): { day?: string; time?: string } {
    if (checkInDates.length === 0) {
      return {};
    }

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayCounts = new Map<string, number>();
    const timeCounts = {
      Morning: 0,   // 5am - 11am
      Afternoon: 0, // 11am - 5pm
      Evening: 0,   // 5pm - 9pm
      Night: 0,     // 9pm - 5am
    };

    checkInDates.forEach(dateStr => {
      const date = new Date(dateStr);
      
      // Count day of week
      const dayName = dayNames[date.getDay()];
      dayCounts.set(dayName, (dayCounts.get(dayName) || 0) + 1);

      // Count time of day
      const hour = date.getHours();
      if (hour >= 5 && hour < 11) {
        timeCounts.Morning++;
      } else if (hour >= 11 && hour < 17) {
        timeCounts.Afternoon++;
      } else if (hour >= 17 && hour < 21) {
        timeCounts.Evening++;
      } else {
        timeCounts.Night++;
      }
    });

    // Find most active day
    let mostActiveDay: string | undefined;
    let maxDayCount = 0;
    dayCounts.forEach((count, day) => {
      if (count > maxDayCount) {
        maxDayCount = count;
        mostActiveDay = day;
      }
    });

    // Find most active time
    let mostActiveTime: string | undefined;
    let maxTimeCount = 0;
    Object.entries(timeCounts).forEach(([time, count]) => {
      if (count > maxTimeCount) {
        maxTimeCount = count;
        mostActiveTime = time;
      }
    });

    return { day: mostActiveDay, time: mostActiveTime };
  }
}
