import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { VenueApplicationService } from '../../services/venueApplicationService';
import Icon from 'react-native-vector-icons/Ionicons';

interface VenueSignUpFormProps {
  onSwitchToLogin: () => void;
}

const VenueSignUpForm: React.FC<VenueSignUpFormProps> = ({ onSwitchToLogin }) => {
  // Venue Information
  const [venueName, setVenueName] = useState('');
  const [venueType, setVenueType] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  
  // Owner/Manager Information
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { theme, isDark } = useTheme();
  const { user, signUp } = useAuth();

  const validateForm = () => {
    if (!venueName.trim()) {
      Alert.alert('Error', 'Please enter venue name');
      return false;
    }

    if (!venueType.trim()) {
      Alert.alert('Error', 'Please enter venue type (e.g., Restaurant, Bar, Cafe)');
      return false;
    }

    if (!address.trim()) {
      Alert.alert('Error', 'Please enter venue address');
      return false;
    }

    if (!city.trim()) {
      Alert.alert('Error', 'Please enter city');
      return false;
    }

    if (!state.trim()) {
      Alert.alert('Error', 'Please enter state');
      return false;
    }

    if (!ownerName.trim()) {
      Alert.alert('Error', 'Please enter owner/manager name');
      return false;
    }

    if (!ownerEmail.trim()) {
      Alert.alert('Error', 'Please enter owner/manager email');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(ownerEmail)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    return true;
  };

  const resetForm = () => {
    setVenueName('');
    setVenueType('');
    setAddress('');
    setCity('');
    setState('');
    setZipCode('');
    setPhone('');
    setWebsite('');
    setDescription('');
    setOwnerName('');
    setOwnerEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleVenueSignUp = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      console.log('🏢 Starting venue signup process:', { 
        venueName, 
        venueType, 
        ownerEmail,
        address: `${address}, ${city}`
      });
      
      let userId = user?.id;
      let accountCreated = false;
      
      // If user is not logged in, try to create account first
      if (!userId) {
        console.log('👤 Attempting to create user account for venue owner...');
        
        try {
          const signUpResult = await signUp(ownerEmail, password, ownerName);
          
          if (signUpResult.user) {
            userId = signUpResult.user.id;
            accountCreated = true;
            console.log('✅ User account created:', userId);
          } else {
            throw new Error('Failed to create user account');
          }
        } catch (authError: any) {
          console.log('⚠️ Account creation failed:', authError.message);
          
          // Handle specific auth errors
          if (authError?.message?.includes('rate limit') || 
              authError?.message?.includes('email rate limit exceeded')) {
            
            Alert.alert(
              'Rate Limit Exceeded',
              'Too many signup attempts. Please wait a few minutes before trying again, or try using a different email address.\n\nIf you already have an account, please sign in instead.',
              [
                { text: 'Try Different Email', style: 'default' },
                { text: 'Sign In Instead', onPress: onSwitchToLogin, style: 'cancel' }
              ]
            );
            return;
          } else if (authError?.message?.includes('User already registered')) {
            Alert.alert(
              'Account Already Exists',
              'An account with this email already exists. Please sign in instead or use a different email address.',
              [
                { text: 'Try Different Email', style: 'default' },
                { text: 'Sign In Instead', onPress: onSwitchToLogin, style: 'cancel' }
              ]
            );
            return;
          } else {
            throw authError; // Re-throw other auth errors
          }
        }
      }
      
      // Submit venue application
      const applicationResult = await VenueApplicationService.submitApplication({
        venueName,
        venueType,
        address,
        city,
        state,
        zipCode: zipCode || undefined,
        phone: phone || undefined,
        website: website || undefined,
        ownerName,
        ownerEmail,
        description: description || undefined
      }, userId);
      
      if (applicationResult.success) {
        const successMessage = accountCreated 
          ? `Thank you ${ownerName}! Your account has been created and your venue application for "${venueName}" has been submitted successfully.\n\nWe'll review your application and contact you at ${ownerEmail} within 24-48 hours.\n\nApplication ID: ${applicationResult.application?.id.slice(0, 8)}...`
          : `Thank you ${ownerName}! Your venue application for "${venueName}" has been submitted successfully.\n\nWe'll review your application and contact you at ${ownerEmail} within 24-48 hours.\n\nApplication ID: ${applicationResult.application?.id.slice(0, 8)}...`;
        
        Alert.alert('Application Submitted! 🎉', successMessage, [
          { 
            text: 'OK', 
            onPress: () => {
              resetForm();
              // If user was created, they're now logged in
              // Otherwise, redirect to login
              if (!user && !accountCreated) {
                onSwitchToLogin();
              }
            }
          }
        ]);
      } else {
        Alert.alert('Application Failed', applicationResult.error || 'Please try again.');
      }
      
    } catch (error: any) {
      console.error('❌ Venue signup error:', error);
      
      // Handle specific Supabase errors
      if (error?.message?.includes('rate limit') || error?.message?.includes('email rate limit exceeded')) {
        Alert.alert(
          'Too Many Attempts',
          'You\'ve exceeded the signup limit. Please wait a few minutes before trying again, or try using a different email address.\n\nIf you already have an account, please sign in instead.',
          [
            { text: 'Try Different Email', style: 'default' },
            { text: 'Sign In Instead', onPress: onSwitchToLogin, style: 'cancel' }
          ]
        );
      } else if (error?.message?.includes('User already registered')) {
        Alert.alert(
          'Account Already Exists',
          'An account with this email already exists. Please sign in instead or use a different email address.',
          [
            { text: 'Try Different Email', style: 'default' },
            { text: 'Sign In Instead', onPress: onSwitchToLogin, style: 'cancel' }
          ]
        );
      } else if (error?.message?.includes('Invalid email')) {
        Alert.alert('Invalid Email', 'Please enter a valid email address.');
      } else if (error?.message?.includes('Password')) {
        Alert.alert('Password Error', 'Password must be at least 6 characters long.');
      } else {
        // Generic error
        Alert.alert(
          'Registration Failed', 
          'Unable to process request at this time. Please try again in a few minutes or contact support if the problem persists.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Venue Information Section */}
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Venue Information</Text>
      
      <View style={[styles.inputContainer, { 
        borderColor: theme.colors.border, 
        backgroundColor: isDark ? theme.colors.card : '#f9f9f9' 
      }]}>
        <Icon name="storefront-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: theme.colors.text }]}
          placeholder="Venue Name"
          value={venueName}
          onChangeText={setVenueName}
          autoCapitalize="words"
          placeholderTextColor={theme.colors.textSecondary}
        />
      </View>

      <View style={[styles.inputContainer, { 
        borderColor: theme.colors.border, 
        backgroundColor: isDark ? theme.colors.card : '#f9f9f9' 
      }]}>
        <Icon name="restaurant-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: theme.colors.text }]}
          placeholder="Venue Type (Restaurant, Bar, Cafe, etc.)"
          value={venueType}
          onChangeText={setVenueType}
          autoCapitalize="words"
          placeholderTextColor={theme.colors.textSecondary}
        />
      </View>

      <View style={[styles.inputContainer, { 
        borderColor: theme.colors.border, 
        backgroundColor: isDark ? theme.colors.card : '#f9f9f9' 
      }]}>
        <Icon name="location-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: theme.colors.text }]}
          placeholder="Street Address"
          value={address}
          onChangeText={setAddress}
          autoCapitalize="words"
          placeholderTextColor={theme.colors.textSecondary}
        />
      </View>

      {/* City and State Row */}
      <View style={styles.rowContainer}>
        <View style={[styles.inputContainer, styles.halfWidth, { 
          borderColor: theme.colors.border, 
          backgroundColor: isDark ? theme.colors.card : '#f9f9f9' 
        }]}>
          <Icon name="business-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: theme.colors.text }]}
            placeholder="City"
            value={city}
            onChangeText={setCity}
            autoCapitalize="words"
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>

        <View style={[styles.inputContainer, styles.halfWidth, { 
          borderColor: theme.colors.border, 
          backgroundColor: isDark ? theme.colors.card : '#f9f9f9' 
        }]}>
          <Icon name="map-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: theme.colors.text }]}
            placeholder="State"
            value={state}
            onChangeText={setState}
            autoCapitalize="characters"
            maxLength={2}
            placeholderTextColor={theme.colors.textSecondary}
          />
        </View>
      </View>

      <View style={[styles.inputContainer, { 
        borderColor: theme.colors.border, 
        backgroundColor: isDark ? theme.colors.card : '#f9f9f9' 
      }]}>
        <Icon name="location-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: theme.colors.text }]}
          placeholder="ZIP Code (Optional)"
          value={zipCode}
          onChangeText={setZipCode}
          keyboardType="numeric"
          maxLength={10}
          placeholderTextColor={theme.colors.textSecondary}
        />
      </View>

      <View style={[styles.inputContainer, { 
        borderColor: theme.colors.border, 
        backgroundColor: isDark ? theme.colors.card : '#f9f9f9' 
      }]}>
        <Icon name="call-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: theme.colors.text }]}
          placeholder="Phone Number (Optional)"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholderTextColor={theme.colors.textSecondary}
        />
      </View>

      <View style={[styles.inputContainer, { 
        borderColor: theme.colors.border, 
        backgroundColor: isDark ? theme.colors.card : '#f9f9f9' 
      }]}>
        <Icon name="globe-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: theme.colors.text }]}
          placeholder="Website (Optional)"
          value={website}
          onChangeText={setWebsite}
          keyboardType="url"
          autoCapitalize="none"
          placeholderTextColor={theme.colors.textSecondary}
        />
      </View>

      <View style={[styles.inputContainer, { 
        borderColor: theme.colors.border, 
        backgroundColor: isDark ? theme.colors.card : '#f9f9f9' 
      }]}>
        <Icon name="document-text-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: theme.colors.text, minHeight: 80 }]}
          placeholder="Brief description of your venue (Optional)"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          placeholderTextColor={theme.colors.textSecondary}
        />
      </View>

      {/* Owner/Manager Information Section */}
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Owner/Manager Information</Text>

      <View style={[styles.inputContainer, { 
        borderColor: theme.colors.border, 
        backgroundColor: isDark ? theme.colors.card : '#f9f9f9' 
      }]}>
        <Icon name="person-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: theme.colors.text }]}
          placeholder="Full Name"
          value={ownerName}
          onChangeText={setOwnerName}
          autoCapitalize="words"
          placeholderTextColor={theme.colors.textSecondary}
        />
      </View>

      <View style={[styles.inputContainer, { 
        borderColor: theme.colors.border, 
        backgroundColor: isDark ? theme.colors.card : '#f9f9f9' 
      }]}>
        <Icon name="mail-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: theme.colors.text }]}
          placeholder="Email Address"
          value={ownerEmail}
          onChangeText={setOwnerEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor={theme.colors.textSecondary}
        />
      </View>

      <View style={[styles.inputContainer, { 
        borderColor: theme.colors.border, 
        backgroundColor: isDark ? theme.colors.card : '#f9f9f9' 
      }]}>
        <Icon name="lock-closed-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: theme.colors.text }]}
          placeholder="Password (min 6 characters)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor={theme.colors.textSecondary}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={styles.eyeIcon}
        >
          <Icon
            name={showPassword ? 'eye-outline' : 'eye-off-outline'}
            size={20}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <View style={[styles.inputContainer, { 
        borderColor: theme.colors.border, 
        backgroundColor: isDark ? theme.colors.card : '#f9f9f9' 
      }]}>
        <Icon name="lock-closed-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: theme.colors.text }]}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor={theme.colors.textSecondary}
        />
        <TouchableOpacity
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          style={styles.eyeIcon}
        >
          <Icon
            name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
            size={20}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          styles.signUpButton, 
          { backgroundColor: theme.colors.primary },
          loading && { backgroundColor: theme.colors.textSecondary }
        ]}
        onPress={handleVenueSignUp}
        disabled={loading}
      >
        <Text style={styles.signUpButtonText}>
          {loading ? 'Submitting Application...' : 'Submit Venue Application'}
        </Text>
      </TouchableOpacity>

      {/* Rate Limit Help Text */}
      <View style={styles.helpContainer}>
        <Text style={[styles.helpText, { color: theme.colors.textSecondary }]}>
          💡 Having trouble? If you get a rate limit error, wait a few minutes or try a different email address.
        </Text>
      </View>

      <View style={styles.loginContainer}>
        <Text style={[styles.loginText, { color: theme.colors.textSecondary }]}>Already have an account? </Text>
        <TouchableOpacity onPress={onSwitchToLogin}>
          <Text style={[styles.loginLink, { color: theme.colors.primary }]}>Sign In</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  halfWidth: {
    flex: 0.48,
    marginBottom: 0,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  eyeIcon: {
    padding: 4,
  },
  signUpButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  helpContainer: {
    marginTop: -16,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  helpText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 16,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loginText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  bottomSpacing: {
    height: 40,
  },
});

export default VenueSignUpForm;