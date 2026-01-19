/**
 * ReviewPromptModal Component
 * 
 * Quick review prompt modal shown after check-out.
 * 
 * Requirements:
 * - 2.2: Optional vibe selection chips (Low-key, Vibey, Poppin, Lit, Maxed)
 * - 2.3: Compact 5-star selector with auto-submit
 * - 2.4, 2.5: "Add written review" button to open full modal
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { ReviewService } from '../../services/api/reviews';
import { ACTIVITY_COLORS } from '../../utils/constants';
import type { ActivityLevel } from '../../utils/formatting/activity';

interface ReviewPromptModalProps {
  visible: boolean;
  onClose: () => void;
  venueId: string;
  venueName: string;
  onQuickRating: (rating: number, vibe?: ActivityLevel['level']) => void;
  onFullReview: () => void;
}

/**
 * ReviewPromptModal Component
 * 
 * Provides a quick review prompt after check-out with optional vibe selection
 * and compact star rating. Users can submit a quick rating or open the full
 * review modal for detailed feedback.
 */
const ReviewPromptModal: React.FC<ReviewPromptModalProps> = ({
  visible,
  onClose,
  venueId,
  venueName,
  onQuickRating,
  onFullReview,
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();

  // State
  const [selectedVibe, setSelectedVibe] = useState<ActivityLevel['level'] | undefined>();
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedVibe(undefined);
      setSelectedRating(0);
      setLoading(false);
    }
  }, [visible]);

  /**
   * Vibe options with colors and emojis
   * Requirement 2.2: Display Low-key, Vibey, Poppin, Lit, Maxed chips
   * Reuses existing ActivityLevel system from src/utils/formatting/activity.ts
   */
  const vibeOptions: Array<{
    level: ActivityLevel['level'];
    emoji: string;
    color: string;
  }> = [
    { level: 'Low-key', emoji: '😌', color: ACTIVITY_COLORS.LOW_KEY },
    { level: 'Vibey', emoji: '✨', color: ACTIVITY_COLORS.VIBEY },
    { level: 'Poppin', emoji: '🎉', color: ACTIVITY_COLORS.POPPIN },
    { level: 'Lit', emoji: '🔥', color: ACTIVITY_COLORS.LIT },
    { level: 'Maxed', emoji: '⛔', color: ACTIVITY_COLORS.MAXED },
  ];

  /**
   * Handle vibe selection
   * Requirement 2.2: Make selection optional (can skip)
   */
  const handleVibeSelect = (vibe: ActivityLevel['level']) => {
    setSelectedVibe(selectedVibe === vibe ? undefined : vibe);
  };

  /**
   * Handle star rating selection
   * Requirement 2.3: Auto-submit on star selection
   * Requirement 2.3: Include optional vibe in submission
   */
  const handleRatingSelect = async (rating: number) => {
    try {
      if (!user?.id) {
        Alert.alert('Authentication Required', 'You must be signed in to submit a review.');
        return;
      }

      setSelectedRating(rating);
      setLoading(true);

      // Submit quick rating (vibe is optional)
      await ReviewService.submitReview({
        venueId,
        userId: user.id,
        rating,
        // Note: Backend doesn't currently support vibe storage
        // When backend support is added, include: vibe: selectedVibe
      });

      // Call success callback
      onQuickRating(rating, selectedVibe);

      // Show success message
      Alert.alert(
        'Thank you!',
        'Your rating has been submitted.',
        [
          {
            text: 'OK',
            onPress: onClose,
          },
        ]
      );
    } catch (error: any) {
      console.error('Error submitting quick rating:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to submit rating. Please try again.',
        [{ text: 'OK' }]
      );
      setSelectedRating(0);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle "Add written review" button
   * Requirements 2.4, 2.5: Open full ReviewSubmissionModal with selected rating and vibe
   */
  const handleAddWrittenReview = () => {
    onFullReview();
  };

  /**
   * Render vibe selection chips
   * Requirement 2.2: Display Low-key, Vibey, Poppin, Lit, Maxed chips
   */
  const renderVibeChips = () => {
    return (
      <View style={styles.vibeSection}>
        <Text style={[styles.vibeLabel, { color: theme.colors.textSecondary }]}>
          How was the vibe? (Optional)
        </Text>
        <View style={styles.vibeChipsContainer}>
          {vibeOptions.map((vibe) => {
            const isSelected = selectedVibe === vibe.level;
            return (
              <TouchableOpacity
                key={vibe.level}
                style={[
                  styles.vibeChip,
                  {
                    backgroundColor: isSelected
                      ? vibe.color + '20'
                      : theme.colors.background,
                    borderColor: isSelected ? vibe.color : theme.colors.border,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
                onPress={() => handleVibeSelect(vibe.level)}
                activeOpacity={0.7}
                disabled={loading}
              >
                <Text style={styles.vibeEmoji}>{vibe.emoji}</Text>
                <Text
                  style={[
                    styles.vibeText,
                    {
                      color: isSelected ? vibe.color : theme.colors.text,
                      fontFamily: isSelected ? 'Inter-SemiBold' : 'Inter-Medium',
                    },
                  ]}
                >
                  {vibe.level}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  /**
   * Render compact star rating selector
   * Requirement 2.3: Compact 5-star selector
   */
  const renderStarSelector = () => {
    return (
      <View style={styles.starSection}>
        <Text style={[styles.starLabel, { color: theme.colors.text }]}>
          Rate your experience
        </Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => handleRatingSelect(star)}
              style={styles.starButton}
              activeOpacity={0.7}
              disabled={loading}
            >
              <Icon
                name={star <= selectedRating ? 'star' : 'star-outline'}
                size={36}
                color={star <= selectedRating ? '#FFD700' : theme.colors.textSecondary}
              />
            </TouchableOpacity>
          ))}
        </View>
        {selectedRating > 0 && (
          <Text style={[styles.ratingLabel, { color: theme.colors.textSecondary }]}>
            {selectedRating === 1 && 'Poor'}
            {selectedRating === 2 && 'Fair'}
            {selectedRating === 3 && 'Good'}
            {selectedRating === 4 && 'Very Good'}
            {selectedRating === 5 && 'Excellent'}
          </Text>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.headerContent}>
              <Icon name="star" size={24} color={theme.colors.primary} />
              <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                How was your visit?
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              disabled={loading}
            >
              <Icon name="close" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Venue Name */}
            <View style={styles.venueInfo}>
              <Icon name="location" size={18} color={theme.colors.primary} />
              <Text style={[styles.venueName, { color: theme.colors.text }]}>
                {venueName}
              </Text>
            </View>

            {/* Vibe Selection Chips */}
            {renderVibeChips()}

            {/* Star Rating Selector */}
            {renderStarSelector()}

            {/* Loading Indicator */}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                  Submitting your rating...
                </Text>
              </View>
            )}

            {/* Helper Text */}
            {!loading && (
              <Text style={[styles.helperText, { color: theme.colors.textSecondary }]}>
                Tap a star to submit a quick rating
              </Text>
            )}
          </View>

          {/* Actions */}
          <View style={[styles.actions, { borderTopColor: theme.colors.border }]}>
            <TouchableOpacity
              style={[styles.dismissButton, { borderColor: theme.colors.border }]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={[styles.dismissButtonText, { color: theme.colors.textSecondary }]}>
                Maybe Later
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.fullReviewButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={handleAddWrittenReview}
              disabled={loading}
            >
              <Icon name="create-outline" size={18} color="white" />
              <Text style={styles.fullReviewButtonText}>Add Written Review</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: height * 0.75,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  venueInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  venueName: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
  },
  vibeSection: {
    marginBottom: 24,
  },
  vibeLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 12,
  },
  vibeChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vibeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  vibeEmoji: {
    fontSize: 16,
  },
  vibeText: {
    fontSize: 14,
  },
  starSection: {
    marginBottom: 16,
  },
  starLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
    textAlign: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  helperText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  dismissButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissButtonText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },
  fullReviewButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  fullReviewButtonText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
});

export default ReviewPromptModal;
