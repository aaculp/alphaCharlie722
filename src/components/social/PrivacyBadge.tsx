import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import type { PrivacyLevel } from '../../types/social.types';

interface PrivacyBadgeProps {
  privacyLevel: PrivacyLevel;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  onPress?: () => void;
}

/**
 * PrivacyBadge Component
 * 
 * Small icon showing privacy level with tooltip on tap.
 * Displays icons for public/friends/close_friends/private.
 * 
 * Requirements: 8.1-8.5
 */
const PrivacyBadge: React.FC<PrivacyBadgeProps> = ({
  privacyLevel,
  size = 'medium',
  showLabel = false,
  onPress,
}) => {
  const { theme } = useTheme();
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const privacyConfig = {
    public: {
      icon: 'globe-outline',
      label: 'Public',
      color: '#52C41A',
      description: 'Visible to everyone, including people who don\'t follow you',
    },
    friends: {
      icon: 'people-outline',
      label: 'Friends',
      color: '#5B9BFF',
      description: 'Visible only to your friends',
    },
    close_friends: {
      icon: 'heart-outline',
      label: 'Close Friends',
      color: '#FF69B4',
      description: 'Visible only to friends you\'ve marked as close friends',
    },
    private: {
      icon: 'lock-closed-outline',
      label: 'Private',
      color: '#8C8C8C',
      description: 'Visible only to you',
    },
  };

  const config = privacyConfig[privacyLevel];

  const iconSizes = {
    small: 12,
    medium: 16,
    large: 20,
  };

  const badgeSizes = {
    small: { paddingHorizontal: 6, paddingVertical: 3 },
    medium: { paddingHorizontal: 8, paddingVertical: 4 },
    large: { paddingHorizontal: 10, paddingVertical: 6 },
  };

  const textSizes = {
    small: 10,
    medium: 12,
    large: 14,
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      setTooltipVisible(true);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.badge,
          badgeSizes[size],
          {
            backgroundColor: config.color + '15',
            borderColor: config.color + '40',
          }
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Icon
          name={config.icon}
          size={iconSizes[size]}
          color={config.color}
        />
        {showLabel && (
          <Text
            style={[
              styles.label,
              {
                color: config.color,
                fontSize: textSizes[size],
              }
            ]}
          >
            {config.label}
          </Text>
        )}
      </TouchableOpacity>

      {/* Tooltip Modal */}
      <Modal
        visible={tooltipVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTooltipVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setTooltipVisible(false)}
        >
          <View
            style={[
              styles.tooltip,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              }
            ]}
          >
            {/* Header */}
            <View style={styles.tooltipHeader}>
              <View
                style={[
                  styles.tooltipIcon,
                  { backgroundColor: config.color + '20' }
                ]}
              >
                <Icon
                  name={config.icon}
                  size={24}
                  color={config.color}
                />
              </View>
              <Text
                style={[
                  styles.tooltipTitle,
                  { color: theme.colors.text }
                ]}
              >
                {config.label}
              </Text>
            </View>

            {/* Description */}
            <Text
              style={[
                styles.tooltipDescription,
                { color: theme.colors.textSecondary }
              ]}
            >
              {config.description}
            </Text>

            {/* Close Button */}
            <TouchableOpacity
              style={[
                styles.tooltipButton,
                { backgroundColor: theme.colors.primary }
              ]}
              onPress={() => setTooltipVisible(false)}
            >
              <Text style={styles.tooltipButtonText}>
                Got it
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  label: {
    fontFamily: 'Inter-SemiBold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  tooltip: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tooltipIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tooltipTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    flex: 1,
  },
  tooltipDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 20,
  },
  tooltipButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  tooltipButtonText: {
    color: 'white',
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },
});

export default PrivacyBadge;
