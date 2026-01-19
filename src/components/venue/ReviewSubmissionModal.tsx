/**
 * ReviewSubmissionModal Component
 * 
 * Modal for submitting new reviews or editing existing ones.
 * 
 * Requirements:
 * - 1.3, 1.4, 1.5: 5-star rating selector with highlighting
 * - 1.6: Review text input with 500 character limit
 * - 1.7: Validate rating required
 * - 1.9, 1.10: Success/error messages
 * - 6.2: Handle edit mode (pre-populate existing review)
 * - 13.2, 13.3, 13.4, 13.5: Character counter with warning color
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { ReviewService } from '../../services/api/reviews';
import { ContentModerationService } from '../../services/compliance/ContentModerationService';
import type { Review } from '../../types';

interface ReviewSubmissionModalProps {
  visible: boolean;
  onClose: () => void;
  venueId: string;
  venueName: string;
  existingReview?: Review; // For editing
  onSubmitSuccess: () => void;
}

/**
 * ReviewSubmissionModal Component
 * 
 * Provides a modal interface for users to submit or edit venue reviews.
 * Includes 5-star rating selector, text input with character counter,
 * content moderation, and validation.
 */
const ReviewSubmissionModal: React.FC<ReviewSubmissionModalProps> = ({
  visible,
  onClose,
  venueId,
  venueName,
  existingReview,
  onSubmitSuccess,
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();

  // State
  const [rating, setRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [moderationMessage, setModerationMessage] = useState<string>('');

  const isEditMode = !!existingReview;
  const maxChars = 500;
  const warningThreshold = 450;
  const charCount = reviewText.length;
  const isOverWarning = charCount >= warningThreshold;
  const isAtLimit = charCount >= maxChars;

  // Requirement 6.2: Pre-populate existing review in edit mode
  useEffect(() => {
    if (visible && existingReview) {
      setRating(existingReview.rating);
      setReviewText(existingReview.review_text || '');
    } else if (visible && !existingReview) {
      // Reset for new review
      setRating(0);
      setReviewText('');
    }
    setModerationMessage('');
  }, [visible, existingReview]);

  /**
   * Handle star rating selection
   * Requirement 1.4: Highlight selected star and all stars to the left
   * Requirement 1.5: Enable text input when rating selected
   */
  const handleRatingSelect = (selectedRating: number) => {
    setRating(selectedRating);
  };

  /**
   * Handle text input change
   * Requirement 13.5: Prevent input beyond 500 chars
   */
  const handleTextChange = (text: string) => {
    if (text.length <= maxChars) {
      setReviewText(text);
      setModerationMessage('');
    }
  };

  /**
   * Handle review submission
   * Requirements:
   * - 1.7: Validate rating required
   * - 1.9: Show success message
   * - 1.10: Show error message and allow retry
   */
  const handleSubmit = async () => {
    try {
      // Requirement 1.7: Validate rating required
      if (rating === 0) {
        Alert.alert('Rating Required', 'Please select a star rating before submitting.');
        return;
      }

      if (!user?.id) {
        Alert.alert('Authentication Required', 'You must be signed in to submit a review.');
        return;
      }

      setLoading(true);
      setModerationMessage('');

      // Apply content moderation if text is provided
      if (reviewText.trim()) {
        const moderation = ContentModerationService.filterProfanity(reviewText.trim());
        
        if (moderation.wasRejected) {
          // Show rejection message
          Alert.alert(
            'Content Not Allowed',
            moderation.message || 'This content violates our community guidelines.',
            [{ text: 'OK' }]
          );
          setLoading(false);
          return;
        }

        if (moderation.hadProfanity && moderation.message) {
          setModerationMessage(moderation.message);
        }
      }

      // Submit or update review
      if (isEditMode && existingReview) {
        await ReviewService.updateReview({
          reviewId: existingReview.id,
          userId: user.id,
          rating,
          reviewText: reviewText.trim() || undefined,
        });
      } else {
        await ReviewService.submitReview({
          venueId,
          userId: user.id,
          rating,
          reviewText: reviewText.trim() || undefined,
        });
      }

      // Requirement 1.9: Show success message
      Alert.alert(
        'Success',
        isEditMode ? 'Your review has been updated!' : 'Thank you for your review!',
        [
          {
            text: 'OK',
            onPress: () => {
              onSubmitSuccess();
              onClose();
            },
          },
        ]
      );
    } catch (error: any) {
      // Requirement 1.10: Show error message and allow retry
      console.error('Error submitting review:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to submit review. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Render star rating selector
   * Requirements:
   * - 1.3: Display 5-star rating selector
   * - 1.4: Highlight selected star and all stars to the left
   */
  const renderStarSelector = () => {
    return (
      <View style={styles.starContainer}>
        <Text style={[styles.label, { color: theme.colors.text }]}>
          Rating {rating === 0 && <Text style={styles.required}>*</Text>}
        </Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => handleRatingSelect(star)}
              style={styles.starButton}
              activeOpacity={0.7}
            >
              <Icon
                name={star <= rating ? 'star' : 'star-outline'}
                size={40}
                color={star <= rating ? '#FFD700' : theme.colors.textSecondary}
              />
            </TouchableOpacity>
          ))}
        </View>
        {rating > 0 && (
          <Text style={[styles.ratingLabel, { color: theme.colors.textSecondary }]}>
            {rating === 1 && 'Poor'}
            {rating === 2 && 'Fair'}
            {rating === 3 && 'Good'}
            {rating === 4 && 'Very Good'}
            {rating === 5 && 'Excellent'}
          </Text>
        )}
      </View>
    );
  };

  /**
   * Render review text input
   * Requirements:
   * - 1.6: Allow up to 500 characters
   * - 13.2: Character counter (500 max)
   * - 13.3: Display character counter
   * - 13.4: Warning color at 450 chars
   * - 13.5: Prevent input beyond 500 chars
   */
  const renderTextInput = () => {
    return (
      <View style={styles.textInputContainer}>
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: theme.colors.text }]}>
            Review (Optional)
          </Text>
          <Text
            style={[
              styles.charCounter,
              {
                color: isAtLimit
                  ? '#FF6B6B'
                  : isOverWarning
                  ? '#FFD700'
                  : theme.colors.textSecondary,
              },
            ]}
          >
            {charCount}/{maxChars}
          </Text>
        </View>
        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: theme.colors.background,
              color: theme.colors.text,
              borderColor: isAtLimit
                ? '#FF6B6B'
                : isOverWarning
                ? '#FFD700'
                : theme.colors.border,
            },
          ]}
          placeholder="Share your experience... (optional)"
          placeholderTextColor={theme.colors.textSecondary}
          value={reviewText}
          onChangeText={handleTextChange}
          multiline
          numberOfLines={6}
          maxLength={maxChars}
          textAlignVertical="top"
          editable={!loading}
        />
        {moderationMessage && (
          <View style={[styles.moderationNotice, { backgroundColor: '#FFD700' + '20' }]}>
            <Icon name="information-circle-outline" size={16} color="#FFD700" />
            <Text style={[styles.moderationText, { color: '#B8860B' }]}>
              {moderationMessage}
            </Text>
          </View>
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
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              {isEditMode ? 'Edit Review' : 'Write a Review'}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              disabled={loading}
            >
              <Icon name="close" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
          >
            {/* Venue Name */}
            <View style={styles.venueInfo}>
              <Icon name="location" size={20} color={theme.colors.primary} />
              <Text style={[styles.venueName, { color: theme.colors.text }]}>
                {venueName}
              </Text>
            </View>

            {/* Star Rating Selector */}
            {renderStarSelector()}

            {/* Text Input (enabled when rating is selected) */}
            {renderTextInput()}

            {/* Photo Upload Placeholder - Requirements 17.1, 17.2 */}
            <View style={styles.photoSection}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Photos (Optional)
              </Text>
              <TouchableOpacity
                style={[
                  styles.photoButton,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={() => {
                  Alert.alert(
                    'Photos Coming Soon',
                    'Photo uploads will be available in a future update. Stay tuned!',
                    [{ text: 'OK' }]
                  );
                }}
                disabled={loading}
              >
                <Icon name="camera-outline" size={32} color={theme.colors.textSecondary} />
                <Text style={[styles.photoButtonText, { color: theme.colors.textSecondary }]}>
                  Add Photos
                </Text>
                <Text style={[styles.comingSoonBadge, { color: theme.colors.primary }]}>
                  Coming Soon
                </Text>
              </TouchableOpacity>
              
              {/* Reserved space for photo thumbnails */}
              <View style={styles.photoThumbnailsPlaceholder}>
                <Text style={[styles.photoPlaceholderText, { color: theme.colors.textSecondary }]}>
                  Photo thumbnails will appear here
                </Text>
              </View>
            </View>

            {/* Helper Text */}
            <Text style={[styles.helperText, { color: theme.colors.textSecondary }]}>
              Your review will be visible to other users and the venue owner.
            </Text>
          </ScrollView>

          {/* Actions */}
          <View style={[styles.actions, { borderTopColor: theme.colors.border }]}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: theme.colors.border }]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: rating > 0 ? theme.colors.primary : theme.colors.border,
                  opacity: loading ? 0.6 : 1,
                },
              ]}
              onPress={handleSubmit}
              disabled={loading || rating === 0}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Icon name="checkmark-circle-outline" size={20} color="white" />
                  <Text style={styles.submitButtonText}>
                    {isEditMode ? 'Update Review' : 'Submit Review'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: height * 0.9, // Fixed height instead of maxHeight
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
  headerTitle: {
    fontSize: 20,
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
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  venueInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  venueName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
  },
  starContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  required: {
    color: '#FF6B6B',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
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
  textInputContainer: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  charCounter: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    minHeight: 120,
    maxHeight: 200,
  },
  moderationNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  moderationText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    flex: 1,
  },
  helperText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
  },
  photoSection: {
    marginBottom: 16,
  },
  photoButton: {
    borderWidth: 1,
    borderRadius: 12,
    borderStyle: 'dashed',
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  photoButtonText: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
  },
  comingSoonBadge: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    marginTop: 4,
  },
  photoThumbnailsPlaceholder: {
    minHeight: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  photoPlaceholderText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
});

export default ReviewSubmissionModal;
