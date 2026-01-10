import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import Icon from 'react-native-vector-icons/Ionicons';

const VenueDashboardScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user, venueBusinessAccount, signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await signOut();
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const DashboardCard = ({ 
    title, 
    value, 
    icon, 
    color = theme.colors.primary,
    onPress 
  }: {
    title: string;
    value: string | number;
    icon: string;
    color?: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.cardHeader}>
        <Icon name={icon} size={24} color={color} />
        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{title}</Text>
      </View>
      <Text style={[styles.cardValue, { color: theme.colors.text }]}>{value}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.welcomeText, { color: theme.colors.textSecondary }]}>
              Welcome back,
            </Text>
            <Text style={[styles.venueName, { color: theme.colors.text }]}>
              {venueBusinessAccount?.venues?.name || 'Your Venue'}
            </Text>
          </View>
          <TouchableOpacity 
            onPress={handleSignOut}
            style={[styles.signOutButton, { backgroundColor: theme.colors.surface }]}
          >
            <Icon name="log-out-outline" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Status Card */}
        <View style={[styles.statusCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.statusHeader}>
            <Icon name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={[styles.statusTitle, { color: theme.colors.text }]}>
              Venue Status
            </Text>
          </View>
          <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
            {venueBusinessAccount?.account_status === 'active' 
              ? '✅ Active and visible to customers'
              : '⏳ Pending verification'
            }
          </Text>
          <Text style={[styles.subscriptionText, { color: theme.colors.textSecondary }]}>
            Subscription: {venueBusinessAccount?.subscription_tier?.toUpperCase() || 'FREE'}
          </Text>
        </View>

        {/* Quick Stats */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Today's Overview
        </Text>
        
        <View style={styles.statsGrid}>
          <DashboardCard
            title="Check-ins"
            value="12"
            icon="people-outline"
            color="#2196F3"
          />
          <DashboardCard
            title="Favorites"
            value="8"
            icon="heart-outline"
            color="#E91E63"
          />
          <DashboardCard
            title="Views"
            value="45"
            icon="eye-outline"
            color="#FF9800"
          />
          <DashboardCard
            title="Rating"
            value="4.8"
            icon="star-outline"
            color="#FFC107"
          />
        </View>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Quick Actions
        </Text>

        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.colors.surface }]}
          >
            <Icon name="create-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.actionText, { color: theme.colors.text }]}>
              Edit Profile
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.colors.surface }]}
          >
            <Icon name="time-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.actionText, { color: theme.colors.text }]}>
              Update Hours
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.colors.surface }]}
          >
            <Icon name="camera-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.actionText, { color: theme.colors.text }]}>
              Manage Photos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.colors.surface }]}
          >
            <Icon name="notifications-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.actionText, { color: theme.colors.text }]}>
              Send Notification
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Recent Activity
        </Text>

        <View style={[styles.activityCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.activityText, { color: theme.colors.textSecondary }]}>
            No recent activity to display
          </Text>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  venueName: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
    marginTop: 4,
  },
  signOutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
    marginLeft: 12,
  },
  statusText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  subscriptionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  card: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginLeft: 8,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  actionButton: {
    width: '48%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginTop: 8,
    textAlign: 'center',
  },
  activityCard: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  activityText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  bottomSpacing: {
    height: 100,
  },
});

export default VenueDashboardScreen;