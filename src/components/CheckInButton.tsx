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
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { CheckInService } from '../services/checkInService';
import CheckInModal from './CheckInModal';

interface CheckInButtonProps {
  venueId: string;
  venueName: string;
  venueImage?: string;
  isCheckedIn: boolean;
  checkInId?: string;
  activeCheckIns: number;
  onCheckInChange: (isCheckedIn: boolean, newCount: number) => void;
  size?: 'small' | 'medium' | 'large';
}

const CheckInButton: React.FC<CheckInButtonProps> = ({
  venueId,
  venueName,
  venueImage,
  isCheckedIn,
  checkInId,
  activeCheckIns,
  onCheckInChange,
  size = 'medium'
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentVenue, setCurrentVenue] = useState<string | undefined>();

  const sizeConfig = {
    small: {
      padding: { paddingHorizontal: 8, paddingVertical: 4 },
      iconSize: 14,
      textSize: 11,
      borderRadius: 12,
    },
    medium: {
      padding: { paddingHorizontal: 12, paddingVertical: 6 },
      iconSize: 16,
      textSize: 12,
      borderRadius: 16,
    },
    large: {
      padding: { paddingHorizontal: 16, paddingVertical: 8 },
      iconSize: 18,
      textSize: 14,
      borderRadius: 20,
    },
  };

  const config = sizeConfig[size];

  const handleCheckInToggle = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to check into venues.');
      return;
    }

    if (loading) return;

    if (isCheckedIn && checkInId) {
      // Direct check out without modal
      await performCheckOut();
    } else {
      // Show modal for check in
      await checkForCurrentVenue();
      setShowModal(true);
    }
  };

  const checkForCurrentVenue = async () => {
    if (!user) return;
    
    try {
      const currentCheckIn = await CheckInService.getUserCurrentCheckIn(user.id);
      if (currentCheckIn) {
        // User has an active check-in somewhere else, we'll need the venue name
        // For now, we'll just indicate they have an active check-in
        setCurrentVenue('another venue');
      } else {
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
        backgroundColor: '#4CAF50' + '20',
        borderColor: '#4CAF50',
        color: '#4CAF50'
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

  const getCrowdLevel = () => {
    if (activeCheckIns >= 10) return { text: 'Busy', color: '#FF6B6B' };
    if (activeCheckIns >= 5) return { text: 'Moderate', color: '#FFD700' };
    if (activeCheckIns >= 1) return { text: 'Quiet', color: '#4CAF50' };
    return { text: 'Empty', color: theme.colors.textSecondary };
  };

  const crowdLevel = getCrowdLevel();

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
            opacity: loading ? 0.6 : 1,
          }
        ]}
        onPress={handleCheckInToggle}
        disabled={loading}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator size="small" color={buttonStyle.color} />
        ) : (
          <View style={styles.buttonContent}>
            <Icon
              name={isCheckedIn ? 'checkmark-circle' : 'location-outline'}
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
              {isCheckedIn ? 'Checked In' : 'Check In'}
            </Text>
            {activeCheckIns > 0 && (
              <View style={styles.crowdIndicator}>
                <Text style={[
                  styles.crowdText,
                  { 
                    color: crowdLevel.color,
                    fontSize: config.textSize - 1,
                  }
                ]}>
                  {activeCheckIns}
                </Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>

      <CheckInModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={performCheckIn}
        venueName={venueName}
        venueImage={venueImage}
        currentVenue={currentVenue}
        activeCheckIns={activeCheckIns}
        loading={loading}
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
  crowdIndicator: {
    marginLeft: 2,
  },
  crowdText: {
    fontFamily: 'Inter-Bold',
    lineHeight: 14,
  },
});

export default CheckInButton;