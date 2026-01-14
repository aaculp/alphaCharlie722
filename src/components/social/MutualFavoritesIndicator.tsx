import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import type { SocialProfile } from '../../types/social.types';

interface MutualFavoritesIndicatorProps {
  friends: SocialProfile[];
  onFriendPress?: (friendId: string) => void;
}

/**
 * MutualFavoritesIndicator Component
 * 
 * Badge showing "You & X friends love this" with stacked friend avatars.
 * Tap to show list of friends who favorited the venue.
 * 
 * Requirements: 10.3
 */
const MutualFavoritesIndicator: React.FC<MutualFavoritesIndicatorProps> = ({
  friends,
  onFriendPress,
}) => {
  const { theme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  if (friends.length === 0) {
    return null;
  }

  const displayedAvatars = friends.slice(0, 3);
  const remainingCount = friends.length - displayedAvatars.length;

  const renderFriendItem = ({ item: friend }: { item: SocialProfile }) => {
    return (
      <TouchableOpacity
        style={[
          styles.friendItem,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          }
        ]}
        onPress={() => {
          if (onFriendPress) {
            onFriendPress(friend.id);
            setModalVisible(false);
          }
        }}
        activeOpacity={0.7}
        disabled={!onFriendPress}
      >
        {/* Friend Avatar */}
        {friend.avatar_url ? (
          <Image
            source={{ uri: friend.avatar_url }}
            style={styles.modalAvatar}
          />
        ) : (
          <View
            style={[
              styles.modalAvatarPlaceholder,
              { backgroundColor: theme.colors.primary + '30' }
            ]}
          >
            <Icon
              name="person"
              size={20}
              color={theme.colors.primary}
            />
          </View>
        )}

        {/* Friend Info */}
        <View style={styles.friendInfo}>
          <Text
            style={[
              styles.friendName,
              { color: theme.colors.text }
            ]}
            numberOfLines={1}
          >
            {friend.name || 'Unknown'}
          </Text>
          {friend.username && (
            <Text
              style={[
                styles.friendUsername,
                { color: theme.colors.textSecondary }
              ]}
              numberOfLines={1}
            >
              @{friend.username}
            </Text>
          )}
        </View>

        {/* Chevron */}
        {onFriendPress && (
          <Icon
            name="chevron-forward"
            size={20}
            color={theme.colors.textSecondary}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      {/* Indicator Badge */}
      <TouchableOpacity
        style={[
          styles.badge,
          {
            backgroundColor: theme.colors.primary + '15',
            borderColor: theme.colors.primary + '40',
          }
        ]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        {/* Stacked Avatars */}
        <View style={styles.avatarStack}>
          {displayedAvatars.map((friend, index) => (
            <View
              key={friend.id}
              style={[
                styles.avatarWrapper,
                { marginLeft: index > 0 ? -8 : 0 }
              ]}
            >
              {friend.avatar_url ? (
                <Image
                  source={{ uri: friend.avatar_url }}
                  style={[
                    styles.avatar,
                    { borderColor: theme.colors.background }
                  ]}
                />
              ) : (
                <View
                  style={[
                    styles.avatarPlaceholder,
                    {
                      backgroundColor: theme.colors.primary + '30',
                      borderColor: theme.colors.background,
                    }
                  ]}
                >
                  <Icon
                    name="person"
                    size={12}
                    color={theme.colors.primary}
                  />
                </View>
              )}
            </View>
          ))}
          {remainingCount > 0 && (
            <View
              style={[
                styles.avatarWrapper,
                { marginLeft: -8 }
              ]}
            >
              <View
                style={[
                  styles.avatarPlaceholder,
                  {
                    backgroundColor: theme.colors.primary,
                    borderColor: theme.colors.background,
                  }
                ]}
              >
                <Text style={styles.remainingText}>
                  +{remainingCount}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Text */}
        <View style={styles.textContainer}>
          <Icon
            name="heart"
            size={14}
            color={theme.colors.primary}
          />
          <Text
            style={[
              styles.badgeText,
              { color: theme.colors.primary }
            ]}
          >
            You & {friends.length} {friends.length === 1 ? 'friend' : 'friends'} love this
          </Text>
        </View>
      </TouchableOpacity>

      {/* Friends List Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: theme.colors.background }
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.header,
              { borderBottomColor: theme.colors.border }
            ]}
          >
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.headerIcon,
                  { backgroundColor: theme.colors.primary + '20' }
                ]}
              >
                <Icon
                  name="heart"
                  size={20}
                  color={theme.colors.primary}
                />
              </View>
              <Text
                style={[
                  styles.headerTitle,
                  { color: theme.colors.text }
                ]}
              >
                Friends who love this
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={[
                styles.closeButton,
                { backgroundColor: theme.colors.surface }
              ]}
            >
              <Icon
                name="close"
                size={24}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Friends List */}
          <FlatList
            data={friends}
            renderItem={renderFriendItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={true}
          />
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  avatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  remainingText: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'Inter-Bold',
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
  },
  modalContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  modalAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  modalAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  friendUsername: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
});

export default MutualFavoritesIndicator;
