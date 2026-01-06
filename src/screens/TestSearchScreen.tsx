import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';

const TestSearchScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();

  const mockSearchResults = [
    { id: '1', name: 'Search Result 1', category: 'Cafe' },
    { id: '2', name: 'Search Result 2', category: 'Restaurant' },
    { id: '3', name: 'Search Result 3', category: 'Bookstore' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={[styles.headerText, { color: theme.colors.text }]}>Test Search Screen (No SafeAreaView)</Text>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>

        {mockSearchResults.map((item) => (
          <View key={item.id} style={[styles.resultItem, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.resultName, { color: theme.colors.text }]}>{item.name}</Text>
            <Text style={[styles.resultCategory, { color: theme.colors.textSecondary }]}>{item.category}</Text>
          </View>
        ))}

        <View style={styles.debugInfo}>
          <Text style={[styles.debugText, { color: theme.colors.textSecondary }]}>
            Debug: Using regular View (no SafeAreaView)
          </Text>
          <Text style={[styles.debugText, { color: theme.colors.textSecondary }]}>
            Check if white bar is gone at bottom
          </Text>
        </View>
      </ScrollView>
    </View>
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
  resultItem: {
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
  resultName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  resultCategory: {
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

export default TestSearchScreen;