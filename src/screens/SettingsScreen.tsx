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
import Icon from 'react-native-vector-icons/Ionicons';

const SettingsScreen: React.FC = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [experimentalFeaturesEnabled, setExperimentalFeaturesEnabled] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => console.log('Logout pressed') },
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
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <Icon name={icon} size={24} color="#007AFF" style={styles.settingIcon} />
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightComponent}
        {showArrow && !rightComponent && (
          <Icon name="chevron-forward" size={20} color="#ccc" />
        )}
      </View>
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* User Profile Section */}
        <SectionHeader title="Profile" />
        <View style={styles.section}>
          <SettingItem
            icon="person-circle"
            title="Edit Profile"
            subtitle="Update your personal information"
            onPress={() => console.log('Edit profile pressed')}
          />
          <SettingItem
            icon="notifications"
            title="Notifications"
            subtitle="Manage your notification preferences"
            rightComponent={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={notificationsEnabled ? '#007AFF' : '#f4f3f4'}
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
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={locationEnabled ? '#007AFF' : '#f4f3f4'}
              />
            }
            showArrow={false}
          />
        </View>

        {/* App Preferences */}
        <SectionHeader title="Preferences" />
        <View style={styles.section}>
          <SettingItem
            icon="moon"
            title="Dark Mode"
            subtitle="Switch to dark theme"
            rightComponent={
              <Switch
                value={darkModeEnabled}
                onValueChange={setDarkModeEnabled}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={darkModeEnabled ? '#007AFF' : '#f4f3f4'}
              />
            }
            showArrow={false}
          />
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
        <View style={styles.section}>
          <SettingItem
            icon="flask"
            title="Beta Features"
            subtitle="Try out new features before they're released"
            rightComponent={
              <Switch
                value={experimentalFeaturesEnabled}
                onValueChange={setExperimentalFeaturesEnabled}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={experimentalFeaturesEnabled ? '#007AFF' : '#f4f3f4'}
              />
            }
            showArrow={false}
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
        <View style={styles.section}>
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
        <View style={styles.section}>
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 30,
    marginBottom: 10,
    marginHorizontal: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    backgroundColor: '#fff',
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
    borderBottomColor: '#f0f0f0',
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
    color: '#333',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
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
  },
  bottomSpacing: {
    height: 50,
  },
});

export default SettingsScreen;