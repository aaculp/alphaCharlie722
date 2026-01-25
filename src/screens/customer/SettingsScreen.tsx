import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useGridLayout, GridLayoutType } from '../../contexts/GridLayoutContext';
import { useNavigationStyle, NavigationStyleType } from '../../contexts/NavigationStyleContext';
import { useLocationContext } from '../../contexts/LocationContext';
import { useNotificationPreferences } from '../../hooks';
import { useFriendsQuery } from '../../hooks/queries/useFriendsQuery';
import { populateVenuesDatabase } from '../../utils/populateVenues';
import { PushPermissionService, PermissionStatus } from '../../services/PushPermissionService';
import { ClaimService } from '../../services/api/flashOfferClaims';
import Icon from 'react-native-vector-icons/Ionicons';

const SettingsScreen: React.FC = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [experimentalFeaturesEnabled, setExperimentalFeaturesEnabled] = useState(false);
  const [gridLayoutExpanded, setGridLayoutExpanded] = useState(false);
  const [navigationStyleExpanded, setNavigationStyleExpanded] = useState(false);
  const [privacyExpanded, setPrivacyExpanded] = useState(false);
  const [notificationTypesExpanded, setNotificationTypesExpanded] = useState(false);
  const [pushPermissionStatus, setPushPermissionStatus] = useState<PermissionStatus>('not_determined');
  const [pushEnabled, setPushEnabled] = useState(false);
  const [activeClaimsCount, setActiveClaimsCount] = useState(0);
  
  const { signOut, user } = useAuth();
  const { theme, themeMode, setThemeMode } = useTheme();
  const { gridLayout, setGridLayout } = useGridLayout();
  const { navigationStyle, setNavigationStyle } = useNavigationStyle();
  const { locationEnabled, setLocationEnabled } = useLocationContext();
  const { data: friends = [], isLoading: friendsLoading } = useFriendsQuery({ 
    userId: user?.id || '', 
    enabled: !!user?.id 
  });
  const { preferences, loading: prefsLoading, updatePreference } = useNotificationPreferences();
  const navigation = useNavigation<any>();

  // Load push permission status on mount
  useEffect(() => {
    loadPushPermissionStatus();
  }, []);

  // Load active claims count on mount
  useEffect(() => {
    if (user?.id) {
      loadActiveClaimsCount();
    }
  }, [user?.id]);

  // Update push enabled state when preferences load
  useEffect(() => {
    if (preferences) {
      // Check if any push notification type is enabled
      const anyEnabled = 
        preferences.friend_requests ||
        preferences.friend_accepted ||
        preferences.venue_shares;
      setPushEnabled(anyEnabled);
    }
  }, [preferences]);

  const loadPushPermissionStatus = async () => {
    try {
      const status = await PushPermissionService.checkPermissionStatus();
      setPushPermissionStatus(status);
    } catch (error) {
      console.error('Error loading push permission status:', error);
    }
  };

  const loadActiveClaimsCount = async () => {
    if (!user?.id) return;
    
    try {
      const claims = await ClaimService.getUserClaims(user.id, 'active');
      setActiveClaimsCount(claims.length);
    } catch (error) {
      console.error('Error loading active claims count:', error);
    }
  };

  const handlePushToggle = async (value: boolean) => {
    try {
      // If enabling, check permission first
      if (value) {
        const isEnabled = await PushPermissionService.isEnabled();
        
        if (!isEnabled) {
          // Check if permanently denied first
          const isPermanentlyDenied = await PushPermissionService.isPermanentlyDenied();
          
          if (isPermanentlyDenied) {
            // Show platform-specific instructions for permanently denied
            await PushPermissionService.handleNeverAskAgain();
            return;
          }
          
          // Request permission
          const result = await PushPermissionService.requestPermission();
          setPushPermissionStatus(result.status);
          
          if (result.isPermanentlyDenied) {
            // Show alert with instructions
            PushPermissionService.showPermissionDeniedAlert();
            return;
          }
          
          if (result.status !== 'authorized' && result.status !== 'provisional') {
            Alert.alert(
              'Permission Required',
              'Push notifications require permission to work. Please enable them in settings.',
              [{ text: 'OK' }]
            );
            return;
          }
        }
      }

      // Update all notification preferences
      if (preferences) {
        await Promise.all([
          updatePreference('friend_requests', value),
          updatePreference('friend_accepted', value),
          updatePreference('venue_shares', value),
        ]);
      }

      setPushEnabled(value);
      
      if (value) {
        Alert.alert(
          'Success',
          'Push notifications enabled. You\'ll receive real-time updates for social interactions.',
          [{ text: 'OK' }]
        );
      } else {
        // Show fallback info when disabling
        PushPermissionService.showFallbackNotificationInfo();
      }
    } catch (error) {
      console.error('Error toggling push notifications:', error);
      Alert.alert(
        'Error',
        'Failed to update push notification settings. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const getPermissionStatusText = (): string => {
    switch (pushPermissionStatus) {
      case 'authorized':
        return 'Enabled';
      case 'provisional':
        return 'Provisional';
      case 'denied':
        return 'Denied';
      case 'not_determined':
        return 'Not Set';
      case 'unavailable':
        return 'Unavailable';
      default:
        return 'Unknown';
    }
  };

  const handleThemeChange = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
  };

  const getThemeDisplayText = () => {
    switch (themeMode) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return 'System';
      default: return 'System';
    }
  };

  const handleUpdateVenueData = async () => {
    Alert.alert(
      'Update Venue Data',
      'This will update all venues with enhanced information including wait times, popular items, atmosphere tags, and parking info. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Update', 
          onPress: async () => {
            try {
              await populateVenuesDatabase();
              Alert.alert('Success', 'Venue data has been updated with enhanced information!');
            } catch (error) {
              console.error('Error updating venue data:', error);
              Alert.alert('Error', 'Failed to update venue data. Please try again.');
            }
          }
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await signOut();
              // User will be automatically redirected to login screen by AuthContext
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
              console.error('Logout error:', error);
            }
          }
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. Are you sure you want to delete your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => console.log('Delete account pressed') },
      ]
    );
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    showArrow = true, 
    rightComponent 
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showArrow?: boolean;
    rightComponent?: React.ReactNode;
  }) => (
    <TouchableOpacity style={[styles.settingItem, { borderBottomColor: theme.colors.border }]} onPress={onPress}>
      <View style={styles.settingLeft}>
        <Icon name={icon} size={24} color={theme.colors.primary} style={styles.settingIcon} />
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: theme.colors.text }]}>{title}</Text>
          {subtitle && <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightComponent}
        {showArrow && !rightComponent && (
          <Icon name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        )}
      </View>
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={[styles.sectionHeader, { color: theme.colors.textSecondary }]}>{title}</Text>
  );

  const GridLayoutOption = ({ 
    layout, 
    title, 
    description, 
    isSelected 
  }: { 
    layout: GridLayoutType; 
    title: string; 
    description: string; 
    isSelected: boolean; 
  }) => (
    <TouchableOpacity 
      style={[
        styles.gridLayoutOption, 
        { 
          borderBottomColor: theme.colors.border,
          backgroundColor: isSelected ? theme.colors.primary + '10' : 'transparent'
        }
      ]} 
      onPress={() => setGridLayout(layout)}
    >
      <View style={styles.gridLayoutLeft}>
        <View style={[
          styles.radioButton, 
          { 
            borderColor: isSelected ? theme.colors.primary : theme.colors.border,
            backgroundColor: isSelected ? theme.colors.primary : 'transparent'
          }
        ]}>
          {isSelected && <View style={styles.radioButtonInner} />}
        </View>
        <View style={styles.gridLayoutText}>
          <Text style={[styles.gridLayoutTitle, { color: theme.colors.text }]}>{title}</Text>
          <Text style={[styles.gridLayoutDescription, { color: theme.colors.textSecondary }]}>{description}</Text>
        </View>
      </View>
      <Icon 
        name={layout === '1-column' ? 'list' : 'grid'} 
        size={20} 
        color={theme.colors.textSecondary} 
      />
    </TouchableOpacity>
  );

  const NavigationStyleOption = ({ 
    style, 
    title, 
    description, 
    isSelected 
  }: { 
    style: NavigationStyleType; 
    title: string; 
    description: string; 
    isSelected: boolean; 
  }) => (
    <TouchableOpacity 
      style={[
        styles.gridLayoutOption, 
        { 
          borderBottomColor: theme.colors.border,
          backgroundColor: isSelected ? theme.colors.primary + '10' : 'transparent'
        }
      ]} 
      onPress={() => setNavigationStyle(style)}
    >
      <View style={styles.gridLayoutLeft}>
        <View style={[
          styles.radioButton, 
          { 
            borderColor: isSelected ? theme.colors.primary : theme.colors.border,
            backgroundColor: isSelected ? theme.colors.primary : 'transparent'
          }
        ]}>
          {isSelected && <View style={styles.radioButtonInner} />}
        </View>
        <View style={styles.gridLayoutText}>
          <Text style={[styles.gridLayoutTitle, { color: theme.colors.text }]}>{title}</Text>
          <Text style={[styles.gridLayoutDescription, { color: theme.colors.textSecondary }]}>{description}</Text>
        </View>
      </View>
      <Icon 
        name={style === 'floating' ? 'radio-button-on' : 'menu'} 
        size={20} 
        color={theme.colors.textSecondary} 
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Settings</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutHeaderButton}>
          <Icon name="log-out-outline" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* User Info Section */}
        <View style={[styles.userInfoSection, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.userAvatar, { backgroundColor: theme.colors.primary + '20' }]}>
            <Icon name="person" size={40} color={theme.colors.primary} />
          </View>
          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: theme.colors.text }]}>{user?.user_metadata?.name || 'User'}</Text>
            <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>{user?.email}</Text>
          </View>
        </View>

        {/* User Profile Section */}
        <SectionHeader title="Profile" />
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <SettingItem
            icon="person-circle"
            title="Edit Profile"
            subtitle="Update your personal information"
            onPress={() => navigation.navigate('Profile')}
          />
          <SettingItem
            icon="heart"
            title="My Favorites"
            subtitle="View your saved venues"
            onPress={() => navigation.navigate('Favorites')}
          />
          <SettingItem
            icon="ticket"
            title="My Flash Offers"
            subtitle={activeClaimsCount > 0 ? `${activeClaimsCount} active claim${activeClaimsCount !== 1 ? 's' : ''}` : 'View your claimed offers'}
            onPress={() => navigation.navigate('MyClaims')}
          />
          <SettingItem
            icon="help-circle"
            title="Flash Offers Help"
            subtitle="Learn how to use Flash Offers"
            onPress={() => navigation.navigate('FlashOffersHelp')}
          />
          <SettingItem
            icon="notifications"
            title="Push Notifications"
            subtitle={`${getPermissionStatusText()} • Real-time social updates`}
            rightComponent={
              <Switch
                value={pushEnabled}
                onValueChange={handlePushToggle}
                disabled={prefsLoading}
                trackColor={{ false: '#767577', true: theme.colors.primary + '80' }}
                thumbColor={pushEnabled ? theme.colors.primary : '#f4f3f4'}
              />
            }
            showArrow={false}
          />
          <SettingItem
            icon="flash"
            title="Flash Offer Notifications"
            subtitle="Configure flash offer notification preferences"
            onPress={() => navigation.navigate('NotificationSettings')}
          />
          
          {/* Notification Types Accordion */}
          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}
            onPress={() => setNotificationTypesExpanded(!notificationTypesExpanded)}
          >
            <View style={styles.settingLeft}>
              <Icon name="options" size={24} color={theme.colors.primary} style={styles.settingIcon} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Notification Types</Text>
                <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                  Choose which notifications you receive
                </Text>
              </View>
            </View>
            <View style={styles.settingRight}>
              <Icon 
                name={notificationTypesExpanded ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color={theme.colors.textSecondary} 
              />
            </View>
          </TouchableOpacity>
          
          {/* Notification Type Toggles */}
          {notificationTypesExpanded && preferences && (
            <View style={styles.accordionContent}>
              <View style={[styles.notificationTypeOption, { borderBottomColor: theme.colors.border }]}>
                <View style={styles.notificationTypeLeft}>
                  <Text style={[styles.notificationTypeTitle, { color: theme.colors.text }]}>Friend Requests</Text>
                  <Text style={[styles.notificationTypeSubtitle, { color: theme.colors.textSecondary }]}>
                    When someone sends you a friend request
                  </Text>
                </View>
                <Switch
                  value={preferences.friend_requests}
                  onValueChange={(value) => updatePreference('friend_requests', value)}
                  disabled={prefsLoading}
                  trackColor={{ false: '#767577', true: theme.colors.primary + '80' }}
                  thumbColor={preferences.friend_requests ? theme.colors.primary : '#f4f3f4'}
                />
              </View>
              
              <View style={[styles.notificationTypeOption, { borderBottomColor: theme.colors.border }]}>
                <View style={styles.notificationTypeLeft}>
                  <Text style={[styles.notificationTypeTitle, { color: theme.colors.text }]}>Friend Accepted</Text>
                  <Text style={[styles.notificationTypeSubtitle, { color: theme.colors.textSecondary }]}>
                    When someone accepts your friend request
                  </Text>
                </View>
                <Switch
                  value={preferences.friend_accepted}
                  onValueChange={(value) => updatePreference('friend_accepted', value)}
                  disabled={prefsLoading}
                  trackColor={{ false: '#767577', true: theme.colors.primary + '80' }}
                  thumbColor={preferences.friend_accepted ? theme.colors.primary : '#f4f3f4'}
                />
              </View>
              
              <View style={[styles.notificationTypeOption, { borderBottomColor: theme.colors.border }]}>
                <View style={styles.notificationTypeLeft}>
                  <Text style={[styles.notificationTypeTitle, { color: theme.colors.text }]}>Venue Shares</Text>
                  <Text style={[styles.notificationTypeSubtitle, { color: theme.colors.textSecondary }]}>
                    When a friend shares a venue with you
                  </Text>
                </View>
                <Switch
                  value={preferences.venue_shares}
                  onValueChange={(value) => updatePreference('venue_shares', value)}
                  disabled={prefsLoading}
                  trackColor={{ false: '#767577', true: theme.colors.primary + '80' }}
                  thumbColor={preferences.venue_shares ? theme.colors.primary : '#f4f3f4'}
                />
              </View>
              
              <View style={[styles.notificationTypeOption, { borderBottomColor: theme.colors.border }]}>
                <View style={styles.notificationTypeLeft}>
                  <Text style={[styles.notificationTypeTitle, { color: theme.colors.text }]}>Collection Follows</Text>
                  <Text style={[styles.notificationTypeSubtitle, { color: theme.colors.textSecondary }]}>
                    When someone follows your collection
                  </Text>
                </View>
                <Switch
                  value={preferences.collection_follows}
                  onValueChange={(value) => updatePreference('collection_follows', value)}
                  disabled={prefsLoading}
                  trackColor={{ false: '#767577', true: theme.colors.primary + '80' }}
                  thumbColor={preferences.collection_follows ? theme.colors.primary : '#f4f3f4'}
                />
              </View>
              
              <View style={[styles.notificationTypeOption, { borderBottomColor: theme.colors.border }]}>
                <View style={styles.notificationTypeLeft}>
                  <Text style={[styles.notificationTypeTitle, { color: theme.colors.text }]}>Activity Likes</Text>
                  <Text style={[styles.notificationTypeSubtitle, { color: theme.colors.textSecondary }]}>
                    When someone likes your activity
                  </Text>
                </View>
                <Switch
                  value={preferences.activity_likes}
                  onValueChange={(value) => updatePreference('activity_likes', value)}
                  disabled={prefsLoading}
                  trackColor={{ false: '#767577', true: theme.colors.primary + '80' }}
                  thumbColor={preferences.activity_likes ? theme.colors.primary : '#f4f3f4'}
                />
              </View>
              
              <View style={[styles.notificationTypeOption, { borderBottomColor: theme.colors.border }]}>
                <View style={styles.notificationTypeLeft}>
                  <Text style={[styles.notificationTypeTitle, { color: theme.colors.text }]}>Activity Comments</Text>
                  <Text style={[styles.notificationTypeSubtitle, { color: theme.colors.textSecondary }]}>
                    When someone comments on your activity
                  </Text>
                </View>
                <Switch
                  value={preferences.activity_comments}
                  onValueChange={(value) => updatePreference('activity_comments', value)}
                  disabled={prefsLoading}
                  trackColor={{ false: '#767577', true: theme.colors.primary + '80' }}
                  thumbColor={preferences.activity_comments ? theme.colors.primary : '#f4f3f4'}
                />
              </View>
            </View>
          )}
          
          <SettingItem
            icon="notifications-outline"
            title="In-App Notifications"
            subtitle="Manage your notification preferences"
            rightComponent={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#767577', true: theme.colors.primary + '80' }}
                thumbColor={notificationsEnabled ? theme.colors.primary : '#f4f3f4'}
              />
            }
            showArrow={false}
          />
          <SettingItem
            icon="location"
            title="Location Services"
            subtitle="Allow app to access your location"
            rightComponent={
              <Switch
                value={locationEnabled}
                onValueChange={setLocationEnabled}
                trackColor={{ false: '#767577', true: theme.colors.primary + '80' }}
                thumbColor={locationEnabled ? theme.colors.primary : '#f4f3f4'}
              />
            }
            showArrow={false}
          />
        </View>

        {/* Friends Section */}
        <SectionHeader title="Social" />
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <SettingItem
            icon="people"
            title="Friends"
            subtitle={friendsLoading ? 'Loading...' : `${friends.length} friends`}
            onPress={() => {
              Alert.alert(
                'Friends',
                'Friends list feature coming soon! You can manage your friend connections here.',
                [{ text: 'OK' }]
              );
            }}
          />
          
          {/* Privacy Settings Accordion */}
          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}
            onPress={() => setPrivacyExpanded(!privacyExpanded)}
          >
            <View style={styles.settingLeft}>
              <Icon name="shield-checkmark" size={24} color={theme.colors.primary} style={styles.settingIcon} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Privacy Settings</Text>
                <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                  Control who can see your activity
                </Text>
              </View>
            </View>
            <View style={styles.settingRight}>
              <Icon 
                name={privacyExpanded ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color={theme.colors.textSecondary} 
              />
            </View>
          </TouchableOpacity>
          
          {/* Privacy Settings Options */}
          {privacyExpanded && (
            <View style={styles.accordionContent}>
              <View style={[styles.privacyOption, { borderBottomColor: theme.colors.border }]}>
                <View style={styles.privacyOptionLeft}>
                  <Text style={[styles.privacyOptionTitle, { color: theme.colors.text }]}>Check-in Visibility</Text>
                  <Text style={[styles.privacyOptionSubtitle, { color: theme.colors.textSecondary }]}>
                    Who can see when you check in
                  </Text>
                </View>
                <TouchableOpacity 
                  style={[styles.privacyButton, { backgroundColor: theme.colors.primary + '20' }]}
                  onPress={() => {
                    Alert.alert(
                      'Check-in Visibility',
                      'Choose who can see your check-ins',
                      [
                        { text: 'Public' },
                        { text: 'Friends' },
                        { text: 'Close Friends' },
                        { text: 'Private' },
                        { text: 'Cancel', style: 'cancel' },
                      ]
                    );
                  }}
                >
                  <Text style={[styles.privacyButtonText, { color: theme.colors.primary }]}>Friends</Text>
                </TouchableOpacity>
              </View>
              
              <View style={[styles.privacyOption, { borderBottomColor: theme.colors.border }]}>
                <View style={styles.privacyOptionLeft}>
                  <Text style={[styles.privacyOptionTitle, { color: theme.colors.text }]}>Favorites Visibility</Text>
                  <Text style={[styles.privacyOptionSubtitle, { color: theme.colors.textSecondary }]}>
                    Who can see your favorite venues
                  </Text>
                </View>
                <TouchableOpacity 
                  style={[styles.privacyButton, { backgroundColor: theme.colors.primary + '20' }]}
                  onPress={() => {
                    Alert.alert(
                      'Favorites Visibility',
                      'Choose who can see your favorites',
                      [
                        { text: 'Public' },
                        { text: 'Friends' },
                        { text: 'Close Friends' },
                        { text: 'Private' },
                        { text: 'Cancel', style: 'cancel' },
                      ]
                    );
                  }}
                >
                  <Text style={[styles.privacyButtonText, { color: theme.colors.primary }]}>Friends</Text>
                </TouchableOpacity>
              </View>
              
              <View style={[styles.privacyOption, { borderBottomColor: theme.colors.border }]}>
                <View style={styles.privacyOptionLeft}>
                  <Text style={[styles.privacyOptionTitle, { color: theme.colors.text }]}>Collections Visibility</Text>
                  <Text style={[styles.privacyOptionSubtitle, { color: theme.colors.textSecondary }]}>
                    Default privacy for new collections
                  </Text>
                </View>
                <TouchableOpacity 
                  style={[styles.privacyButton, { backgroundColor: theme.colors.primary + '20' }]}
                  onPress={() => {
                    Alert.alert(
                      'Collections Visibility',
                      'Choose default privacy for collections',
                      [
                        { text: 'Public' },
                        { text: 'Friends' },
                        { text: 'Close Friends' },
                        { text: 'Private' },
                        { text: 'Cancel', style: 'cancel' },
                      ]
                    );
                  }}
                >
                  <Text style={[styles.privacyButtonText, { color: theme.colors.primary }]}>Friends</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          <SettingItem
            icon="ban"
            title="Blocked Users"
            subtitle="Manage blocked users"
            onPress={() => {
              Alert.alert(
                'Blocked Users',
                'Blocked users list feature coming soon! You can manage blocked users here.',
                [{ text: 'OK' }]
              );
            }}
          />
        </View>

        {/* App Preferences */}
        <SectionHeader title="Preferences" />
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}
            onPress={() => {
              Alert.alert(
                'Theme',
                'Choose your preferred theme',
                [
                  { text: 'Light', onPress: () => handleThemeChange('light') },
                  { text: 'Dark', onPress: () => handleThemeChange('dark') },
                  { text: 'System', onPress: () => handleThemeChange('system') },
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
            }}
          >
            <View style={styles.settingLeft}>
              <Icon name="moon" size={24} color={theme.colors.primary} style={styles.settingIcon} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Theme</Text>
                <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>{getThemeDisplayText()}</Text>
              </View>
            </View>
            <View style={styles.settingRight}>
              <Icon name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </View>
          </TouchableOpacity>
          <SettingItem
            icon="language"
            title="Language"
            subtitle="English"
            onPress={() => console.log('Language pressed')}
          />
          <SettingItem
            icon="map"
            title="Default Location"
            subtitle="Set your preferred search area"
            onPress={() => console.log('Default location pressed')}
          />
        </View>

        {/* Experimental Features */}
        <SectionHeader title="Experimental Features" />
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <SettingItem
            icon="flask"
            title="Beta Features"
            subtitle="Try out new features before they're released"
            rightComponent={
              <Switch
                value={experimentalFeaturesEnabled}
                onValueChange={setExperimentalFeaturesEnabled}
                trackColor={{ false: '#767577', true: theme.colors.primary + '80' }}
                thumbColor={experimentalFeaturesEnabled ? theme.colors.primary : '#f4f3f4'}
              />
            }
            showArrow={false}
          />
          
          {/* Grid Layout Accordion */}
          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}
            onPress={() => setGridLayoutExpanded(!gridLayoutExpanded)}
          >
            <View style={styles.settingLeft}>
              <Icon name="grid" size={24} color={theme.colors.primary} style={styles.settingIcon} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Grid Layout</Text>
                <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                  {gridLayout === '1-column' ? '1 Column' : '2 Column'} layout
                </Text>
              </View>
            </View>
            <View style={styles.settingRight}>
              <Icon 
                name={gridLayoutExpanded ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color={theme.colors.textSecondary} 
              />
            </View>
          </TouchableOpacity>
          
          {/* Grid Layout Options */}
          {gridLayoutExpanded && (
            <View style={styles.accordionContent}>
              <GridLayoutOption
                layout="1-column"
                title="1 Column Grid"
                description="Single column layout for detailed view"
                isSelected={gridLayout === '1-column'}
              />
              <GridLayoutOption
                layout="2-column"
                title="2 Column Grid"
                description="Compact two-column layout"
                isSelected={gridLayout === '2-column'}
              />
            </View>
          )}
          
          {/* Navigation Style Accordion */}
          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}
            onPress={() => setNavigationStyleExpanded(!navigationStyleExpanded)}
          >
            <View style={styles.settingLeft}>
              <Icon name="navigate" size={24} color={theme.colors.primary} style={styles.settingIcon} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Navigation Style</Text>
                <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                  {navigationStyle === 'floating' ? 'Floating' : 'Regular'} tab bar
                </Text>
              </View>
            </View>
            <View style={styles.settingRight}>
              <Icon 
                name={navigationStyleExpanded ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color={theme.colors.textSecondary} 
              />
            </View>
          </TouchableOpacity>
          
          {/* Navigation Style Options */}
          {navigationStyleExpanded && (
            <View style={styles.accordionContent}>
              <NavigationStyleOption
                style="floating"
                title="Floating Tab Bar"
                description="Modern floating navigation at bottom"
                isSelected={navigationStyle === 'floating'}
              />
              <NavigationStyleOption
                style="regular"
                title="Regular Tab Bar"
                description="Traditional bottom tab navigation"
                isSelected={navigationStyle === 'regular'}
              />
            </View>
          )}
          
          <SettingItem
            icon="refresh"
            title="Update Venue Data"
            subtitle="Refresh venues with enhanced information"
            onPress={handleUpdateVenueData}
          />
          <SettingItem
            icon="analytics"
            title="Usage Analytics"
            subtitle="Help improve the app by sharing usage data"
            onPress={() => console.log('Analytics pressed')}
          />
          <SettingItem
            icon="bug"
            title="Debug Mode"
            subtitle="Enable advanced debugging features"
            onPress={() => console.log('Debug mode pressed')}
          />
        </View>

        {/* Support & Legal */}
        <SectionHeader title="Support & Legal" />
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <SettingItem
            icon="flag"
            title="My Reports"
            subtitle="View notifications you've reported"
            onPress={() => {
              Alert.alert(
                'My Reports',
                'View and manage your reported notifications. This feature helps us maintain a safe community.',
                [{ text: 'OK' }]
              );
            }}
          />
          <SettingItem
            icon="help-circle"
            title="Help & Support"
            subtitle="Get help or contact support"
            onPress={() => console.log('Help pressed')}
          />
          <SettingItem
            icon="document-text"
            title="Privacy Policy"
            onPress={() => console.log('Privacy policy pressed')}
          />
          <SettingItem
            icon="document-text"
            title="Terms of Service"
            onPress={() => console.log('Terms pressed')}
          />
          <SettingItem
            icon="information-circle"
            title="About"
            subtitle="Version 1.0.0"
            onPress={() => console.log('About pressed')}
          />
        </View>

        {/* Account Actions */}
        <SectionHeader title="Account" />
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <SettingItem
            icon="log-out"
            title="Logout"
            onPress={handleLogout}
          />
          <TouchableOpacity style={styles.dangerItem} onPress={handleDeleteAccount}>
            <Icon name="trash" size={24} color="#FF3B30" style={styles.settingIcon} />
            <Text style={styles.dangerText}>Delete Account</Text>
          </TouchableOpacity>
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold', // Primary font for headings
  },
  logoutHeaderButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  userInfoSection: {
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold', // Primary font for headings
  },
  userEmail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular', // Secondary font for body text
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 30,
    marginBottom: 10,
    marginHorizontal: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: 'Poppins-SemiBold', // Primary font for headings
  },
  section: {
    marginHorizontal: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 15,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
    fontFamily: 'Inter-Medium', // Secondary font for UI elements
  },
  settingSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular', // Secondary font for body text
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dangerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  dangerText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF3B30',
    marginLeft: 15,
    fontFamily: 'Inter-Medium', // Secondary font for UI elements
  },
  bottomSpacing: {
    height: 50,
  },
  accordionContent: {
    backgroundColor: '#E8E8E8', // Solid color for light theme
  },
  gridLayoutOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  gridLayoutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  gridLayoutText: {
    flex: 1,
  },
  gridLayoutTitle: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
    fontFamily: 'Inter-Medium',
  },
  gridLayoutDescription: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  privacyOptionLeft: {
    flex: 1,
    marginRight: 12,
  },
  privacyOptionTitle: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
    fontFamily: 'Inter-Medium',
  },
  privacyOptionSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  privacyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  privacyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  notificationTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  notificationTypeLeft: {
    flex: 1,
    marginRight: 12,
  },
  notificationTypeTitle: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
    fontFamily: 'Inter-Medium',
  },
  notificationTypeSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
});

export default SettingsScreen;