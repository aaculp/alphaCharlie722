/**
 * Example usage of StatisticsCard component
 * 
 * This file demonstrates how to use the StatisticsCard component
 * with sample data.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatisticsCard } from './StatisticsCard';

export const StatisticsCardExample: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Example with typical values */}
      <StatisticsCard
        checkInsCount={42}
        favoritesCount={18}
        friendsCount={127}
      />

      {/* Example with zero values */}
      <StatisticsCard
        checkInsCount={0}
        favoritesCount={0}
        friendsCount={0}
      />

      {/* Example with large values */}
      <StatisticsCard
        checkInsCount={1234}
        favoritesCount={567}
        friendsCount={890}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
  },
});
