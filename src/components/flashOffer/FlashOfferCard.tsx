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
import { useCountdownTimer } from '../../hooks/useCountdownTimer';
import { useRealtimeOffer } from '../../hooks/useRealtimeOffer';
import { fadeIn, scaleIn, countdownPulse } from '../../utils/animations';
import { triggerLightHaptic } from '../../utils/haptics';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;

interface FlashOfferCardProps {
  offer: FlashOffer;
  venueName: string;
  onPress: () => void;
  enableRealtime?: boolean;
}

/**
 * FlashOfferCard component displays a flash offer with countdown timer and urgency indicators
 * 
 * Features:
 * - Real-time countdown timer with pulse animation when urgent
 * - Remaining claims display
 * - Visual urgency indicators (low claims, ending soon)
 * - Optional real-time claim count updates
 * - Smooth entrance animations
 * - Responsive design
 */
export const FlashOfferCard: React.FC<FlashOfferCardProps> = ({
  offer: initialOffer,
  venueName,
  onPress,
  enableRealtime = false,
}) => {
  const { theme } = useTheme();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Use real-time updates if enabled
  const { offer: realtimeOffer } = useRealtimeOffer({
    offerId: initialOffer.id,
    enabled: enableRealtime,
  });
  
  // Use real-time offer if available, otherwise use initial offer
  const offer = realtimeOffer || initialOffer;
  
  // Use countdown timer hook
  const { timeRemaining, isExpired, totalSeconds } = useCountdownTimer(offer.end_time);
  
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

        {/* Countdown Timer with pulse animation when urgent */}
        <Animated.View
          style={[
            styles.timerRow,
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

        {/* Claims Remaining */}
        <View style={styles.claimsRow}>
          <View style={styles.claimsInfo}>
            <Icon name="people-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.claimsText, { color: theme.colors.textSecondary }]}>
              {isFull ? 'All claimed' : `${remainingClaims} of ${offer.max_claims} left`}
            </Text>
          </View>

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
        </View>

        {/* Value Cap (if present) */}
        {offer.value_cap && (
          <View style={[styles.valueBadge, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.valueText}>{offer.value_cap}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
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
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  timerText: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  claimsRow: {
    marginBottom: 8,
  },
  claimsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  claimsText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  valueBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
  },
  valueText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
});
