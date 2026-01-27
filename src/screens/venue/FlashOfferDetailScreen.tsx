import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { FlashOfferService, type FlashOfferWithStats } from '../../services/api/flashOffers';
import { FlashOfferAnalyticsService, type FlashOfferAnalytics } from '../../services/api/flashOfferAnalytics';
import { type FlashOfferClaim } from '../../services/api/flashOfferClaims';
import { supabase } from '../../lib/supabase';
import { DetailScreenSkeleton } from '../../components/flashOffer/SkeletonLoaders';
import Icon from 'react-native-vector-icons/Ionicons';

type FlashOfferDetailScreenProps = {
  navigation: any;
  route: any;
};

const FlashOfferDetailScreen: React.FC<FlashOfferDetailScreenProps> = ({ navigation, route }) => {
  const { theme, isDark } = useTheme();
  const { offerId } = route.params;
  const [offer, setOffer] = useState<FlashOfferWithStats | null>(null);
  const [analytics, setAnalytics] = useState<FlashOfferAnalytics | null>(null);
  const [claims, setClaims] = useState<FlashOfferClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const loadOfferDetails = useCallback(async () => {
    try {
      const offerData = await FlashOfferService.getOfferDetails(offerId);
      setOffer(offerData);

      // Load analytics data
      const analyticsData = await FlashOfferAnalyticsService.getOfferAnalytics(offerId);
      setAnalytics(analyticsData);

      // Load claims for this offer
      const { data: claimsData, error: claimsError } = await supabase
        .from('flash_offer_claims')
        .select('*')
        .eq('offer_id', offerId)
        .order('created_at', { ascending: false });

      if (claimsError) {
        console.error('Error loading claims:', claimsError);
      } else {
        setClaims(claimsData || []);
      }
    } catch (error) {
      console.error('Error loading offer details:', error);
      Alert.alert('Error', 'Failed to load offer details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [offerId]);

  useEffect(() => {
    loadOfferDetails();

    // Set up real-time subscription for offer updates
    const offerSubscription = supabase
      .channel(`offer:${offerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'flash_offers',
          filter: `id=eq.${offerId}`,
        },
        (payload) => {
          console.log('Offer updated:', payload);
          loadOfferDetails();
        }
      )
      .subscribe();

    // Set up real-time subscription for claims updates
    const claimsSubscription = supabase
      .channel(`claims:${offerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'flash_offer_claims',
          filter: `offer_id=eq.${offerId}`,
        },
        (payload) => {
          console.log('Claims updated:', payload);
          loadOfferDetails();
        }
      )
      .subscribe();

    return () => {
      offerSubscription.unsubscribe();
      claimsSubscription.unsubscribe();
    };
  }, [offerId, loadOfferDetails]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadOfferDetails();
  }, [loadOfferDetails]);

  const handleCancelOffer = async () => {
    if (!offer) return;

    Alert.alert(
      'Cancel Offer',
      'Are you sure you want to cancel this offer? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await FlashOfferService.updateOfferStatus(offerId, 'cancelled');
              Alert.alert('Success', 'Offer cancelled successfully');
              navigation.goBack();
            } catch (error) {
              console.error('Error cancelling offer:', error);
              Alert.alert('Error', 'Failed to cancel offer');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const getTimeRemaining = (endTime: string): string => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'redeemed':
        return '#2196F3';
      case 'expired':
        return '#9E9E9E';
      default:
        return theme.colors.textSecondary;
    }
  };

  const renderClaimItem = ({ item }: { item: FlashOfferClaim }) => {
    const statusColor = getStatusColor(item.status);

    return (
      <View
        style={[
          styles.claimCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.claimHeader}>
          <View style={[styles.tokenBadge, { backgroundColor: theme.colors.primary + '20' }]}>
            <Text style={[styles.tokenText, { color: theme.colors.primary }]}>
              {item.token}
            </Text>
          </View>
          <View style={[styles.claimStatusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.claimStatusText, { color: statusColor }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={styles.claimDetails}>
          <Text style={[styles.claimLabel, { color: theme.colors.textSecondary }]}>
            Claimed: {formatDate(item.created_at)}
          </Text>
          {item.redeemed_at && (
            <Text style={[styles.claimLabel, { color: theme.colors.textSecondary }]}>
              Redeemed: {formatDate(item.redeemed_at)}
            </Text>
          )}
          {item.status === 'active' && (
            <Text style={[styles.claimLabel, { color: theme.colors.textSecondary }]}>
              Expires: {formatDate(item.expires_at)}
            </Text>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Offer Details</Text>
          <View style={styles.headerRight} />
        </View>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <DetailScreenSkeleton />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!offer) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Offer Details</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            Offer not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const timeRemaining = offer.status === 'active' ? getTimeRemaining(offer.end_time) : null;
  const claimsRemaining = offer.max_claims - offer.claimed_count;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Offer Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Offer Info Card */}
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              shadowColor: theme.colors.shadow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0 : 0.05,
              shadowRadius: 4,
              elevation: isDark ? 0 : 2,
            },
          ]}
        >
          <Text style={[styles.offerTitle, { color: theme.colors.text }]}>{offer.title}</Text>
          <Text style={[styles.offerDescription, { color: theme.colors.textSecondary }]}>
            {offer.description}
          </Text>
          {offer.value_cap && (
            <View style={[styles.valueCapBadge, { backgroundColor: theme.colors.primary + '20' }]}>
              <Icon name="pricetag" size={16} color={theme.colors.primary} />
              <Text style={[styles.valueCapText, { color: theme.colors.primary }]}>
                {offer.value_cap}
              </Text>
            </View>
          )}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Icon name="eye-outline" size={24} color="#9C27B0" />
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {offer.views_count}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Views</Text>
          </View>

          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Icon name="ticket-outline" size={24} color="#2196F3" />
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {offer.claims_count}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Claims</Text>
          </View>

          <View
            style={[
              styles.statCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Icon name="checkmark-circle-outline" size={24} color="#4CAF50" />
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {offer.redemptions_count}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Redeemed
            </Text>
          </View>
        </View>

        {/* Redeem Token Section - Moved here for easier access */}
        <TouchableOpacity
          style={[
            styles.redeemTokenButton,
            {
              backgroundColor: theme.colors.primary,
            },
          ]}
          onPress={() => navigation.navigate('TokenRedemption')}
        >
          <Icon name="scan-outline" size={24} color="#fff" />
          <Text style={styles.redeemTokenButtonText}>Redeem Token</Text>
        </TouchableOpacity>

        {/* Analytics Dashboard */}
        {analytics && (
          <View
            style={[
              styles.analyticsCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Performance Metrics
            </Text>

            {/* Conversion Rates */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <View style={styles.metricHeader}>
                  <Icon name="mail-open-outline" size={20} color="#9C27B0" />
                  <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>
                    Open Rate
                  </Text>
                </View>
                <Text style={[styles.metricValue, { color: theme.colors.text }]}>
                  {analytics.open_rate.toFixed(1)}%
                </Text>
                <Text style={[styles.metricDescription, { color: theme.colors.textSecondary }]}>
                  {analytics.views_count} views / {analytics.push_sent_count} sent
                </Text>
              </View>

              <View style={styles.metricItem}>
                <View style={styles.metricHeader}>
                  <Icon name="hand-left-outline" size={20} color="#2196F3" />
                  <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>
                    Claim Rate
                  </Text>
                </View>
                <Text style={[styles.metricValue, { color: theme.colors.text }]}>
                  {analytics.claim_rate.toFixed(1)}%
                </Text>
                <Text style={[styles.metricDescription, { color: theme.colors.textSecondary }]}>
                  {analytics.claims_count} claims / {analytics.views_count} views
                </Text>
              </View>

              <View style={styles.metricItem}>
                <View style={styles.metricHeader}>
                  <Icon name="checkmark-done-outline" size={20} color="#4CAF50" />
                  <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>
                    Redemption Rate
                  </Text>
                </View>
                <Text style={[styles.metricValue, { color: theme.colors.text }]}>
                  {analytics.redemption_rate.toFixed(1)}%
                </Text>
                <Text style={[styles.metricDescription, { color: theme.colors.textSecondary }]}>
                  {analytics.redemptions_count} redeemed / {analytics.claims_count} claims
                </Text>
              </View>
            </View>

            {/* Time to Full */}
            {analytics.time_to_full_minutes !== null && (
              <View style={styles.timeToFullContainer}>
                <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                <View style={styles.timeToFullContent}>
                  <Icon name="timer-outline" size={24} color="#FF9800" />
                  <View style={styles.timeToFullText}>
                    <Text style={[styles.timeToFullLabel, { color: theme.colors.textSecondary }]}>
                      Time to Full
                    </Text>
                    <Text style={[styles.timeToFullValue, { color: theme.colors.text }]}>
                      {analytics.time_to_full_minutes < 60
                        ? `${analytics.time_to_full_minutes} minutes`
                        : `${Math.floor(analytics.time_to_full_minutes / 60)}h ${analytics.time_to_full_minutes % 60}m`}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Push Notification Info */}
            {offer.push_sent && (
              <View style={styles.pushInfoContainer}>
                <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                <View style={styles.pushInfoContent}>
                  <Icon name="notifications-outline" size={20} color={theme.colors.primary} />
                  <Text style={[styles.pushInfoText, { color: theme.colors.textSecondary }]}>
                    Push notification sent to {analytics.push_sent_count} users
                    {offer.push_sent_at && ` on ${formatDate(offer.push_sent_at)}`}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Time & Claims Info */}
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.infoRow}>
            <Icon name="time-outline" size={20} color={theme.colors.primary} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                Time Period
              </Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                {formatDate(offer.start_time)} - {formatDate(offer.end_time)}
              </Text>
              {timeRemaining && (
                <Text style={[styles.infoHighlight, { color: '#FF9800' }]}>
                  {timeRemaining} remaining
                </Text>
              )}
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

          <View style={styles.infoRow}>
            <Icon name="people-outline" size={20} color={theme.colors.primary} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                Claims
              </Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                {offer.claimed_count} of {offer.max_claims} claimed
              </Text>
              {offer.status === 'active' && claimsRemaining > 0 && (
                <Text style={[styles.infoHighlight, { color: '#4CAF50' }]}>
                  {claimsRemaining} remaining
                </Text>
              )}
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

          <View style={styles.infoRow}>
            <Icon name="location-outline" size={20} color={theme.colors.primary} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                Target Radius
              </Text>
              <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                {offer.radius_miles} mile{offer.radius_miles !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Claims List */}
        {claims.length > 0 && (
          <View style={styles.claimsSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Claims ({claims.length})
            </Text>
            <FlatList
              data={claims}
              keyExtractor={(item) => item.id}
              renderItem={renderClaimItem}
              scrollEnabled={false}
              contentContainerStyle={styles.claimsList}
            />
          </View>
        )}

        {/* Cancel Button */}
        {offer.status === 'active' && (
          <TouchableOpacity
            style={[
              styles.cancelButton,
              {
                backgroundColor: '#F44336',
                opacity: cancelling ? 0.6 : 1,
              },
            ]}
            onPress={handleCancelOffer}
            disabled={cancelling}
          >
            {cancelling ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="close-circle" size={20} color="#fff" />
                <Text style={styles.cancelButtonText}>Cancel Offer</Text>
              </>
            )}
          </TouchableOpacity>
        )}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  infoCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  offerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
    marginBottom: 8,
  },
  offerDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    lineHeight: 24,
    marginBottom: 12,
  },
  valueCapBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  valueCapText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  infoHighlight: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  claimsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  claimsList: {
    gap: 8,
  },
  claimCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  claimHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tokenBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tokenText: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
    letterSpacing: 2,
  },
  claimStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  claimStatusText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.5,
  },
  claimDetails: {
    gap: 4,
  },
  claimLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  redeemTokenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  redeemTokenButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  analyticsCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  metricsGrid: {
    marginTop: 16,
    gap: 16,
  },
  metricItem: {
    paddingVertical: 12,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  metricLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  metricValue: {
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
    marginBottom: 4,
  },
  metricDescription: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  timeToFullContainer: {
    marginTop: 12,
  },
  timeToFullContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    gap: 12,
  },
  timeToFullText: {
    flex: 1,
  },
  timeToFullLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginBottom: 4,
  },
  timeToFullValue: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  pushInfoContainer: {
    marginTop: 12,
  },
  pushInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    gap: 8,
  },
  pushInfoText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
});

export default FlashOfferDetailScreen;
