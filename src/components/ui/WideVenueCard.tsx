import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  AccessibilityInfo,
} from 'react-native';
import Animated, { SharedValue } from 'react-native-reanimated';
import { GestureDetector } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { VenueCustomerCountChip, VenueEngagementChip } from '../ui';
import { CheckInButton, CheckInModal } from '../checkin';
import { AggregateRatingDisplay } from '../venue';
import { useEngagementColor } from '../../hooks/useEngagementColor';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { CheckInService } from '../../services/api/checkins';
import SwipeActionBackground from './SwipeActionBackground';
import type { Venue } from '../../types';

/**
 * Props for the WideVenueCard component
 */
interface WideVenueCardProps {
  /** Venue data object containing name, location, rating, etc. */
  venue: Venue;
  
  /** Current number of people checked in to this venue */
  checkInCount: number;
  
  /** Callback triggered when the card is tapped (for navigation to detail screen) */
  onPress?: () => void;
  
  /** Visual variant for the customer count chip (default: 'traffic') */
  customerCountVariant?: 'themed' | 'traffic' | 'primary' | 'success' | 'warning' | 'error';
  
  /** Visual variant for the engagement chip (default: 'traffic') */
  engagementChipVariant?: 'themed' | 'colored' | 'traffic' | 'primary' | 'success' | 'warning' | 'error';
  
  /** Optional distance display text (e.g., "1.2 km") */
  distance?: string;
  
  /** Callback triggered when check-in state changes (isCheckedIn, newCount) */
  onCheckInChange?: (isCheckedIn: boolean, newCount: number) => void;
  
  /** User's check-in ID if currently checked in to this venue */
  userCheckInId?: string;
  
  /** Timestamp of when user checked in (ISO string) */
  userCheckInTime?: string;
  
  /** Whether the user is currently checked in to this venue */
  isUserCheckedIn?: boolean;
  
  /** Enable swipe gesture functionality (default: true) */
  enableSwipe?: boolean;
  
  /** Minimum swipe distance in pixels to trigger action (default: 120) */
  swipeThreshold?: number;
  
  /** Async callback for swipe left (check-in) action */
  onSwipeCheckIn?: () => Promise<void>;
  
  /** Async callback for swipe right (check-out) action */
  onSwipeCheckOut?: () => Promise<void>;
  
  /** Shared value to control parent ScrollView scrolling during swipe gestures */
  scrollEnabled?: SharedValue<boolean>;
}

/**
 * WideVenueCard Component
 * 
 * A horizontal venue card component with swipe gesture support for quick check-in/check-out actions.
 * Displays venue information, engagement metrics, and provides both button and swipe interactions.
 * 
 * **Features:**
 * - Swipe right to check in (green background with "Arriving" label)
 * - Swipe left to check out (red background with "Leaving" label)
 * - Visual feedback with animated backgrounds and haptic responses
 * - State-aware gestures (only valid swipes are allowed based on check-in status)
 * - Accessibility support with screen reader announcements
 * - Error handling with user-friendly messages
 * - Multi-venue check-in confirmation modal
 * 
 * **Swipe Gesture Behavior:**
 * - Threshold: 120px horizontal drag distance to trigger action
 * - Resistance: Invalid swipe directions provide 0.3x resistance
 * - Snap-back: Card returns to center if released before threshold
 * - Conflict resolution: Horizontal swipes disable vertical scrolling
 * 
 * **Requirements Satisfied:**
 * - Requirement 1: Component refactoring (renamed from TestVenueCard)
 * - Requirement 2: Swipe gesture detection with threshold
 * - Requirement 3: Swipe right to check in with green background
 * - Requirement 4: Swipe left to check out with red background
 * - Requirement 5: Visual feedback during swipe
 * - Requirement 6: Dual interaction methods (button + swipe)
 * - Requirement 7: Check-in state awareness
 * - Requirement 9: Error handling with visual feedback
 * - Requirement 10: Accessibility labels and announcements
 * - Requirement 11: Integration with existing features
 * - Requirement 12: Gesture conflict resolution
 * 
 * @example
 * ```tsx
 * // Basic usage with swipe enabled
 * <WideVenueCard
 *   venue={venueData}
 *   checkInCount={15}
 *   isUserCheckedIn={false}
 *   onPress={() => navigation.navigate('VenueDetail', { venueId: venue.id })}
 *   onCheckInChange={(isCheckedIn, newCount) => {
 *     console.log(`Check-in status: ${isCheckedIn}, Count: ${newCount}`);
 *   }}
 *   onSwipeCheckIn={async () => {
 *     await checkInToVenue(venue.id);
 *   }}
 *   onSwipeCheckOut={async () => {
 *     await checkOutFromVenue(venue.id);
 *   }}
 * />
 * 
 * // Usage without swipe gestures
 * <WideVenueCard
 *   venue={venueData}
 *   checkInCount={15}
 *   enableSwipe={false}
 *   onPress={() => navigation.navigate('VenueDetail')}
 * />
 * 
 * // Usage with custom threshold and scroll control
 * const scrollEnabled = useSharedValue(true);
 * <WideVenueCard
 *   venue={venueData}
 *   checkInCount={15}
 *   swipeThreshold={150}
 *   scrollEnabled={scrollEnabled}
 *   onSwipeCheckIn={handleCheckIn}
 *   onSwipeCheckOut={handleCheckOut}
 * />
 * ```
 * 
 * @param props - Component props (see WideVenueCardProps interface)
 * @returns Rendered venue card with optional swipe gesture support
 */
const WideVenueCard: React.FC<WideVenueCardProps> = ({
  venue,
  checkInCount,
  onPress,
  customerCountVariant = 'traffic',
  engagementChipVariant = 'traffic',
  distance,
  onCheckInChange,
  userCheckInId,
  userCheckInTime,
  isUserCheckedIn = false,
  enableSwipe = true,
  swipeThreshold = 120,
  onSwipeCheckIn,
  onSwipeCheckOut,
  scrollEnabled,
}) => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [localCheckInCount, setLocalCheckInCount] = useState(checkInCount);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentVenue, setCurrentVenue] = useState<string | undefined>();
  const [pendingCheckIn, setPendingCheckIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Requirement 9.4: Loading state for visual atomicity
  
  // IMPORTANT: Call hooks unconditionally at the top level
  const engagementColor = useEngagementColor(localCheckInCount, venue.max_capacity || 100);
  const { triggerSuccess, triggerError } = useHapticFeedback();

  // Sync local state with prop changes
  useEffect(() => {
    setLocalCheckInCount(checkInCount);
  }, [checkInCount]);

  const handleCheckInChange = (isCheckedIn: boolean, newCount: number) => {
    // Update local count for immediate UI feedback
    setLocalCheckInCount(newCount);
    
    // Call parent callback if provided
    if (onCheckInChange) {
      onCheckInChange(isCheckedIn, newCount);
    }
  };

  // Check if user is checked in elsewhere
  const checkForCurrentVenue = async () => {
    if (!user) return;
    
    try {
      const currentCheckInData = await CheckInService.getUserCurrentCheckInWithVenue(user.id);
      if (currentCheckInData && currentCheckInData.checkIn.venue_id !== venue.id) {
        // User has an active check-in at a DIFFERENT venue
        setCurrentVenue(currentCheckInData.venueName);
        return true; // User is checked in elsewhere
      } else {
        // User is either not checked in anywhere, or already checked into this venue
        setCurrentVenue(undefined);
        return false; // User is not checked in elsewhere
      }
    } catch (error) {
      console.error('Error checking current venue:', error);
      setCurrentVenue(undefined);
      return false;
    }
  };

  // Swipe gesture handlers (Subtask 6.3 & 7.2 & 9.1 & 12.1)
  const handleSwipeCheckIn = async () => {
    try {
      setError(null);
      setIsLoading(true); // Requirement 9.4: Set loading state
      
      // Check if user is checked in elsewhere (Requirement 7.4)
      const isCheckedInElsewhere = await checkForCurrentVenue();
      
      if (isCheckedInElsewhere) {
        // Show confirmation modal
        setPendingCheckIn(true);
        setShowModal(true);
        setIsLoading(false);
        return; // Don't proceed with check-in yet
      }
      
      // User is not checked in elsewhere, proceed with check-in
      if (onSwipeCheckIn) {
        await onSwipeCheckIn();
        // Requirement 9.4: Only update visual state after successful response
        // The parent component will update isUserCheckedIn prop after success
        triggerSuccess();
        
        // Requirement 10.3: Announce check-in to screen readers
        AccessibilityInfo.announceForAccessibility(`Checked in to ${venue.name}`);
        
        // Requirement 11.3: Call onCheckInChange callback after successful check-in
        // Update local count optimistically (will be corrected by parent refetch)
        const newCount = localCheckInCount + 1;
        setLocalCheckInCount(newCount);
        if (onCheckInChange) {
          onCheckInChange(true, newCount);
        }
      }
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false); // Clear loading state on error
      // Requirement 9.1, 9.2, 9.3: Comprehensive error handling
      let errorMessage = 'Failed to check in';
      
      if (err instanceof Error) {
        // Check for specific error types
        if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = 'No connection. Please try again.';
        } else if (err.message.includes('capacity')) {
          errorMessage = 'Venue is at full capacity';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      triggerError(); // Requirement 9.3: Trigger error haptic feedback
      
      // Requirement 10.3: Announce error to screen readers
      AccessibilityInfo.announceForAccessibility(`Check in failed. ${errorMessage}`);
      
      throw err; // Re-throw to let useSwipeGesture animate card back to center
    }
  };

  const handleSwipeCheckOut = async () => {
    try {
      setError(null);
      setIsLoading(true); // Requirement 9.4: Set loading state
      
      if (onSwipeCheckOut) {
        await onSwipeCheckOut();
        // Requirement 9.4: Only update visual state after successful response
        // The parent component will update isUserCheckedIn prop after success
        triggerSuccess();
        
        // Requirement 10.3: Announce check-out to screen readers
        AccessibilityInfo.announceForAccessibility(`Checked out from ${venue.name}`);
        
        // Requirement 11.3: Call onCheckInChange callback after successful check-out
        // Update local count optimistically (will be corrected by parent refetch)
        const newCount = Math.max(0, localCheckInCount - 1);
        setLocalCheckInCount(newCount);
        if (onCheckInChange) {
          onCheckInChange(false, newCount);
        }
      }
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false); // Clear loading state on error
      // Requirement 9.1, 9.2, 9.3: Comprehensive error handling
      let errorMessage = 'Failed to check out';
      
      if (err instanceof Error) {
        // Check for specific error types
        if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = 'No connection. Please try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      triggerError(); // Requirement 9.3: Trigger error haptic feedback
      
      // Requirement 10.3: Announce error to screen readers
      AccessibilityInfo.announceForAccessibility(`Check out failed. ${errorMessage}`);
      
      throw err; // Re-throw to let useSwipeGesture animate card back to center
    }
  };

  // Handle modal confirmation for multi-venue check-in
  const handleModalConfirm = async () => {
    try {
      setError(null);
      setIsLoading(true); // Requirement 9.4: Set loading state
      
      if (onSwipeCheckIn) {
        await onSwipeCheckIn();
        // Requirement 9.4: Only update visual state after successful response
        triggerSuccess();
        
        // Requirement 10.3: Announce check-in to screen readers
        AccessibilityInfo.announceForAccessibility(`Checked in to ${venue.name}`);
        
        // Requirement 11.3: Call onCheckInChange callback after successful check-in
        const newCount = localCheckInCount + 1;
        setLocalCheckInCount(newCount);
        if (onCheckInChange) {
          onCheckInChange(true, newCount);
        }
      }
      setIsLoading(false);
      setShowModal(false);
      setPendingCheckIn(false);
      setCurrentVenue(undefined);
    } catch (err) {
      setIsLoading(false); // Clear loading state on error
      // Requirement 9.1, 9.2, 9.3: Comprehensive error handling
      let errorMessage = 'Failed to check in';
      
      if (err instanceof Error) {
        if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = 'No connection. Please try again.';
        } else if (err.message.includes('capacity')) {
          errorMessage = 'Venue is at full capacity';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      triggerError();
      
      // Requirement 10.3: Announce error to screen readers
      AccessibilityInfo.announceForAccessibility(`Check in failed. ${errorMessage}`);
      
      setShowModal(false);
      setPendingCheckIn(false);
    }
  };

  // Handle modal cancellation
  const handleModalCancel = () => {
    setShowModal(false);
    setPendingCheckIn(false);
    setCurrentVenue(undefined);
  };

  const handleSwipeError = (err: Error) => {
    setError(err.message);
    triggerError();
  };

  // Initialize swipe gesture hook
  const {
    panGesture,
    translateX,
    leftActionOpacity,
    rightActionOpacity,
    animatedCardStyle,
  } = useSwipeGesture({
    threshold: swipeThreshold,
    isCheckedIn: isUserCheckedIn,
    onCheckIn: handleSwipeCheckIn,
    onCheckOut: handleSwipeCheckOut,
    onError: handleSwipeError,
    scrollEnabled, // Pass scrollEnabled shared value to hook
    enabled: !isLoading, // Requirement 9.4: Disable gesture while loading
  });

  // Generate accessibility label based on current state (Requirement 10.2)
  const getAccessibilityLabel = () => {
    const rating = venue.aggregate_rating || 0;
    const reviewCount = venue.review_count || 0;
    const ratingText = reviewCount > 0 
      ? `Rating ${rating.toFixed(1)} stars with ${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'}`
      : 'No reviews yet';
    
    const baseLabel = `${venue.name}, ${venue.location}. ${ratingText}. ${localCheckInCount} people currently here.`;
    
    if (enableSwipe) {
      if (isUserCheckedIn) {
        return `${baseLabel} You are checked in. Swipe left to check out, or use the check out button.`;
      } else {
        return `${baseLabel} Swipe right to check in, or use the check in button.`;
      }
    }
    
    return baseLabel;
  };

  // Generate accessibility hint based on current state (Requirement 10.2)
  const getAccessibilityHint = () => {
    if (isUserCheckedIn) {
      return 'Double tap to view details. Swipe left to check out.';
    } else {
      return 'Double tap to view details. Swipe right to check in.';
    }
  };

  // Card content component
  const cardContent = (
    <TouchableOpacity
      style={[
        styles.cardContainer,
        {
          borderColor: engagementColor.borderColor,
          borderWidth: 2,
        }
      ]}
      onPress={onPress}
      activeOpacity={0.9}
      disabled={isLoading} // Requirement 9.4: Disable touch during loading
      // Requirement 10.2: Accessibility labels
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={getAccessibilityLabel()}
      accessibilityHint={getAccessibilityHint()}
      accessibilityState={{
        disabled: isLoading,
        selected: isUserCheckedIn,
      }}
    >
      {/* Background Image */}
      <Image
        source={{
          uri: venue.image_url || 'https://via.placeholder.com/400x300'
        }}
        style={styles.backgroundImage}
      />

      {/* Loading Overlay - Requirement 9.4 */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingSpinner}>
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        </View>
      )}

      {/* Glassmorphism Content Wrapper at Bottom */}
      <View style={[
        styles.contentWrapper,
        {
          backgroundColor: isDark
            ? 'rgba(20, 20, 20, 0.8)'
            : '#F5F5F5', // Solid color for light theme
          borderColor: engagementColor.borderColor,
          borderWidth: 2,
        }
      ]}>
        <View style={styles.contentRow}>
          {/* Left Side - Venue Info */}
          <View style={styles.leftContent}>
            <Text style={[styles.venueName, { color: isDark ? 'white' : '#000000' }]} numberOfLines={1}>
              {venue.name}
            </Text>
            <View style={styles.locationRow}>
              <Icon name="location-outline" size={14} color={isDark ? 'rgba(255, 255, 255, 0.7)' : '#4A4A4A'} />
              <Text style={[styles.venueLocation, { color: isDark ? 'rgba(255, 255, 255, 0.7)' : '#4A4A4A' }]} numberOfLines={1}>
                {venue.location}
              </Text>
              {distance && (
                <View style={styles.distanceBadge}>
                  <Text style={styles.distanceText}>{distance}</Text>
                </View>
              )}
            </View>
            
            {/* Aggregate Rating Display - Requirements 7.1, 7.4 */}
            <View style={styles.ratingRow}>
              <AggregateRatingDisplay
                rating={venue.aggregate_rating || 0}
                reviewCount={venue.review_count || 0}
                size="small"
                showCount={true}
              />
            </View>
            
            {/* Check-In Button */}
            {onCheckInChange && (
              <View style={styles.checkInButtonInline}>
                <CheckInButton
                  venueId={venue.id}
                  venueName={venue.name}
                  venueImage={venue.image_url || undefined}
                  isCheckedIn={isUserCheckedIn}
                  checkInId={userCheckInId}
                  checkInTime={userCheckInTime}
                  activeCheckIns={localCheckInCount}
                  maxCapacity={venue.max_capacity || undefined}
                  onCheckInChange={handleCheckInChange}
                  size="medium"
                  showModalForCheckout={true}
                />
              </View>
            )}
          </View>

          {/* Right Side - Engagement Elements */}
          <View style={styles.rightContent}>
            <VenueCustomerCountChip
              count={localCheckInCount}
              maxCapacity={venue.max_capacity || 100}
              size="small"
              variant={customerCountVariant}
            />
            
            <VenueEngagementChip
              currentCheckIns={localCheckInCount}
              maxCapacity={venue.max_capacity || 100}
              size="small"
              variant={engagementChipVariant}
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // If swipe is disabled, return card without gesture wrapper
  if (!enableSwipe) {
    return cardContent;
  }

  // Return card with swipe gesture support (Subtask 6.1 & 6.2)
  return (
    <View style={styles.swipeContainer}>
      {/* Swipe Action Backgrounds - Positioned behind the card */}
      <View style={styles.backgroundsContainer}>
        {/* Left Swipe Action Background (Green - Check In / Arriving) */}
        <SwipeActionBackground
          direction="left"
          opacity={leftActionOpacity}
          translateX={translateX}
          icon="checkmark-circle"
          label="Arriving"
          backgroundColor="#10B981"
        />
        
        {/* Right Swipe Action Background (Red - Check Out / Leaving) */}
        <SwipeActionBackground
          direction="right"
          opacity={rightActionOpacity}
          translateX={translateX}
          icon="log-out-outline"
          label="Leaving"
          backgroundColor="#EF4444"
        />
      </View>
      
      {/* Animated Card with Gesture */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.animatedCardWrapper, animatedCardStyle]}>
          {/* Card Content */}
          {cardContent}
        </Animated.View>
      </GestureDetector>
      
      {/* Error Message Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      {/* Multi-venue Check-in Confirmation Modal (Subtask 7.2) */}
      <CheckInModal
        visible={showModal}
        onClose={handleModalCancel}
        onConfirm={handleModalConfirm}
        venueName={venue.name}
        venueImage={venue.image_url || undefined}
        currentVenue={currentVenue}
        activeCheckIns={localCheckInCount}
        maxCapacity={venue.max_capacity || undefined}
        loading={pendingCheckIn}
        mode="checkin"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  swipeContainer: {
    width: '100%',
    height: 280, // Match card height
    marginBottom: 16,
    position: 'relative', // Ensure relative positioning for absolute children
  },
  backgroundsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0, // Behind the card
    borderRadius: 16, // Match card border radius
    overflow: 'hidden', // Clip backgrounds to rounded corners
  },
  animatedCardWrapper: {
    width: '100%',
    height: '100%', // Fill the container
    zIndex: 1, // Above the backgrounds
  },
  cardContainer: {
    width: '100%',
    height: 280, // Requirement 10.5: Card height (280pt) exceeds minimum 44pt touch target
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  contentWrapper: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    ...Platform.select({
      ios: {
        backdropFilter: 'blur(20px)',
      },
    }),
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftContent: {
    flex: 1,
    marginRight: 12,
  },
  rightContent: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    height: '100%',
    gap: 8,
  },
  venueName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  venueLocation: {
    fontSize: 13,
    marginLeft: 4,
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  distanceBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 8,
  },
  distanceText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  checkInButtonInline: {
    marginTop: 8,
  },
  errorContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingSpinner: {
    backgroundColor: '#F5F5F5', // Solid color for light theme
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  loadingText: {
    color: '#000',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
});

export default WideVenueCard;
