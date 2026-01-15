/**
 * AboutMeSection Usage Example
 * 
 * This file demonstrates how to use the AboutMeSection component
 * in the ProfileScreen with proper state management.
 */

import React from 'react';
import { View } from 'react-native';
import { AboutMeSection } from './AboutMeSection';
import { useAboutMe } from '../../hooks/useAboutMe';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Example 1: Basic usage with custom hook
 */
export const AboutMeSectionExample1: React.FC = () => {
  const { user } = useAuth();
  const {
    aboutText,
    isEditing,
    isSaving,
    setAboutText,
    toggleEdit,
    saveAboutText,
  } = useAboutMe('I like to read books and cook!');

  const handleSave = async (newText: string) => {
    if (user?.id) {
      await saveAboutText(user.id, newText);
    }
  };

  return (
    <AboutMeSection
      aboutText={aboutText}
      isEditing={isEditing}
      onEditPress={toggleEdit}
      onSavePress={handleSave}
      onTextChange={setAboutText}
      isSaving={isSaving}
    />
  );
};

/**
 * Example 2: Manual state management
 */
export const AboutMeSectionExample2: React.FC = () => {
  const [aboutText, setAboutText] = React.useState('I like to read books and cook!');
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const handleEditPress = () => {
    setIsEditing(!isEditing);
  };

  const handleSave = async (newText: string) => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise<void>(resolve => setTimeout(resolve, 1000));
      setAboutText(newText);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AboutMeSection
      aboutText={aboutText}
      isEditing={isEditing}
      onEditPress={handleEditPress}
      onSavePress={handleSave}
      onTextChange={setAboutText}
      isSaving={isSaving}
    />
  );
};

/**
 * Example 3: Integration in ProfileScreen
 * 
 * Add this to your ProfileScreen component:
 * 
 * ```tsx
 * import { AboutMeSection } from '../../components/profile';
 * import { useAboutMe } from '../../hooks/useAboutMe';
 * 
 * const ProfileScreen: React.FC = () => {
 *   const { user } = useAuth();
 *   const {
 *     aboutText,
 *     isEditing,
 *     isSaving,
 *     setAboutText,
 *     toggleEdit,
 *     saveAboutText,
 *   } = useAboutMe(user?.bio || '');
 * 
 *   const handleSave = async (newText: string) => {
 *     if (user?.id) {
 *       await saveAboutText(user.id, newText);
 *     }
 *   };
 * 
 *   return (
 *     <ScrollView>
 *       <HeroSection ... />
 *       
 *       <AboutMeSection
 *         aboutText={aboutText}
 *         isEditing={isEditing}
 *         onEditPress={toggleEdit}
 *         onSavePress={handleSave}
 *         onTextChange={setAboutText}
 *         isSaving={isSaving}
 *       />
 *       
 *       <TabNavigation ... />
 *     </ScrollView>
 *   );
 * };
 * ```
 */
