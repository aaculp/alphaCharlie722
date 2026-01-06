import React from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface OTWLogoProps {
  size?: number;
  style?: any;
  variant?: 'full' | 'block' | 'text'; // Choose logo variant
}

const OTWLogo: React.FC<OTWLogoProps> = ({ size = 120, style, variant = 'full' }) => {
  const { theme } = useTheme();
  
  if (variant === 'full') {
    // Use the full colorful OTW logo
    return (
      <View style={[styles.container, style]}>
        <Image
          source={require('../assets/images/OTW_Full_Logo.png')}
          style={[styles.logoImage, { width: size, height: size * 0.6 }]}
          resizeMode="contain"
        />
      </View>
    );
  }
  
  if (variant === 'block') {
    // Use just the block O logo
    return (
      <View style={[styles.container, style]}>
        <Image
          source={require('../assets/images/OTW_Block_O.png')}
          style={[styles.logoImage, { width: size * 0.4, height: size * 0.4 }]}
          resizeMode="contain"
        />
      </View>
    );
  }

  // Text version using theme colors (fallback)
  const fontSize = size;
  const letterSpacing = size * 0.02;

  return (
    <View style={[styles.textContainer, style]}>
      <Text style={[styles.letterO, { fontSize, letterSpacing, color: theme.colors.logoRed }]}>o</Text>
      <Text style={[styles.letterT, { fontSize, letterSpacing, color: theme.colors.logoYellow }]}>T</Text>
      <Text style={[styles.letterW, { fontSize, letterSpacing, color: theme.colors.logoGreen }]}>W</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    // Image will be sized by props
  },
  letterO: {
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  letterT: {
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  letterW: {
    fontWeight: 'bold',
    fontFamily: 'System',
  },
});

export default OTWLogo;