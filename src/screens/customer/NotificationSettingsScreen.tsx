import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { NotificationPreferencesService, FlashOfferNotificationPreferences } from '../../services/api/notificationPreferences';
import { PushNotificationStatus } from '../../components/settings/PushNotificationStatus';
import Icon from 'react-native-vector-icons/Ionicons';

/**
 * NotificationSettingsScreen
 * 
 * Allows users to configure their flash offer notification preferences:
 * - Toggle flash offer notifications on/off
 * - Set quiet hours (start and end times)
 * - Select timezone
 * - Set maximum distance for notifications
 * 
 * Validates: Requirements 12.3, 12.7, 12.10
 */
const NotificationSettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  
  // State for preferences
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<FlashOfferNotificationPreferences | null>(null);
  
  // State for UI controls
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showTimezoneModal, setShowTimezoneModal] = useState(false);
  
  // Temporary state for time pickers
  const [tempStartTime, setTempStartTime] = useState(new Date());
  const [tempEndTime, setTempEndTime] = useState(new Date());

  // Common timezones for the dropdown
  const COMMON_TIMEZONES = [
    { label: 'UTC', value: 'UTC' },
    { label: 'Eastern Time (ET)', value: 'America/New_York' },
    { label: 'Central Time (CT)', value: 'America/Chicago' },
    { label: 'Mountain Time (MT)', value: 'America/Denver' },
    { label: 'Pacific Time (PT)', value: 'America/Los_Angeles' },
    { label: 'Alaska Time (AKT)', value: 'America/Anchorage' },
    { label: 'Hawaii Time (HT)', value: 'Pacific/Honolulu' },
    { label: 'London (GMT)', value: 'Europe/London' },
    { label: 'Paris (CET)', value: 'Europe/Paris' },
    { label: 'Tokyo (JST)', value: 'Asia/Tokyo' },
    { label: 'Sydney (AEDT)', value: 'Australia/Sydney' },
  ];

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const prefs = await NotificationPreferencesService.getPreferences(user.id);
      setPreferences(prefs);
      
      // Initialize time pickers with current values
      if (prefs.quiet_hours_start) {
        const [hours, minutes] = prefs.quiet_hours_start.split(':').map(Number);
        const startDate = new Date();
        startDate.setHours(hours, minutes, 0);
        setTempStartTime(startDate);
      }
      
      if (prefs.quiet_hours_end) {
        const [hours, minutes] = prefs.quiet_hours_end.split(':').map(Number);
        const endDate = new Date();
        endDate.setHours(hours, minutes, 0);
        setTempEndTime(endDate);
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      Alert.alert('Error', 'Failed to load notification preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (updates: Partial<FlashOfferNotificationPreferences>) => {
    if (!user?.id || !preferences) return;
    
    try {
      setSaving(true);
      const updated = await NotificationPreferencesService.updatePreferences(user.id, updates);
      setPreferences(updated);
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      Alert.alert('Error', 'Failed to update preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleNotifications = async (value: boolean) => {
    await updatePreference({ flash_offers_enabled: value });
  };

  const handleStartTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartTimePicker(false);
    }
    
    if (selectedDate) {
      setTempStartTime(selectedDate);
      
      // Format time as HH:MM:SS
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}:00`;
      
      updatePreference({ quiet_hours_start: timeString });
    }
  };

  const handleEndTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndTimePicker(false);
    }
    
    if (selectedDate) {
      setTempEndTime(selectedDate);
      
      // Format time as HH:MM:SS
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}:00`;
      
      updatePreference({ quiet_hours_end: timeString });
    }
  };

  const handleClearQuietHours = async () => {
    Alert.alert(
      'Clear Quiet Hours',
      'Are you sure you want to remove quiet hours? You\'ll receive notifications at any time.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await updatePreference({
              quiet_hours_start: null,
              quiet_hours_end: null,
            });
          },
        },
      ]
    );
  };

  const handleTimezoneSelect = async (timezone: string) => {
    await updatePreference({ timezone });
    setShowTimezoneModal(false);
  };

  const handleDistanceChange = (distance: number | null) => {
    updatePreference({ max_distance_miles: distance });
  };

  const formatTime = (timeString: string | null): string => {
    if (!timeString) return 'Not set';
    
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const getTimezoneLabel = (value: string): string => {
    const timezone = COMMON_TIMEZONES.find(tz => tz.value === value);
    return timezone?.label || value;
  };

  if (loading || !preferences) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Flash Offer Notifications</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading preferences...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} testID="back-button">
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Flash Offer Notifications</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Push Notification Status */}
        <PushNotificationStatus style={styles.statusCard} />

        {/* Description */}
        <View style={styles.descriptionContainer}>
          <Text style={[styles.descriptionText, { color: theme.colors.textSecondary }]}>
            Control when and how you receive flash offer notifications from nearby venues.
          </Text>
        </View>

        {/* Enable/Disable Flash Offers */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.settingLeft}>
              <Icon name="notifications" size={24} color={theme.colors.primary} style={styles.settingIcon} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Flash Offer Notifications</Text>
                <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                  Receive notifications for nearby flash offers
                </Text>
              </View>
            </View>
            <Switch
              value={preferences.flash_offers_enabled}
              onValueChange={handleToggleNotifications}
              disabled={saving}
              trackColor={{ false: '#767577', true: theme.colors.primary + '80' }}
              thumbColor={preferences.flash_offers_enabled ? theme.colors.primary : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Quiet Hours Section */}
        <Text style={[styles.sectionHeader, { color: theme.colors.textSecondary }]}>Quiet Hours</Text>
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.settingLeft}>
              <Icon name="moon" size={24} color={theme.colors.primary} style={styles.settingIcon} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Quiet Hours Start</Text>
                <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                  {formatTime(preferences.quiet_hours_start)}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setShowStartTimePicker(true)}
              disabled={saving || !preferences.flash_offers_enabled}
              style={[styles.timeButton, { backgroundColor: theme.colors.primary + '20' }]}
            >
              <Text style={[styles.timeButtonText, { color: theme.colors.primary }]}>Set</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.settingLeft}>
              <Icon name="sunny" size={24} color={theme.colors.primary} style={styles.settingIcon} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Quiet Hours End</Text>
                <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                  {formatTime(preferences.quiet_hours_end)}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setShowEndTimePicker(true)}
              disabled={saving || !preferences.flash_offers_enabled}
              style={[styles.timeButton, { backgroundColor: theme.colors.primary + '20' }]}
            >
              <Text style={[styles.timeButtonText, { color: theme.colors.primary }]}>Set</Text>
            </TouchableOpacity>
          </View>

          {(preferences.quiet_hours_start || preferences.quiet_hours_end) && (
            <TouchableOpacity
              style={[styles.clearButton, { borderTopColor: theme.colors.border }]}
              onPress={handleClearQuietHours}
              disabled={saving}
            >
              <Icon name="close-circle" size={20} color="#FF3B30" />
              <Text style={styles.clearButtonText}>Clear Quiet Hours</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Timezone Section */}
        <Text style={[styles.sectionHeader, { color: theme.colors.textSecondary }]}>Timezone</Text>
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <TouchableOpacity
            style={[styles.settingItem, { borderBottomWidth: 0 }]}
            onPress={() => setShowTimezoneModal(true)}
            disabled={saving || !preferences.flash_offers_enabled}
          >
            <View style={styles.settingLeft}>
              <Icon name="time" size={24} color={theme.colors.primary} style={styles.settingIcon} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Timezone</Text>
                <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                  {getTimezoneLabel(preferences.timezone)}
                </Text>
              </View>
            </View>
            <Icon name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Distance Section */}
        <Text style={[styles.sectionHeader, { color: theme.colors.textSecondary }]}>Maximum Distance</Text>
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.distanceContainer}>
            <Text style={[styles.distanceLabel, { color: theme.colors.text }]}>
              {preferences.max_distance_miles ? `${preferences.max_distance_miles} miles` : 'No Limit'}
            </Text>
            <Text style={[styles.distanceDescription, { color: theme.colors.textSecondary }]}>
              Only receive notifications for offers within this distance
            </Text>
          </View>

          {/* Distance Options */}
          <View style={styles.distanceOptions}>
            {[1, 5, 10, 25, 50, null].map((distance) => (
              <TouchableOpacity
                key={distance?.toString() || 'unlimited'}
                style={[
                  styles.distanceOption,
                  {
                    backgroundColor: preferences.max_distance_miles === distance
                      ? theme.colors.primary + '20'
                      : theme.colors.background,
                    borderColor: preferences.max_distance_miles === distance
                      ? theme.colors.primary
                      : theme.colors.border,
                  },
                ]}
                onPress={() => handleDistanceChange(distance)}
                disabled={saving || !preferences.flash_offers_enabled}
              >
                <Text
                  style={[
                    styles.distanceOptionText,
                    {
                      color: preferences.max_distance_miles === distance
                        ? theme.colors.primary
                        : theme.colors.text,
                    },
                  ]}
                >
                  {distance ? `${distance} mi` : 'No Limit'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Time Pickers */}
      {showStartTimePicker && (
        <DateTimePicker
          value={tempStartTime}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleStartTimeChange}
        />
      )}

      {showEndTimePicker && (
        <DateTimePicker
          value={tempEndTime}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleEndTimeChange}
        />
      )}

      {/* Timezone Modal */}
      {showTimezoneModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Select Timezone</Text>
              <TouchableOpacity onPress={() => setShowTimezoneModal(false)}>
                <Icon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {COMMON_TIMEZONES.map((tz) => (
                <TouchableOpacity
                  key={tz.value}
                  style={[
                    styles.timezoneOption,
                    {
                      backgroundColor: preferences.timezone === tz.value
                        ? theme.colors.primary + '10'
                        : 'transparent',
                      borderBottomColor: theme.colors.border,
                    },
                  ]}
                  onPress={() => handleTimezoneSelect(tz.value)}
                >
                  <Text style={[styles.timezoneLabel, { color: theme.colors.text }]}>{tz.label}</Text>
                  {preferences.timezone === tz.value && (
                    <Icon name="checkmark" size={24} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  scrollView: {
    flex: 1,
  },
  statusCard: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  descriptionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 30,
    marginBottom: 10,
    marginHorizontal: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: 'Poppins-SemiBold',
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
    fontFamily: 'Inter-Medium',
  },
  settingSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  timeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  timeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderTopWidth: 1,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF3B30',
    marginLeft: 8,
    fontFamily: 'Inter-Medium',
  },
  distanceContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
  },
  distanceLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold',
  },
  distanceDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  distanceOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    paddingBottom: 15,
    gap: 10,
  },
  distanceOption: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
    minWidth: 80,
    alignItems: 'center',
  },
  distanceOptionText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  bottomSpacing: {
    height: 50,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxHeight: '70%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  modalScroll: {
    maxHeight: 400,
  },
  timezoneOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  timezoneLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
});

export default NotificationSettingsScreen;
