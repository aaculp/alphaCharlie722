/**
 * NotificationReportModal Component
 * 
 * Modal for reporting inappropriate notifications
 * Requirement 15.9: Allow users to report inappropriate notifications
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { NotificationService } from '../../services/api/notifications';
import { ComplianceService } from '../../services/compliance/ComplianceService';
import type { SocialNotification } from '../../types/social.types';

interface NotificationReportModalProps {
  visible: boolean;
  notification: SocialNotification | null;
  onClose: () => void;
  onReportSubmitted?: () => void;
}

type ReportReason = 'spam' | 'harassment' | 'inappropriate' | 'misleading' | 'other';

interface ReasonOption {
  value: ReportReason;
  label: string;
  description: string;
  icon: string;
}

const REPORT_REASONS: ReasonOption[] = [
  {
    value: 'spam',
    label: 'Spam',
    description: 'Unwanted or repetitive notifications',
    icon: 'mail-unread',
  },
  {
    value: 'harassment',
    label: 'Harassment',
    description: 'Threatening or abusive content',
    icon: 'warning',
  },
  {
    value: 'inappropriate',
    label: 'Inappropriate',
    description: 'Offensive or inappropriate content',
    icon: 'ban',
  },
  {
    value: 'misleading',
    label: 'Misleading',
    description: 'False or deceptive information',
    icon: 'alert-circle',
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Other reason not listed above',
    icon: 'ellipsis-horizontal',
  },
];

/**
 * Modal for reporting inappropriate notifications
 * Allows users to select a reason and provide additional details
 */
const NotificationReportModal: React.FC<NotificationReportModalProps> = ({
  visible,
  notification,
  onClose,
  onReportSubmitted,
}) => {
  const { theme } = useTheme();
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!notification || !selectedReason) {
      Alert.alert('Error', 'Please select a reason for reporting');
      return;
    }

    try {
      setSubmitting(true);

      // Submit the report
      const report = await NotificationService.reportNotification(
        notification.id,
        notification.user_id,
        selectedReason,
        details.trim() || undefined
      );

      // Track the report for compliance
      ComplianceService.trackNotificationReport(
        report.id,
        notification.id,
        notification.user_id,
        notification.actor_id || 'unknown',
        notification.type,
        selectedReason,
        details.trim() || undefined
      );

      // Show success message
      Alert.alert(
        'Report Submitted',
        'Thank you for your report. Our team will review it shortly.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setSelectedReason(null);
              setDetails('');
              
              // Call callback
              if (onReportSubmitted) {
                onReportSubmitted();
              }
              
              // Close modal
              onClose();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert(
        'Error',
        'Failed to submit report. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) {
      return;
    }
    
    // Reset form
    setSelectedReason(null);
    setDetails('');
    
    // Close modal
    onClose();
  };

  if (!notification) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Report Notification
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              disabled={submitting}
              style={styles.closeButton}
            >
              <Icon name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Notification Preview */}
            <View style={[styles.notificationPreview, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.previewLabel, { color: theme.colors.textSecondary }]}>
                Reporting this notification:
              </Text>
              <Text style={[styles.previewTitle, { color: theme.colors.text }]}>
                {notification.title}
              </Text>
              <Text style={[styles.previewBody, { color: theme.colors.textSecondary }]}>
                {notification.body}
              </Text>
            </View>

            {/* Reason Selection */}
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Why are you reporting this?
            </Text>

            {REPORT_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason.value}
                style={[
                  styles.reasonOption,
                  {
                    backgroundColor: selectedReason === reason.value
                      ? theme.colors.primary + '15'
                      : 'transparent',
                    borderColor: selectedReason === reason.value
                      ? theme.colors.primary
                      : theme.colors.border,
                  },
                ]}
                onPress={() => setSelectedReason(reason.value)}
                disabled={submitting}
              >
                <View style={styles.reasonLeft}>
                  <View
                    style={[
                      styles.reasonIcon,
                      {
                        backgroundColor: selectedReason === reason.value
                          ? theme.colors.primary + '20'
                          : theme.colors.background,
                      },
                    ]}
                  >
                    <Icon
                      name={reason.icon}
                      size={20}
                      color={selectedReason === reason.value ? theme.colors.primary : theme.colors.textSecondary}
                    />
                  </View>
                  <View style={styles.reasonText}>
                    <Text style={[styles.reasonLabel, { color: theme.colors.text }]}>
                      {reason.label}
                    </Text>
                    <Text style={[styles.reasonDescription, { color: theme.colors.textSecondary }]}>
                      {reason.description}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.radioButton,
                    {
                      borderColor: selectedReason === reason.value
                        ? theme.colors.primary
                        : theme.colors.border,
                    },
                  ]}
                >
                  {selectedReason === reason.value && (
                    <View style={[styles.radioButtonInner, { backgroundColor: theme.colors.primary }]} />
                  )}
                </View>
              </TouchableOpacity>
            ))}

            {/* Additional Details */}
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Additional Details (Optional)
            </Text>
            <TextInput
              style={[
                styles.detailsInput,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                },
              ]}
              placeholder="Provide any additional information..."
              placeholderTextColor={theme.colors.textSecondary}
              value={details}
              onChangeText={setDetails}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!submitting}
            />

            {/* Privacy Notice */}
            <View style={[styles.privacyNotice, { backgroundColor: theme.colors.background }]}>
              <Icon name="shield-checkmark" size={16} color={theme.colors.primary} />
              <Text style={[styles.privacyText, { color: theme.colors.textSecondary }]}>
                Your report will be reviewed by our moderation team. Reports are confidential and help us maintain a safe community.
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: theme.colors.border }]}
              onPress={handleClose}
              disabled={submitting}
            >
              <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: selectedReason ? theme.colors.primary : theme.colors.border,
                },
              ]}
              onPress={handleSubmit}
              disabled={!selectedReason || submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Report</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
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
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  notificationPreview: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  previewLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  previewBody: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
    marginTop: 8,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
  },
  reasonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reasonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reasonText: {
    flex: 1,
  },
  reasonLabel: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  reasonDescription: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  detailsInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    minHeight: 100,
    marginBottom: 16,
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  privacyText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});

export default NotificationReportModal;
