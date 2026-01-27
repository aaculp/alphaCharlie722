/**
 * ClaimButton Component
 * 
 * Renders an interactive button for claiming flash offers on the VenueDetailScreen.
 * The button adapts its appearance and behavior based on eligibility and claim status.
 * 
 * Features:
 * - State-driven rendering (claimable, claimed, loading, not_checked_in, full, expired)
 * - Integrates with useClaimFlashOfferMutation for claim operations
 * - Provides visual feedback for each state
 * - Handles errors and success states
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 6.1
 */

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  AccessibilityInfo,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useClaimFlashOfferMutation } from '../../hooks/mutations/useClaimFlashOfferMutation';
import { deriveClaimButtonState } from '../../utils/claimButtonState';
import { handleClaimError, type ClaimErrorResponse } from '../../utils/claimErrorHandler';
import { triggerSuccessHaptic } from '../../utils/haptics';
import ClaimFeedbackModal from '../ClaimFeedbackModal/ClaimFeedbackModal';
import type { FlashOffer } from '../../types/flashOffer.types';
import type { FlashOfferClaim } from '../../types/flashOfferClaim.types';
import type { ClaimButtonState, ClaimButtonVariant } from '../../types/claimButton.types';
import type { RootTabParamList } from '../../types/navigation.types';

export interface ClaimButtonProps {
  offer: FlashOffer;
  userClaim: FlashOfferClaim | null;
  isCheckedIn: boolean;
  onClaimSuccess?: (claim: FlashOfferClaim) => void;
  onPress?: () => void;
  onNavigate?: (target: string) => void;
  compact?: boolean;
}

/**
 * Maps claim button state to button configuration
 */
function getButtonConfig(
  state: ClaimButtonState,
  theme: any
): {
  label: string;
  variant: ClaimButtonVariant;
  icon?: string;
  disabled: boolean;
  accessibilityLabel: string;
  accessibilityHint: string;
} {
  switch (state) {
    case 'claimable':
      return {
        label: 'Claim Offer',
        variant: 'primary',
        icon: 'flash',
        disabled: false,
        accessibilityLabel: 'Claim this flash offer',
        accessibilityHint: 'Double tap to claim this offer and receive your claim token',
      };
    case 'claimed':
      return {
        label: 'View Claim',
        variant: 'success',
        icon: 'checkmark-circle',
        disabled: false,
        accessibilityLabel: 'View your claim details',
        accessibilityHint: 'Double tap to view your claim token and redemption details',
      };
    case 'loading':
      return {
        label: 'Claiming...',
        variant: 'primary',
        disabled: true,
        accessibilityLabel: 'Claiming offer in progress',
        accessibilityHint: 'Please wait while we process your claim',
      };
    case 'not_checked_in':
      return {
        label: 'Claim',
        variant: 'primary',
        icon: 'flash',
        disabled: false,
        accessibilityLabel: 'Claim this flash offer',
        accessibilityHint: 'Double tap to view offer details and claim',
      };
    case 'full':
      return {
        label: 'Offer Full',
        variant: 'disabled',
        icon: 'close-circle',
        disabled: true,
        accessibilityLabel: 'Offer is full',
        accessibilityHint: 'This offer has reached its maximum number of claims',
      };
    case 'expired':
      return {
        label: 'Expired',
        variant: 'disabled',
        icon: 'time',
        disabled: true,
        accessibilityLabel: 'Offer expired',
        accessibilityHint: 'This offer is no longer available',
      };
  }
}

/**
 * Gets the background color for the button variant
 */
function getVariantBackgroundColor(variant: ClaimButtonVariant, theme: any): string {
  switch (variant) {
    case 'primary':
      return theme.colors.primary;
    case 'success':
      return theme.colors.success;
    case 'secondary':
      return theme.colors.textSecondary;
    case 'disabled':
      return theme.colors.border;
  }
}

/**
 * Gets the text color for the button variant
 */
function getVariantTextColor(variant: ClaimButtonVariant, theme: any): string {
  switch (variant) {
    case 'primary':
    case 'success':
    case 'secondary':
      return '#FFFFFF';
    case 'disabled':
      return theme.colors.textSecondary;
  }
}

/**
 * ClaimButton component
 * 
 * Displays an interactive button for claiming flash offers.
 * The button appearance and behavior adapts based on:
 * - User check-in status
 * - Offer availability (active, full, expired)
 * - User's claim status (claimed or not)
 * - Mutation loading state
 * 
 * Performance optimizations:
 * - Memoized state derivation and button config
 * - Stable event handler references with useCallback
 * - Component wrapped with React.memo for shallow prop comparison
 * 
 * Requirements: 2.1, 2.2, 2.3, 6.5
 */
const ClaimButtonComponent: React.FC<ClaimButtonProps> = ({
  offer,
  userClaim,
  isCheckedIn,
  onClaimSuccess,
  onPress,
  onNavigate,
  compact = false,
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();
  const [errorResponse, setErrorResponse] = useState<ClaimErrorResponse | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successClaim, setSuccessClaim] = useState<FlashOfferClaim | null>(null);

  // Memoize mutation success handler to prevent recreation
  const handleMutationSuccess = useCallback(
    (claim: FlashOfferClaim) => {
      // Clear any previous errors
      setErrorResponse(null);
      
      // Trigger haptic feedback for success
      triggerSuccessHaptic();
      
      // Announce success to screen readers
      AccessibilityInfo.announceForAccessibility(
        `Offer claimed successfully! Your claim token is ${claim.token.split('').join(' ')}`
      );
      
      // Store claim data and show success modal
      setSuccessClaim(claim);
      setShowSuccessModal(true);
      
      // Trigger success callback if provided
      if (onClaimSuccess) {
        onClaimSuccess(claim);
      }
    },
    [onClaimSuccess]
  );

  // Memoize mutation error handler to prevent recreation
  const handleMutationError = useCallback((err: Error) => {
    // Handle error and get structured response
    const errorResp = handleClaimError(err);
    setErrorResponse(errorResp);
  }, []);

  // Set up claim mutation with callbacks
  const { mutate: claimOffer, isPending } = useClaimFlashOfferMutation({
    onSuccess: handleMutationSuccess,
    onError: handleMutationError,
  });

  // Derive button state based on all inputs (memoized)
  const buttonState = useMemo(
    () =>
      deriveClaimButtonState(offer, userClaim, isCheckedIn, {
        isLoading: isPending,
      }),
    [offer, userClaim, isCheckedIn, isPending]
  );

  // Get button configuration for current state (memoized)
  const config = useMemo(
    () => getButtonConfig(buttonState, theme),
    [buttonState, theme]
  );

  // Get colors for current variant (memoized)
  const backgroundColor = useMemo(
    () => getVariantBackgroundColor(config.variant, theme),
    [config.variant, theme]
  );
  
  const textColor = useMemo(
    () => getVariantTextColor(config.variant, theme),
    [config.variant, theme]
  );

  // Announce loading state to screen readers
  useEffect(() => {
    if (isPending) {
      AccessibilityInfo.announceForAccessibility('Claiming offer, please wait');
    }
  }, [isPending]);

  // Announce errors to screen readers
  useEffect(() => {
    if (errorResponse) {
      AccessibilityInfo.announceForAccessibility(
        `Error: ${errorResponse.message}`
      );
    }
  }, [errorResponse]);

  // Handle button press (stable reference with useCallback)
  const handlePress = useCallback(() => {
    if (config.disabled) {
      return;
    }

    // If button is in claimable state, trigger the mutation
    if (buttonState === 'claimable' && user?.id) {
      claimOffer({
        offerId: offer.id,
        userId: user.id,
        venueId: offer.venue_id,
      });
    } else if (buttonState === 'claimed' && userClaim) {
      // For claimed state, navigate to ClaimDetailScreen
      navigation.navigate('ClaimDetail' as any, { claimId: userClaim.id });
    } else if (buttonState === 'not_checked_in' && onNavigate) {
      // For not checked in state, trigger navigation to check-in
      // Requirements: 1.2 - Guide users to check in
      onNavigate('check_in');
    } else if (onPress) {
      // For other states, use custom handler
      onPress();
    }
  }, [config.disabled, buttonState, user?.id, claimOffer, offer.id, offer.venue_id, userClaim, navigation, onNavigate, onPress]);

  // Handle retry button press (stable reference with useCallback)
  const handleRetry = useCallback(() => {
    setErrorResponse(null);
    if (user?.id) {
      claimOffer({
        offerId: offer.id,
        userId: user.id,
        venueId: offer.venue_id,
      });
    }
  }, [user?.id, claimOffer, offer.id, offer.venue_id]);

  // Handle dismiss button press (stable reference with useCallback)
  const handleDismiss = useCallback(() => {
    setErrorResponse(null);
  }, []);

  // Handle navigate button press (stable reference with useCallback)
  const handleNavigate = useCallback(() => {
    if (errorResponse?.navigationTarget && onNavigate) {
      onNavigate(errorResponse.navigationTarget);
    }
    setErrorResponse(null);
  }, [errorResponse?.navigationTarget, onNavigate]);

  // Handle modal close (stable reference with useCallback)
  const handleModalClose = useCallback(() => {
    setShowSuccessModal(false);
  }, []);

  // Handle "View Details" navigation from modal (stable reference with useCallback)
  const handleViewDetails = useCallback(() => {
    setShowSuccessModal(false);
    if (successClaim) {
      navigation.navigate('ClaimDetail' as any, { claimId: successClaim.id });
    }
  }, [successClaim, navigation]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor,
            opacity: config.disabled ? 0.6 : 1,
          },
          compact && styles.buttonCompact,
        ]}
        onPress={handlePress}
        disabled={config.disabled}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={config.accessibilityLabel}
        accessibilityHint={config.accessibilityHint}
        accessibilityState={{
          disabled: config.disabled,
          busy: buttonState === 'loading',
        }}
      >
        <View style={styles.buttonContent}>
          {/* Loading spinner */}
          {buttonState === 'loading' && (
            <ActivityIndicator
              size="small"
              color={textColor}
              style={styles.spinner}
            />
          )}

          {/* Icon */}
          {config.icon && buttonState !== 'loading' && (
            <Icon
              name={config.icon}
              size={compact ? 14 : 18}
              color={textColor}
              style={styles.icon}
            />
          )}

          {/* Label */}
          <Text
            style={[
              styles.buttonText,
              { color: textColor },
              compact && styles.buttonTextCompact,
            ]}
          >
            {config.label}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Error Display */}
      {errorResponse && (
        <View
          style={[
            styles.errorContainer,
            {
              backgroundColor:
                errorResponse.severity === 'error'
                  ? theme.colors.error + '15'
                  : errorResponse.severity === 'warning'
                  ? theme.colors.warning + '15'
                  : theme.colors.success + '15',
              borderColor:
                errorResponse.severity === 'error'
                  ? theme.colors.error
                  : errorResponse.severity === 'warning'
                  ? theme.colors.warning
                  : theme.colors.success,
            },
          ]}
          accessible={true}
          accessibilityRole="alert"
          accessibilityLabel={`Error: ${errorResponse.message}`}
          accessibilityLiveRegion="polite"
        >
          <View style={styles.errorContent}>
            <Icon
              name={
                errorResponse.severity === 'error'
                  ? 'alert-circle'
                  : errorResponse.severity === 'warning'
                  ? 'warning'
                  : 'information-circle'
              }
              size={16}
              color={
                errorResponse.severity === 'error'
                  ? theme.colors.error
                  : errorResponse.severity === 'warning'
                  ? theme.colors.warning
                  : theme.colors.success
              }
              style={styles.errorIcon}
            />
            <Text
              style={[
                styles.errorText,
                {
                  color:
                    errorResponse.severity === 'error'
                      ? theme.colors.error
                      : errorResponse.severity === 'warning'
                      ? theme.colors.warning
                      : theme.colors.success,
                },
              ]}
            >
              {errorResponse.message}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.errorActions}>
            {errorResponse.action === 'retry' && (
              <TouchableOpacity
                style={[
                  styles.errorButton,
                  {
                    backgroundColor: theme.colors.primary,
                  },
                ]}
                onPress={handleRetry}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Retry claiming the offer"
                accessibilityHint="Double tap to try claiming the offer again"
              >
                <Icon name="refresh" size={14} color="#FFFFFF" style={styles.errorButtonIcon} />
                <Text style={styles.errorButtonText}>Retry</Text>
              </TouchableOpacity>
            )}

            {errorResponse.action === 'navigate' && (
              <TouchableOpacity
                style={[
                  styles.errorButton,
                  {
                    backgroundColor: theme.colors.primary,
                  },
                ]}
                onPress={handleNavigate}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={
                  errorResponse.navigationTarget === 'check_in'
                    ? 'Go to check in'
                    : errorResponse.navigationTarget === 'my_claims'
                    ? 'View your claims'
                    : 'Navigate'
                }
                accessibilityHint="Double tap to navigate"
              >
                <Icon name="arrow-forward" size={14} color="#FFFFFF" style={styles.errorButtonIcon} />
                <Text style={styles.errorButtonText}>
                  {errorResponse.navigationTarget === 'check_in'
                    ? 'Check In'
                    : errorResponse.navigationTarget === 'my_claims'
                    ? 'View Claims'
                    : 'Go'}
                </Text>
              </TouchableOpacity>
            )}

            {errorResponse.action === 'check_claims' && (
              <TouchableOpacity
                style={[
                  styles.errorButton,
                  {
                    backgroundColor: theme.colors.primary,
                  },
                ]}
                onPress={handleNavigate}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Check your claims"
                accessibilityHint="Double tap to view your claims list"
              >
                <Icon name="list" size={14} color="#FFFFFF" style={styles.errorButtonIcon} />
                <Text style={styles.errorButtonText}>Check Claims</Text>
              </TouchableOpacity>
            )}

            {/* Dismiss button - always show */}
            <TouchableOpacity
              style={[
                styles.errorButton,
                styles.errorButtonSecondary,
                {
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={handleDismiss}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Dismiss error message"
              accessibilityHint="Double tap to close this error message"
            >
              <Text
                style={[
                  styles.errorButtonText,
                  {
                    color: theme.colors.textSecondary,
                  },
                ]}
              >
                Dismiss
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Success Feedback Modal */}
      <ClaimFeedbackModal
        visible={showSuccessModal}
        claim={successClaim}
        offerTitle={offer.title}
        onClose={handleModalClose}
        onViewDetails={handleViewDetails}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  button: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonCompact: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  buttonTextCompact: {
    fontSize: 12,
  },
  icon: {
    marginRight: 6,
  },
  spinner: {
    marginRight: 8,
  },
  errorContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  errorIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Inter-Regular',
  },
  errorActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  errorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    flex: 1,
    justifyContent: 'center',
  },
  errorButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  errorButtonIcon: {
    marginRight: 4,
  },
  errorButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
  },
});

/**
 * Memoized ClaimButton component
 * 
 * Wrapped with React.memo to prevent unnecessary re-renders when props haven't changed.
 * This is particularly important when rendering multiple ClaimButtons in a list/scroll view.
 * 
 * Requirements: 6.5 - Performance optimization
 */
export const ClaimButton = React.memo(ClaimButtonComponent);
