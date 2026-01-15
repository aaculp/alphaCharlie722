/**
 * Example usage of TabNavigation component
 * 
 * This example demonstrates how to integrate TabNavigation
 * into a profile screen with tab content switching.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TabNavigation } from './TabNavigation';
import type { TabType } from '../../types/profile.types';

export const TabNavigationExample: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('main');

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    // You can add additional logic here, such as:
    // - Announcing tab change for accessibility
    // - Animating content transition
    // - Fetching data for the new tab
  };

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Tab Content */}
      <View style={styles.content}>
        {activeTab === 'main' && (
          <View style={styles.tabContent}>
            <Text style={styles.contentText}>Main Info Content</Text>
            <Text style={styles.description}>
              This is where you would display:
              {'\n'}- FollowersCard
              {'\n'}- StatisticsCard
              {'\n'}- Other main info components
            </Text>
          </View>
        )}

        {activeTab === 'settings' && (
          <View style={styles.tabContent}>
            <Text style={styles.contentText}>Settings Content</Text>
            <Text style={styles.description}>
              This is where you would display:
              {'\n'}- SettingsMenu
              {'\n'}- Settings options
              {'\n'}- Logout button
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  tabContent: {
    flex: 1,
  },
  contentText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
