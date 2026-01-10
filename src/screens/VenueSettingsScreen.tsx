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
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import Icon from 'react-native-vector-icons/Ionicons';

const VenueSettingsScreen: React.FC = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoAcceptReservations, setAutoAcceptReservations] = useState(false);
  const { theme, themeMode, setThemeMode, isDark } = useTheme();
  const { user, venueBusinessAccount } = useAuth();

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Venue Info Section */}
        <View style={[
          styles.venueInfoSection, 
          { 
            backgroundColor: theme.colors.surface,
            shadowColor: theme.colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0 : 0.1,
            shadowRadius: 8,
            elevation: isDark ? 0 : 4,
            borderWidth: isDark ? 0 : 1,
            borderColor: theme.colors.border,
          }
        ]}>
          <View style={[styles.venueIcon, { backgroundColor: theme.colors.primary + '20' }]}>
            <Icon name="storefront" size={40} color={theme.colors.primary} />
          </View>
          <View style={styles.venueDetails}>
            <Text style={[styles.venueName, { color: theme.colors.text }]}>
              {venueBusinessAccount?.venues?.name || 'Demo Venue'}
            </Text>
            <Text style={[styles.venueEmail, { color: theme.colors.textSecondary }]}>
              {user?.email || 'demo@venue.com'}
            </Text>
            <Text style={[styles.subscriptionBadge, { 
              color: theme.colors.primary, 
              backgroundColor: theme.colors.primary + '20' 
            }]}>
              {venueBusinessAccount?.subscription_tier?.toUpperCase() || 'FREE'} PLAN
            </Text>
          </View>
        </View>

        {/* Venue Management */}
        <SectionHeader title="Venue Management" />
        <View style={[
          styles.section, 
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
        ]}>
          <SettingItem
            icon="create-outline"
            title="Edit Venue Profile"
            subtitle="Update venue information and photos"
            onPress={() => Alert.alert('Coming Soon', 'Venue profile editing is being developed')}
          />
          <SettingItem
            icon="time-outline"
            title="Operating Hours"
            subtitle="Manage your venue's hours"
            onPress={() => Alert.alert('Coming Soon', 'Hours management is being developed')}
          />
          <SettingItem
            icon="camera-outline"
            title="Manage Photos"
            subtitle="Upload and organize venue photos"
            onPress={() => Alert.alert('Coming Soon', 'Photo management is being developed')}
          />
          <SettingItem
            icon="pricetag-outline"
            title="Menu & Pricing"
            subtitle="Update your menu and prices"
            onPress={() => Alert.alert('Coming Soon', 'Menu management is being developed')}
          />
        </View>

        {/* Notifications & Automation */}
        <SectionHeader title="Notifications & Automation" />
        <View style={[
          styles.section, 
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
        ]}>
          <SettingItem
            icon="notifications-outline"
            title="Push Notifications"
            subtitle="Send promotions to nearby customers"
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
            icon="checkmark-circle-outline"
            title="Auto-Accept Reservations"
            subtitle="Automatically accept reservation requests"
            rightComponent={
              <Switch
                value={autoAcceptReservations}
                onValueChange={setAutoAcceptReservations}
                trackColor={{ false: '#767577', true: theme.colors.primary + '80' }}
                thumbColor={autoAcceptReservations ? theme.colors.primary : '#f4f3f4'}
              />
            }
            showArrow={false}
          />
          <SettingItem
            icon="flash-outline"
            title="Flash Offers"
            subtitle="Create time-limited promotions"
            onPress={() => Alert.alert('Coming Soon', 'Flash offers are being developed')}
          />
        </View>

        {/* App Preferences */}
        <SectionHeader title="App Preferences" />
        <View style={[
          styles.section, 
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
        ]}>
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
            icon="language-outline"
            title="Language"
            subtitle="English"
            onPress={() => Alert.alert('Coming Soon', 'Language settings are being developed')}
          />
        </View>

        {/* Subscription & Billing */}
        <SectionHeader title="Subscription & Billing" />
        <View style={[
          styles.section, 
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
        ]}>
          <SettingItem
            icon="card-outline"
            title="Subscription Plan"
            subtitle={`${venueBusinessAccount?.subscription_tier?.toUpperCase() || 'FREE'} - Manage your plan`}
            onPress={() => Alert.alert('Coming Soon', 'Subscription management is being developed')}
          />
          <SettingItem
            icon="receipt-outline"
            title="Billing History"
            subtitle="View past invoices and payments"
            onPress={() => Alert.alert('Coming Soon', 'Billing history is being developed')}
          />
          <SettingItem
            icon="wallet-outline"
            title="Payment Methods"
            subtitle="Manage your payment options"
            onPress={() => Alert.alert('Coming Soon', 'Payment management is being developed')}
          />
        </View>

        {/* Support & Legal */}
        <SectionHeader title="Support & Legal" />
        <View style={[
          styles.section, 
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
        ]}>
          <SettingItem
            icon="help-circle-outline"
            title="Help & Support"
            subtitle="Get help with your venue account"
            onPress={() => Alert.alert('Support', 'Contact support at support@otw.com')}
          />
          <SettingItem
            icon="document-text-outline"
            title="Terms of Service"
            subtitle="Read our terms and conditions"
            onPress={() => Alert.alert('Coming Soon', 'Terms of service viewer is being developed')}
          />
          <SettingItem
            icon="shield-checkmark-outline"
            title="Privacy Policy"
            subtitle="Learn how we protect your data"
            onPress={() => Alert.alert('Coming Soon', 'Privacy policy viewer is being developed')}
          />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  scrollView: {
    flex: 1,
  },
  venueInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
  },
  venueIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  venueDetails: {
    flex: 1,
  },
  venueName: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
    marginBottom: 4,
  },
  venueEmail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  subscriptionBadge: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 32,
    marginBottom: 12,
    marginHorizontal: 20,
  },
  section: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomSpacing: {
    height: 100,
  },
});

export default VenueSettingsScreen;