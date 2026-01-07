import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { UserFeedbackService } from '../services/userFeedbackService';
import { VenueService } from '../services/venueService';

const PulseTest: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [testing, setTesting] = useState(false);

  const testDatabase = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in first');
      return;
    }

    setTesting(true);
    try {
      console.log('Testing database connection...');
      
      // First, get a real venue ID from the database
      console.log('Fetching venues...');
      let venues = await VenueService.getAllVenues();
      
      if (venues.length === 0) {
        console.log('No venues found, trying to populate...');
        Alert.alert('No Venues', 'No venues found in database. Please go to the Home screen first to populate venues, then come back and test.');
        return;
      }
      
      const testVenueId = venues[0].id;
      console.log('Using venue ID:', testVenueId);
      
      // Test 1: Try to fetch tags
      const tags = await UserFeedbackService.getVenueTags(testVenueId, user.id);
      console.log('Fetched tags:', tags);
      
      if (tags.length === 0) {
        // Test 2: Try to create a test tag
        console.log('Creating test tag...');
        const newTag = await UserFeedbackService.createTag(
          { venue_id: testVenueId, tag_text: 'Test pulse!' },
          user.id
        );
        console.log('Created tag:', newTag);
        
        // Test 3: Try to like the tag
        console.log('Testing like functionality...');
        const likeResult = await UserFeedbackService.toggleTagLike(newTag.id, user.id);
        console.log('Like result:', likeResult);
        
        Alert.alert('Success!', 'Database is working correctly! Created a test pulse.');
      } else {
        // Test like on existing tag
        const firstTag = tags[0];
        console.log('Testing like on existing tag:', firstTag.id);
        const likeResult = await UserFeedbackService.toggleTagLike(firstTag.id, user.id);
        console.log('Like result:', likeResult);
        
        Alert.alert('Success!', `Database working! Found ${tags.length} existing pulses. Like toggled successfully.`);
      }
    } catch (error) {
      console.error('Database test failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      Alert.alert('Database Error', `Error: ${errorMessage}\n\nMake sure you ran all 3 SQL scripts in order.`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Pulse Database Test</Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.colors.primary }]}
        onPress={testDatabase}
        disabled={testing}
      >
        <Text style={styles.buttonText}>
          {testing ? 'Testing...' : 'Test Database'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 15,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 16,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});

export default PulseTest;