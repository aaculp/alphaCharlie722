import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { OTWLogo } from '../components';

const SplashScreen: React.FC = () => {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const scrollAnim = useRef(new Animated.Value(0)).current;

  // OTW phrases for the scrolling animation
  const otwPhrases = [
    "OTW to get a new phone, let's see how packed it is",
    "OTW to the gym, crush those goals",
    "OTW to date night but didn't make any reservations",
    "OTW to girls night, let's see if the bar is poppin'",
    "OTW to brunch, hoping they have bottomless mimosas",
    "OTW to the coffee shop, need that caffeine fix",
    "OTW to happy hour, time to unwind",
    "OTW to dinner, heard this place is amazing",
    "OTW to the movies, hope we get good seats",
    "OTW to the mall, retail therapy time",
    "OTW to lunch, craving something delicious",
    "OTW to the beach, sun and waves await",
  ];

  const [currentPhraseIndex, setCurrentPhraseIndex] = React.useState(0);

  useEffect(() => {
    console.log('🎬 SplashScreen: Rendered');
    
    // Start logo animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Start text scrolling animation - continuous and fluid
    const startTextAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scrollAnim, {
            toValue: 1,
            duration: 2000, // Slower, more natural timing
            useNativeDriver: true,
          }),
          Animated.timing(scrollAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        { iterations: -1 } // Infinite loop
      ).start();
    };

    // Change phrase at regular intervals, independent of animation
    const phraseInterval = setInterval(() => {
      setCurrentPhraseIndex((prev) => (prev + 1) % otwPhrases.length);
    }, 2000); // Change phrase every 2 seconds

    // Start text animation after a short delay
    const textTimer = setTimeout(startTextAnimation, 1500);

    return () => {
      clearTimeout(textTimer);
      clearInterval(phraseInterval);
    };
  }, [fadeAnim, scaleAnim, scrollAnim, otwPhrases.length]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.View 
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <OTWLogo size={500} variant="full" />
      </Animated.View>
      
      <Animated.View style={[styles.textContainer, { opacity: fadeAnim }]}>
        <Text style={[styles.subtitle, { color: theme.colors.text }]}>
          Welcome to OTW
        </Text>
        
        <View style={styles.scrollingTextContainer}>
          <Animated.Text 
            style={[
              styles.scrollingText, 
              { 
                color: theme.colors.textSecondary,
                transform: [
                  {
                    translateY: scrollAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [20, 0, -20], // Smoother movement range
                    }),
                  },
                ],
                opacity: scrollAnim.interpolate({
                  inputRange: [0, 0.2, 0.8, 1],
                  outputRange: [0, 1, 1, 0], // Longer visible time
                }),
              }
            ]}
          >
            {otwPhrases[currentPhraseIndex]}
          </Animated.Text>
        </View>
      </Animated.View>
      
      <ActivityIndicator 
        size="large" 
        color={theme.colors.primary} 
        style={styles.loader}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  scrollingTextContainer: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  scrollingText: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 10,
    lineHeight: 22,
  },
  tagline: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  loader: {
    marginTop: 20,
  },
});

export default SplashScreen;