import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';

interface HelpTooltipProps {
  title: string;
  content: string;
  iconSize?: number;
  iconColor?: string;
}

/**
 * HelpTooltip Component
 * 
 * Displays a help icon that shows a tooltip with helpful information when tapped.
 * Used throughout the app to provide contextual help for complex features.
 */
export const HelpTooltip: React.FC<HelpTooltipProps> = ({
  title,
  content,
  iconSize = 20,
  iconColor,
}) => {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        style={styles.iconButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Icon
          name="help-circle-outline"
          size={iconSize}
          color={iconColor || theme.colors.primary}
        />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View
            style={[
              styles.tooltipContainer,
              { backgroundColor: theme.colors.surface },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.tooltipHeader}>
              <Icon name="information-circle" size={24} color={theme.colors.primary} />
              <Text style={[styles.tooltipTitle, { color: theme.colors.text }]}>
                {title}
              </Text>
            </View>
            <Text style={[styles.tooltipContent, { color: theme.colors.textSecondary }]}>
              {content}
            </Text>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => setVisible(false)}
            >
              <Text style={styles.closeButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  iconButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tooltipContainer: {
    borderRadius: 16,
    padding: 20,
    maxWidth: Dimensions.get('window').width - 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  tooltipTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    flex: 1,
  },
  tooltipContent: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Inter-Regular',
    marginBottom: 20,
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});
