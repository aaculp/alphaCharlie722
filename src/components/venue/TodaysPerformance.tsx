import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { VenueAnalytics } from '../../services/venueAnalyticsService';
import Icon from 'react-native-vector-icons/Ionicons';

interface TodaysPerformanceProps {
  analytics: VenueAnalytics | null;
  analyticsLoading: boolean;
}

export const TodaysPerformance: React.FC<TodaysPerformanceProps> = ({
  analytics,
  analyticsLoading,
}) => {
  const { theme, isDark } = useTheme();

  const DashboardCard = ({ 
    title, 
    value, 
    icon, 
    color = theme.colors.primary,
  }: {
    title: string;
    value: string | number;
    icon: string;
    color?: string;
  }) => (
    <View style={styles.card}>
      <View 
        style={[
          styles.cardInner, 
          { 
            backgroundColor: theme.colors.surface,
            shadowColor: theme.colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0 : 0.05,
            shadowRadius: 4,
            elevation: isDark ? 0 : 2,
            borderWidth: isDark ? 0 : 1,
            borderColor: theme.colors.border,
          }
        ]}
      >
        <View style={styles.cardHeader}>
          <Icon name={icon} size={24} color={color} />
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{title}</Text>
        </View>
        <Text style={[styles.cardValue, { color: theme.colors.text }]}>{value}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Today's Performance {analyticsLoading && '(Updating...)'}
      </Text>
      
      <View style={styles.statsGrid}>
        <DashboardCard
          title="Check-ins"
          value={analytics?.todayCheckIns?.toString() || '0'}
          icon="people-outline"
          color="#2196F3"
        />
        <DashboardCard
          title="Newly Favorited"
          value={analytics?.todayNewFavorites?.toString() || '0'}
          icon="heart-outline"
          color="#E91E63"
        />
        <DashboardCard
          title="Current Activity"
          value={`${analytics?.currentActivity?.level || 'Loading'} ${analytics?.currentActivity?.emoji || ''}`}
          icon="pulse-outline"
          color="#FF9800"
        />
        <DashboardCard
          title="Rating Today"
          value={analytics?.todayRating?.toString() || '0'}
          icon="star-outline"
          color="#FFC107"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '90%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    marginBottom: 12,
  },
  cardInner: {
    padding: 16,
    borderRadius: 12,
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '700',
  },
});
