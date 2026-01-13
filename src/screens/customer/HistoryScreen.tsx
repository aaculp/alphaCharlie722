import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCheckInHistory } from '../../hooks/useCheckInHistory';
import { CheckInService } from '../../services/api/checkins';
import { CheckInHistoryItem } from '../../components/checkin';
import type { HomeStackParamList } from '../../types/navigation.types';

type HistoryScreenNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'HomeList'>;

/**
 * HistoryScreen Component
 * 
 * Displays the user's recent check-in history with venue details.
 * Supports pull-to-refresh and infinite scroll pagination.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 4.1, 4.2, 4.3, 4.4, 
 *               7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3
 */
const HistoryScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<HistoryScreenNavigationProp>();
  
  const [visitCounts, setVisitCounts] = useState<Map<string, number>>(new Map());
  const [loadingVisitCounts, setLoadingVisitCounts] = useState<boolean>(false);

  // Fetch check-in history using custom hook
  const {
    checkIns,
    loading,
    refreshing,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refetch,
  } = useCheckInHistory({
    enabled: !!user,
    daysBack: 30,
  });

  // Extract unique venue IDs from check-ins
  const venueIds = useMemo(() => {
    return Array.from(new Set(checkIns.map(checkIn => checkIn.venue_id)));
  }, [checkIns]);

  // Fetch visit counts for all displayed venues
  useEffect(() => {
    const fetchVisitCounts = async () => {
      if (!user || venueIds.length === 0) {
        return;
      }

      try {
        setLoadingVisitCounts(true);
        const counts = await CheckInService.getUserVenueVisitCounts(user.id, venueIds);
        setVisitCounts(counts);
      } catch (error) {
        console.error('Error fetching visit counts:', error);
      } finally {
        setLoadingVisitCounts(false);
      }
    };

    fetchVisitCounts();
  }, [user, venueIds]);

  // Handle navigation to venue detail screen
  const handleVenuePress = (venueId: string, venueName: string) => {
    navigation.navigate('VenueDetail', {
      venueId,
      venueName,
    });
  };

  // Handle scroll to bottom for pagination
  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    
    // Check if user has scrolled to bottom
    const isCloseToBottom = 
      layoutMeasurement.height + contentOffset.y >= 
      contentSize.height - paddingToBottom;

    if (isCloseToBottom && hasMore && !loadingMore && !loading) {
      loadMore();
    }
  };

  // Handle retry on error
  const handleRetry = () => {
    refetch();
  };

  // Handle navigation to home screen from empty state
  const handleExploreVenues = () => {
    navigation.navigate('HomeList');
  };

  // Loading state (initial load)
  if (loading && checkIns.length === 0) {
    return (
      <SafeAreaView 
        style={[styles.container, { backgroundColor: theme.colors.background }]} 
        edges={['top']}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            History
          </Text>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading your history...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && checkIns.length === 0) {
    return (
      <SafeAreaView 
        style={[styles.container, { backgroundColor: theme.colors.background }]} 
        edges={['top']}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            History
          </Text>
        </View>
        <View style={styles.centerContainer}>
          <Icon name="alert-circle-outline" size={64} color={theme.colors.error} />
          <Text style={[styles.errorTitle, { color: theme.colors.text }]}>
            Oops! Something went wrong
          </Text>
          <Text style={[styles.errorMessage, { color: theme.colors.textSecondary }]}>
            {error.message || 'Failed to load your check-in history'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleRetry}
          >
            <Icon name="refresh" size={20} color="#fff" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Empty state
  if (checkIns.length === 0) {
    return (
      <SafeAreaView 
        style={[styles.container, { backgroundColor: theme.colors.background }]} 
        edges={['top']}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            History
          </Text>
        </View>
        <ScrollView
          testID="empty-scroll-view"
          contentContainerStyle={styles.centerContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refetch}
              tintColor={theme.colors.primary}
            />
          }
        >
          <Icon name="time-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            No recent check-ins
          </Text>
          <Text style={[styles.emptyMessage, { color: theme.colors.textSecondary }]}>
            You haven't checked in to any venues in the past 30 days.
          </Text>
          <TouchableOpacity
            style={[styles.exploreButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleExploreVenues}
          >
            <Icon name="compass" size={20} color="#fff" />
            <Text style={styles.exploreButtonText}>Explore Venues</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Main content with check-in history
  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: theme.colors.background }]} 
      edges={['top']}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          History
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
          {checkIns.length} check-in{checkIns.length !== 1 ? 's' : ''} in the past 30 days
        </Text>
      </View>

      <ScrollView
        testID="history-scroll-view"
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={400}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refetch}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={styles.listContainer}>
          {checkIns.map((checkIn) => (
            <CheckInHistoryItem
              key={checkIn.id}
              checkIn={checkIn}
              visitCount={visitCounts.get(checkIn.venue_id) || 1}
              onPress={() => handleVenuePress(checkIn.venue_id, checkIn.venue.name)}
            />
          ))}
        </View>

        {/* Loading more indicator */}
        {loadingMore && (
          <View style={styles.loadingMoreContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={[styles.loadingMoreText, { color: theme.colors.textSecondary }]}>
              Loading more...
            </Text>
          </View>
        )}

        {/* End of list indicator */}
        {!hasMore && checkIns.length > 0 && (
          <View style={styles.endOfListContainer}>
            <Text style={[styles.endOfListText, { color: theme.colors.textSecondary }]}>
              You've reached the end
            </Text>
          </View>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for floating tab bar
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginTop: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    marginTop: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    marginTop: 24,
    gap: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 8,
    textAlign: 'center',
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    marginTop: 24,
    gap: 8,
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  endOfListContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  endOfListText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
});

export default HistoryScreen;
