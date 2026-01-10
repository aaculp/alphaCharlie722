import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';

const VenueAnalyticsScreen: React.FC = () => {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Analytics
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Track your venue's performance and customer engagement
        </Text>
        
        <View style={[styles.comingSoon, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.comingSoonText, { color: theme.colors.textSecondary }]}>
            📊 Coming Soon
          </Text>
          <Text style={[styles.comingSoonDesc, { color: theme.colors.textSecondary }]}>
            Detailed analytics and insights are being developed
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
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 32,
  },
  comingSoon: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  comingSoonText: {
    fontSize: 24,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 8,
  },
  comingSoonDesc: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});

export default VenueAnalyticsScreen;