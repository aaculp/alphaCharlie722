/**
 * ClaimConfirmationScreen
 * 
 * Displays success message after claiming a flash offer.
 * Shows the 6-digit token prominently with expiration time.
 * Provides navigation to "My Claims" screen.
 * 
 * Requirements: Task 10.4 - Create ClaimConfirmationScreen
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import type { FlashOfferClaim } from '../../types/flashOfferClaim.types';
import { successCelebration, bounceIn } from '../../utils/animations';
import { triggerSuccessHaptic } from '../../utils/haptics';

type ClaimConfirmationScreenProps = {
  navigation: any;
  route: {
    params: {
      claim: FlashOfferClaim;
      offerTitle: string;
      venueName: string;
    };
  };
};

const ClaimConfirmationScreen: React.FC<ClaimConfirmationScreenProps> = ({
  navigation,
  route,
}) => {
  const { theme } = useTheme();
  const { claim, offerTitle, venueName } = route.params;
  
  const [scaleAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [tokenScaleAnim] = useState(new Animated.Value(0.8));
  const [expirationSlideAnim] = useState(new Animated.Value(50));
  const [buttonFadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Trigger success haptic feedback when screen loads
    triggerSuccessHaptic();
    
    // Orchestrated animation sequence
    Animated.sequence([
      // Success icon celebration
      Animated.parallel([
        successCelebration(scaleAnim, fadeAnim),
      ]),
      // Token card bounce in
      Animated.delay(100),
      bounceIn(tokenScaleAnim),
      // Expiration info slide in
      Animated.parallel([
        Animated.spring(expirationSlideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(buttonFadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handleViewMyClaims = () => {
    navigation.navigate('Settings', { screen: 'MyClaims' });
  };

  const handleDone = () => {
    // Navigate back to home or previous screen
    navigation.navigate('Home');
  };

  const formatExpirationDate = (expiresAt: string) => {
    const date = new Date(expiresAt);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.content}>
        {/* Success Icon */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: `${theme.colors.success}20` },
            ]}
          >
            <Icon name="checkmark-circle" size={80} color={theme.colors.success} />
          </View>
        </Animated.View>

        {/* Success Message */}
        <Animated.View style={[styles.messageContainer, { opacity: fadeAnim }]}>
          <Text
            style={[
              styles.successTitle,
              { color: theme.colors.text, fontFamily: theme.fonts.secondary.bold },
            ]}
          >
            Offer Claimed!
          </Text>
          <Text
            style={[
              styles.successSubtitle,
              { color: theme.colors.textSecondary, fontFamily: theme.fonts.secondary.regular },
            ]}
          >
            {offerTitle}
          </Text>
          <Text
            style={[
              styles.venueName,
              { color: theme.colors.textSecondary, fontFamily: theme.fonts.secondary.regular },
            ]}
          >
            at {venueName}
          </Text>
        </Animated.View>

        {/* Token Display with bounce animation */}
        <Animated.View
          style={[
            styles.tokenCard,
            {
              backgroundColor: theme.colors.card,
              transform: [{ scale: tokenScaleAnim }],
            },
          ]}
        >
          <Text
            style={[
              styles.tokenLabel,
              { color: theme.colors.textSecondary, fontFamily: theme.fonts.secondary.regular },
            ]}
          >
            Your Redemption Token
          </Text>
          <Text
            style={[
              styles.tokenValue,
              { color: theme.colors.text, fontFamily: theme.fonts.primary.bold },
            ]}
          >
            {claim.token}
          </Text>
          <View style={styles.instructionContainer}>
            <Icon name="information-circle-outline" size={20} color={theme.colors.primary} />
            <Text
              style={[
                styles.instructionText,
                { color: theme.colors.textSecondary, fontFamily: theme.fonts.secondary.regular },
              ]}
            >
              Show this code to venue staff
            </Text>
          </View>
        </Animated.View>

        {/* Expiration Info with slide animation */}
        <Animated.View
          style={[
            styles.expirationCard,
            {
              backgroundColor: theme.colors.card,
              transform: [{ translateY: expirationSlideAnim }],
              opacity: buttonFadeAnim,
            },
          ]}
        >
          <Icon name="time-outline" size={24} color={theme.colors.primary} />
          <View style={styles.expirationContent}>
            <Text
              style={[
                styles.expirationLabel,
                { color: theme.colors.textSecondary, fontFamily: theme.fonts.secondary.regular },
              ]}
            >
              Expires on
            </Text>
            <Text
              style={[
                styles.expirationValue,
                { color: theme.colors.text, fontFamily: theme.fonts.secondary.semiBold },
              ]}
            >
              {formatExpirationDate(claim.expires_at)}
            </Text>
          </View>
        </Animated.View>

        {/* Action Buttons with fade animation */}
        <Animated.View style={[styles.buttonContainer, { opacity: buttonFadeAnim }]}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleViewMyClaims}
            activeOpacity={0.8}
          >
            <Icon name="ticket" size={20} color="#FFFFFF" />
            <Text
              style={[
                styles.primaryButtonText,
                { fontFamily: theme.fonts.secondary.semiBold },
              ]}
            >
              View My Claims
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              { borderColor: theme.colors.textSecondary },
            ]}
            onPress={handleDone}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.secondaryButtonText,
                { color: theme.colors.text, fontFamily: theme.fonts.secondary.semiBold },
              ]}
            >
              Done
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 18,
    marginBottom: 4,
    textAlign: 'center',
  },
  venueName: {
    fontSize: 16,
    textAlign: 'center',
  },
  tokenCard: {
    width: '100%',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  tokenLabel: {
    fontSize: 14,
    marginBottom: 12,
  },
  tokenValue: {
    fontSize: 56,
    fontWeight: '700',
    letterSpacing: 8,
    marginBottom: 16,
  },
  instructionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.08)', // Darker background
  },
  instructionText: {
    fontSize: 14,
    marginLeft: 8,
  },
  expirationCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  expirationContent: {
    marginLeft: 12,
    flex: 1,
  },
  expirationLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  expirationValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    width: '100%',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    padding: 18,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ClaimConfirmationScreen;
