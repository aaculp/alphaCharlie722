import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';

interface StatCardProps {
  icon: string;
  label: string;
  value: number;
  iconColor: string;
}

export const StatCard: React.FC<StatCardProps> = ({ icon, label, value, iconColor }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.headerRow}>
        <View style={[styles.iconCircle, { backgroundColor: iconColor }]}>
          <Icon name={icon} size={16} color={theme.colors.surface} />
        </View>
        <Text style={[styles.statLabel, { color: theme.colors.textSecondary, fontFamily: theme.fonts.secondary.regular }]}>
          {label}
        </Text>
      </View>
      <Text style={[styles.statValue, { color: theme.colors.text, fontFamily: theme.fonts.primary.bold }]}>
        {value}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
  },
  statValue: {
    fontSize: 32,
  },
});
