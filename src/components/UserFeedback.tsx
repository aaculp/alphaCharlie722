import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { UserFeedbackService, UserTag } from '../services/userFeedbackService';
import type { Database } from '../lib/supabase';

type Venue = Database['public']['Tables']['venues']['Row'];

interface UserFeedbackProps {
  venue: Venue;
}

interface TagItemProps {
  tag: UserTag;
  onLike: (tagId: string) => void;
  onDelete?: (tagId: string) => void;
  isOwner: boolean;
  isLiking: boolean;
}

const TagItem: React.FC<TagItemProps> = ({ tag, onLike, onDelete, isOwner, isLiking }) => {
  const { theme } = useTheme();
  const [likeAnimation] = useState(new Animated.Value(1));
  const [fireAnimation] = useState(new Animated.Value(0));

  const handleLike = () => {
    if (isLiking) return;

    // Animate the like button
    Animated.sequence([
      Animated.timing(likeAnimation, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(likeAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Show fire animation if getting liked
    if (!tag.user_has_liked) {
      Animated.sequence([
        Animated.timing(fireAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fireAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }

    onLike(tag.id);
  };

  const handleDelete = () => {
    if (!onDelete) return;
    
    Alert.alert(
      'Delete Tag',
      'Are you sure you want to delete this tag?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(tag.id) },
      ]
    );
  };

  const getTagColor = () => {
    if (tag.like_count >= 20) return '#FF4500'; // Hot orange
    if (tag.like_count >= 10) return '#FF6B6B'; // Red
    if (tag.like_count >= 5) return '#FFD700'; // Gold
    return theme.colors.primary; // Default
  };

  const tagColor = getTagColor();

  return (
    <View style={[styles.tagItem, { backgroundColor: theme.colors.surface }]}>
      <View style={[styles.tagContent, { borderColor: tagColor + '30' }]}>
        <Text style={[styles.tagText, { color: theme.colors.text }]}>
          {tag.tag_text}
        </Text>
        
        <View style={styles.tagActions}>
          {/* Fire animation overlay */}
          <Animated.View 
            style={[
              styles.fireAnimation,
              {
                opacity: fireAnimation,
                transform: [
                  {
                    scale: fireAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1.5],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.fireEmoji}>🔥</Text>
          </Animated.View>

          {/* Like button */}
          <TouchableOpacity
            style={[
              styles.likeButton,
              { 
                backgroundColor: tag.user_has_liked ? tagColor + '20' : 'transparent',
                borderColor: tagColor + '40',
              }
            ]}
            onPress={handleLike}
            disabled={isLiking}
          >
            <Animated.View style={{ transform: [{ scale: likeAnimation }] }}>
              <Icon
                name={tag.user_has_liked ? 'heart' : 'heart-outline'}
                size={16}
                color={tag.user_has_liked ? tagColor : theme.colors.textSecondary}
              />
            </Animated.View>
            <Text style={[
              styles.likeCount,
              { color: tag.user_has_liked ? tagColor : theme.colors.textSecondary }
            ]}>
              {tag.like_count}
            </Text>
          </TouchableOpacity>

          {/* Delete button for tag owner */}
          {isOwner && onDelete && (
            <TouchableOpacity
              style={[styles.deleteButton, { borderColor: theme.colors.error + '40' }]}
              onPress={handleDelete}
            >
              <Icon name="trash-outline" size={14} color={theme.colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const UserFeedback: React.FC<UserFeedbackProps> = ({ venue }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [tags, setTags] = useState<UserTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTagText, setNewTagText] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [likingTags, setLikingTags] = useState<Set<string>>(new Set());
  const [tablesExist, setTablesExist] = useState(true);

  // Load tags when component mounts
  useEffect(() => {
    loadTags();
  }, [venue.id, user?.id]);

  const loadTags = async () => {
    try {
      setLoading(true);
      const venueTags = await UserFeedbackService.getVenueTags(venue.id, user?.id);
      setTags(venueTags);
      setTablesExist(true);
    } catch (error) {
      console.error('Error loading tags:', error);
      // Check if it's a table doesn't exist error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
        console.warn('User feedback tables not set up yet. Hiding community tags section.');
        setTablesExist(false);
        setTags([]);
      } else {
        Alert.alert('Error', 'Failed to load community tags');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to create tags');
      return;
    }

    const trimmedText = newTagText.trim();
    if (!trimmedText) {
      Alert.alert('Invalid Tag', 'Please enter a tag');
      return;
    }

    if (trimmedText.length > 50) {
      Alert.alert('Tag Too Long', 'Tags must be 50 characters or less');
      return;
    }

    // Check for duplicate tags
    const isDuplicate = tags.some(tag => 
      tag.tag_text.toLowerCase() === trimmedText.toLowerCase()
    );

    if (isDuplicate) {
      Alert.alert('Duplicate Tag', 'This tag already exists for this venue');
      return;
    }

    try {
      setCreating(true);
      const newTag = await UserFeedbackService.createTag(
        { venue_id: venue.id, tag_text: trimmedText },
        user.id
      );

      setTags(prev => [{ ...newTag, user_has_liked: false }, ...prev]);
      setNewTagText('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating tag:', error);
      Alert.alert('Error', 'Failed to create tag');
    } finally {
      setCreating(false);
    }
  };

  const handleLikeTag = async (tagId: string) => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to like tags');
      return;
    }

    if (likingTags.has(tagId)) return;

    try {
      setLikingTags(prev => new Set(prev).add(tagId));
      
      const result = await UserFeedbackService.toggleTagLike(tagId, user.id);
      
      setTags(prev => prev.map(tag => 
        tag.id === tagId 
          ? { ...tag, user_has_liked: result.liked, like_count: result.newCount }
          : tag
      ));
    } catch (error) {
      console.error('Error liking tag:', error);
      Alert.alert('Error', 'Failed to update like');
    } finally {
      setLikingTags(prev => {
        const newSet = new Set(prev);
        newSet.delete(tagId);
        return newSet;
      });
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!user) return;

    try {
      await UserFeedbackService.deleteTag(tagId, user.id);
      setTags(prev => prev.filter(tag => tag.id !== tagId));
    } catch (error) {
      console.error('Error deleting tag:', error);
      Alert.alert('Error', 'Failed to delete tag');
    }
  };

  // Don't render if tables don't exist - but after all hooks are called
  if (!tablesExist) {
    return null;
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Community Tags</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading community feedback...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Icon name="people-outline" size={24} color={theme.colors.primary} />
          <Text style={[styles.title, { color: theme.colors.text }]}>Community Tags</Text>
        </View>
        
        {user && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary + '40' }]}
            onPress={() => setShowCreateForm(!showCreateForm)}
          >
            <Icon 
              name={showCreateForm ? 'close' : 'add'} 
              size={20} 
              color={theme.colors.primary} 
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Create tag form */}
      {showCreateForm && user && (
        <View style={[styles.createForm, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <TextInput
            style={[styles.tagInput, { 
              color: theme.colors.text, 
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.background 
            }]}
            placeholder="Add a community tag..."
            placeholderTextColor={theme.colors.textSecondary}
            value={newTagText}
            onChangeText={setNewTagText}
            maxLength={50}
            multiline={false}
            returnKeyType="done"
            onSubmitEditing={handleCreateTag}
          />
          <TouchableOpacity
            style={[
              styles.createButton,
              { 
                backgroundColor: newTagText.trim() ? theme.colors.primary : theme.colors.textSecondary + '40',
                opacity: creating ? 0.6 : 1
              }
            ]}
            onPress={handleCreateTag}
            disabled={creating || !newTagText.trim()}
          >
            {creating ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Icon name="send" size={16} color="white" />
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Tags list */}
      {tags.length > 0 ? (
        <ScrollView 
          style={styles.tagsList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.tagsContent}
        >
          {tags.map((tag) => (
            <TagItem
              key={tag.id}
              tag={tag}
              onLike={handleLikeTag}
              onDelete={user?.id === tag.user_id ? handleDeleteTag : undefined}
              isOwner={user?.id === tag.user_id}
              isLiking={likingTags.has(tag.id)}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Icon name="chatbubbles-outline" size={48} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            No community tags yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
            {user ? 'Be the first to add a tag!' : 'Login to add community tags'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 15,
    marginVertical: 10,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    marginLeft: 8,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createForm: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  tagInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 40,
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginLeft: 8,
  },
  tagsList: {
    maxHeight: 300,
  },
  tagsContent: {
    gap: 8,
  },
  tagItem: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tagContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    flex: 1,
    marginRight: 12,
  },
  tagActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  fireAnimation: {
    position: 'absolute',
    right: 40,
    top: -10,
    zIndex: 10,
  },
  fireEmoji: {
    fontSize: 20,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  likeCount: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});

export default UserFeedback;