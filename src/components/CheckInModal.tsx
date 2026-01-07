import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';

interface CheckInModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  venueName: string;
  venueImage?: string;
  currentVenue?: string;
  activeCheckIns: number;
  loading?: boolean;
  mode: 'checkin' | 'checkout';
  checkInDuration?: string; // For checkout mode
}

const CheckInModal: React.FC<CheckInModalProps> = ({
  visible,
  onClose,
  onConfirm,
  venueName,
  venueImage,
  currentVenue,
  activeCheckIns,
  loading = false,
  mode,
  checkInDuration
}) => {
  const { theme } = useTheme();

  const getCrowdLevel = () => {
    if (activeCheckIns >= 10) return { text: 'Busy', color: '#FF6B6B', icon: 'people' };
    if (activeCheckIns >= 5) return { text: 'Moderate', color: '#FFD700', icon: 'people-outline' };
    if (activeCheckIns >= 1) return { text: 'Quiet', color: '#4CAF50', icon: 'person-outline' };
    return { text: 'Empty', color: theme.colors.textSecondary, icon: 'location-outline' };
  };

  const crowdLevel = getCrowdLevel();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Venue Image */}
          {venueImage && (
            <Image 
              source={{ uri: venueImage }} 
              style={styles.venueImage}
            />
          )}

          {/* Content */}
          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: mode === 'checkin' ? '#4CAF50' + '20' : '#FF6B6B' + '20' }]}>
              <Icon 
                name={mode === 'checkin' ? 'location' : 'exit-outline'} 
                size={32} 
                color={mode === 'checkin' ? theme.colors.primary : '#FF6B6B'} 
              />
            </View>
            
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {mode === 'checkin' ? `Check into ${venueName}?` : `Check out of ${venueName}?`}
            </Text>

            {/* Check-in duration for checkout */}
            {mode === 'checkout' && checkInDuration && (
              <View style={styles.durationContainer}>
                <Icon name="time-outline" size={16} color={theme.colors.primary} />
                <Text style={[styles.durationText, { color: theme.colors.text }]}>
                  You've been here for {checkInDuration}
                </Text>
              </View>
            )}

            {/* Current venue warning for check-in */}
            {mode === 'checkin' && currentVenue && (
              <View style={[styles.warningContainer, { backgroundColor: '#FFD700' + '20', borderColor: '#FFD700' + '40' }]}>
                <Icon name="warning-outline" size={16} color="#FFD700" />
                <Text style={[styles.warningText, { color: '#B8860B' }]}>
                  You'll be checked out of {currentVenue}
                </Text>
              </View>
            )}

            {/* Crowd info */}
            <View style={styles.crowdInfo}>
              <Icon name={crowdLevel.icon} size={20} color={crowdLevel.color} />
              <Text style={[styles.crowdText, { color: theme.colors.text }]}>
                {mode === 'checkin' ? (
                  activeCheckIns === 0 ? 'Be the first to check in!' : 
                  activeCheckIns === 1 ? '1 person here now' :
                  `${activeCheckIns} people here now`
                ) : (
                  activeCheckIns <= 1 ? 'You\'re the only one here' :
                  `${activeCheckIns - 1} others will remain here`
                )}
              </Text>
              <View style={[styles.crowdBadge, { backgroundColor: crowdLevel.color + '20' }]}>
                <Text style={[styles.crowdBadgeText, { color: crowdLevel.color }]}>
                  {crowdLevel.text}
                </Text>
              </View>
            </View>

            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              {mode === 'checkin' 
                ? 'Let others know you\'re here and discover who else is around!'
                : 'Thanks for sharing your presence! Others will know you\'ve left.'
              }
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: theme.colors.border }]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.confirmButton, 
                { 
                  backgroundColor: mode === 'checkin' ? theme.colors.primary : '#FF6B6B',
                  opacity: loading ? 0.6 : 1
                }
              ]}
              onPress={onConfirm}
              disabled={loading}
            >
              <Icon 
                name={mode === 'checkin' ? 'checkmark-circle-outline' : 'exit-outline'} 
                size={20} 
                color="white" 
              />
              <Text style={styles.confirmButtonText}>
                {loading 
                  ? (mode === 'checkin' ? 'Checking In...' : 'Checking Out...')
                  : (mode === 'checkin' ? 'Check In' : 'Check Out')
                }
              </Text>
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    paddingBottom: 0,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  venueImage: {
    width: '100%',
    height: 120,
    marginBottom: 20,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4CAF50' + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
    marginBottom: 16,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#4CAF50' + '10',
    marginBottom: 16,
    gap: 8,
  },
  durationText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  warningText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    flex: 1,
  },
  crowdInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  crowdText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  crowdBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  crowdBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    padding: 24,
    paddingTop: 0,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
});

export default CheckInModal;