/**
 * AboutMeSection Component
 * 
 * Displays the "About me" section with:
 * - Read mode: Display about text with edit icon
 * - Edit mode: TextInput with character limit and save button
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  AccessibilityInfo,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { RESPONSIVE_SPACING } from '../../utils/responsive';
import type { AboutMeSectionProps } from '../../types/profile.types';

const MAX_ABOUT_LENGTH = 500;

/**
 * AboutMeSection component for profile screen
 * 
 * @param aboutText - Current about text to display
 * @param isEditing - Whether the section is in edit mode
 * @param onEditPress - Callback when edit button is pressed
 * @param onSavePress - Callback when save button is pressed with new text
 * @param onTextChange - Callback when text changes in edit mode
 * @param isSaving - Optional loading state for save operation
 * @param maxLength - Optional maximum character limit (default: 500)
 */
export const AboutMeSection: React.FC<AboutMeSectionProps> = ({
  aboutText,
  isEditing,
  onEditPress,
  onSavePress,
  onTextChange,
  isSaving = false,
  maxLength = MAX_ABOUT_LENGTH,
}) => {
  const { theme } = useTheme();
  const [localText, setLocalText] = useState(aboutText);

  // Update local text when prop changes
  React.useEffect(() => {
    setLocalText(aboutText);
  }, [aboutText]);

  // Announce edit mode changes for screen readers (Requirements 8.2, 8.3)
  React.useEffect(() => {
    if (isEditing) {
      AccessibilityInfo.announceForAccessibility('Editing about me');
    } else {
      AccessibilityInfo.announceForAccessibility('Exited edit mode');
    }
  }, [isEditing]);

  const handleTextChange = (text: string) => {
    // Enforce character limit
    if (text.length <= maxLength) {
      setLocalText(text);
      onTextChange(text);
    }
  };

  const handleSave = () => {
    onSavePress(localText);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]} testID="about-section">
      {/* Header with title and edit/checkmark icon */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.fonts.primary.bold }]}>
          About me
        </Text>
        <TouchableOpacity
          onPress={onEditPress}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={isEditing ? 'Exit edit mode' : 'Edit about me'}
          accessibilityHint={isEditing ? 'Double tap to exit edit mode' : 'Double tap to edit your about me text'}
          testID="edit-about-button"
          disabled={isSaving}
          style={styles.editButton}
        >
          <Icon
            name={isEditing ? 'checkmark' : 'create-outline'}
            size={20}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Read mode: Display about text */}
      {!isEditing && (
        <Text
          style={[
            styles.aboutText,
            { color: theme.colors.textSecondary, fontFamily: theme.fonts.secondary.regular }
          ]}
          testID="about-text"
        >
          {aboutText || 'Tell us about yourself...'}
        </Text>
      )}

      {/* Edit mode: TextInput and save button */}
      {isEditing && (
        <View style={styles.editContainer}>
          <TextInput
            style={[
              styles.textInput,
              {
                color: theme.colors.text,
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                fontFamily: theme.fonts.secondary.regular,
              }
            ]}
            value={localText}
            onChangeText={handleTextChange}
            multiline
            placeholder="Tell us about yourself..."
            placeholderTextColor={theme.colors.textSecondary}
            maxLength={maxLength}
            accessible={true}
            accessibilityRole="text"
            accessibilityLabel="About me text input"
            accessibilityHint={`Enter your about me text. Maximum ${maxLength} characters.`}
            testID="about-text-input"
            editable={!isSaving}
          />
          
          {/* Character count */}
          <Text style={[styles.characterCount, { color: theme.colors.textSecondary }]}>
            {localText.length} / {maxLength}
          </Text>

          {/* Save button */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: theme.colors.primary },
              isSaving && styles.saveButtonDisabled
            ]}
            onPress={handleSave}
            disabled={isSaving}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Save about me"
            accessibilityHint="Double tap to save your about me text"
            testID="save-about-button"
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={[styles.saveButtonText, { fontFamily: theme.fonts.secondary.semiBold }]}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: RESPONSIVE_SPACING.sectionHorizontal,
    paddingVertical: RESPONSIVE_SPACING.sectionVertical,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: RESPONSIVE_SPACING.elementGap,
  },
  editButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
  },
  aboutText: {
    fontSize: 16,
    lineHeight: 24,
  },
  editContainer: {
    marginTop: 4,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: RESPONSIVE_SPACING.elementGap + 4,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: RESPONSIVE_SPACING.elementGap,
  },
  saveButton: {
    paddingVertical: RESPONSIVE_SPACING.buttonVertical,
    paddingHorizontal: RESPONSIVE_SPACING.buttonHorizontal,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});
