import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import OTWLogo from '../components/shared/OTWLogo';
import { UserSignUpForm, VenueSignUpForm } from '../components';

interface SignUpScreenProps {
  onSwitchToLogin: () => void;
}

type TabType = 'users' | 'venues';

const SignUpScreen: React.FC<SignUpScreenProps> = ({ onSwitchToLogin }) => {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const { theme } = useTheme();

  const TabButton = ({ 
    tab, 
    title 
  }: { 
    tab: TabType; 
    title: string; 
  }) => {
    const isActive = activeTab === tab;
    
    return (
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => setActiveTab(tab)}
      >
        <Text style={[
          styles.tabButtonText,
          {
            color: isActive ? theme.colors.text : theme.colors.textSecondary,
            fontWeight: isActive ? '600' : '400',
          }
        ]}>
          {title}
        </Text>
        {isActive && (
          <View style={[styles.underline, { backgroundColor: theme.colors.primary }]} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Header */}
          <View style={styles.header}>
            <OTWLogo size={300} variant="full" />
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <View style={styles.tabRow}>
              <TabButton tab="users" title="USERS" />
              <TabButton tab="venues" title="VENUES" />
            </View>
          </View>

          {/* Form Container */}
          <View style={[styles.form, { backgroundColor: theme.colors.surface }]}>
            {activeTab === 'users' ? (
              <UserSignUpForm onSwitchToLogin={onSwitchToLogin} />
            ) : (
              <VenueSignUpForm onSwitchToLogin={onSwitchToLogin} />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  tabContainer: {
    marginBottom: 30,
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tabButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'relative',
  },
  tabButtonText: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  underline: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    width: 60,
    borderRadius: 2,
  },
  form: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 400,
  },
});

export default SignUpScreen;