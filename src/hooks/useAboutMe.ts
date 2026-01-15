/**
 * useAboutMe Hook
 * 
 * Custom hook for managing About Me section state and operations
 * 
 * Requirements: 2.2, 2.4, 2.5
 */

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { ProfileService } from '../services/api/profile';

interface UseAboutMeResult {
  aboutText: string;
  isEditing: boolean;
  isSaving: boolean;
  setAboutText: (text: string) => void;
  toggleEdit: () => void;
  saveAboutText: (userId: string, newText: string) => Promise<void>;
}

/**
 * Hook for managing About Me section
 * 
 * @param initialAboutText - Initial about text value
 * @returns About me state and handlers
 */
export const useAboutMe = (initialAboutText: string = ''): UseAboutMeResult => {
  const [aboutText, setAboutText] = useState(initialAboutText);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Toggle edit mode (Requirement 2.2)
   */
  const toggleEdit = useCallback(() => {
    setIsEditing(prev => !prev);
  }, []);

  /**
   * Save about text to backend (Requirements 2.4, 2.5)
   * 
   * Enhanced error handling for:
   * - Network errors
   * - Validation errors (character limit)
   * - Server errors
   * 
   * @param userId - User ID
   * @param newText - New about text to save
   * 
   * Validates: Requirements 2.4, 6.7
   */
  const saveAboutText = useCallback(async (userId: string, newText: string) => {
    setIsSaving(true);
    
    try {
      const result = await ProfileService.updateAboutText(userId, newText);
      
      if (result.success) {
        // Update local state with saved text (Requirement 2.5)
        setAboutText(result.aboutText || newText);
        // Exit edit mode
        setIsEditing(false);
        Alert.alert('Success', 'About me updated successfully!');
      } else {
        // Handle save error with specific error messages (Requirement 6.7)
        const errorMsg = result.error || 'Failed to save about text';
        
        // Categorize error and provide user-friendly message
        let userMessage = errorMsg;
        
        // Validation errors
        if (errorMsg.toLowerCase().includes('too long') || 
            errorMsg.toLowerCase().includes('character') ||
            errorMsg.toLowerCase().includes('max') ||
            errorMsg.toLowerCase().includes('500')) {
          userMessage = 'About text is too long (max 500 characters)';
        }
        // Network errors
        else if (errorMsg.toLowerCase().includes('network') || 
                 errorMsg.toLowerCase().includes('connection') ||
                 errorMsg.toLowerCase().includes('timeout')) {
          userMessage = 'Failed to save. Check your connection.';
        }
        // Permission errors
        else if (errorMsg.toLowerCase().includes('permission') || 
                 errorMsg.toLowerCase().includes('unauthorized')) {
          userMessage = 'Permission denied. Please try logging in again.';
        }
        // Server errors
        else if (errorMsg.toLowerCase().includes('server') || 
                 errorMsg.toLowerCase().includes('500') ||
                 errorMsg.toLowerCase().includes('503')) {
          userMessage = 'Save failed. Please try again later.';
        }
        
        Alert.alert('Error', userMessage);
      }
    } catch (error) {
      console.error('Save about text error:', error);
      
      // Handle unexpected errors (Requirement 6.7)
      let errorMsg = 'Failed to save. Please try again.';
      
      if (error instanceof Error) {
        // Network errors
        if (error.message.toLowerCase().includes('network') || 
            error.message.toLowerCase().includes('connection') ||
            error.message.toLowerCase().includes('timeout')) {
          errorMsg = 'Failed to save. Check your connection.';
        }
        // Generic error with message
        else if (error.message) {
          errorMsg = error.message;
        }
      }
      
      Alert.alert('Error', errorMsg);
    } finally {
      setIsSaving(false);
    }
  }, []);

  return {
    aboutText,
    isEditing,
    isSaving,
    setAboutText,
    toggleEdit,
    saveAboutText,
  };
};
