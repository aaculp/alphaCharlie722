import { supabase } from '../../lib/supabase';
// import type { Database } from '../../lib/supabase';

export interface UserTag {
  id: string;
  venue_id: string;
  user_id: string;
  tag_text: string;
  like_count: number;
  created_at: string;
  user_has_liked?: boolean;
}

export interface CreateTagRequest {
  venue_id: string;
  tag_text: string;
}

export interface TagLike {
  id: string;
  tag_id: string;
  user_id: string;
  created_at: string;
}

export class UserFeedbackService {
  // Get all tags for a venue
  static async getVenueTags(venueId: string, userId?: string): Promise<UserTag[]> {
    try {
      let query = supabase
        .from('user_tags')
        .select(`
          *,
          tag_likes(count)
        `)
        .eq('venue_id', venueId)
        .order('like_count', { ascending: false });

      const { data: tags, error } = await query;

      if (error) {
        // Check if tables don't exist yet
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          console.warn('User feedback tables not created yet. Please run the database setup script.');
          return [];
        }
        throw new Error(`Failed to fetch venue tags: ${error.message}`);
      }

      // If user is logged in, check which tags they've liked
      if (userId && tags && tags.length > 0) {
        const { data: userLikes, error: likesError } = await supabase
          .from('tag_likes')
          .select('tag_id')
          .eq('user_id', userId)
          .in('tag_id', tags.map(tag => tag.id));

        if (!likesError && userLikes) {
          const likedTagIds = new Set(userLikes.map(like => like.tag_id));
          return tags.map(tag => ({
            ...tag,
            user_has_liked: likedTagIds.has(tag.id)
          }));
        }
      }

      return tags || [];
    } catch (error) {
      console.error('Error fetching venue tags:', error);
      throw error;
    }
  }

  // Create a new tag
  static async createTag(request: CreateTagRequest, userId: string): Promise<UserTag> {
    try {
      const { data, error } = await supabase
        .from('user_tags')
        .insert({
          venue_id: request.venue_id,
          user_id: userId,
          tag_text: request.tag_text.trim(),
          like_count: 0
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create tag: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error creating tag:', error);
      throw error;
    }
  }

  // Like/unlike a tag
  static async toggleTagLike(tagId: string, userId: string): Promise<{ liked: boolean; newCount: number }> {
    try {
      console.log('Toggling like for tag:', tagId, 'user:', userId);
      
      // Check if user has already liked this tag
      const { data: existingLike, error: checkError } = await supabase
        .from('tag_likes')
        .select('id')
        .eq('tag_id', tagId)
        .eq('user_id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing like:', checkError);
        throw new Error(`Failed to check existing like: ${checkError.message}`);
      }

      let liked = false;
      let likeCountChange = 0;

      if (existingLike) {
        console.log('Removing existing like:', existingLike.id);
        // Unlike - remove the like
        const { error: deleteError } = await supabase
          .from('tag_likes')
          .delete()
          .eq('id', existingLike.id);

        if (deleteError) {
          console.error('Error deleting like:', deleteError);
          throw new Error(`Failed to remove like: ${deleteError.message}`);
        }

        liked = false;
        likeCountChange = -1;
      } else {
        console.log('Adding new like');
        // Like - add the like
        const { error: insertError } = await supabase
          .from('tag_likes')
          .insert({
            tag_id: tagId,
            user_id: userId
          });

        if (insertError) {
          console.error('Error inserting like:', insertError);
          throw new Error(`Failed to add like: ${insertError.message}`);
        }

        liked = true;
        likeCountChange = 1;
      }

      // Get current like count and update it
      const { data: currentTag, error: getCurrentError } = await supabase
        .from('user_tags')
        .select('like_count')
        .eq('id', tagId)
        .single();

      if (getCurrentError) {
        console.error('Error getting current tag:', getCurrentError);
        throw new Error(`Failed to get current tag: ${getCurrentError.message}`);
      }

      const newCount = Math.max(0, currentTag.like_count + likeCountChange);

      // Update the like count on the tag
      const { data: updatedTag, error: updateError } = await supabase
        .from('user_tags')
        .update({
          like_count: newCount
        })
        .eq('id', tagId)
        .select('like_count')
        .single();

      if (updateError) {
        console.error('Error updating like count:', updateError);
        throw new Error(`Failed to update like count: ${updateError.message}`);
      }

      console.log('Like toggle successful:', { liked, newCount: updatedTag.like_count });

      return {
        liked,
        newCount: updatedTag.like_count
      };
    } catch (error) {
      console.error('Error toggling tag like:', error);
      throw error;
    }
  }

  // Delete a tag (only by the creator)
  static async deleteTag(tagId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_tags')
        .delete()
        .eq('id', tagId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to delete tag: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting tag:', error);
      throw error;
    }
  }

  // Get trending tags across all venues
  static async getTrendingTags(limit: number = 10): Promise<UserTag[]> {
    try {
      const { data, error } = await supabase
        .from('user_tags')
        .select(`
          *,
          venues(name)
        `)
        .order('like_count', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch trending tags: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching trending tags:', error);
      throw error;
    }
  }
}