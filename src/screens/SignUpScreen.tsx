import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { SupabaseTest } from '../utils/supabaseTest';
import { supabase } from '../lib/supabase';
import Icon from 'react-native-vector-icons/Ionicons';

interface SignUpScreenProps {
  onSwitchToLogin: () => void;
}

const SignUpScreen: React.FC<SignUpScreenProps> = ({ onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp, signIn } = useAuth();

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
      console.log('🚀 Starting signup process:', { email, name });
      
      const result = await signUp(email, password, name);
      
      console.log('📋 Signup completed:', { 
        hasUser: !!result.user, 
        hasSession: !!result.session,
        autoSignedIn: result.autoSignedIn,
        needsManualLogin: result.needsManualLogin
      });

      // Check if user was automatically signed in
      if (result.session && result.autoSignedIn) {
        console.log('✅ User successfully signed up and automatically logged in');
        // The AuthContext will automatically redirect to home screen
        // No alert needed - just let the navigation happen
      } else if (result.needsManualLogin) {
        console.log('🔄 Account created, attempting manual sign-in...');
        console.log('📧 Using credentials:', { email, passwordLength: password.length });
        
        try {
          await signIn(email, password);
          console.log('✅ Manual sign-in after signup successful');
          // User will be automatically redirected to home screen by AuthContext
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
        // Fallback case
        console.log('⚠️ Unexpected signup result');
        Alert.alert(
          'Account Created',
          'Account created! Please sign in to continue.',
          [{ text: 'Sign In', onPress: onSwitchToLogin }]
        );
      }
    } catch (error) {
      console.error('❌ Signup error:', error);
      const errorMessage = (error as Error).message;
      
      // If the error mentions auto-login failed, try to sign them in manually
      if (errorMessage.includes('auto-login failed')) {
        console.log('🔄 Auto-login failed, attempting manual sign-in...');
        try {
          await signIn(email, password);
          console.log('✅ Manual sign-in after signup successful');
          // User will be automatically redirected to home screen
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

  const handleTestSupabase = async () => {
    setLoading(true);
    try {
      console.log('Running Supabase tests...');
      const results = await SupabaseTest.runAllTests();
      
      Alert.alert(
        'Test Results',
        `Connection: ${results.connection.success ? '✅' : '❌'}\n` +
        `Tables: ${Object.values(results.tables).every(Boolean) ? '✅' : '❌'}\n` +
        'Check console for details'
      );
    } catch (error) {
      Alert.alert('Test Error', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join us to discover amazing venues</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Icon name="person-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Icon name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Icon name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password (min 6 characters)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Icon
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Icon name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <Icon
                  name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.signUpButton, loading && styles.signUpButtonDisabled]}
              onPress={handleSignUp}
              disabled={loading}
            >
              <Text style={styles.signUpButtonText}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.testButton}
              onPress={handleTestSupabase}
              disabled={loading}
            >
              <Text style={styles.testButtonText}>Test Supabase Connection</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.testButton}
              onPress={async () => {
                setLoading(true);
                try {
                  // Test signup with immediate check
                  const testEmail = `test${Date.now()}@example.com`;
                  const { data, error } = await supabase.auth.signUp({
                    email: testEmail,
                    password: 'password123'
                  });
                  
                  console.log('Test signup result:', {
                    user: data.user?.id,
                    session: !!data.session,
                    emailConfirmed: data.user?.email_confirmed_at,
                    confirmed: data.user?.confirmed_at
                  });
                  
                  Alert.alert(
                    'Auth Settings Test',
                    error 
                      ? `Error: ${error.message}` 
                      : `User: ${data.user ? 'YES' : 'NO'}\nSession: ${data.session ? 'YES' : 'NO'}\nEmail Confirmed: ${data.user?.email_confirmed_at ? 'YES' : 'NO'}`
                  );
                } catch (err) {
                  Alert.alert('Test Failed', (err as Error).message);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              <Text style={styles.testButtonText}>Test Auth Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.testButton}
              onPress={async () => {
                setLoading(true);
                try {
                  // Check current auth settings
                  const { data: { session } } = await supabase.auth.getSession();
                  Alert.alert(
                    'Auth Status',
                    `Current session: ${session ? 'Logged in as ' + session.user.email : 'Not logged in'}`
                  );
                } catch (err) {
                  Alert.alert('Status Check Failed', (err as Error).message);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              <Text style={styles.testButtonText}>Check Auth Status</Text>
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={onSwitchToLogin}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 4,
  },
  signUpButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  signUpButtonDisabled: {
    backgroundColor: '#ccc',
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  testButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default SignUpScreen;