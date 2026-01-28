import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatCard } from './StatCard';

export interface StatConfig {
  icon: string;
  label: string;
  value: string | number;
  iconColor: string;
  subtitle?: string;
}

interface StatsGridProps {
  stats: StatConfig[];
}

/**
 * Reusable grid component for displaying stat cards
 * Shows all stats with default values, allowing the app to hydrate data progressively
 */
export const StatsGrid: React.FC<StatsGridProps> = ({ stats }) => {
  return (
    <View style={styles.container}>
      {stats.map((stat, index) => (
        <StatCard
          key={`${stat.label}-${index}`}
          icon={stat.icon}
          label={stat.label}
          value={stat.value}
          iconColor={stat.iconColor}
          subtitle={stat.subtitle}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 12,
  },
});
