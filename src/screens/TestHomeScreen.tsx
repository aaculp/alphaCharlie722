import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../contexts/ThemeContext';
import { TestStackParamList } from '../navigation/TestNavigator';

type TestHomeScreenNavigationProp = NativeStackNavigationProp<TestStackParamList, 'TestHome'>;

const TestHomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<TestHomeScreenNavigationProp>();

  const mockVenues = [
    { id: '1', name: 'Test Venue 1', category: 'Cafe' },
    { id: '2', name: 'Test Venue 2', category: 'Restaurant' },
    { id: '3', name: 'Test Venue 3', category: 'Gym' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={[styles.headerText, { color: theme.colors.text }]}>Test Home Screen</Text>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('TestSearch')}
          >
            <Text style={styles.buttonText}>Go to Search</Text>
          </TouchableOpacity>
        </View>

        {mockVenues.map((venue) => (
          <View key={venue.id} style={[styles.venueItem, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.venueName, { color: theme.colors.text }]}>{venue.name}</Text>
            <Text style={[styles.venueCategory, { color: theme.colors.textSecondary }]}>{venue.category}</Text>
          </View>
        ))}

        <View style={styles.debugInfo}>
          <Text style={[styles.debugText, { color: theme.colors.textSecondary }]}>
            Debug: This is a simple stack navigator test
          </Text>
          <Text style={[styles.debugText, { color: theme.colors.textSecondary }]}>
            No bottom tabs, just stack navigation
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  venueItem: {
    marginHorizontal: 15,
    marginVertical: 8,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  venueName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  venueCategory: {
    fontSize: 14,
  },
  debugInfo: {
    padding: 20,
    marginTop: 20,
  },
  debugText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 5,
  },
});

export default TestHomeScreen;