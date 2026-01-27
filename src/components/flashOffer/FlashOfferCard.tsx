import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { FlashOffer } from '../../types/flashOffer.types';
import { FlashOfferClaim } from '../../types/flashOfferClaim.types';
import { useCountdownTimer } from '../../hooks/useCountdownTimer';
import { useRealtimeOffer } from '../../hooks/useRealtimeOffer';
import { fadeIn, scaleIn, countdownPulse } from '../../utils/animations';
import { triggerLightHaptic } from '../../utils/haptics';
import { ClaimButton } from '../ClaimButton/ClaimButton';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;
const CARD_MIN_HEIGHT = 220; // Reduced from 280 due to more compact horizontal layout

interface FlashOfferCardProps {
  offer: FlashOffer;
  venueName: string;
  onPress: () => void;
  enableRealtime?: boolean;
  distanceMiles?: number;
  showDistance?: boolean;
  userClaim?: FlashOfferClaim | null;
  isCheckedIn?: boolean;
  onNavigate?: (target: string) => void;
}

/**
 * FlashOfferCard component displays a flash offer with countdown timer and urgency indicators
 * 
 * Features:
 * - Real-time countdown timer with pulse animation when urgent
 * - Remaining claims display with animated updates
 * - Visual urgency indicators (low claims, ending soon)
 * - Optional real-time claim count updates with polling fallback
 * - Distance display when location is available
 * - "Starts Soon" indicator for future offers on current day
 * - Smooth entrance animations
 * - Responsive design
 * - Integrated ClaimButton for direct claiming (Requirements 1.1-1.5, 6.4)
 */
export const FlashOfferCard: React.FC<FlashOfferCardProps> = ({
  offer: initialOffer,
  venueName,
  onPress,
  enableRealtime = false,
  distanceMiles,
  showDistance = false,
  userClaim = null,
  isCheckedIn = false,
  onNavigate,
}) => {
  const { theme } = useTheme();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const claimCountAnim = useRef(new Animated.Value(1)).current;
  
  // Use real-time updates if enabled
  const { offer: realtimeOffer } = useRealtimeOffer({
    offerId: initialOffer.id,
    enabled: enableRealtime,
  });
  
  // Use real-time offer if available, otherwise use initial offer
  const offer = realtimeOffer || initialOffer;
  
  // Track previous claim count for animation
  const prevClaimCountRef = useRef(offer.claimed_count);
  
  // Use countdown timer hook
  const { timeRemaining, isExpired, totalSeconds } = useCountdownTimer(offer.end_time);
  
  // Check if offer starts in the future (on current day)
  const startTime = new Date(offer.start_time);
  const now = new Date();
  const isStartingSoon = startTime > now && 
    startTime.toDateString() === now.toDateString();
  
  // Determine urgency based on time remaining (less than 1 hour)
  const isUrgent = !isExpired && totalSeconds < 3600;

  // Entrance animation on mount
  useEffect(() => {
    Animated.parallel([
      fadeIn(fadeAnim, 300),
      scaleIn(scaleAnim, 300),
    ]).start();
  }, []);

  // Pulse animation for urgent timers
  useEffect(() => {
    if (isUrgent && !isExpired) {
      const pulseAnimation = countdownPulse(pulseAnim);
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    } else {
      // Reset to normal scale
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isUrgent, isExpired]);

  // Animate claim count changes
  useEffect(() => {
    if (prevClaimCountRef.current !== offer.claimed_count) {
      // Trigger animation when claim count changes
      Animated.sequence([
        Animated.timing(claimCountAnim, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(claimCountAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
      
      prevClaimCountRef.current = offer.claimed_count;
    }
  }, [offer.claimed_count]);

  // Calculate remaining claims
  const remainingClaims = offer.max_claims - offer.claimed_count;
  const claimsPercentage = (offer.claimed_count / offer.max_claims) * 100;
  const isLowClaims = remainingClaims <= 3 || claimsPercentage >= 80;
  const isFull = offer.status === 'full' || remainingClaims <= 0;

  // Determine urgency color
  const getUrgencyColor = () => {
    if (isExpired) {
      return theme.colors.textSecondary;
    }
    if (isFull) {
      return theme.colors.warning;
    }
    if (isUrgent || isLowClaims) {
      return theme.colors.error;
    }
    if (claimsPercentage >= 50) {
      return theme.colors.warning;
    }
    return theme.colors.success;
  };

  const urgencyColor = getUrgencyColor();

  // Determine badge text
  const getBadgeText = () => {
    if (isExpired) return 'EXPIRED';
    if (isFull) return 'FULL';
    if (isStartingSoon) return 'STARTS SOON';
    if (isUrgent) return 'ENDING SOON';
    if (isLowClaims) return 'LIMITED';
    return null;
  };

  const badgeText = getBadgeText();
  const showBadge = badgeText !== null;

  const handlePress = () => {
    // Trigger light haptic feedback for card press
    triggerLightHaptic();
    onPress();
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
      }}
    >
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.card,
            borderColor: showBadge ? urgencyColor : theme.colors.border,
            borderWidth: showBadge ? 2 : 1,
            opacity: isExpired || isFull ? 0.7 : 1,
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
        disabled={isExpired}
      >
        {/* Urgency Badge */}
        {showBadge && (
          <View style={[styles.urgencyBadge, { backgroundColor: urgencyColor }]}>
            <Icon name="flash" size={12} color="#fff" />
            <Text style={styles.urgencyText}>
              {badgeText}
            </Text>
          </View>
        )}

        {/* Offer Title */}
        <Text
          style={[styles.title, { color: theme.colors.text }]}
          numberOfLines={2}
        >
          {offer.title}
        </Text>

        {/* Venue Name */}
        <View style={styles.venueRow}>
          <Icon name="location" size={14} color={theme.colors.textSecondary} />
          <Text
            style={[styles.venueName, { color: theme.colors.textSecondary }]}
            numberOfLines={1}
          >
            {venueName}
          </Text>
        </View>

        {/* Distance Display */}
        {showDistance && distanceMiles !== undefined && (
          <View style={styles.distanceRow}>
            <Icon name="navigate-outline" size={12} color={theme.colors.textSecondary} />
            <Text style={[styles.distanceText, { color: theme.colors.textSecondary }]}>
              {distanceMiles < 0.1 ? '< 0.1 mi away' : `${distanceMiles.toFixed(1)} mi away`}
            </Text>
          </View>
        )}

        {/* Horizontal Row: Countdown Timer | Claim Button */}
        <View style={styles.actionRow}>
          {/* Countdown Timer with pulse animation when urgent */}
          <Animated.View
            style={[
              styles.timerContainer,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <Icon name="time-outline" size={16} color={urgencyColor} />
            <Text style={[styles.timerText, { color: urgencyColor }]}>
              {timeRemaining}
            </Text>
          </Animated.View>

          {/* Claim Button */}
          <View style={styles.claimButtonContainer}>
            <ClaimButton
              offer={offer}
              userClaim={userClaim}
              isCheckedIn={isCheckedIn}
              compact={true}
              onPress={() => {
                // Navigate to venue detail screen
                onPress();
              }}
              onNavigate={onNavigate}
            />
          </View>
        </View>

        {/* Claims Remaining */}
        <Animated.View
          style={[
            styles.claimsContainer,
            {
              transform: [{ scale: claimCountAnim }],
            },
          ]}
        >
          <Icon name="people-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.claimsText, { color: theme.colors.textSecondary }]}>
            {isFull ? 'All claimed' : `${remainingClaims} of ${offer.max_claims} left`}
          </Text>
        </Animated.View>

        {/* Progress Bar */}
        {!isFull && (
          <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: `${claimsPercentage}%`,
                  backgroundColor: urgencyColor,
                },
              ]}
            />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    minHeight: CARD_MIN_HEIGHT,
    padding: 16,
    borderRadius: 16,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  urgencyBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  urgencyText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 8,
    paddingRight: 80, // Space for urgency badge
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 4,
  },
  venueName: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 4,
    marginLeft: 18, // Align with venue name (icon width + gap)
  },
  distanceText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  timerText: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  claimButtonContainer: {
    flex: 2,
  },
  claimsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  claimsText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});
