import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { ClaimService } from '../../services/api/flashOfferClaims';
import type { FlashOfferClaimWithDetails, ClaimStatus } from '../../types/flashOfferClaim.types';
import type { RootTabParamList } from '../../types/navigation.types';
import { RESPONSIVE_SPACING } from '../../utils/responsive';
import { ClaimListItemSkeleton } from '../../components/flashOffer/SkeletonLoaders';

interface ClaimSection {
  title: string;
  status: ClaimStatus;
  data: FlashOfferClaimWithDetails[];
}

const MyClaimsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();

  const [claims, setClaims] = useState<FlashOfferClaimWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch claims on mount
  useEffect(() => {
    if (user?.id) {
      loadClaims();
    }
  }, [user?.id]);

  const loadClaims = async () => {
    if (!user?.id) return;

    try {
      setError(null);
      const claimsWithDetails = await ClaimService.getUserClaimsWithDetails(user.id);
      setClaims(claimsWithDetails);
    } catch (err) {
      console.error('Error loading claims:', err);
      setError(err instanceof Error ? err.message : 'Failed to load claims');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadClaims();
    setIsRefreshing(false);
  }, [user?.id]);

  const handleClaimPress = (claim: FlashOfferClaimWithDetails) => {
    // Navigate to ClaimDetailScreen
    navigation.navigate('ClaimDetail' as any, { claimId: claim.id });
  };

  // Group claims by status
  const sections: ClaimSection[] = [
    {
      title: 'Active',
      status: 'active',
      data: claims.filter((c) => c.status === 'active'),
    },
    {
      title: 'Redeemed',
      status: 'redeemed',
      data: claims.filter((c) => c.status === 'redeemed'),
    },
    {
      title: 'Expired',
      status: 'expired',
      data: claims.filter((c) => c.status === 'expired'),
    },
  ];

  const renderClaimItem = ({ item }: { item: FlashOfferClaimWithDetails }) => {
    const isActive = item.status === 'active';
    const isRedeemed = item.status === 'redeemed';
    const isExpired = item.status === 'expired';

    const statusColor = isActive
      ? theme.colors.success
      : isRedeemed
      ? theme.colors.primary
      : theme.colors.textSecondary;

    const statusIcon = isActive
      ? 'checkmark-circle'
      : isRedeemed
      ? 'checkmark-done-circle'
      : 'time-outline';

    return (
      <TouchableOpacity
        style={[styles.claimCard, { backgroundColor: theme.colors.card }]}
        onPress={() => handleClaimPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.claimHeader}>
          <View style={styles.claimTitleContainer}>
            <Text
              style={[
                styles.claimTitle,
                { color: theme.colors.text, fontFamily: theme.fonts.secondary.semiBold },
              ]}
              numberOfLines={1}
            >
              {item.offer.title}
            </Text>
            <Text
              style={[
                styles.venueName,
                { color: theme.colors.textSecondary, fontFamily: theme.fonts.secondary.regular },
              ]}
              numberOfLines={1}
            >
              {item.venue.name}
            </Text>
          </View>
          <Icon name={statusIcon} size={24} color={statusColor} />
        </View>

        <View style={styles.claimBody}>
          <View style={styles.tokenContainer}>
            <Text
              style={[
                styles.tokenLabel,
                { color: theme.colors.textSecondary, fontFamily: theme.fonts.secondary.regular },
              ]}
            >
              Token
            </Text>
            <Text
              style={[
                styles.tokenValue,
                { color: theme.colors.text, fontFamily: theme.fonts.primary.bold },
              ]}
            >
              {item.token}
            </Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <Text
              style={[
                styles.statusText,
                { color: statusColor, fontFamily: theme.fonts.secondary.semiBold },
              ]}
            >
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        {isActive && (
          <Text
            style={[
              styles.expiresText,
              { color: theme.colors.textSecondary, fontFamily: theme.fonts.secondary.regular },
            ]}
          >
            Expires: {new Date(item.expires_at).toLocaleDateString()}
          </Text>
        )}

        {isRedeemed && item.redeemed_at && (
          <Text
            style={[
              styles.redeemedText,
              { color: theme.colors.textSecondary, fontFamily: theme.fonts.secondary.regular },
            ]}
          >
            Redeemed: {new Date(item.redeemed_at).toLocaleDateString()}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = (section: ClaimSection) => {
    if (section.data.length === 0) return null;

    return (
      <View style={styles.sectionHeader}>
        <Text
          style={[
            styles.sectionTitle,
            { color: theme.colors.text, fontFamily: theme.fonts.secondary.semiBold },
          ]}
        >
          {section.title}
        </Text>
        <View style={[styles.sectionBadge, { backgroundColor: theme.colors.primary }]}>
          <Text
            style={[
              styles.sectionBadgeText,
              { fontFamily: theme.fonts.secondary.semiBold },
            ]}
          >
            {section.data.length}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="ticket-outline" size={64} color={theme.colors.textSecondary} />
      <Text
        style={[
          styles.emptyTitle,
          { color: theme.colors.text, fontFamily: theme.fonts.secondary.semiBold },
        ]}
      >
        No Claims Yet
      </Text>
      <Text
        style={[
          styles.emptySubtitle,
          { color: theme.colors.textSecondary, fontFamily: theme.fonts.secondary.regular },
        ]}
      >
        Claim flash offers to see them here
      </Text>
    </View>
  );

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
            My Flash Offers
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.listContent}>
          {[1, 2, 3, 4].map((i) => (
            <ClaimListItemSkeleton key={i} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
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
            My Flash Offers
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
            Failed to Load Claims
          </Text>
          <Text
            style={[
              styles.errorSubtitle,
              { color: theme.colors.textSecondary, fontFamily: theme.fonts.secondary.regular },
            ]}
          >
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={loadClaims}
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
          My Flash Offers
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={sections.flatMap((section) => [
          { type: 'header' as const, section },
          ...section.data.map((claim) => ({ type: 'item' as const, claim })),
        ])}
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return renderSectionHeader(item.section);
          }
          return renderClaimItem({ item: item.claim });
        }}
        keyExtractor={(item) =>
          item.type === 'header' ? `header-${item.section.status}` : `claim-${item.claim.id}`
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
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
  listContent: {
    padding: RESPONSIVE_SPACING.sectionHorizontal,
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: RESPONSIVE_SPACING.cardMargin,
    marginBottom: RESPONSIVE_SPACING.elementGap,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sectionBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  sectionBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  claimCard: {
    padding: RESPONSIVE_SPACING.elementGap + 4,
    borderRadius: 12,
    marginBottom: RESPONSIVE_SPACING.elementGap,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  claimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: RESPONSIVE_SPACING.elementGap,
  },
  claimTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  claimTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  venueName: {
    fontSize: 14,
  },
  claimBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tokenContainer: {
    flex: 1,
  },
  tokenLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  tokenValue: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  expiresText: {
    fontSize: 12,
  },
  redeemedText: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    marginTop: RESPONSIVE_SPACING.elementGap + 8,
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtitle: {
    marginTop: RESPONSIVE_SPACING.elementGap,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default MyClaimsScreen;
