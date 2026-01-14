import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import type { FriendRequest, SocialProfile } from '../../types/social.types';
import { triggerLightHaptic, triggerSuccessHaptic, triggerMediumHaptic } from '../../utils/haptics';
import { fadeIn, scaleIn } from '../../utils/animations';

interface FriendRequestCardProps {
  request: FriendRequest;
  fromUser: SocialProfile;
  mutualFriendsCount?: number;
  onAccept: (requestId: string) => Promise<void>;
  onDecline: (requestId: string) => Promise<void>;
  onUserPress?: (userId: string) => void;
}

/**
 * FriendRequestCard Component
 * 
 * Displays a pending friend request with requester's profile picture and name.
 * Shows mutual friends count and Accept/Decline buttons.
 * 
 * Requirements: 1.3, 1.4, 1.5
 */
const FriendRequestCard: React.FC<FriendRequestCardProps> = ({
  request,
  fromUser,
  mutualFriendsCount = 0,
  onAccept,
  onDecline,
  onUserPress,
}) => {
  const { theme } = useTheme();
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Animate in on mount
  useEffect(() => {
    Animated.parallel([
      fadeIn(fadeAnim, 250),
      scaleIn(scaleAnim, 250),
    ]).start();
  }, []);

  const handleAccept = async () => {
    try {
      triggerSuccessHaptic();
      setAccepting(true);
      await onAccept(request.id);
    } catch (error) {
      console.error('Error accepting friend request:', error);
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    try {
      triggerMediumHaptic();
      setDeclining(true);
      await onDecline(request.id);
    } catch (error) {
      console.error('Error declining friend request:', error);
    } finally {
      setDeclining(false);
    }
  };

  const handleUserPress = () => {
    if (onUserPress) {
      triggerLightHaptic();
      onUserPress(fromUser.id);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }
      ]}
    >
      {/* User Info Section */}
      <TouchableOpacity
        style={styles.userSection}
        onPress={handleUserPress}
        activeOpacity={onUserPress ? 0.7 : 1}
        disabled={!onUserPress}
      >
        {/* Avatar */}
        {fromUser.avatar_url ? (
          <Image
            source={{ uri: fromUser.avatar_url }}
            style={styles.avatar}
          />
        ) : (
          <View
            style={[
              styles.avatarPlaceholder,
              { backgroundColor: theme.colors.primary + '30' }
            ]}
          >
            <Icon
              name="person"
              size={28}
              color={theme.colors.primary}
            />
          </View>
        )}

        {/* User Details */}
        <View style={styles.userInfo}>
          <Text
            style={[
              styles.userName,
              { color: theme.colors.text }
            ]}
            numberOfLines={1}
          >
            {fromUser.name || 'Unknown User'}
          </Text>

          {fromUser.username && (
            <Text
              style={[
                styles.userUsername,
                { color: theme.colors.textSecondary }
              ]}
              numberOfLines={1}
            >
              @{fromUser.username}
            </Text>
          )}

          {/* Mutual Friends */}
          {mutualFriendsCount > 0 && (
            <View style={styles.mutualFriendsRow}>
              <Icon
                name="people"
                size={14}
                color={theme.colors.textSecondary}
              />
              <Text
                style={[
                  styles.mutualFriendsText,
                  { color: theme.colors.textSecondary }
                ]}
              >
                {mutualFriendsCount} mutual {mutualFriendsCount === 1 ? 'friend' : 'friends'}
              </Text>
            </View>
          )}

          {/* Request Time */}
          <Text
            style={[
              styles.requestTime,
              { color: theme.colors.textSecondary }
            ]}
          >
            {formatDate(request.created_at)}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Action Buttons */}
      <View style={styles.actionsSection}>
        {/* Decline Button */}
        <TouchableOpacity
          style={[
            styles.declineButton,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              opacity: declining || accepting ? 0.5 : 1,
            }
          ]}
          onPress={handleDecline}
          disabled={declining || accepting}
          activeOpacity={0.7}
        >
          {declining ? (
            <ActivityIndicator size="small" color={theme.colors.textSecondary} />
          ) : (
            <>
              <Icon
                name="close"
                size={18}
                color={theme.colors.textSecondary}
              />
              <Text
                style={[
                  styles.declineButtonText,
                  { color: theme.colors.textSecondary }
                ]}
              >
                Decline
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Accept Button */}
        <TouchableOpacity
          style={[
            styles.acceptButton,
            {
              backgroundColor: theme.colors.primary,
              opacity: accepting || declining ? 0.5 : 1,
            }
          ]}
          onPress={handleAccept}
          disabled={accepting || declining}
          activeOpacity={0.7}
        >
          {accepting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Icon
                name="checkmark"
                size={18}
                color="white"
              />
              <Text style={styles.acceptButtonText}>
                Accept
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 2,
  },
  userUsername: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 6,
  },
  mutualFriendsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  mutualFriendsText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  requestTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  actionsSection: {
    flexDirection: 'row',
    gap: 8,
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  declineButtonText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },
});

export default FriendRequestCard;
