import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { FlashOfferService } from '../../services/api/flashOffers';
import type { CreateFlashOfferInput } from '../../types/flashOffer.types';
import { HelpTooltip, HelpText } from '../shared';

interface FlashOfferCreationModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const FlashOfferCreationModal: React.FC<FlashOfferCreationModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { theme, isDark } = useTheme();
  const { venueBusinessAccount } = useAuth();
  
  // Form state
  const [step, setStep] = useState<1 | 2>(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [valueCap, setValueCap] = useState('');
  const [maxClaims, setMaxClaims] = useState('');
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(Date.now() + 2 * 60 * 60 * 1000)); // 2 hours from now
  const [radiusMiles, setRadiusMiles] = useState('1');
  const [targetFavoritesOnly, setTargetFavoritesOnly] = useState(false);
  const [sendPushNotification, setSendPushNotification] = useState(true);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal closes
  const handleClose = () => {
    setStep(1);
    setTitle('');
    setDescription('');
    setValueCap('');
    setMaxClaims('');
    setStartTime(new Date());
    setEndTime(new Date(Date.now() + 2 * 60 * 60 * 1000));
    setRadiusMiles('1');
    setTargetFavoritesOnly(false);
    setSendPushNotification(true);
    setErrors({});
    onClose();
  };

  // Validate step 1
  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    } else if (title.trim().length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    if (description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    } else if (description.trim().length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    const maxClaimsNum = parseInt(maxClaims, 10);
    if (!maxClaims || isNaN(maxClaimsNum)) {
      newErrors.maxClaims = 'Max claims is required';
    } else if (maxClaimsNum < 1) {
      newErrors.maxClaims = 'Max claims must be at least 1';
    } else if (maxClaimsNum > 1000) {
      newErrors.maxClaims = 'Max claims must be less than 1000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate step 2
  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    const now = new Date();
    if (startTime < now && startTime.getTime() < now.getTime() - 60000) {
      // Allow start time within last minute (for "immediate" offers)
      newErrors.startTime = 'Start time must be now or in the future';
    }

    if (endTime <= startTime) {
      newErrors.endTime = 'End time must be after start time';
    }

    const radiusNum = parseFloat(radiusMiles);
    if (!radiusMiles || isNaN(radiusNum) || radiusNum <= 0) {
      newErrors.radius = 'Radius must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle next button
  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  // Handle back button
  const handleBack = () => {
    setStep(1);
    setErrors({});
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateStep2()) {
      return;
    }

    const venueId = venueBusinessAccount?.venues?.id;
    if (!venueId) {
      Alert.alert('Error', 'No venue found. Please try again.');
      return;
    }

    setLoading(true);

    try {
      const offerData: CreateFlashOfferInput = {
        venue_id: venueId,
        title: title.trim(),
        description: description.trim(),
        value_cap: valueCap.trim() || undefined,
        max_claims: parseInt(maxClaims, 10),
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        radius_miles: parseFloat(radiusMiles),
        target_favorites_only: targetFavoritesOnly,
      };

      const offer = await FlashOfferService.createFlashOffer(venueId, offerData);

      // TODO: Send push notification if enabled
      if (sendPushNotification) {
        console.log('📲 Push notification would be sent for offer:', offer.id);
        // await FlashOfferNotificationService.sendFlashOfferPush(offer.id);
      }

      Alert.alert(
        'Success!',
        'Your flash offer has been created successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              handleClose();
              onSuccess?.();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error creating flash offer:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to create flash offer. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDateTime = (date: Date): string => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Icon name="close" size={28} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Create Flash Offer
          </Text>
          <View style={styles.headerRight} />
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressSteps}>
            <View style={[styles.progressStep, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.progressStepText}>1</Text>
            </View>
            <View
              style={[
                styles.progressLine,
                { backgroundColor: step === 2 ? theme.colors.primary : theme.colors.border },
              ]}
            />
            <View
              style={[
                styles.progressStep,
                {
                  backgroundColor: step === 2 ? theme.colors.primary : theme.colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.progressStepText,
                  { color: step === 2 ? '#fff' : theme.colors.textSecondary },
                ]}
              >
                2
              </Text>
            </View>
          </View>
          <Text style={[styles.progressLabel, { color: theme.colors.textSecondary }]}>
            {step === 1 ? 'Offer Details' : 'Timing & Targeting'}
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 ? (
            // Step 1: Offer Details
            <View style={styles.formContainer}>
              <Text style={[styles.stepTitle, { color: theme.colors.text }]}>
                What's your offer?
              </Text>

              {/* Title */}
              <View style={styles.fieldContainer}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Title <Text style={styles.required}>*</Text>
                  </Text>
                  <HelpTooltip
                    title="Offer Title"
                    content="Create a catchy, concise title that grabs attention. Examples: 'Happy Hour Special', '50% Off Appetizers', 'Free Dessert with Entree'"
                  />
                </View>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.text,
                      borderColor: errors.title ? '#FF6B6B' : theme.colors.border,
                    },
                  ]}
                  placeholder="e.g., Happy Hour Special"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={title}
                  onChangeText={setTitle}
                  maxLength={100}
                />
                {errors.title && (
                  <Text style={styles.errorText}>{errors.title}</Text>
                )}
                <Text style={[styles.helperText, { color: theme.colors.textSecondary }]}>
                  {title.length}/100 characters
                </Text>
              </View>

              {/* Description */}
              <View style={styles.fieldContainer}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  Description <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    {
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.text,
                      borderColor: errors.description ? '#FF6B6B' : theme.colors.border,
                    },
                  ]}
                  placeholder="Describe your offer in detail..."
                  placeholderTextColor={theme.colors.textSecondary}
                  value={description}
                  onChangeText={setDescription}
                  maxLength={500}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                {errors.description && (
                  <Text style={styles.errorText}>{errors.description}</Text>
                )}
                <Text style={[styles.helperText, { color: theme.colors.textSecondary }]}>
                  {description.length}/500 characters
                </Text>
              </View>

              {/* Value Cap */}
              <View style={styles.fieldContainer}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  Value Cap (Optional)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.text,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  placeholder="e.g., $10 off, Free appetizer"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={valueCap}
                  onChangeText={setValueCap}
                />
                <Text style={[styles.helperText, { color: theme.colors.textSecondary }]}>
                  Optional: Specify the maximum value of the offer
                </Text>
              </View>

              {/* Max Claims */}
              <View style={styles.fieldContainer}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Max Claims <Text style={styles.required}>*</Text>
                  </Text>
                  <HelpTooltip
                    title="Maximum Claims"
                    content="Set how many customers can claim this offer. Consider your capacity and inventory. Start with a smaller number (20-50) for your first offers to test demand."
                  />
                </View>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.text,
                      borderColor: errors.maxClaims ? '#FF6B6B' : theme.colors.border,
                    },
                  ]}
                  placeholder="e.g., 50"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={maxClaims}
                  onChangeText={setMaxClaims}
                  keyboardType="number-pad"
                />
                {errors.maxClaims && (
                  <Text style={styles.errorText}>{errors.maxClaims}</Text>
                )}
                <HelpText
                  text="Tip: Start with 20-50 claims for your first offer to gauge demand"
                  type="tip"
                />
              </View>
            </View>
          ) : (
            // Step 2: Timing & Targeting
            <View style={styles.formContainer}>
              <Text style={[styles.stepTitle, { color: theme.colors.text }]}>
                When and who?
              </Text>

              {/* Start Time */}
              <View style={styles.fieldContainer}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  Start Time <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[
                    styles.dateButton,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: errors.startTime ? '#FF6B6B' : theme.colors.border,
                    },
                  ]}
                  onPress={() => setShowStartPicker(true)}
                >
                  <Icon name="calendar-outline" size={20} color={theme.colors.primary} />
                  <Text style={[styles.dateButtonText, { color: theme.colors.text }]}>
                    {formatDateTime(startTime)}
                  </Text>
                </TouchableOpacity>
                {errors.startTime && (
                  <Text style={styles.errorText}>{errors.startTime}</Text>
                )}
                {showStartPicker && (
                  <DateTimePicker
                    value={startTime}
                    mode="datetime"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(_event: any, date?: Date) => {
                      setShowStartPicker(false);
                      if (date) setStartTime(date);
                    }}
                  />
                )}
              </View>

              {/* End Time */}
              <View style={styles.fieldContainer}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  End Time <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[
                    styles.dateButton,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: errors.endTime ? '#FF6B6B' : theme.colors.border,
                    },
                  ]}
                  onPress={() => setShowEndPicker(true)}
                >
                  <Icon name="calendar-outline" size={20} color={theme.colors.primary} />
                  <Text style={[styles.dateButtonText, { color: theme.colors.text }]}>
                    {formatDateTime(endTime)}
                  </Text>
                </TouchableOpacity>
                {errors.endTime && (
                  <Text style={styles.errorText}>{errors.endTime}</Text>
                )}
                {showEndPicker && (
                  <DateTimePicker
                    value={endTime}
                    mode="datetime"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    minimumDate={startTime}
                    onChange={(_event: any, date?: Date) => {
                      setShowEndPicker(false);
                      if (date) setEndTime(date);
                    }}
                  />
                )}
              </View>

              {/* Radius */}
              <View style={styles.fieldContainer}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, { color: theme.colors.text }]}>
                    Radius (miles) <Text style={styles.required}>*</Text>
                  </Text>
                  <HelpTooltip
                    title="Targeting Radius"
                    content="Set how far customers can be from your venue to see this offer. 1 mile is recommended for most venues. Increase for larger events or decrease for very local targeting."
                  />
                </View>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.text,
                      borderColor: errors.radius ? '#FF6B6B' : theme.colors.border,
                    },
                  ]}
                  placeholder="1"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={radiusMiles}
                  onChangeText={setRadiusMiles}
                  keyboardType="decimal-pad"
                />
                {errors.radius && (
                  <Text style={styles.errorText}>{errors.radius}</Text>
                )}
                <HelpText
                  text="1 mile radius is recommended for most venues"
                  type="info"
                />
              </View>

              {/* Target Favorites Only */}
              <View style={[styles.fieldContainer, styles.switchContainer]}>
                <View style={styles.switchLabel}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      Target Favorites Only
                    </Text>
                    <HelpTooltip
                      title="Target Favorites"
                      content="Enable this to only show the offer to customers who have favorited your venue. This rewards loyal customers and increases redemption rates."
                    />
                  </View>
                  <Text style={[styles.helperText, { color: theme.colors.textSecondary }]}>
                    Only show to customers who favorited your venue
                  </Text>
                </View>
                <Switch
                  value={targetFavoritesOnly}
                  onValueChange={setTargetFavoritesOnly}
                  trackColor={{ false: '#767577', true: theme.colors.primary + '80' }}
                  thumbColor={targetFavoritesOnly ? theme.colors.primary : '#f4f3f4'}
                />
              </View>

              {/* Send Push Notification */}
              <View style={[styles.fieldContainer, styles.switchContainer]}>
                <View style={styles.switchLabel}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>
                      Send Push Notification
                    </Text>
                    <HelpTooltip
                      title="Push Notifications"
                      content="Send a push notification to eligible customers when your offer goes live. This significantly increases visibility and claim rates. Recommended for all offers."
                    />
                  </View>
                  <Text style={[styles.helperText, { color: theme.colors.textSecondary }]}>
                    Notify nearby customers when offer goes live
                  </Text>
                </View>
                <Switch
                  value={sendPushNotification}
                  onValueChange={setSendPushNotification}
                  trackColor={{ false: '#767577', true: theme.colors.primary + '80' }}
                  thumbColor={sendPushNotification ? theme.colors.primary : '#f4f3f4'}
                />
              </View>
              {sendPushNotification && (
                <HelpText
                  text="Push notifications significantly increase offer visibility and claim rates"
                  type="tip"
                />
              )}
            </View>
          )}
        </ScrollView>

        {/* Footer Buttons */}
        <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
          {step === 1 ? (
            <TouchableOpacity
              style={[
                styles.button,
                styles.primaryButton,
                { backgroundColor: theme.colors.primary, opacity: loading ? 0.6 : 1 },
              ]}
              onPress={handleNext}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>Next</Text>
                  <Icon name="arrow-forward" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.secondaryButton,
                  {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface,
                    opacity: loading ? 0.6 : 1,
                  },
                ]}
                onPress={handleBack}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Icon name="arrow-back" size={20} color={theme.colors.text} />
                <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '600' }}>
                  Back
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.primaryButton,
                  { backgroundColor: theme.colors.primary, opacity: loading ? 0.6 : 1 },
                ]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                      Create Offer
                    </Text>
                    <Icon name="checkmark" size={20} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
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
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerRight: {
    width: 36,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
  },
  progressSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressStep: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressStepText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  progressLine: {
    width: 60,
    height: 2,
    marginHorizontal: 8,
  },
  progressLabel: {
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  formContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  required: {
    color: '#FF6B6B',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateButtonText: {
    fontSize: 16,
    marginLeft: 12,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    flex: 1,
    marginRight: 16,
  },
  helperText: {
    fontSize: 14,
    marginTop: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#FF6B6B',
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    minHeight: 50,
  },
  primaryButton: {
    flex: 1,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
