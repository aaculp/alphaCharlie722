import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { ProfileService } from '../../services/api/profile';

const EditProfileScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [photoUri, setPhotoUri] = useState('');
  const [newPhotoUri, setNewPhotoUri] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadProfile();
    }
  }, []); // Remove user?.id dependency to prevent infinite loop

  const loadProfile = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const response = await ProfileService.fetchCompleteUserProfile(user.id);
      if (response.success && response.profile) {
        setUsername(response.profile.username || '');
        setDisplayName(response.profile.display_name || '');
        setBio(''); // Bio not yet implemented in database
        setPhotoUri(response.profile.profilePhotoUrl || '');
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateUsername = (value: string): boolean => {
    if (!value) {
      setUsernameError(null);
      return true;
    }

    if (value.length < 3 || value.length > 30) {
      setUsernameError('Username must be 3-30 characters');
      return false;
    }

    if (!/^[a-z0-9_]+$/.test(value)) {
      setUsernameError('Only lowercase letters, numbers, and underscores');
      return false;
    }

    setUsernameError(null);
    return true;
  };

  const handleUsernameChange = (value: string) => {
    const lowercased = value.toLowerCase();
    setUsername(lowercased);
    validateUsername(lowercased);
  };

  const handlePickPhoto = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1000,
        maxHeight: 1000,
      },
      (response) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorCode) {
          Alert.alert('Error', 'Failed to pick image');
        } else if (response.assets && response.assets[0]) {
          const asset = response.assets[0];
          if (asset.uri) {
            setNewPhotoUri(asset.uri);
            setPhotoUri(asset.uri);
          }
        }
      }
    );
  };

  const handleSave = async () => {
    if (!user?.id) return;

    // Validate username
    if (username && !validateUsername(username)) {
      Alert.alert('Invalid Username', usernameError || 'Please fix the username error');
      return;
    }

    // Validate bio length
    if (bio.length > 500) {
      Alert.alert('Bio Too Long', 'Bio must be 500 characters or less');
      return;
    }

    setSaving(true);

    try {
      // Upload new photo if selected
      if (newPhotoUri) {
        setUploadingPhoto(true);
        const fileName = `profile-${Date.now()}.jpg`;
        const photoResult = await ProfileService.uploadProfilePhoto(
          user.id,
          newPhotoUri,
          fileName
        );

        if (!photoResult.success) {
          Alert.alert('Photo Upload Failed', photoResult.error || 'Failed to upload photo');
          setSaving(false);
          setUploadingPhoto(false);
          return;
        }
        setUploadingPhoto(false);
      }

      // Update profile fields
      const updates: any = {};
      
      if (username) {
        updates.username = username;
      }
      
      if (displayName) {
        updates.display_name = displayName;
      }
      
      // Note: bio field doesn't exist in profiles table yet
      // TODO: Add bio column to profiles table or store in user metadata

      const result = await ProfileService.updateProfile(user.id, updates);
      
      if (!result) {
        Alert.alert('Update Failed', 'Failed to update profile. Please try again.');
        setSaving(false);
        return;
      }

      setSaving(false);
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
      setSaving(false);
      setUploadingPhoto(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Icon name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text, fontFamily: theme.fonts.primary.bold }]}>
          Edit Profile
        </Text>
        <TouchableOpacity 
          onPress={handleSave} 
          style={styles.headerButton}
          disabled={saving || uploadingPhoto || !!usernameError}
        >
          {saving ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Text 
              style={[
                styles.saveText, 
                { 
                  color: usernameError ? theme.colors.textSecondary : theme.colors.primary,
                  fontFamily: theme.fonts.secondary.semiBold 
                }
              ]}
            >
              Save
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Photo */}
        <View style={styles.photoSection}>
          <View style={[styles.photoWrapper, { backgroundColor: theme.colors.border }]}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photo} />
            ) : (
              <Icon name="person" size={60} color={theme.colors.textSecondary} />
            )}
            {uploadingPhoto && (
              <View style={styles.photoOverlay}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
            )}
          </View>
          <TouchableOpacity 
            onPress={handlePickPhoto}
            style={[styles.changePhotoButton, { backgroundColor: theme.colors.primary }]}
            disabled={uploadingPhoto}
          >
            <Text style={[styles.changePhotoText, { fontFamily: theme.fonts.secondary.medium }]}>
              Change Photo
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          {/* Display Name */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: theme.colors.text, fontFamily: theme.fonts.secondary.semiBold }]}>
              Display Name
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  fontFamily: theme.fonts.secondary.regular,
                },
              ]}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your display name"
              placeholderTextColor={theme.colors.textSecondary}
              maxLength={100}
            />
            <Text style={[styles.helperText, { color: theme.colors.textSecondary, fontFamily: theme.fonts.secondary.regular }]}>
              This is how your name appears to others
            </Text>
          </View>

          {/* Username */}
          <View style={styles.fieldContainer}>
            <Text style={[styles.label, { color: theme.colors.text, fontFamily: theme.fonts.secondary.semiBold }]}>
              Username
            </Text>
            <View style={styles.usernameInputContainer}>
              <Text style={[styles.usernamePrefix, { color: theme.colors.textSecondary, fontFamily: theme.fonts.secondary.regular }]}>
                @
              </Text>
              <TextInput
                style={[
                  styles.usernameInput,
                  {
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    borderColor: usernameError ? theme.colors.error : theme.colors.border,
                    fontFamily: theme.fonts.secondary.regular,
                  },
                ]}
                value={username}
                onChangeText={handleUsernameChange}
                placeholder="username"
                placeholderTextColor={theme.colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={30}
              />
            </View>
            {usernameError ? (
              <Text style={[styles.errorText, { color: theme.colors.error, fontFamily: theme.fonts.secondary.regular }]}>
                {usernameError}
              </Text>
            ) : (
              <Text style={[styles.helperText, { color: theme.colors.textSecondary, fontFamily: theme.fonts.secondary.regular }]}>
                Lowercase letters, numbers, and underscores only (3-30 chars)
              </Text>
            )}
          </View>

          {/* Bio */}
          <View style={styles.fieldContainer}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: theme.colors.text, fontFamily: theme.fonts.secondary.semiBold }]}>
                Bio (Coming Soon)
              </Text>
              <Text style={[styles.charCount, { color: theme.colors.textSecondary, fontFamily: theme.fonts.secondary.regular }]}>
                {bio.length}/500
              </Text>
            </View>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.textSecondary,
                  borderColor: theme.colors.border,
                  fontFamily: theme.fonts.secondary.regular,
                },
              ]}
              value={bio}
              onChangeText={setBio}
              placeholder="Bio feature coming soon..."
              placeholderTextColor={theme.colors.textSecondary}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
              editable={false}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 18,
  },
  saveText: {
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  photoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 16,
  },
  photo: {
    width: 120,
    height: 120,
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  changePhotoText: {
    color: '#fff',
    fontSize: 14,
  },
  form: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  usernameInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usernamePrefix: {
    fontSize: 16,
    marginRight: 4,
  },
  usernameInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default EditProfileScreen;
