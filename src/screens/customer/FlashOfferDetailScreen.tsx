/**
 * FlashOfferDetailScreen (Customer View)
 * 
 * Displays flash offer details for customers.
 * Shows offer information, countdown timer, remaining claims, and claim button.
 * Handles navigation from push notifications.
 * 
 * Requirements: Task 12.2 - Handle notification tap
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { FlashOfferService, type FlashOfferWithStats } from '../../services/api/flashOffers';
import { ClaimService } from '../../services/api/flashOfferClaims';
import { FlashOfferAnalyticsService } from '../../services/api/flashOfferAnalytics';
import { NetworkErrorHandler } from '../../utils/errors/NetworkErrorHandler';
import { RaceConditionHandler, detectRaceCondition } from '../../utils/errors/RaceConditionHandler';
import { supabase } from '../../lib/supabase';
import { useCountdownTimer } from '../../hooks/useCountdownTimer';
import { useRealtimeOffer } from '../../hooks/useRealtimeOffer';
import { DetailScreenSkeleton } from '../../components/flashOffer/SkeletonLoaders';
import { fadeIn, scaleIn, countdownPulse, pulse } from '../../utils/animations';
import { triggerSuccessHaptic, triggerLightHaptic } from '../../utils/haptics';
import { HelpText } from '../../components/shared';
import Icon from 'react-native-vector-icons/Ionicons';

type FlashOfferDetailScreenProps = {
  navigation: any;
  route: any;
};

const FlashOfferDetailScreen: React.FC<FlashOfferDetailScreenProps> = ({ navigation, route }) => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const { offerId, venueName } = route.params;
  
  const [offer, setOffer] = useState<FlashOfferWithStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const timerPulseAnim = useRef(new Animated.Value(1)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  // Use real-time offer updates hook
  const {
    offer: realtimeOffer,
    loading: realtimeLoading,
    refetch: refetchRealtimeOffer,
  } = useRealtimeOffer({
    offerId,
    enabled: true,
    onOfferUpdate: (updatedOffer) => {
      console.log('📊 Offer updated:', {
        claimed: updatedOffer.claimed_count,
        max: updatedOffer.max_claims,
        status: updatedOffer.status,
      });
    },
    onOfferFull: () => {
      Alert.alert(
        'Offer Full',
        'This offer has reached its claim limit. Check back later for new offers!',
        [{ text: 'OK' }]
      );
    },
    onOfferExpired: () => {
      Alert.alert(
        'Offer Expired',
        'This offer has expired. Check out other active offers nearby!',
        [{ text: 'OK' }]
      );
    },
  });

  // Use countdown timer hook
  const { timeRemaining, isExpired: timerExpired, totalSeconds } = useCountdownTimer(
    offer?.end_time || realtimeOffer?.end_time || new Date().toISOString()
  );

  // Determine if timer is urgent (less than 5 minutes)
  const isUrgent = !timerExpired && totalSeconds < 300;

  // Entrance animation
  useEffect(() => {
    if (!loading && offer) {
      Animated.parallel([
        fadeIn(fadeAnim, 300),
        scaleIn(scaleAnim, 300),
      ]).start();
    }
  }, [loading, offer]);

  // Pulse animation for urgent countdown
  useEffect(() => {
    if (isUrgent && !timerExpired) {
      const pulseAnimation = countdownPulse(timerPulseAnim);
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    } else {
      Animated.timing(timerPulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isUrgent, timerExpired]);

  // Button press animation
  const animateButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadOfferDetails = useCallback(async () => {
    try {
      setNetworkError(false);
      const offerData = await FlashOfferService.getOfferDetails(offerId);
      setOffer(offerData);

      // Check if user already claimed this offer
      if (user) {
        const eligibility = await ClaimService.validateClaimEligibility(offerId, user.id);
        setAlreadyClaimed(!eligibility.eligible && eligibility.reason === 'You have already claimed this offer');
        
        // Check if user is checked in by looking at the reason
        const isCheckedInAtVenue = eligibility.eligible || 
          eligibility.reason !== 'You must be checked in to this venue to claim this offer';
        setIsCheckedIn(isCheckedInAtVenue);
      }
    } catch (error) {
      console.error('Error loading offer details:', error);
      
      // Check if it's a network error
      if (NetworkErrorHandler.isNetworkError(error)) {
        setNetworkError(true);
        Alert.alert(
          'Connection Error',
          NetworkErrorHandler.getUserMessage(error),
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Retry', onPress: () => loadOfferDetails() },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to load offer details');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [offerId, user]);

  // Sync real-time offer data with detailed offer data
  useEffect(() => {
    if (realtimeOffer && offer) {
      // Update the offer with real-time data while preserving stats
      setOffer({
        ...offer,
        ...realtimeOffer,
        stats: offer.stats, // Keep the stats from detailed fetch
      });
    }
  }, [realtimeOffer]);

  useEffect(() => {
    loadOfferDetails();

    // Track view event when screen loads
    if (user) {
      FlashOfferAnalyticsService.trackView(offerId, user.id).catch(err =>
        console.warn('Failed to track view event:', err)
      );
    }
  }, [loadOfferDetails, offerId, user]);

  const handleClaim = async () => {
    if (!user || !offer) return;

    // Animate button press
    animateButtonPress();
    
    // Trigger light haptic feedback for button press
    triggerLightHaptic();

    // Store original offer state for potential rollback
    const originalOffer = { ...offer };
    let updateId: string | null = null;

    try {
      setClaiming(true);
      setNetworkError(false);

      // Apply optimistic update - increment claimed count
      updateId = RaceConditionHandler.applyOptimisticUpdate(
        `offer_${offerId}`,
        offer,
        {
          ...offer,
          claimed_count: offer.claimed_count + 1,
        }
      );

      // Update UI optimistically
      setOffer({
        ...offer,
        claimed_count: offer.claimed_count + 1,
      });

      const claim = await ClaimService.claimOffer(offerId, user.id);

      // Confirm the optimistic update
      if (updateId) {
        RaceConditionHandler.confirmUpdate(`offer_${offerId}`, updateId);
      }

      // Trigger success haptic feedback for successful claim
      triggerSuccessHaptic();

      // Navigate to claim confirmation screen
      navigation.navigate('ClaimConfirmation', {
        claim,
        offerTitle: offer.title,
        venueName: venueName || 'Venue',
      });
    } catch (error) {
      console.error('Error claiming offer:', error);

      // Rollback optimistic update
      if (updateId) {
        const rolledBack = RaceConditionHandler.rollbackUpdate(updateId);
        if (rolledBack) {
          setOffer(rolledBack);
        } else {
          setOffer(originalOffer);
        }
      }

      // Check for race condition errors
      const raceConditionError = detectRaceCondition(error);
      if (raceConditionError) {
        Alert.alert(
          'Offer Status Changed',
          raceConditionError.message,
          [
            { text: 'OK', onPress: () => loadOfferDetails() },
          ]
        );
        return;
      }
      
      // Check if it's a network error
      if (NetworkErrorHandler.isNetworkError(error)) {
        setNetworkError(true);
        Alert.alert(
          'Connection Error',
          NetworkErrorHandler.getUserMessage(error),
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Retry', onPress: () => handleClaim() },
          ]
        );
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Failed to claim offer';
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setClaiming(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadOfferDetails();
  };

  const handleNavigateToVenue = () => {
    if (offer) {
      navigation.navigate('VenueDetail', {
        venueId: offer.venue_id,
        venueName: venueName || 'Venue',
      });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Flash Offer
          </Text>
          <View style={styles.backButton} />
        </View>
        <ScrollView style={styles.scrollView}>
          <DetailScreenSkeleton />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!offer) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
            Offer not found
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isExpired = offer.status === 'expired' || timerExpired;
  const isFull = offer.status === 'full' || offer.claimed_count >= offer.max_claims;
  const canClaim = !isExpired && !isFull && !alreadyClaimed && isCheckedIn;
  const remainingClaims = offer.max_claims - offer.claimed_count;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
      >
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Flash Offer
            </Text>
            <View style={styles.backButton} />
          </View>

          {/* Offer Details */}
          <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
            <View style={styles.offerHeader}>
              <Text style={[styles.offerTitle, { color: theme.colors.text }]}>
                🔥 {offer.title}
              </Text>
              {offer.status === 'active' && (
                <View style={[styles.statusBadge, styles.activeBadge]}>
                  <Text style={styles.statusText}>Active</Text>
                </View>
              )}
              {isExpired && (
                <View style={[styles.statusBadge, styles.expiredBadge]}>
                  <Text style={styles.statusText}>Expired</Text>
                </View>
              )}
              {isFull && !isExpired && (
                <View style={[styles.statusBadge, styles.fullBadge]}>
                  <Text style={styles.statusText}>Full</Text>
                </View>
              )}
            </View>

            <Text style={[styles.offerDescription, { color: theme.colors.textSecondary }]}>
              {offer.description}
            </Text>

            {/* Venue Info */}
            <TouchableOpacity
              style={styles.venueInfo}
              onPress={handleNavigateToVenue}
            >
              <Icon name="location" size={20} color={theme.colors.primary} />
              <Text style={[styles.venueName, { color: theme.colors.primary }]}>
                {venueName || 'View Venue'}
              </Text>
              <Icon name="chevron-forward" size={20} color={theme.colors.primary} />
            </TouchableOpacity>

            {/* Timer with pulse animation when urgent */}
            {!isExpired && (
              <Animated.View
                style={[
                  styles.timerContainer,
                  {
                    transform: [{ scale: timerPulseAnim }],
                  },
                ]}
              >
                <Icon
                  name="time-outline"
                  size={24}
                  color={isUrgent ? theme.colors.error : theme.colors.primary}
                />
                <Text
                  style={[
                    styles.timerText,
                    { color: isUrgent ? theme.colors.error : theme.colors.text },
                  ]}
                >
                  {timeRemaining}
                </Text>
              </Animated.View>
            )}

            {/* Claims Info */}
            <View style={styles.claimsInfo}>
              <View style={styles.claimsStat}>
                <Text style={[styles.claimsNumber, { color: theme.colors.text }]}>
                  {remainingClaims}
                </Text>
                <Text style={[styles.claimsLabel, { color: theme.colors.textSecondary }]}>
                  Remaining
                </Text>
              </View>
              <View style={styles.claimsStat}>
                <Text style={[styles.claimsNumber, { color: theme.colors.text }]}>
                  {offer.claimed_count}
                </Text>
                <Text style={[styles.claimsLabel, { color: theme.colors.textSecondary }]}>
                  Claimed
                </Text>
              </View>
              <View style={styles.claimsStat}>
                <Text style={[styles.claimsNumber, { color: theme.colors.text }]}>
                  {offer.max_claims}
                </Text>
                <Text style={[styles.claimsLabel, { color: theme.colors.textSecondary }]}>
                  Total
                </Text>
              </View>
            </View>
          </View>

          {/* Check-in Requirement */}
          {!isCheckedIn && !alreadyClaimed && !isExpired && !isFull && (
            <>
              <View style={[styles.infoCard, { backgroundColor: theme.colors.card }]}>
                <Icon name="information-circle" size={24} color={theme.colors.primary} />
                <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                  You must be checked in at this venue to claim this offer
                </Text>
              </View>
              <HelpText
                text="Check in at the venue from the venue detail screen to unlock this offer"
                type="tip"
              />
            </>
          )}

          {/* Already Claimed */}
          {alreadyClaimed && (
            <View style={[styles.infoCard, { backgroundColor: theme.colors.card }]}>
              <Icon name="checkmark-circle" size={24} color="#4CAF50" />
              <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                You've already claimed this offer. Check "My Claims" to view your token.
              </Text>
            </View>
          )}

          {/* Network Error Banner */}
          {networkError && (
            <View style={[styles.infoCard, styles.errorCard, { backgroundColor: '#FFEBEE' }]}>
              <Icon name="cloud-offline-outline" size={24} color="#F44336" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.infoText, { color: '#C62828', marginLeft: 0 }]}>
                  Connection issue detected. Some features may not work properly.
                </Text>
                <TouchableOpacity
                  style={{ marginTop: 8 }}
                  onPress={() => loadOfferDetails()}
                >
                  <Text style={{ color: '#F44336', fontWeight: '600' }}>Tap to retry</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Offer Full Message */}
          {isFull && !isExpired && (
            <View style={[styles.infoCard, styles.warningCard, { backgroundColor: '#FFF3E0' }]}>
              <Icon name="people" size={24} color="#FF9800" />
              <Text style={[styles.infoText, { color: '#E65100' }]}>
                This offer has reached its claim limit. All {offer.max_claims} claims have been taken.
              </Text>
            </View>
          )}

          {/* Offer Expired Message */}
          {isExpired && (
            <View style={[styles.infoCard, styles.errorCard, { backgroundColor: '#FFEBEE' }]}>
              <Icon name="time-outline" size={24} color="#F44336" />
              <Text style={[styles.infoText, { color: '#C62828' }]}>
                This offer has expired. Check out other active offers nearby!
              </Text>
            </View>
          )}

          {/* Claim Button with animation */}
          {canClaim && (
            <Animated.View
              style={{
                transform: [{ scale: buttonScaleAnim }],
              }}
            >
              <TouchableOpacity
                style={[
                  styles.claimButton,
                  { backgroundColor: theme.colors.primary },
                  claiming && styles.claimButtonDisabled,
                ]}
                onPress={handleClaim}
                disabled={claiming}
              >
                {claiming ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Icon name="flash" size={24} color="#FFFFFF" />
                    <Text style={styles.claimButtonText}>Claim Now</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* View My Claims Button */}
          {alreadyClaimed && (
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: theme.colors.primary }]}
              onPress={() => navigation.navigate('Settings', { screen: 'MyClaims' })}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.colors.primary }]}>
                View My Claims
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  card: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  offerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  offerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 8,
  },
  activeBadge: {
    backgroundColor: '#4CAF50',
  },
  expiredBadge: {
    backgroundColor: '#9E9E9E',
  },
  fullBadge: {
    backgroundColor: '#FF9800',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  offerDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  venueInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  venueName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginBottom: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)', // Darker border
  },
  timerText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  claimsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  claimsStat: {
    alignItems: 'center',
  },
  claimsNumber: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  claimsLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
  },
  warningCard: {
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  errorCard: {
    borderWidth: 1,
    borderColor: '#F44336',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    marginLeft: 12,
    lineHeight: 20,
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 18,
    borderRadius: 12,
  },
  claimButtonDisabled: {
    opacity: 0.6,
  },
  claimButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    margin: 16,
    marginTop: 0,
    padding: 18,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FlashOfferDetailScreen;
