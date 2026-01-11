import React, { useState } from 'react';
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
import { populateVenuesDatabase } from '../../utils/populateVenues';
import Icon from 'react-native-vector-icons/Ionicons';

const SettingsScreen: React.FC = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [experimentalFeaturesEnabled, setExperimentalFeaturesEnabled] = useState(false);
  const [gridLayoutExpanded, setGridLayoutExpanded] = useState(false);
  const [navigationStyleExpanded, setNavigationStyleExpanded] = useState(false);
  const { signOut, user } = useAuth();
  const { theme, themeMode, setThemeMode } = useTheme();
  const { gridLayout, setGridLayout } = useGridLayout();
  const { navigationStyle, setNavigationStyle } = useNavigationStyle();
  const navigation = useNavigation<any>();

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
            onPress={() => console.log('Edit profile pressed')}
          />
          <SettingItem
            icon="heart"
            title="My Favorites"
            subtitle="View your saved venues"
            onPress={() => navigation.navigate('Favorites')}
          />
          <SettingItem
            icon="notifications"
            title="Notifications"
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
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
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
});

export default SettingsScreen;