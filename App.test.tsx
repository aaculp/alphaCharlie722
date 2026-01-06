/**
 * Test App - Gradually adding components to identify the issue
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Test 1: Just SafeAreaProvider
function App() {
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <Text style={styles.text}>🎉 OTW App with SafeAreaProvider!</Text>
        <Text style={styles.subtext}>Testing SafeAreaProvider integration</Text>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtext: {
    fontSize: 16,
    color: '#666',
  },
});

export default App;