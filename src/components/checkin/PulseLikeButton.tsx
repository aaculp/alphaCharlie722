import React, { useState, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  Animated,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface PulseLikeButtonProps {
  likeCount: number;
  userHasLiked: boolean;
  onPress: () => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

interface LikeState {
  emoji: string;
  color: string;
  backgroundColor: string;
  borderColor: string;
  showFireAnimation?: boolean;
}

const PulseLikeButton: React.FC<PulseLikeButtonProps> = ({
  likeCount,
  userHasLiked,
  onPress,
  disabled = false,
  size = 'medium'
}) => {
  const { theme } = useTheme();
  const [likeAnimation] = useState(new Animated.Value(1));
  const [fireAnimation] = useState(new Animated.Value(0));
  const [prevLikeCount, setPrevLikeCount] = useState(likeCount);

  // Size configurations
  const sizeConfig = {
    small: {
      buttonPadding: { paddingHorizontal: 8, paddingVertical: 4 },
      emojiSize: 14,
      textSize: 12,
      borderRadius: 12,
    },
    medium: {
      buttonPadding: { paddingHorizontal: 12, paddingVertical: 8 },
      emojiSize: 18,
      textSize: 16,
      borderRadius: 20,
    },
    large: {
      buttonPadding: { paddingHorizontal: 16, paddingVertical: 10 },
      emojiSize: 22,
      textSize: 18,
      borderRadius: 24,
    },
  };

  const config = sizeConfig[size];

  // Determine the current state based on like count and user interaction
  const getLikeState = (): LikeState => {
    // Handle negative scenarios (dislikes)
    if (likeCount < 0) {
      const absCount = Math.abs(likeCount);
      if (absCount >= 5) {
        return {
          emoji: '😭',
          color: '#6B73FF',
          backgroundColor: '#6B73FF' + '15',
          borderColor: '#6B73FF' + '30',
        };
      } else if (absCount >= 3) {
        return {
          emoji: '💔',
          color: '#8B5CF6',
          backgroundColor: '#8B5CF6' + '15',
          borderColor: '#8B5CF6' + '30',
        };
      } else if (absCount >= 1) {
        return {
          emoji: '❤️‍🩹',
          color: '#F59E0B',
          backgroundColor: '#F59E0B' + '15',
          borderColor: '#F59E0B' + '30',
        };
      }
    }

    // Handle positive scenarios (likes)
    if (likeCount >= 20) {
      return {
        emoji: '🔥',
        color: '#FF4500',
        backgroundColor: '#FF4500' + '15',
        borderColor: '#FF4500' + '30',
        showFireAnimation: true,
      };
    } else if (likeCount >= 10) {
      return {
        emoji: '❤️',
        color: '#FF6B6B',
        backgroundColor: '#FF6B6B' + '15',
        borderColor: '#FF6B6B' + '30',
      };
    } else if (likeCount >= 5) {
      return {
        emoji: '👍',
        color: '#FFD700',
        backgroundColor: '#FFD700' + '15',
        borderColor: '#FFD700' + '30',
      };
    } else if (likeCount >= 1) {
      // Star progression: 1⭐ -> 2⭐ -> 3⭐ -> 4⭐ -> 5⭐
      const stars = Math.min(likeCount, 5);
      const starEmoji = '⭐'.repeat(stars);
      return {
        emoji: starEmoji,
        color: theme.colors.primary,
        backgroundColor: theme.colors.primary + '15',
        borderColor: theme.colors.primary + '30',
      };
    }

    // Default state (0 likes)
    return {
      emoji: userHasLiked ? '⭐' : '☆',
      color: userHasLiked ? theme.colors.primary : theme.colors.textSecondary,
      backgroundColor: userHasLiked ? theme.colors.primary + '15' : 'transparent',
      borderColor: userHasLiked ? theme.colors.primary + '30' : theme.colors.textSecondary + '40',
    };
  };

  const currentState = getLikeState();

  // Animate when like count changes
  useEffect(() => {
    if (likeCount !== prevLikeCount) {
      // Button scale animation
      Animated.sequence([
        Animated.timing(likeAnimation, {
          toValue: 1.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(likeAnimation, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      // Fire animation for hot content
      if (currentState.showFireAnimation && likeCount > prevLikeCount) {
        Animated.sequence([
          Animated.timing(fireAnimation, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(fireAnimation, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
      }

      setPrevLikeCount(likeCount);
    }
  }, [likeCount, prevLikeCount, currentState.showFireAnimation]);

  const handlePress = () => {
    if (!disabled) {
      onPress();
    }
  };

  return (
    <View style={styles.container}>
      {/* Fire animation overlay */}
      {currentState.showFireAnimation && (
        <Animated.View 
          style={[
            styles.fireAnimation,
            {
              opacity: fireAnimation,
              transform: [
                {
                  scale: fireAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 2],
                  }),
                },
                {
                  translateY: fireAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -20],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={[styles.fireEmoji, { fontSize: config.emojiSize + 6 }]}>🔥</Text>
        </Animated.View>
      )}

      {/* Main like button */}
      <TouchableOpacity
        style={[
          styles.likeButton,
          config.buttonPadding,
          {
            backgroundColor: currentState.backgroundColor,
            borderColor: currentState.borderColor,
            borderRadius: config.borderRadius,
            opacity: disabled ? 0.6 : 1,
          }
        ]}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Animated.View 
          style={[
            styles.buttonContent,
            { transform: [{ scale: likeAnimation }] }
          ]}
        >
          <Text style={[styles.emoji, { fontSize: config.emojiSize }]}>
            {currentState.emoji}
          </Text>
          <Text style={[
            styles.likeCount,
            { 
              color: currentState.color,
              fontSize: config.textSize,
            }
          ]}>
            {Math.abs(likeCount)}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    gap: 6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emoji: {
    lineHeight: 20,
  },
  likeCount: {
    fontFamily: 'Inter-Bold',
    lineHeight: 20,
  },
  fireAnimation: {
    position: 'absolute',
    top: -10,
    right: -5,
    zIndex: 10,
    pointerEvents: 'none',
  },
  fireEmoji: {
    lineHeight: 24,
  },
});

export default PulseLikeButton;