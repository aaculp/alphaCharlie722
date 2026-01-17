import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { FlashOfferService, type FlashOffer, type FlashOfferStatus } from '../../services/api/flashOffers';
import { FlashOfferCreationModal } from '../../components/venue';
import { OfferListItemSkeleton } from '../../components/flashOffer/SkeletonLoaders';
import Icon from 'react-native-vector-icons/Ionicons';

type FlashOfferListScreenProps = {
  navigation: any;
};

interface OfferSection {
  title: string;
  data: FlashOffer[];
  status: FlashOfferStatus;
}

const FlashOfferListScreen: React.FC<FlashOfferListScreenProps> = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { venueBusinessAccount } = useAuth();
  const [offers, setOffers] = useState<FlashOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const venueId = venueBusinessAccount?.venues?.id;

  const loadOffers = useCallback(async () => {
    if (!venueId) {
      console.warn('No venue ID available');
      setLoading(false);
      return;
    }

    try {
      const data = await FlashOfferService.getVenueOffers(venueId);
      setOffers(data);
    } catch (error) {
      console.error('Error loading offers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [venueId]);

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadOffers();
  }, [loadOffers]);

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

  const getStatusColor = (status: FlashOfferStatus): string => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'scheduled':
        return '#2196F3';
      case 'expired':
        return '#9E9E9E';
      case 'cancelled':
        return '#F44336';
      case 'full':
        return '#FF9800';
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusIcon = (status: FlashOfferStatus): string => {
    switch (status) {
      case 'active':
        return 'flash';
      case 'scheduled':
        return 'time';
      case 'expired':
        return 'close-circle';
      case 'cancelled':
        return 'ban';
      case 'full':
        return 'checkmark-circle';
      default:
        return 'help-circle';
    }
  };

  const groupOffersByStatus = (): OfferSection[] => {
    const active = offers.filter(o => o.status === 'active');
    const scheduled = offers.filter(o => o.status === 'scheduled');
    const expired = offers.filter(o => o.status === 'expired' || o.status === 'cancelled' || o.status === 'full');

    const sections: OfferSection[] = [];

    if (active.length > 0) {
      sections.push({ title: 'Active', data: active, status: 'active' });
    }
    if (scheduled.length > 0) {
      sections.push({ title: 'Scheduled', data: scheduled, status: 'scheduled' });
    }
    if (expired.length > 0) {
      sections.push({ title: 'Past', data: expired, status: 'expired' });
    }

    return sections;
  };

  const renderOfferCard = ({ item }: { item: FlashOffer }) => {
    const statusColor = getStatusColor(item.status);
    const statusIcon = getStatusIcon(item.status);
    const timeRemaining = item.status === 'active' ? getTimeRemaining(item.end_time) : null;
    const claimsRemaining = item.max_claims - item.claimed_count;

    return (
      <TouchableOpacity
        style={[
          styles.offerCard,
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
        onPress={() => navigation.navigate('FlashOfferDetail', { offerId: item.id })}
      >
        {/* Header */}
        <View style={styles.offerHeader}>
          <View style={styles.offerTitleContainer}>
            <Text style={[styles.offerTitle, { color: theme.colors.text }]} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Icon name={statusIcon} size={12} color={statusColor} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {item.status.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <Text style={[styles.offerDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
          {item.description}
        </Text>

        {/* Stats */}
        <View style={styles.statsContainer}>
          {/* Claims */}
          <View style={styles.statItem}>
            <Icon name="ticket-outline" size={16} color={theme.colors.primary} />
            <Text style={[styles.statText, { color: theme.colors.text }]}>
              {item.claimed_count}/{item.max_claims} claimed
            </Text>
          </View>

          {/* Time Remaining */}
          {timeRemaining && (
            <View style={styles.statItem}>
              <Icon name="time-outline" size={16} color={theme.colors.primary} />
              <Text style={[styles.statText, { color: theme.colors.text }]}>
                {timeRemaining} left
              </Text>
            </View>
          )}

          {/* Claims Remaining */}
          {item.status === 'active' && claimsRemaining > 0 && (
            <View style={styles.statItem}>
              <Icon name="people-outline" size={16} color={theme.colors.primary} />
              <Text style={[styles.statText, { color: theme.colors.text }]}>
                {claimsRemaining} left
              </Text>
            </View>
          )}
        </View>

        {/* Chevron */}
        <View style={styles.chevronContainer}>
          <Icon name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }: { section: OfferSection }) => (
    <View style={[styles.sectionHeader, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        {section.title}
      </Text>
      <Text style={[styles.sectionCount, { color: theme.colors.textSecondary }]}>
        {section.data.length}
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="flash-outline" size={64} color={theme.colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
        No Flash Offers Yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        Create your first flash offer to attract customers with time-limited promotions
      </Text>
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => setModalVisible(true)}
      >
        <Icon name="add" size={20} color="#fff" />
        <Text style={styles.createButtonText}>Create Flash Offer</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Flash Offers</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.listContent}>
          {[1, 2, 3, 4].map((i) => (
            <OfferListItemSkeleton key={i} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  const sections = groupOffersByStatus();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Flash Offers</Text>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={styles.headerRight}
        >
          <Icon name="add" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Offer List */}
      {sections.length === 0 ? (
        renderEmptyState()
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderOfferCard}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
          stickySectionHeadersEnabled={false}
        />
      )}

      {/* Flash Offer Creation Modal */}
      <FlashOfferCreationModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={() => {
          setModalVisible(false);
          loadOffers();
        }}
      />
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
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  sectionCount: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  offerCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    position: 'relative',
  },
  offerHeader: {
    marginBottom: 8,
  },
  offerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.5,
  },
  offerDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  chevronContainer: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});

export default FlashOfferListScreen;
