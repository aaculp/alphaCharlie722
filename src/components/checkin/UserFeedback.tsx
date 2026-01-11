import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { UserFeedbackService, UserTag } from '../../services/api/feedback';
import PulseLikeButton from './PulseLikeButton';
import type { Venue } from '../../types';

interface UserFeedbackProps {
  venue: Venue;
}

interface TagItemProps {
  tag: UserTag;
  onLike: (tagId: string) => void;
  isLiking: boolean;
}

const TagItem: React.FC<TagItemProps> = ({ tag, onLike, isLiking }) => {
  const { theme } = useTheme();

  const handleLike = () => {
    if (isLiking) return;
    onLike(tag.id);
  };

  const getTagColor = () => {
    if (tag.like_count >= 20) return '#FF4500'; // Hot orange
    if (tag.like_count >= 10) return '#FF6B6B'; // Red
    if (tag.like_count >= 5) return '#FFD700'; // Gold
    return theme.colors.primary; // Default
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return diffInMinutes <= 1 ? 'now' : `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return diffInDays === 1 ? '1d' : `${diffInDays}d`;
    }
  };

  const tagColor = getTagColor();

  return (
    <View style={[styles.tagItemHorizontal, { backgroundColor: theme.colors.surface }]}>
      <View style={[styles.tagContentHorizontal, { borderColor: tagColor + '30' }]}>
        {/* Header - Pulse Text */}
        <Text style={[styles.tagTextHorizontal, { color: theme.colors.text }]}>
          {tag.tag_text}
        </Text>
        
        {/* Bottom Row - Date and Like Icon */}
        <View style={styles.bottomRow}>
          <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>
            {formatDate(tag.created_at)}
          </Text>
          
          <PulseLikeButton
            likeCount={tag.like_count}
            userHasLiked={tag.user_has_liked || false}
            onPress={handleLike}
            disabled={isLiking}
            size="small"
          />
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

  const loadTags = useCallback(async () => {
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
  }, [venue.id, user?.id]);

  // Load tags when component mounts
  useEffect(() => {
    loadTags();
  }, [loadTags]);

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

    console.log('Attempting to like tag:', tagId, 'by user:', user.id);

    try {
      setLikingTags(prev => new Set(prev).add(tagId));
      
      const result = await UserFeedbackService.toggleTagLike(tagId, user.id);
      console.log('Like result:', result);
      
      setTags(prev => prev.map(tag => 
        tag.id === tagId 
          ? { ...tag, user_has_liked: result.liked, like_count: result.newCount }
          : tag
      ));
    } catch (error) {
      console.error('Error liking tag:', error);
      Alert.alert('Error', 'Failed to update like. Please check if database is set up.');
    } finally {
      setLikingTags(prev => {
        const newSet = new Set(prev);
        newSet.delete(tagId);
        return newSet;
      });
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
          <Text style={[styles.title, { color: theme.colors.text }]}>Pulse</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading pulse...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Icon name="pulse-outline" size={24} color={theme.colors.primary} />
          <Text style={[styles.title, { color: theme.colors.text }]}>Pulse</Text>
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
            placeholder="Share the pulse..."
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
          horizontal
          style={styles.tagsListHorizontal}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagsContentHorizontal}
        >
          {tags.map((tag) => (
            <TagItem
              key={tag.id}
              tag={tag}
              onLike={handleLikeTag}
              isLiking={likingTags.has(tag.id)}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Icon name="pulse-outline" size={48} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            No vibes yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
            {user ? 'Be the first to share the pulse!' : 'Login to share the pulse'}
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
  tagsListHorizontal: {
    maxHeight: 120,
  },
  tagsContentHorizontal: {
    paddingRight: 20,
    gap: 12,
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
  tagItemHorizontal: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    minWidth: 140,
  },
  tagContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  tagContentHorizontal: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 90,
  },
  tagText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    flex: 1,
    marginRight: 12,
  },
  tagTextHorizontal: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    lineHeight: 24,
    marginBottom: 12,
    textAlign: 'left',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    opacity: 0.7,
  },
  tagActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  tagActionsHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
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