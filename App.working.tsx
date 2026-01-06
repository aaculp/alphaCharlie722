/**
 * Working App - Minimal version with core functionality
 * This version should bundle successfully and allow testing
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function App() {
  const handleLocationTest = () => {
    Alert.alert(
      'Location Test',
      'This would request location permission and show nearby venues with mock NYC coordinates.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'OK', onPress: () => console.log('Location test confirmed') }
      ]
    );
  };

  const handleNavigationTest = () => {
    Alert.alert(
      'Navigation Test', 
      'This would navigate between Home, Search, and Settings screens.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <Text style={styles.title}>🎉 OTW App</Text>
        <Text style={styles.subtitle}>Venue Discovery Platform</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleLocationTest}>
            <Text style={styles.buttonText}>📍 Test Location Services</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button} onPress={handleNavigationTest}>
            <Text style={styles.buttonText}>🧭 Test Navigation</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button} onPress={() => Alert.alert('Auth Test', 'This would show login/signup screens.')}>
            <Text style={styles.buttonText}>🔐 Test Authentication</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.status}>✅ Basic React Native: Working</Text>
        <Text style={styles.status}>✅ Metro Bundler: Working</Text>
        <Text style={styles.status}>✅ Emulator: Connected</Text>
        <Text style={styles.status}>⚠️ Full App: Debugging...</Text>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  status: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
});

export default App;