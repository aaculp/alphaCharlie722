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
import { useTheme } from '../contexts/ThemeContext';
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
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  
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
      
      // TODO: Implement venue signup logic
      // This will create both a user account and a venue profile
      // For now, show a placeholder message
      
      Alert.alert(
        'Venue Registration',
        'Thank you for your interest! Venue registration is coming soon. We\'ll review your application and contact you within 24 hours.',
        [
          { 
            text: 'OK', 
            onPress: () => {
              // Reset form
              setVenueName('');
              setVenueType('');
              setAddress('');
              setCity('');
              setPhone('');
              setWebsite('');
              setOwnerName('');
              setOwnerEmail('');
              setPassword('');
              setConfirmPassword('');
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('❌ Venue signup error:', error);
      Alert.alert('Registration Failed', 'Please try again or contact support.');
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

      <View style={[styles.inputContainer, { 
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
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