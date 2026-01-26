/**
 * TimezoneChangeModal Component
 * 
 * Modal that prompts users when their device timezone changes.
 * Shows both old and new timezone with friendly names.
 * Provides "Update" and "Keep Current" options.
 * 
 * Requirements: 5.2, 5.3, 5.4, 5.5
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { getFriendlyTimezoneName } from '../../utils/timezone';

interface TimezoneChangeModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** The old timezone stored in preferences (IANA format) */
  oldTimezone: string;
  /** The new timezone detected on device (IANA format) */
  newTimezone: string;
  /** Handler for when user accepts the timezone change */
  onAccept: () => void;
  /** Handler for when user declines the timezone change */
  onDecline: () => void;
  /** Whether an action is currently being processed */
  loading?: boolean;
}

/**
 * TimezoneChangeModal Component
 * 
 * Displays a modal prompting the user to update their timezone when
 * the device timezone changes. Shows both old and new timezones with
 * friendly names and provides clear action buttons.
 */
const TimezoneChangeModal: React.FC<TimezoneChangeModalProps> = ({
  visible,
  oldTimezone,
  newTimezone,
  onAccept,
  onDecline,
  loading = false,
}) => {
  const { theme } = useTheme();

  const oldFriendlyName = getFriendlyTimezoneName(oldTimezone);
  const newFriendlyName = getFriendlyTimezoneName(newTimezone);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDecline}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
            <Icon
              name="time-outline"
              size={40}
              color={theme.colors.primary}
            />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Timezone Changed
          </Text>

          {/* Description */}
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            We detected that your device timezone has changed. Would you like to update your notification settings?
          </Text>

          {/* Timezone Comparison */}
          <View style={[styles.timezoneContainer, { backgroundColor: theme.colors.background }]}>
            {/* Old Timezone */}
            <View style={styles.timezoneRow}>
              <Text style={[styles.timezoneLabel, { color: theme.colors.textSecondary }]}>
                Current:
              </Text>
              <View style={styles.timezoneInfo}>
                <Text style={[styles.timezoneName, { color: theme.colors.text }]}>
                  {oldFriendlyName}
                </Text>
                <Text style={[styles.timezoneIANA, { color: theme.colors.textSecondary }]}>
                  {oldTimezone}
                </Text>
              </View>
            </View>

            {/* Arrow */}
            <View style={styles.arrowContainer}>
              <Icon
                name="arrow-down"
                size={24}
                color={theme.colors.primary}
              />
            </View>

            {/* New Timezone */}
            <View style={styles.timezoneRow}>
              <Text style={[styles.timezoneLabel, { color: theme.colors.textSecondary }]}>
                New:
              </Text>
              <View style={styles.timezoneInfo}>
                <Text style={[styles.timezoneName, { color: theme.colors.text }]}>
                  {newFriendlyName}
                </Text>
                <Text style={[styles.timezoneIANA, { color: theme.colors.textSecondary }]}>
                  {newTimezone}
                </Text>
              </View>
            </View>
          </View>

          {/* Info Note */}
          <View style={[styles.infoContainer, { backgroundColor: theme.colors.primary + '10' }]}>
            <Icon
              name="information-circle-outline"
              size={16}
              color={theme.colors.primary}
            />
            <Text style={[styles.infoText, { color: theme.colors.text }]}>
              This will update your quiet hours to match your new timezone
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.declineButton, { borderColor: theme.colors.border }]}
              onPress={onDecline}
              disabled={loading}
            >
              <Text style={[styles.declineButtonText, { color: theme.colors.textSecondary }]}>
                Keep Current
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.acceptButton,
                {
                  backgroundColor: theme.colors.primary,
                  opacity: loading ? 0.6 : 1
                }
              ]}
              onPress={onAccept}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Icon
                    name="checkmark-circle-outline"
                    size={20}
                    color="white"
                  />
                  <Text style={styles.acceptButtonText}>
                    Update Timezone
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: Math.min(width - 40, 400),
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  timezoneContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  timezoneRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  timezoneLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    width: 70,
    paddingTop: 2,
  },
  timezoneInfo: {
    flex: 1,
  },
  timezoneName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  timezoneIANA: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  arrowContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  declineButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  acceptButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
});

export default TimezoneChangeModal;
