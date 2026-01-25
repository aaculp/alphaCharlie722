import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { CheckInService } from '../../services/api/checkins';
import { ReviewService } from '../../services/api/reviews';
import { useCheckInMutation, useCheckOutMutation } from '../../hooks/mutations';
import CheckInModal from './CheckInModal';
import ReviewPromptModal from '../venue/ReviewPromptModal';
import ReviewSubmissionModal from '../venue/ReviewSubmissionModal';

interface CheckInButtonProps {
  venueId: string;
  venueName: string;
  venueImage?: string;
  isCheckedIn: boolean;
  checkInId?: string;
  checkInTime?: string; // ISO string of when user checked in
  activeCheckIns: number;
  maxCapacity?: number; // Keep this for passing to modal
  onCheckInChange: (isCheckedIn: boolean, newCount: number) => void;
  size?: 'small' | 'medium' | 'large';
  showModalForCheckout?: boolean; // Option to show modal for checkout
}

const CheckInButton: React.FC<CheckInButtonProps> = ({
  venueId,
  venueName,
  venueImage,
  isCheckedIn,
  checkInId,
  checkInTime,
  activeCheckIns,
  maxCapacity,
  onCheckInChange,
  size = 'medium',
  showModalForCheckout = false
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'checkin' | 'checkout'>('checkin');
  const [currentVenue, setCurrentVenue] = useState<string | undefined>();
  
  // Review prompt state
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);
  const [showFullReviewModal, setShowFullReviewModal] = useState(false);
  const [hasShownReviewPrompt, setHasShownReviewPrompt] = useState(false);

  // React Query mutations
  const checkInMutation = useCheckInMutation({
    onSuccess: () => {
      onCheckInChange(true, activeCheckIns + 1);
      setShowModal(false);
    },
    onError: (error) => {
      console.error('Error checking in:', error);
      Alert.alert('Error', `Failed to check into ${venueName}. Please try again.`);
    }
  });

  const checkOutMutation = useCheckOutMutation({
    onSuccess: async () => {
      onCheckInChange(false, Math.max(0, activeCheckIns - 1));
      setShowModal(false);
      
      // Show review prompt after checkout
      if (!hasShownReviewPrompt) {
        await checkAndShowReviewPrompt();
      }
    },
    onError: (error) => {
      console.error('Error checking out:', error);
      Alert.alert('Error', `Failed to check out of ${venueName}. Please try again.`);
    }
  });

  const sizeConfig = {
    small: {
      padding: { paddingHorizontal: 12, paddingVertical: 6 },
      iconSize: 14,
      textSize: 12,
      borderRadius: 18,
      minHeight: 44, // Requirement 10.5: Minimum touch target
      minWidth: 44,  // Requirement 10.5: Minimum touch target
    },
    medium: {
      padding: { paddingHorizontal: 14, paddingVertical: 7 },
      iconSize: 16,
      textSize: 13,
      borderRadius: 20,
      minHeight: 44, // Requirement 10.5: Minimum touch target
      minWidth: 44,  // Requirement 10.5: Minimum touch target
    },
    large: {
      padding: { paddingHorizontal: 16, paddingVertical: 8 },
      iconSize: 18,
      textSize: 14,
      borderRadius: 22,
      minHeight: 44, // Requirement 10.5: Minimum touch target
      minWidth: 44,  // Requirement 10.5: Minimum touch target
    },
  };

  const config = sizeConfig[size];

  const getCheckInDuration = (): string | undefined => {
    if (!checkInTime) return undefined;
    
    const checkInDate = new Date(checkInTime);
    const now = new Date();
    const diffMs = now.getTime() - checkInDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    
    if (diffHours >= 1) {
      const remainingMinutes = diffMinutes % 60;
      if (remainingMinutes === 0) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
      }
      return `${diffHours}h ${remainingMinutes}m`;
    } else if (diffMinutes >= 1) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    } else {
      return 'just now';
    }
  };

  const handleCheckInToggle = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to check into venues.');
      return;
    }

    const isLoading = checkInMutation.isPending || checkOutMutation.isPending;
    if (isLoading || showModal) return; // Prevent multiple operations

    if (isCheckedIn && checkInId) {
      // Check out - show modal if requested, otherwise direct checkout
      if (showModalForCheckout) {
        setModalMode('checkout');
        setShowModal(true);
      } else {
        await performCheckOut();
      }
    } else {
      // Check in - always show modal
      await checkForCurrentVenue();
      setModalMode('checkin');
      setShowModal(true);
    }
  };

  const checkForCurrentVenue = async () => {
    if (!user) return;
    
    try {
      const currentCheckInData = await CheckInService.getUserCurrentCheckInWithVenue(user.id);
      if (currentCheckInData && currentCheckInData.checkIn.venue_id !== venueId) {
        // User has an active check-in at a DIFFERENT venue
        setCurrentVenue(currentCheckInData.venueName);
      } else {
        // User is either not checked in anywhere, or already checked into this venue
        setCurrentVenue(undefined);
      }
    } catch (error) {
      console.error('Error checking current venue:', error);
      setCurrentVenue(undefined);
    }
  };

  const performCheckIn = async () => {
    if (!user) return;

    checkInMutation.mutate({
      venueId,
      userId: user.id,
    });
  };

  const performCheckOut = async () => {
    if (!user || !checkInId) return;

    checkOutMutation.mutate({
      checkInId,
      userId: user.id,
      venueId,
    });
  };

  /**
   * Check if user has already reviewed venue and show prompt if not
   * Requirements:
   * - 2.1: Show ReviewPromptModal after check-out
   * - 2.7: Show only once per check-out
   * - 2.8: Only show if user hasn't reviewed venue
   */
  const checkAndShowReviewPrompt = async () => {
    if (!user?.id) return;

    try {
      // Check if user has already reviewed this venue
      const existingReview = await ReviewService.getUserReviewForVenue(user.id, venueId);
      
      // Requirement 2.8: Only show if user hasn't reviewed venue
      if (!existingReview) {
        // Requirement 2.7: Show only once per check-out
        setHasShownReviewPrompt(true);
        setShowReviewPrompt(true);
      }
    } catch (error) {
      console.error('Error checking review status:', error);
      // Don't show prompt if there's an error
    }
  };

  /**
   * Handle quick rating submission from review prompt
   */
  const handleQuickRating = (rating: number, vibe?: string) => {
    console.log('Quick rating submitted:', rating, vibe);
    setShowReviewPrompt(false);
    // Refresh parent component to show updated review
    onCheckInChange(false, activeCheckIns);
  };

  /**
   * Handle "Add written review" button from review prompt
   * Requirements 2.4, 2.5: Open full review modal
   */
  const handleOpenFullReview = () => {
    setShowReviewPrompt(false);
    setShowFullReviewModal(true);
  };

  /**
   * Handle full review submission success
   */
  const handleFullReviewSuccess = () => {
    setShowFullReviewModal(false);
    // Refresh parent component to show updated review
    onCheckInChange(false, activeCheckIns);
  };

  const getButtonStyle = () => {
    if (isCheckedIn) {
      return {
        backgroundColor: '#FF6B6B' + '40', // Red for leaving
        borderColor: '#FF6B6B' + '60',
        color: 'white'
      };
    } else {
      return {
        backgroundColor: '#10B981' + '20', // Green background like activity chip
        borderColor: '#10B981' + '40',
        color: '#10B981' // Green text
      };
    }
  };

  const buttonStyle = getButtonStyle();
  const isLoading = checkInMutation.isPending || checkOutMutation.isPending;

  return (
    <>
      <TouchableOpacity
        style={[
          styles.checkInButton,
          config.padding,
          {
            backgroundColor: buttonStyle.backgroundColor,
            borderColor: buttonStyle.borderColor,
            borderRadius: config.borderRadius,
            opacity: (isLoading || showModal) ? 0.6 : 1,
            minHeight: config.minHeight, // Requirement 10.5: Minimum touch target
            minWidth: config.minWidth,   // Requirement 10.5: Minimum touch target
            justifyContent: 'center',
            alignItems: 'center',
          }
        ]}
        onPress={handleCheckInToggle}
        disabled={isLoading || showModal}
        activeOpacity={0.7}
        // Requirement 10.5: Accessibility for touch targets
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={isCheckedIn ? `Check out from ${venueName}` : `Check in to ${venueName}`}
        accessibilityState={{ disabled: isLoading || showModal }}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={buttonStyle.color} />
        ) : (
          <View style={styles.buttonContent}>
            <Icon
              name={isCheckedIn ? 'log-out-outline' : 'location-outline'}
              size={config.iconSize}
              color={buttonStyle.color}
            />
            <Text style={[
              styles.buttonText,
              { 
                color: buttonStyle.color,
                fontSize: config.textSize,
              }
            ]}>
              {isCheckedIn ? 'Leave' : 'Arrived'}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <CheckInModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={modalMode === 'checkin' ? performCheckIn : performCheckOut}
        venueName={venueName}
        venueImage={venueImage}
        currentVenue={modalMode === 'checkin' ? currentVenue : undefined}
        activeCheckIns={activeCheckIns}
        maxCapacity={maxCapacity}
        loading={isLoading}
        mode={modalMode}
        checkInDuration={modalMode === 'checkout' ? getCheckInDuration() : undefined}
      />

      {/* Review Prompt Modal - shown after checkout */}
      <ReviewPromptModal
        visible={showReviewPrompt}
        onClose={() => setShowReviewPrompt(false)}
        venueId={venueId}
        venueName={venueName}
        onQuickRating={handleQuickRating}
        onFullReview={handleOpenFullReview}
      />

      {/* Full Review Submission Modal */}
      <ReviewSubmissionModal
        visible={showFullReviewModal}
        onClose={() => setShowFullReviewModal(false)}
        venueId={venueId}
        venueName={venueName}
        onSubmitSuccess={handleFullReviewSuccess}
      />
    </>
  );
};

const styles = StyleSheet.create({
  checkInButton: {
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  buttonText: {
    fontFamily: 'Inter-SemiBold',
    fontWeight: '600',
    lineHeight: 14,
  },
});

export default CheckInButton;