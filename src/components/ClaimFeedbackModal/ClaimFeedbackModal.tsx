/**
 * ClaimFeedbackModal Component
 * 
 * Modal that displays success confirmation after claiming a flash offer.
 * Shows the claim token, expiration time, and navigation options.
 * Includes real-time updates when the claim is redeemed.
 * 
 * Requirements: 4.1, 4.2, 4.3
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Clipboard,
  AccessibilityInfo,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import type { FlashOfferClaim } from '../../types/flashOfferClaim.types';

interface ClaimFeedbackModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** The claim data (null if no claim) */
  claim: FlashOfferClaim | null;
  /** The title of the claimed offer */
  offerTitle: string;
  /** Handler for closing the modal */
  onClose: () => void;
  /** Handler for navigating to claim details */
  onViewDetails: () => void;
}

/**
 * ClaimFeedbackModal Component
 * 
 * Displays a success modal after a user successfully claims a flash offer.
 * Shows the 6-digit claim token (copyable), expiration time, and action buttons.
 */
const ClaimFeedbackModal: React.FC<ClaimFeedbackModalProps> = ({
  visible,
  claim,
  offerTitle,
  onClose,
  onViewDetails,
}) => {
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);
  const [claimStatus, setClaimStatus] = useState<string>(claim?.status || 'active');
  const [redeemSuccess, setRedeemSuccess] = useState(false);

  // Set up real-time subscription for claim status updates
  useEffect(() => {
    if (!claim || !visible) return;

    console.log('📡 Setting up real-time subscription for claim:', claim.id);
    const claimSubscription = supabase
      .channel(`claim:${claim.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'flash_offer_claims',
          filter: `id=eq.${claim.id}`,
        },
        (payload) => {
          console.log('🔄 Claim status updated in real-time:', payload);
          
          const newStatus = payload.new.status;
          setClaimStatus(newStatus);
          
          // If claim was redeemed, show success state
          if (newStatus === 'redeemed' && payload.old.status !== 'redeemed') {
            setRedeemSuccess(true);
            
            AccessibilityInfo.announceForAccessibility(
              'Congratulations! Your offer has been redeemed. Enjoy your promotion!'
            );
            
            // Auto-close after showing success for 3 seconds
            setTimeout(() => {
              onClose();
            }, 3000);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Unsubscribing from claim updates');
      claimSubscription.unsubscribe();
    };
  }, [claim?.id, visible, onClose]);

  // Update local status when claim prop changes
  useEffect(() => {
    if (claim) {
      setClaimStatus(claim.status);
    }
  }, [claim]);

  /**
   * Calculates the expiration time display (24 hours from claim)
   */
  const getExpirationDisplay = (): string => {
    if (!claim) return '';
    
    const expiresAt = new Date(claim.expires_at);
    const now = new Date();
    const hoursRemaining = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (hoursRemaining < 1) {
      const minutesRemaining = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60));
      return `Expires in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}`;
    }
    
    return `Expires in ${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''}`;
  };

  /**
   * Copies the claim token to clipboard
   */
  const handleCopyToken = () => {
    if (!claim) return;
    
    Clipboard.setString(claim.token);
    setCopied(true);
    
    // Announce to screen readers
    AccessibilityInfo.announceForAccessibility(
      `Token ${claim.token.split('').join(' ')} copied to clipboard`
    );
    
    // Reset copied state after 2 seconds
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  /**
   * Formats the token with spacing for better readability
   * Example: "123456" -> "123 456"
   */
  const formatToken = (token: string): string => {
    if (token.length === 6) {
      return `${token.slice(0, 3)} ${token.slice(3)}`;
    }
    return token;
  };

  // Announce modal opening to screen readers
  useEffect(() => {
    if (visible && claim) {
      AccessibilityInfo.announceForAccessibility(
        `Offer claimed successfully! Your claim token is ${claim.token.split('').join(' ')}. ${getExpirationDisplay()}`
      );
    }
  }, [visible, claim]);

  if (!claim) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessible={true}
      accessibilityViewIsModal={true}
    >
      <View style={styles.overlay}>
        <View 
          style={[
            styles.modalContainer, 
            { 
              backgroundColor: theme.colors.surface,
              borderColor: redeemSuccess ? theme.colors.success : 'transparent',
              borderWidth: redeemSuccess ? 2 : 0,
            }
          ]}
          accessible={true}
          accessibilityRole="alert"
          accessibilityLabel="Offer claimed successfully"
        >
          {/* Icon & Title - Inline */}
          <View style={[styles.headerRow, { backgroundColor: redeemSuccess ? theme.colors.success + '20' : claimStatus === 'redeemed' ? theme.colors.success + '20' : theme.colors.primary + '20' }]}>
            <Icon
              name={redeemSuccess || claimStatus === 'redeemed' ? 'checkmark-done-circle' : 'flash'}
              size={48}
              color={redeemSuccess || claimStatus === 'redeemed' ? theme.colors.success : theme.colors.primary}
            />
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {redeemSuccess || claimStatus === 'redeemed' ? '🎉 Redeemed!' : 'Claiming...'}
            </Text>
          </View>

          {/* Offer Title */}
          <Text style={[styles.offerTitle, { color: theme.colors.textSecondary }]}>
            {offerTitle}
          </Text>

          {/* Token Display (only if not redeemed) */}
          {!redeemSuccess && claimStatus !== 'redeemed' && (
            <>
              {/* Claim Token Section */}
              <View style={[styles.tokenContainer, { backgroundColor: theme.colors.background }]}>
                <Text style={[styles.tokenLabel, { color: theme.colors.textSecondary }]}>
                  Your Claim Token
                </Text>
                
                <TouchableOpacity
                  style={[styles.tokenBox, { borderColor: theme.colors.primary }]}
                  onPress={handleCopyToken}
                  activeOpacity={0.7}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`Claim token: ${claim.token.split('').join(' ')}`}
                  accessibilityHint="Double tap to copy token to clipboard"
                  accessibilityValue={{ text: claim.token }}
                >
                  <Text 
                    style={[styles.tokenText, { color: theme.colors.primary }]}
                    accessible={false}
                  >
                    {formatToken(claim.token)}
                  </Text>
                  <Icon
                    name={copied ? 'checkmark-circle' : 'copy-outline'}
                    size={24}
                    color={copied ? theme.colors.success : theme.colors.primary}
                    accessible={false}
                  />
                </TouchableOpacity>
                
                {copied && (
                  <Text 
                    style={[styles.copiedText, { color: theme.colors.success }]}
                    accessible={true}
                    accessibilityLiveRegion="polite"
                  >
                    Copied to clipboard!
                  </Text>
                )}
              </View>

              {/* Expiration Info */}
              <View 
                style={[styles.expirationContainer, { backgroundColor: theme.colors.warning + '10' }]}
                accessible={true}
                accessibilityRole="text"
                accessibilityLabel={getExpirationDisplay()}
              >
                <Icon
                  name="time-outline"
                  size={16}
                  color={theme.colors.warning}
                  accessible={false}
                />
                <Text 
                  style={[styles.expirationText, { color: theme.colors.text }]}
                  accessible={false}
                >
                  {getExpirationDisplay()}
                </Text>
              </View>

              {/* Info Note */}
              <View 
                style={[styles.infoContainer, { backgroundColor: theme.colors.primary + '10' }]}
                accessible={true}
                accessibilityRole="text"
                accessibilityLabel="Show this token to venue staff to redeem your offer"
              >
                <Icon
                  name="information-circle-outline"
                  size={16}
                  color={theme.colors.primary}
                  accessible={false}
                />
                <Text 
                  style={[styles.infoText, { color: theme.colors.text }]}
                  accessible={false}
                >
                  Show this token to venue staff to redeem your offer
                </Text>
              </View>
            </>
          )}

          {/* Redeemed Message */}
          {(redeemSuccess || claimStatus === 'redeemed') && (
            <View 
              style={[styles.redeemedContainer, { backgroundColor: theme.colors.success + '10' }]}
              accessible={true}
              accessibilityRole="text"
              accessibilityLabel="Your offer has been successfully redeemed. Enjoy your promotion!"
            >
              <Icon
                name="checkmark-done-circle"
                size={32}
                color={theme.colors.success}
                accessible={false}
              />
              <Text 
                style={[styles.redeemedText, { color: theme.colors.text }]}
                accessible={false}
              >
                Your offer has been successfully redeemed. Enjoy your promotion!
              </Text>
            </View>
          )}

          {/* Actions */}
          {!redeemSuccess && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: theme.colors.border }]}
                onPress={onClose}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Done"
                accessibilityHint="Double tap to close this modal"
              >
                <Text style={[styles.secondaryButtonText, { color: theme.colors.textSecondary }]}>
                  Done
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
                onPress={onViewDetails}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="View claim details"
                accessibilityHint="Double tap to view full claim details and redemption information"
              >
                <Icon
                  name="eye-outline"
                  size={20}
                  color="white"
                  accessible={false}
                />
                <Text style={styles.primaryButtonText}>
                  View Details
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Success State - Close Button */}
          {redeemSuccess && (
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: theme.colors.success }]}
              onPress={onClose}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Close"
              accessibilityHint="Double tap to close this modal"
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: Math.min(width - 40, 400),
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    gap: 16,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins-SemiBold',
    flex: 1,
  },
  offerTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 24,
  },
  tokenContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  tokenLabel: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tokenBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
    minWidth: 200,
  },
  tokenText: {
    fontSize: 36,
    fontFamily: 'Poppins-Bold',
    letterSpacing: 4,
  },
  copiedText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginTop: 8,
  },
  expirationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  expirationText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
  },
  redeemedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    gap: 16,
  },
  redeemedText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
  closeButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
});

export default ClaimFeedbackModal;
