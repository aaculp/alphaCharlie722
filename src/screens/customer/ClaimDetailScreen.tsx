import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { ClaimService } from '../../services/api/flashOfferClaims';
import type { FlashOfferClaimWithDetails } from '../../types/flashOfferClaim.types';
import type { RootTabParamList } from '../../types/navigation.types';
import { RESPONSIVE_SPACING } from '../../utils/responsive';
import { useClaimExpirationTimer } from '../../hooks/useCountdownTimer';
import { DetailScreenSkeleton } from '../../components/flashOffer/SkeletonLoaders';
import { useSubscriptionManager } from '../../hooks/useSubscriptionManager';
import { useFeedbackManager } from '../../hooks/useFeedbackManager';
import { stateCache } from '../../utils/cache/StateCache';
import { ConnectionWarningBanner } from '../../components/shared/ConnectionWarningBanner';
import type { ConnectionState } from '../../services/SubscriptionManager';
import { formatCurrency } from '../../utils/currency';

type ClaimDetailScreenRouteProp = RouteProp<
  { ClaimDetail: { claimId: string } },
  'ClaimDetail'
>;

const ClaimDetailScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();
  const route = useRoute<ClaimDetailScreenRouteProp>();
  const { claimId } = route.params;

  const [claim, setClaim] = useState<FlashOfferClaimWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');

  // Get singleton instances
  const subscriptionManager = useSubscriptionManager();
  const feedbackManager = useFeedbackManager();

  // Use countdown timer hook for claim expiration
  const { timeRemaining, isExpired: timerExpired } = useClaimExpirationTimer(
    claim?.expires_at || new Date().toISOString()
  );

  useEffect(() => {
    // Initialize state cache if not already initialized
    stateCache.initialize().catch(err => {
      console.error('Failed to initialize state cache:', err);
    });

    // Load initial claim from cache
    const cachedClaim = stateCache.getClaim(claimId);
    if (cachedClaim) {
      console.log('📦 Loaded claim from cache:', claimId);
      // Note: We still need to load full details from server
      // Cache only has basic claim data, not full details with venue/offer
    }

    // Load full claim details from server
    loadClaimDetails();

    // Set up real-time subscription using SubscriptionManager
    console.log('📡 Setting up real-time subscription for claim:', claimId);
    const subscription = subscriptionManager.subscribeToClaimUpdates(
      claimId,
      (update) => {
        console.log('🔄 Claim update received:', update);
        
        // Update state cache with new data
        stateCache.updateClaim(claimId, {
          claimId: update.claimId,
          status: update.status,
          updatedAt: update.updatedAt,
          rejectionReason: update.rejectionReason,
        });
        
        // Reload full claim details to get complete data
        loadClaimDetails();
        
        // Trigger appropriate feedback based on status
        if (update.status === 'redeemed') {
          feedbackManager.showAcceptedFeedback(claimId);
          
          // Announce to screen reader
          AccessibilityInfo.announceForAccessibility(
            'Your offer has been redeemed! Thank you for using this promotion.'
          );
        } else if (update.status === 'expired') {
          // Handle expiration (no haptic, just update UI)
          AccessibilityInfo.announceForAccessibility(
            'This claim has expired.'
          );
        }
      },
      (error) => {
        console.error('❌ Subscription error:', error);
        
        // Show connection warning for connection failures
        if (error.type === 'connection_failed' && error.retryable) {
          feedbackManager.showConnectionWarning();
        }
      }
    );

    // Monitor connection state changes
    const unsubscribeState = subscriptionManager.onConnectionStateChange((state) => {
      console.log('📡 Connection state changed:', state);
      setConnectionState(state);
      
      // Show/hide connection warning based on state
      if (state === 'connected') {
        feedbackManager.hideConnectionWarning();
      } else if (state === 'failed') {
        feedbackManager.showConnectionWarning();
      }
    });

    // Cleanup on unmount
    return () => {
      console.log('🔌 Unsubscribing from claim updates');
      subscription.unsubscribe();
      unsubscribeState();
    };
  }, [claimId, subscriptionManager, feedbackManager]);

  const loadClaimDetails = async () => {
    try {
      setError(null);
      const claimData = await ClaimService.getClaimWithDetails(claimId);
      
      if (!claimData) {
        setError('Claim not found');
        setIsLoading(false);
        return;
      }
      
      setClaim(claimData);
      setIsLoading(false);
    } catch (err) {
      console.error('Error loading claim details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load claim details');
      setIsLoading(false);
    }
  };

  const handleNavigateToVenue = () => {
    if (!claim?.venue) return;
    // Navigate to venue detail screen
    // TODO: Implement navigation when venue detail screen is available
    console.log('Navigate to venue:', claim.venue.id);
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['top']}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text
            style={[
              styles.headerTitle,
              { color: theme.colors.text, fontFamily: theme.fonts.secondary.bold },
            ]}
          >
            Claim Details
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <DetailScreenSkeleton />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error || !claim) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['top']}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text
            style={[
              styles.headerTitle,
              { color: theme.colors.text, fontFamily: theme.fonts.secondary.bold },
            ]}
          >
            Claim Details
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={64} color={theme.colors.textSecondary} />
          <Text
            style={[
              styles.errorTitle,
              { color: theme.colors.text, fontFamily: theme.fonts.secondary.semiBold },
            ]}
          >
            Failed to Load Claim
          </Text>
          <Text
            style={[
              styles.errorSubtitle,
              { color: theme.colors.textSecondary, fontFamily: theme.fonts.secondary.regular },
            ]}
          >
            {error || 'Claim not found'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={loadClaimDetails}
          >
            <Text
              style={[
                styles.retryButtonText,
                { fontFamily: theme.fonts.secondary.semiBold },
              ]}
            >
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isActive = claim.status === 'active' && !timerExpired;
  const isRedeemed = claim.status === 'redeemed';
  const isExpired = claim.status === 'expired' || timerExpired;

  const statusColor = isActive
    ? theme.colors.success
    : isRedeemed
    ? theme.colors.primary
    : theme.colors.textSecondary;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            { color: theme.colors.text, fontFamily: theme.fonts.secondary.bold },
          ]}
        >
          Claim Details
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Connection Warning Banner */}
      {connectionState !== 'connected' && connectionState !== 'disconnected' && (
        <ConnectionWarningBanner
          message={
            connectionState === 'reconnecting'
              ? 'Reconnecting...'
              : connectionState === 'failed'
              ? 'Real-time updates unavailable'
              : 'Connecting...'
          }
          onRetry={connectionState === 'failed' ? loadClaimDetails : undefined}
        />
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
          <Icon
            name={
              isActive
                ? 'checkmark-circle'
                : isRedeemed
                ? 'checkmark-done-circle'
                : 'time-outline'
            }
            size={20}
            color={statusColor}
          />
          <Text
            style={[
              styles.statusText,
              { color: statusColor, fontFamily: theme.fonts.secondary.semiBold },
            ]}
          >
            {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
          </Text>
        </View>

        {/* Token Display (if not redeemed) */}
        {!isRedeemed && (
          <View style={[styles.tokenCard, { backgroundColor: theme.colors.card }]}>
            <Text
              style={[
                styles.tokenLabel,
                { color: theme.colors.textSecondary, fontFamily: theme.fonts.secondary.regular },
              ]}
            >
              Your Token
            </Text>
            <Text
              style={[
                styles.tokenValue,
                { color: theme.colors.text, fontFamily: theme.fonts.primary.bold },
              ]}
            >
              {claim.token}
            </Text>
            <Text
              style={[
                styles.tokenInstruction,
                { color: theme.colors.textSecondary, fontFamily: theme.fonts.secondary.regular },
              ]}
            >
              Show this code to venue staff
            </Text>
          </View>
        )}

        {/* Expiration Countdown (if active) */}
        {isActive && (
          <View style={[styles.countdownCard, { backgroundColor: theme.colors.card }]}>
            <Icon name="time-outline" size={24} color={theme.colors.primary} />
            <View style={styles.countdownContent}>
              <Text
                style={[
                  styles.countdownLabel,
                  { color: theme.colors.textSecondary, fontFamily: theme.fonts.secondary.regular },
                ]}
              >
                Expires in
              </Text>
              <Text
                style={[
                  styles.countdownValue,
                  { color: theme.colors.text, fontFamily: theme.fonts.primary.bold },
                ]}
              >
                {timeRemaining}
              </Text>
            </View>
          </View>
        )}

        {/* Redemption Details (if redeemed) */}
        {isRedeemed && claim.redeemed_at && (
          <View style={[styles.redemptionCard, { backgroundColor: theme.colors.card }]}>
            <Icon name="checkmark-done-circle" size={24} color={theme.colors.success} />
            <View style={styles.redemptionContent}>
              <Text
                style={[
                  styles.redemptionLabel,
                  { color: theme.colors.textSecondary, fontFamily: theme.fonts.secondary.regular },
                ]}
              >
                Redeemed on
              </Text>
              <Text
                style={[
                  styles.redemptionValue,
                  { color: theme.colors.text, fontFamily: theme.fonts.secondary.semiBold },
                ]}
              >
                {new Date(claim.redeemed_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>
        )}

        {/* Offer Details */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.text, fontFamily: theme.fonts.secondary.semiBold },
            ]}
          >
            Offer Details
          </Text>

          <Text
            style={[
              styles.offerTitle,
              { color: theme.colors.text, fontFamily: theme.fonts.secondary.bold },
            ]}
          >
            {claim.offer.title}
          </Text>

          <Text
            style={[
              styles.offerDescription,
              { color: theme.colors.textSecondary, fontFamily: theme.fonts.secondary.regular },
            ]}
          >
            {claim.offer.description}
          </Text>

          <View style={[styles.valueCapBadge, { backgroundColor: theme.colors.primary }]}>
            <Text
              style={[
                styles.valueCapText,
                { color: '#FFFFFF', fontFamily: theme.fonts.secondary.semiBold },
              ]}
            >
              {formatCurrency(claim.offer.claim_value)}
            </Text>
          </View>
        </View>

        {/* Venue Details */}
        <TouchableOpacity
          style={[styles.venueCard, { backgroundColor: theme.colors.card }]}
          onPress={handleNavigateToVenue}
          activeOpacity={0.7}
        >
          <View style={styles.venueHeader}>
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.colors.text, fontFamily: theme.fonts.secondary.semiBold },
              ]}
            >
              Venue
            </Text>
            <Icon name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </View>

          {claim.venue.image_url && (
            <Image
              source={{ uri: claim.venue.image_url }}
              style={styles.venueImage}
              resizeMode="cover"
            />
          )}

          <Text
            style={[
              styles.venueName,
              { color: theme.colors.text, fontFamily: theme.fonts.secondary.bold },
            ]}
          >
            {claim.venue.name}
          </Text>

          <View style={styles.venueLocationRow}>
            <Icon name="location-outline" size={16} color={theme.colors.textSecondary} />
            <Text
              style={[
                styles.venueLocation,
                { color: theme.colors.textSecondary, fontFamily: theme.fonts.secondary.regular },
              ]}
            >
              {claim.venue.location}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Claim Info */}
        <View style={[styles.infoCard, { backgroundColor: theme.colors.card }]}>
          <View style={styles.infoRow}>
            <Text
              style={[
                styles.infoLabel,
                { color: theme.colors.textSecondary, fontFamily: theme.fonts.secondary.regular },
              ]}
            >
              Claimed on
            </Text>
            <Text
              style={[
                styles.infoValue,
                { color: theme.colors.text, fontFamily: theme.fonts.secondary.semiBold },
              ]}
            >
              {new Date(claim.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>

          {!isRedeemed && (
            <View style={styles.infoRow}>
              <Text
                style={[
                  styles.infoLabel,
                  { color: theme.colors.textSecondary, fontFamily: theme.fonts.secondary.regular },
                ]}
              >
                Expires on
              </Text>
              <Text
                style={[
                  styles.infoValue,
                  { color: theme.colors.text, fontFamily: theme.fonts.secondary.semiBold },
                ]}
              >
                {new Date(claim.expires_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: RESPONSIVE_SPACING.sectionHorizontal,
    paddingVertical: RESPONSIVE_SPACING.elementGap + 4,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
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
    padding: RESPONSIVE_SPACING.sectionHorizontal,
  },
  errorTitle: {
    marginTop: RESPONSIVE_SPACING.elementGap + 8,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorSubtitle: {
    marginTop: RESPONSIVE_SPACING.elementGap,
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: RESPONSIVE_SPACING.cardMargin + 8,
    paddingVertical: RESPONSIVE_SPACING.buttonVertical,
    paddingHorizontal: RESPONSIVE_SPACING.buttonHorizontal,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    padding: RESPONSIVE_SPACING.sectionHorizontal,
    paddingBottom: 100,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: RESPONSIVE_SPACING.cardMargin,
  },
  statusText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  tokenCard: {
    padding: RESPONSIVE_SPACING.cardMargin,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: RESPONSIVE_SPACING.cardMargin,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tokenLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  tokenValue: {
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: 4,
    marginBottom: 8,
  },
  tokenInstruction: {
    fontSize: 14,
    textAlign: 'center',
  },
  countdownCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: RESPONSIVE_SPACING.elementGap + 4,
    borderRadius: 12,
    marginBottom: RESPONSIVE_SPACING.cardMargin,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  countdownContent: {
    marginLeft: 12,
    flex: 1,
  },
  countdownLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  countdownValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  redemptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: RESPONSIVE_SPACING.elementGap + 4,
    borderRadius: 12,
    marginBottom: RESPONSIVE_SPACING.cardMargin,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  redemptionContent: {
    marginLeft: 12,
    flex: 1,
  },
  redemptionLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  redemptionValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    padding: RESPONSIVE_SPACING.elementGap + 4,
    borderRadius: 12,
    marginBottom: RESPONSIVE_SPACING.cardMargin,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: RESPONSIVE_SPACING.elementGap,
  },
  offerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  offerDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  valueCapBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  valueCapText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  venueCard: {
    padding: RESPONSIVE_SPACING.elementGap + 4,
    borderRadius: 12,
    marginBottom: RESPONSIVE_SPACING.cardMargin,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  venueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: RESPONSIVE_SPACING.elementGap,
  },
  venueImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
  },
  venueName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  venueLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  venueLocation: {
    marginLeft: 4,
    fontSize: 14,
  },
  infoCard: {
    padding: RESPONSIVE_SPACING.elementGap + 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ClaimDetailScreen;
