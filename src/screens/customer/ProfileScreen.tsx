import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { launchImageLibrary } from 'react-native-image-picker';
import { ProfileService } from '../../services/api/profile';
import { RESPONSIVE_SPACING } from '../../utils/responsive';
import type { UserProfile, TabType, SettingType } from '../../types/profile.types';
import type { SocialProfile } from '../../types/social.types';

// Import profile components
import { HeroSection } from '../../components/profile/HeroSection';
import { AboutMeSection } from '../../components/profile/AboutMeSection';
import { TabNavigation } from '../../components/profile/TabNavigation';
import { FollowersCard } from '../../components/profile/FollowersCard';
import { StatisticsCard } from '../../components/profile/StatisticsCard';
import { SettingsMenu } from '../../components/profile/SettingsMenu';

interface ProfileScreenState {
  // User data
  user: UserProfile | null;
  profileImageUri: string | null;
  aboutText: string;
  
  // UI state
  activeTab: TabType;
  isEditingAbout: boolean;
  
  // Loading states
  isUploadingPhoto: boolean;
  isSavingAbout: boolean;
  isLoadingProfile: boolean;
  
  // Statistics
  followerCount: number;
  checkInsCount: number;
  favoritesCount: number;
  friendsCount: number;
  recentFollowers: SocialProfile[];
  
  // Error states
  photoUploadError: string | null;
  aboutSaveError: string | null;
  profileLoadError: string | null;
}

const ProfileScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user: authUser } = useAuth();
  
  // Animation value for tab transitions (Requirement 3.7)
  const contentOpacity = useSharedValue(1);
  
  // Initialize state with default values (Requirement 6.5)
  const [state, setState] = useState<ProfileScreenState>({
    user: null,
    profileImageUri: null,
    aboutText: '',
    activeTab: 'main',
    isEditingAbout: false,
    isUploadingPhoto: false,
    isSavingAbout: false,
    isLoadingProfile: true,
    followerCount: 0,
    checkInsCount: 0,
    favoritesCount: 0,
    friendsCount: 0,
    recentFollowers: [],
    photoUploadError: null,
    aboutSaveError: null,
    profileLoadError: null,
  });

  // Fetch profile data on mount (Requirement 6.5)
  useEffect(() => {
    if (authUser?.id) {
      loadProfileData();
    }
  }, [authUser?.id]);

  // Animated style for tab content transitions (Requirement 3.7)
  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  /**
   * Handle tab change with animation
   * Requirement 3.7: Animate content transition when switching tabs
   */
  const handleTabChange = (tab: TabType) => {
    if (tab === state.activeTab) return;

    // Update tab state immediately
    setState((prev) => ({ ...prev, activeTab: tab }));
    
    // Animate opacity for smooth transition
    contentOpacity.value = 0;
    contentOpacity.value = withTiming(1, { duration: 200 });
  };

  /**
   * Load complete profile data including statistics
   * Validates: Requirements 6.5, 6.6
   */
  const loadProfileData = async () => {
    if (!authUser?.id) return;

    setState(prev => ({ ...prev, isLoadingProfile: true, profileLoadError: null }));

    try {
      const response = await ProfileService.fetchCompleteUserProfile(authUser.id);

      if (response.success && response.profile) {
        const profile = response.profile;
        
        setState(prev => ({
          ...prev,
          user: profile,
          profileImageUri: profile.profilePhotoUrl,
          aboutText: profile.aboutText,
          followerCount: profile.followerCount,
          checkInsCount: profile.checkInsCount,
          favoritesCount: profile.favoritesCount,
          friendsCount: profile.friendsCount,
          isLoadingProfile: false,
          profileLoadError: null,
        }));
      } else {
        // Handle error state (Requirement 6.6)
        setState(prev => ({
          ...prev,
          isLoadingProfile: false,
          profileLoadError: response.error || 'Failed to load profile',
        }));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setState(prev => ({
        ...prev,
        isLoadingProfile: false,
        profileLoadError: error instanceof Error ? error.message : 'Failed to load profile',
      }));
    }
  };

  const handleShareProfile = () => {
    // TODO: Implement share functionality
    Alert.alert('Share Profile', 'Share functionality coming soon!');
  };

  const handleInviteFriend = () => {
    // TODO: Implement invite functionality
    Alert.alert('Invite Friend', 'Invite functionality coming soon!');
  };

  const handleSettingPress = (setting: SettingType) => {
    // TODO: Implement navigation to setting screens
    Alert.alert('Settings', `Navigate to ${setting} settings`);
  };

  const handleImagePicker = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1000,
        maxHeight: 1000,
      },
      async (response) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorCode) {
          Alert.alert('Error', 'Failed to pick image');
        } else if (response.assets && response.assets[0] && authUser?.id) {
          const asset = response.assets[0];
          const uri = asset.uri;
          const fileName = asset.fileName || 'profile.jpg';

          if (!uri) return;

          // Set uploading state
          setState(prev => ({ ...prev, isUploadingPhoto: true, photoUploadError: null }));

          try {
            const result = await ProfileService.uploadProfilePhoto(
              authUser.id,
              uri,
              fileName
            );

            if (result.success && result.photoUrl) {
              setState(prev => ({
                ...prev,
                profileImageUri: result.photoUrl || null,
                isUploadingPhoto: false,
                photoUploadError: null,
              }));
              Alert.alert('Success', 'Profile photo updated!');
            } else {
              setState(prev => ({
                ...prev,
                isUploadingPhoto: false,
                photoUploadError: result.error || 'Failed to upload photo',
              }));
              Alert.alert('Error', result.error || 'Failed to upload photo');
            }
          } catch (error) {
            console.error('Photo upload error:', error);
            setState(prev => ({
              ...prev,
              isUploadingPhoto: false,
              photoUploadError: error instanceof Error ? error.message : 'Failed to upload photo',
            }));
            Alert.alert('Error', 'Failed to upload photo');
          }
        }
      }
    );
  };

  const handleSaveAbout = async () => {
    if (!authUser?.id) return;

    setState(prev => ({ ...prev, isSavingAbout: true, aboutSaveError: null }));

    try {
      const response = await ProfileService.updateAboutText(authUser.id, state.aboutText);

      if (response.success) {
        setState(prev => ({
          ...prev,
          isEditingAbout: false,
          isSavingAbout: false,
          aboutSaveError: null,
          aboutText: response.aboutText || prev.aboutText,
        }));
        Alert.alert('Success', 'About me updated!');
      } else {
        setState(prev => ({
          ...prev,
          isSavingAbout: false,
          aboutSaveError: response.error || 'Failed to save about text',
        }));
        Alert.alert('Error', response.error || 'Failed to save about text');
      }
    } catch (error) {
      console.error('About save error:', error);
      setState(prev => ({
        ...prev,
        isSavingAbout: false,
        aboutSaveError: error instanceof Error ? error.message : 'Failed to save about text',
      }));
      Alert.alert('Error', 'Failed to save about text');
    }
  };

  // Show loading state while fetching profile
  if (state.isLoadingProfile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary, fontFamily: theme.fonts.secondary.regular }]}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state if profile load failed
  if (state.profileLoadError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={[styles.errorText, { color: theme.colors.text, fontFamily: theme.fonts.secondary.semiBold }]}>
            Failed to load profile
          </Text>
          <Text style={[styles.errorSubtext, { color: theme.colors.textSecondary, fontFamily: theme.fonts.secondary.regular }]}>
            {state.profileLoadError}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={loadProfileData}
          >
            <Text style={[styles.retryButtonText, { fontFamily: theme.fonts.secondary.semiBold }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderMainInfo = () => (
    <View style={styles.tabContent}>
      {/* Followers Card */}
      <FollowersCard
        followerCount={state.followerCount}
        recentFollowers={state.recentFollowers}
        onInvitePress={handleInviteFriend}
      />

      {/* Statistics Card */}
      <StatisticsCard
        checkInsCount={state.checkInsCount}
        favoritesCount={state.favoritesCount}
        friendsCount={state.friendsCount}
      />
    </View>
  );

  const renderSettings = () => (
    <View style={styles.tabContent}>
      <SettingsMenu onSettingPress={handleSettingPress} />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section with Profile Image */}
        <HeroSection
          profileImageUri={state.profileImageUri}
          username={state.user?.username || authUser?.email?.split('@')[0] || 'User'}
          onCameraPress={handleImagePicker}
          onSharePress={handleShareProfile}
          isUploading={state.isUploadingPhoto}
        />

        {/* About Me Section */}
        <AboutMeSection
          aboutText={state.aboutText}
          isEditing={state.isEditingAbout}
          onEditPress={() => setState(prev => ({ ...prev, isEditingAbout: !prev.isEditingAbout }))}
          onSavePress={handleSaveAbout}
          onTextChange={(text) => setState(prev => ({ ...prev, aboutText: text }))}
          isSaving={state.isSavingAbout}
        />

        {/* Tab Navigation */}
        <TabNavigation
          activeTab={state.activeTab}
          onTabChange={handleTabChange}
        />

        {/* Animated Tab Content */}
        <Animated.View style={animatedContentStyle}>
          {state.activeTab === 'main' ? renderMainInfo() : renderSettings()}
        </Animated.View>
        
        {/* Bottom spacing for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
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
    padding: RESPONSIVE_SPACING.sectionHorizontal,
  },
  loadingText: {
    marginTop: RESPONSIVE_SPACING.elementGap + 8,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: RESPONSIVE_SPACING.sectionHorizontal,
  },
  errorText: {
    marginTop: RESPONSIVE_SPACING.elementGap + 8,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorSubtext: {
    marginTop: RESPONSIVE_SPACING.elementGap,
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: RESPONSIVE_SPACING.cardMargin + 8,
    paddingVertical: RESPONSIVE_SPACING.buttonVertical,
    paddingHorizontal: RESPONSIVE_SPACING.buttonHorizontal,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tabContent: {
    padding: RESPONSIVE_SPACING.sectionHorizontal,
  },
});

export default ProfileScreen;
