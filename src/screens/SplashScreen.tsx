import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { debugAuthStorage, clearAuthStorage } from '../utils/debugAuth';

const SplashScreen: React.FC = () => {
  const { theme } = useTheme();

  useEffect(() => {
    console.log('🎬 SplashScreen: Rendered');
  }, []);

  const handleDebugStorage = async () => {
    await debugAuthStorage();
  };

  const handleClearStorage = async () => {
    await clearAuthStorage();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.logo, { color: theme.colors.primary }]}>OTW</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Checking authentication...
      </Text>
      <ActivityIndicator 
        size="large" 
        color={theme.colors.primary} 
        style={styles.loader}
      />
      
      {/* Debug buttons - remove these in production */}
      <View style={styles.debugContainer}>
        <TouchableOpacity 
          style={[styles.debugButton, { backgroundColor: theme.colors.primary }]} 
          onPress={handleDebugStorage}
        >
          <Text style={[styles.debugButtonText, { color: theme.colors.background }]}>
            Debug Storage
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.debugButton, { backgroundColor: theme.colors.error || '#ff4444' }]} 
          onPress={handleClearStorage}
        >
          <Text style={[styles.debugButtonText, { color: theme.colors.background }]}>
            Clear Storage
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 10,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
  },
  loader: {
    marginTop: 20,
  },
  debugContainer: {
    position: 'absolute',
    bottom: 100,
    flexDirection: 'row',
    gap: 10,
  },
  debugButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  debugButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default SplashScreen;