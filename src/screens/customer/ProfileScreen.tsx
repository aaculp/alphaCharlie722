import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { ProfileStackParamList } from '../../types';
import { ProfileService } from '../../services/api/profile';
import { StatsGrid, type StatConfig } from '../../components/profile';
import { formatCurrency } from '../../utils/currency';

const ProfileScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user, signOut } = useAuth();
  const navigation = useNavigation<NavigationProp<ProfileStackParamList>>();

  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [user?.id]);

  // Reload profile when screen comes into focus (after editing)
  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
    }, [user?.id])
  );

  const loadProfile = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const response = await ProfileService.fetchCompleteUserProfile(user.id);
      if (response.success && response.profile) {
        setProfileData(response.profile);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile' as never);
  };

  const handleLogout = () => {
    console.log('Logout button pressed');
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await signOut();
  };

  // Configure stats in the desired order
  // All stats are always visible, defaulting to 0 or empty values
  const stats: StatConfig[] = useMemo(() => [
    // Row 1: Avg per Offer, Total Savings
    {
      icon: 'trending-up',
      label: 'Avg per Offer',
      value: profileData?.averageSavings ? formatCurrency(profileData.averageSavings) : '$0.00',
      iconColor: '#059669',
      subtitle: 'Money saved',
    },
    {
      icon: 'cash',
      label: 'Total Savings',
      value: profileData?.totalSavings ? formatCurrency(profileData.totalSavings) : '$0.00',
      iconColor: '#10B981',
    },
    
    // Row 2: Offers Redeemed, Check-ins
    {
      icon: 'flash',
      label: 'Offers Redeemed',
      value: profileData?.redeemedOffersCount || 0,
      iconColor: '#F59E0B',
    },
    {
      icon: 'location',
      label: 'Check-ins',
      value: profileData?.checkInsCount || 0,
      iconColor: theme.colors.primary,
    },
    
    // Row 3: Current Streak, Longest Streak
    {
      icon: 'flame',
      label: 'Current Streak',
      value: profileData?.currentStreak || 0,
      iconColor: '#EF4444',
      subtitle: 'Days in a row',
    },
    {
      icon: 'trophy',
      label: 'Longest Streak',
      value: profileData?.longestStreak || 0,
      iconColor: '#F59E0B',
      subtitle: 'Personal best',
    },
    
    // Row 4: Top Venue, Avg Rating
    {
      icon: 'ribbon',
      label: 'Top Venue',
      value: profileData?.topVenue?.visitCount || 0,
      iconColor: '#10B981',
      subtitle: profileData?.topVenue?.name || 'None yet',
    },
    {
      icon: 'star',
      label: 'Avg Rating',
      value: profileData?.averageRatingGiven?.toFixed(1) || '0.0',
      iconColor: '#8B5CF6',
      subtitle: 'You give',
    },
    
    // Row 5: Most Active, Favorite Time
    {
      icon: 'calendar-outline',
      label: 'Most Active',
      value: profileData?.mostActiveDay || 'N/A',
      iconColor: '#6366F1',
    },
    {
      icon: 'time-outline',
      label: 'Favorite Time',
      value: profileData?.mostActiveTime || 'N/A',
      iconColor: '#EC4899',
    },
    
    // Row 6: Venues, Favorites
    {
      icon: 'business',
      label: 'Venues',
      value: profileData?.uniqueVenuesCount || 0,
      iconColor: theme.colors.success,
    },
    {
      icon: 'heart',
      label: 'Favorites',
      value: profileData?.favoritesCount || 0,
      iconColor: theme.colors.error,
    },
    
    // Row 7: This Month
    {
      icon: 'calendar',
      label: 'This Month',
      value: profileData?.monthlyCheckInsCount || 0,
      iconColor: theme.colors.warning,
    },
  ], [profileData, theme]);

  // Show the screen immediately with default values
  // Data will hydrate as it loads
  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Profile Image */}
          <View style={styles.profileImageContainer}>
            <View style={[styles.profileImageWrapper, { backgroundColor: theme.colors.border }]}>
              {loading ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Image
                  source={
                    profileData?.profilePhotoUrl
                      ? { uri: profileData.profilePhotoUrl }
                      : require('../../assets/images/OTW_Block_O.png')
                  }
                  style={styles.profileImage}
                />
              )}
            </View>
          </View>

          {/* Name and Action Buttons */}
          <View style={styles.nameLogoutContainer}>
            <Text style={[styles.name, { color: theme.colors.text, fontFamily: theme.fonts.primary.bold }]}>
              {profileData?.display_name || profileData?.username || 'Loading...'}
            </Text>
            <View style={styles.iconButtonsContainer}>
              <TouchableOpacity 
                style={styles.iconButton} 
                onPress={handleEditProfile}
                activeOpacity={0.7}
                disabled={loading}
              >
                <Icon name="create-outline" size={24} color={theme.colors.text} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.iconButton} 
                onPress={() => navigation.navigate('Settings' as never)}
                activeOpacity={0.7}
                disabled={loading}
              >
                <Icon name="settings-outline" size={24} color={theme.colors.text} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.iconButton} 
                onPress={handleLogout}
                activeOpacity={0.7}
                disabled={loading}
              >
                <Icon name="log-out-outline" size={24} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          </View>


          {/* Email */}
          <Text style={[styles.email, { color: theme.colors.textSecondary, fontFamily: theme.fonts.secondary.regular }]}>
            {user?.email || 'Loading...'}
          </Text>

          {/* Stats Grid */}
          <StatsGrid stats={stats} />

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text, fontFamily: theme.fonts.primary.bold }]}>
              Logout
            </Text>
            <Text style={[styles.modalMessage, { color: theme.colors.textSecondary, fontFamily: theme.fonts.secondary.regular }]}>
              Are you sure you want to logout?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.text, fontFamily: theme.fonts.secondary.medium }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.error }]}
                onPress={confirmLogout}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.surface, fontFamily: theme.fonts.secondary.medium }]}>
                  Logout
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerText: {
    fontSize: 24,
  },
  topLogoutButton: {
    padding: 8,
  },
  iconButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 4,
    minWidth: 32,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameLogoutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  profileImageWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  name: {
    fontSize: 28,
    textAlign: 'center',
    marginTop: 16,
  },
  email: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginTop: 24,
    gap: 12,
  },
  menuContainer: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuItemText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  modalButtonText: {
    fontSize: 16,
  },
});

export default ProfileScreen;
