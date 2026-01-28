import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Text,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { VenueAnalytics } from '../../services/venueAnalyticsService';
import { TodaysPerformance } from './TodaysPerformance';
import { ThisWeeksAnalysis } from './ThisWeeksAnalysis';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PerformanceSliderProps {
  analytics: VenueAnalytics | null;
  analyticsLoading: boolean;
}

export const PerformanceSlider: React.FC<PerformanceSliderProps> = ({
  analytics,
  analyticsLoading,
}) => {
  const { theme } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  const handleDotPress = (index: number) => {
    scrollViewRef.current?.scrollTo({
      x: index * SCREEN_WIDTH,
      animated: true,
    });
    setActiveIndex(index);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={SCREEN_WIDTH}
        snapToAlignment="start"
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
          <TodaysPerformance
            analytics={analytics}
            analyticsLoading={analyticsLoading}
          />
        </View>
        <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
          <ThisWeeksAnalysis
            analytics={analytics}
            analyticsLoading={analyticsLoading}
          />
        </View>
      </ScrollView>

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {[0, 1].map((index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleDotPress(index)}
            style={[
              styles.dot,
              {
                backgroundColor:
                  activeIndex === index
                    ? theme.colors.primary
                    : theme.colors.border,
                width: activeIndex === index ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* Optional: Labels for clarity */}
      {/* <View style={styles.labels}>
        <Text
          style={[
            styles.label,
            {
              color: activeIndex === 0 ? theme.colors.primary : theme.colors.textSecondary,
              fontWeight: activeIndex === 0 ? '600' : '400',
            },
          ]}
        >
          Today
        </Text>
        <Text
          style={[
            styles.label,
            {
              color: activeIndex === 1 ? theme.colors.primary : theme.colors.textSecondary,
              fontWeight: activeIndex === 1 ? '600' : '400',
            },
          ]}
        >
          This Week
        </Text>
      </View> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  scrollContent: {
    flexDirection: 'row',
  },
  slide: {
    width: SCREEN_WIDTH,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 56,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
  },
});
