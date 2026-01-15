import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { CheckInService } from '../../services/api/checkins';
import CheckInModal from './CheckInModal';

interface CheckInButtonProps {
  venueId: string;
  venueName: string;
  venueImage?: string;
  isCheckedIn: boolean;
  checkInId?: string;
  checkInTime?: string; // ISO string of when user checked in
  activeCheckIns: number;
  maxCapacity?: number; // Keep this for passing to modal
  onCheckInChange: (isCheckedIn: boolean, newCount: number) => void;
  size?: 'small' | 'medium' | 'large';
  showModalForCheckout?: boolean; // Option to show modal for checkout
}

const CheckInButton: React.FC<CheckInButtonProps> = ({
  venueId,
  venueName,
  venueImage,
  isCheckedIn,
  checkInId,
  checkInTime,
  activeCheckIns,
  maxCapacity,
  onCheckInChange,
  size = 'medium',
  showModalForCheckout = false
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'checkin' | 'checkout'>('checkin');
  const [currentVenue, setCurrentVenue] = useState<string | undefined>();

  const sizeConfig = {
    small: {
      padding: { paddingHorizontal: 8, paddingVertical: 4 },
      iconSize: 14,
      textSize: 11,
      borderRadius: 12,
      minHeight: 44, // Requirement 10.5: Minimum touch target
      minWidth: 44,  // Requirement 10.5: Minimum touch target
    },
    medium: {
      padding: { paddingHorizontal: 8, paddingVertical: 4 },
      iconSize: 16,
      textSize: 12,
      borderRadius: 16,
      minHeight: 44, // Requirement 10.5: Minimum touch target
      minWidth: 44,  // Requirement 10.5: Minimum touch target
    },
    large: {
      padding: { paddingHorizontal: 16, paddingVertical: 8 },
      iconSize: 18,
      textSize: 14,
      borderRadius: 20,
      minHeight: 44, // Requirement 10.5: Minimum touch target
      minWidth: 44,  // Requirement 10.5: Minimum touch target
    },
  };

  const config = sizeConfig[size];

  const getCheckInDuration = (): string | undefined => {
    if (!checkInTime) return undefined;
    
    const checkInDate = new Date(checkInTime);
    const now = new Date();
    const diffMs = now.getTime() - checkInDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    
    if (diffHours >= 1) {
      const remainingMinutes = diffMinutes % 60;
      if (remainingMinutes === 0) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
      }
      return `${diffHours}h ${remainingMinutes}m`;
    } else if (diffMinutes >= 1) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    } else {
      return 'just now';
    }
  };

  const handleCheckInToggle = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to check into venues.');
      return;
    }

    if (loading || showModal) return; // Prevent multiple operations

    if (isCheckedIn && checkInId) {
      // Check out - show modal if requested, otherwise direct checkout
      if (showModalForCheckout) {
        setModalMode('checkout');
        setShowModal(true);
      } else {
        await performCheckOut();
      }
    } else {
      // Check in - always show modal
      await checkForCurrentVenue();
      setModalMode('checkin');
      setShowModal(true);
    }
  };

  const checkForCurrentVenue = async () => {
    if (!user) return;
    
    try {
      const currentCheckInData = await CheckInService.getUserCurrentCheckInWithVenue(user.id);
      if (currentCheckInData && currentCheckInData.checkIn.venue_id !== venueId) {
        // User has an active check-in at a DIFFERENT venue
        setCurrentVenue(currentCheckInData.venueName);
      } else {
        // User is either not checked in anywhere, or already checked into this venue
        setCurrentVenue(undefined);
      }
    } catch (error) {
      console.error('Error checking current venue:', error);
      setCurrentVenue(undefined);
    }
  };

  const performCheckIn = async () => {
    if (!user) return;

    try {
      setLoading(true);
      await CheckInService.checkIn(venueId, user.id);
      onCheckInChange(true, activeCheckIns + 1);
      setShowModal(false);
    } catch (error) {
      console.error('Error checking in:', error);
      Alert.alert('Error', `Failed to check into ${venueName}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const performCheckOut = async () => {
    if (!user || !checkInId) return;

    try {
      setLoading(true);
      await CheckInService.checkOut(checkInId, user.id);
      onCheckInChange(false, Math.max(0, activeCheckIns - 1));
      setShowModal(false); // Close modal after successful checkout
    } catch (error) {
      console.error('Error checking out:', error);
      Alert.alert('Error', `Failed to check out of ${venueName}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const getButtonStyle = () => {
    if (isCheckedIn) {
      return {
        backgroundColor: '#FF6B6B' + '20', // Red tint for leaving
        borderColor: '#FF6B6B',
        color: '#FF6B6B'
      };
    } else {
      return {
        backgroundColor: theme.colors.primary + '15',
        borderColor: theme.colors.primary + '40',
        color: theme.colors.primary
      };
    }
  };

  const buttonStyle = getButtonStyle();

  return (
    <>
      <TouchableOpacity
        style={[
          styles.checkInButton,
          config.padding,
          {
            backgroundColor: buttonStyle.backgroundColor,
            borderColor: buttonStyle.borderColor,
            borderRadius: config.borderRadius,
            opacity: (loading || showModal) ? 0.6 : 1,
            minHeight: config.minHeight, // Requirement 10.5: Minimum touch target
            minWidth: config.minWidth,   // Requirement 10.5: Minimum touch target
            justifyContent: 'center',
            alignItems: 'center',
          }
        ]}
        onPress={handleCheckInToggle}
        disabled={loading || showModal}
        activeOpacity={0.7}
        // Requirement 10.5: Accessibility for touch targets
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={isCheckedIn ? `Check out from ${venueName}` : `Check in to ${venueName}`}
        accessibilityState={{ disabled: loading || showModal }}
      >
        {loading ? (
          <ActivityIndicator size="small" color={buttonStyle.color} />
        ) : (
          <View style={styles.buttonContent}>
            <Icon
              name={isCheckedIn ? 'log-out-outline' : 'location-outline'}
              size={config.iconSize}
              color={buttonStyle.color}
            />
            <Text style={[
              styles.buttonText,
              { 
                color: buttonStyle.color,
                fontSize: config.textSize,
              }
            ]}>
              {isCheckedIn ? 'Leave' : 'Arrived'}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <CheckInModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={modalMode === 'checkin' ? performCheckIn : performCheckOut}
        venueName={venueName}
        venueImage={venueImage}
        currentVenue={modalMode === 'checkin' ? currentVenue : undefined}
        activeCheckIns={activeCheckIns}
        maxCapacity={maxCapacity}
        loading={loading}
        mode={modalMode}
        checkInDuration={modalMode === 'checkout' ? getCheckInDuration() : undefined}
      />
    </>
  );
};

const styles = StyleSheet.create({
  checkInButton: {
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  buttonText: {
    fontFamily: 'Inter-SemiBold',
    lineHeight: 16,
  },
});

export default CheckInButton;