import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { OTWLogo } from '../components';

const SplashScreen: React.FC = () => {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const textAnim = useRef(new Animated.Value(1)).current;

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

  // Start with a random phrase
  const [currentPhrase, setCurrentPhrase] = useState(() => 
    otwPhrases[Math.floor(Math.random() * otwPhrases.length)]
  );

  useEffect(() => {
    console.log('🎬 SplashScreen: Rendered');
    console.log('Initial phrase:', currentPhrase);
    
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

    // Change phrase every 1.5 seconds with fade animation
    const phraseInterval = setInterval(() => {
      // Fade out current text
      Animated.timing(textAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        // Change to new random phrase
        const newPhrase = otwPhrases[Math.floor(Math.random() * otwPhrases.length)];
        console.log('New phrase:', newPhrase);
        setCurrentPhrase(newPhrase);
        
        // Fade in new text
        Animated.timing(textAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }, 1500);

    return () => {
      clearInterval(phraseInterval);
    };
  }, [fadeAnim, scaleAnim, textAnim, otwPhrases]);

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
        
        <Animated.Text 
          style={[
            styles.scrollingText, 
            { 
              color: theme.colors.textSecondary,
              opacity: textAnim,
            }
          ]}
        >
          {currentPhrase}
        </Animated.Text>
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
    minHeight: 80, // Ensure space for text
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  scrollingText: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 10,
    lineHeight: 22,
    minHeight: 44, // Ensure text has space
  },
  loader: {
    marginTop: 20,
  },
});

export default SplashScreen;