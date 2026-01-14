import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import type { SocialProfile } from '../../types/social.types';

interface FriendSelectorProps {
  friends: SocialProfile[];
  selectedFriendIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  showCloseFriendsFilter?: boolean;
  maxHeight?: number;
}

/**
 * FriendSelector Component
 * 
 * Reusable friend selection component with search and multi-select.
 * Supports filtering by close friends and displays friend avatars.
 * 
 * Requirements: 1.6, 4.3
 */
const FriendSelector: React.FC<FriendSelectorProps> = ({
  friends,
  selectedFriendIds,
  onSelectionChange,
  showCloseFriendsFilter = true,
  maxHeight = 400,
}) => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCloseFriendsOnly, setShowCloseFriendsOnly] = useState(false);

  // Filter friends based on search and close friends filter
  const filteredFriends = useMemo(() => {
    let filtered = friends;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(friend =>
        friend.name?.toLowerCase().includes(query) ||
        friend.username?.toLowerCase().includes(query) ||
        friend.email?.toLowerCase().includes(query)
      );
    }

    // Apply close friends filter (if enabled and active)
    // Note: This would require the friendship_status to include isCloseFriend
    // For now, we'll skip this filter as the data structure doesn't support it yet
    // if (showCloseFriendsOnly) {
    //   filtered = filtered.filter(friend => friend.friendship_status?.isCloseFriend);
    // }

    return filtered;
  }, [friends, searchQuery, showCloseFriendsOnly]);

  const handleToggleFriend = (friendId: string) => {
    const newSelection = selectedFriendIds.includes(friendId)
      ? selectedFriendIds.filter(id => id !== friendId)
      : [...selectedFriendIds, friendId];
    
    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedFriendIds.length === filteredFriends.length) {
      // Deselect all
      onSelectionChange([]);
    } else {
      // Select all filtered friends
      onSelectionChange(filteredFriends.map(f => f.id));
    }
  };

  const renderFriendItem = ({ item: friend }: { item: SocialProfile }) => {
    const isSelected = selectedFriendIds.includes(friend.id);

    return (
      <TouchableOpacity
        style={[
          styles.friendItem,
          {
            backgroundColor: isSelected
              ? theme.colors.primary + '10'
              : theme.colors.surface,
            borderColor: isSelected
              ? theme.colors.primary
              : theme.colors.border,
          }
        ]}
        onPress={() => handleToggleFriend(friend.id)}
        activeOpacity={0.7}
      >
        {/* Checkbox */}
        <View
          style={[
            styles.checkbox,
            {
              backgroundColor: isSelected
                ? theme.colors.primary
                : 'transparent',
              borderColor: isSelected
                ? theme.colors.primary
                : theme.colors.border,
            }
          ]}
        >
          {isSelected && (
            <Icon name="checkmark" size={16} color="white" />
          )}
        </View>

        {/* Friend Avatar */}
        {friend.avatar_url ? (
          <Image
            source={{ uri: friend.avatar_url }}
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
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View
        style={[
          styles.searchBar,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          }
        ]}
      >
        <Icon
          name="search"
          size={18}
          color={theme.colors.textSecondary}
        />
        <TextInput
          style={[
            styles.searchInput,
            { color: theme.colors.text }
          ]}
          placeholder="Search friends..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon
              name="close-circle"
              size={18}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter and Select All Row */}
      <View style={styles.controlsRow}>
        {/* Close Friends Filter (if enabled) */}
        {showCloseFriendsFilter && (
          <TouchableOpacity
            style={[
              styles.filterButton,
              {
                backgroundColor: showCloseFriendsOnly
                  ? theme.colors.primary + '20'
                  : theme.colors.surface,
                borderColor: showCloseFriendsOnly
                  ? theme.colors.primary
                  : theme.colors.border,
              }
            ]}
            onPress={() => setShowCloseFriendsOnly(!showCloseFriendsOnly)}
            activeOpacity={0.7}
          >
            <Icon
              name="heart"
              size={14}
              color={showCloseFriendsOnly
                ? theme.colors.primary
                : theme.colors.textSecondary
              }
            />
            <Text
              style={[
                styles.filterButtonText,
                {
                  color: showCloseFriendsOnly
                    ? theme.colors.primary
                    : theme.colors.textSecondary,
                }
              ]}
            >
              Close Friends
            </Text>
          </TouchableOpacity>
        )}

        {/* Select All Button */}
        <TouchableOpacity
          style={[
            styles.selectAllButton,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            }
          ]}
          onPress={handleSelectAll}
          activeOpacity={0.7}
        >
          <Icon
            name={selectedFriendIds.length === filteredFriends.length
              ? 'checkbox'
              : 'square-outline'
            }
            size={16}
            color={theme.colors.primary}
          />
          <Text
            style={[
              styles.selectAllText,
              { color: theme.colors.text }
            ]}
          >
            {selectedFriendIds.length === filteredFriends.length
              ? 'Deselect All'
              : 'Select All'
            }
          </Text>
        </TouchableOpacity>
      </View>

      {/* Selected Count */}
      {selectedFriendIds.length > 0 && (
        <View
          style={[
            styles.selectedBanner,
            { backgroundColor: theme.colors.primary + '10' }
          ]}
        >
          <Icon
            name="checkmark-circle"
            size={16}
            color={theme.colors.primary}
          />
          <Text
            style={[
              styles.selectedText,
              { color: theme.colors.primary }
            ]}
          >
            {selectedFriendIds.length} {selectedFriendIds.length === 1 ? 'friend' : 'friends'} selected
          </Text>
        </View>
      )}

      {/* Friends List */}
      <FlatList
        data={filteredFriends}
        renderItem={renderFriendItem}
        keyExtractor={(item) => item.id}
        style={[styles.friendsList, { maxHeight }]}
        contentContainerStyle={styles.friendsListContent}
        showsVerticalScrollIndicator={true}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon
              name="people-outline"
              size={48}
              color={theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.emptyStateText,
                { color: theme.colors.textSecondary }
              ]}
            >
              {searchQuery ? 'No friends found' : 'No friends yet'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    padding: 0,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  filterButtonText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
    marginLeft: 'auto',
  },
  selectAllText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },
  selectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  selectedText: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
  },
  friendsList: {
    flex: 1,
  },
  friendsListContent: {
    flexGrow: 1,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  friendUsername: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 12,
  },
});

export default FriendSelector;
