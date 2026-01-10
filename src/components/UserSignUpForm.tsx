import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';

interface UserSignUpFormProps {
  onSwitchToLogin: () => void;
}

const UserSignUpForm: React.FC<UserSignUpFormProps> = ({ onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp, signIn } = useAuth();
  const { theme, isDark } = useTheme();

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return false;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
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

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      console.log('🚀 Starting user signup process:', { email, name });
      
      const result = await signUp(email, password, name);
      
      console.log('📋 User signup completed:', { 
        hasUser: !!result.user, 
        hasSession: !!result.session,
        autoSignedIn: result.autoSignedIn,
        needsManualLogin: result.needsManualLogin
      });

      // Check if user was automatically signed in
      if (result.session && result.autoSignedIn) {
        console.log('✅ User successfully signed up and automatically logged in');
        // The AuthContext will automatically redirect to home screen
      } else if (result.needsManualLogin) {
        console.log('🔄 Account created, attempting manual sign-in...');
        
        try {
          await signIn(email, password);
          console.log('✅ Manual sign-in after signup successful');
        } catch (signInError) {
          console.error('❌ Manual sign-in failed:', signInError);
          const errorMsg = (signInError as Error).message;
          
          if (errorMsg.includes('Invalid login credentials') || errorMsg.includes('invalid')) {
            Alert.alert(
              'Email Confirmation Required',
              'Your account has been created but needs email confirmation. Please check your email and click the confirmation link, then sign in.',
              [{ text: 'OK', onPress: onSwitchToLogin }]
            );
          } else {
            Alert.alert(
              'Account Created!',
              'Your account has been created successfully. Please sign in to continue.',
              [{ text: 'Sign In', onPress: onSwitchToLogin }]
            );
          }
        }
      } else {
        console.log('⚠️ Unexpected signup result');
        Alert.alert(
          'Account Created',
          'Account created! Please sign in to continue.',
          [{ text: 'Sign In', onPress: onSwitchToLogin }]
        );
      }
    } catch (error) {
      console.error('❌ User signup error:', error);
      const errorMessage = (error as Error).message;
      
      if (errorMessage.includes('auto-login failed')) {
        console.log('🔄 Auto-login failed, attempting manual sign-in...');
        try {
          await signIn(email, password);
          console.log('✅ Manual sign-in after signup successful');
        } catch (signInError) {
          console.error('❌ Manual sign-in also failed:', signInError);
          Alert.alert(
            'Account Created!',
            'Your account has been created. Please sign in to continue.',
            [{ text: 'Sign In', onPress: onSwitchToLogin }]
          );
        }
      } else {
        Alert.alert('Sign Up Failed', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.inputContainer, { 
        borderColor: theme.colors.border, 
        backgroundColor: isDark ? theme.colors.card : '#f9f9f9' 
      }]}>
        <Icon name="person-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: theme.colors.text }]}
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoCorrect={false}
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
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
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
        onPress={handleSignUp}
        disabled={loading}
      >
        <Text style={styles.signUpButtonText}>
          {loading ? 'Creating Account...' : 'Create User Account'}
        </Text>
      </TouchableOpacity>

      <View style={styles.loginContainer}>
        <Text style={[styles.loginText, { color: theme.colors.textSecondary }]}>Already have an account? </Text>
        <TouchableOpacity onPress={onSwitchToLogin}>
          <Text style={[styles.loginLink, { color: theme.colors.primary }]}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
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
});

export default UserSignUpForm;