/**
 * VenueReviewsScreen
 * 
 * Full-screen view of all reviews for a venue with filtering and sorting.
 * 
 * Requirements:
 * - 3.4: Show reviews in cards
 * - 3.5: Navigate to full reviews screen
 * - 4.2, 4.3: Sort options
 * - 4.4, 4.5, 4.6, 4.7: Filter options
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { ReviewList } from '../../components/venue';
import type { HomeStackParamList } from '../../types';
import Icon from 'react-native-vector-icons/Ionicons';
import { TouchableOpacity } from 'react-native';

type VenueReviewsRouteProp = RouteProp<HomeStackParamList, 'VenueReviews'>;

const VenueReviewsScreen: React.FC = () => {
  const route = useRoute<VenueReviewsRouteProp>();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { venueId, venueName } = route.params;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Reviews</Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>{venueName}</Text>
        </View>
      </View>

      {/* Review List */}
      <ReviewList venueId={venueId} />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
});

export default VenueReviewsScreen;
