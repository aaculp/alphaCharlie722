/**
 * NotificationPayloadBuilder
 * 
 * Utility for constructing FCM notification payloads for social events.
 * Handles platform-specific configuration and navigation data.
 * 
 * Requirements: 3.3, 3.4, 3.7, 4.3, 4.4, 4.7, 5.4, 5.7
 */

import type { NotificationPayload } from './FCMService';
import type { NotificationType } from '../types/social.types';

/**
 * Navigation target screens
 */
export type NavigationTarget =
  | 'FriendRequests'
  | 'UserProfile'
  | 'VenueDetail'
  | 'CollectionDetail'
  | 'ActivityFeed'
  | 'GroupOuting';

/**
 * Payload builder options
 */
export interface PayloadBuilderOptions {
  type: NotificationType;
  title: string;
  body: string;
  actorId?: string;
  actorName?: string;
  actorAvatarUrl?: string;
  referenceId?: string;
  navigationTarget: NavigationTarget;
  navigationParams?: Record<string, any>;
}

/**
 * Friend request payload options
 */
export interface FriendRequestPayloadOptions {
  fromUserId: string;
  fromUserName: string;
  fromUserAvatarUrl?: string;
}

/**
 * Friend accepted payload options
 */
export interface FriendAcceptedPayloadOptions {
  accepterId: string;
  accepterName: string;
  accepterAvatarUrl?: string;
}

/**
 * Venue share payload options
 */
export interface VenueSharePayloadOptions {
  fromUserId: string;
  fromUserName: string;
  fromUserAvatarUrl?: string;
  venueId: string;
  venueName: string;
  shareId: string;
  message?: string;
}

export class NotificationPayloadBuilder {
  /**
   * Build FCM notification payload from options
   * 
   * @param options - Payload builder options
   * @returns FCM notification payload
   */
  static buildPayload(options: PayloadBuilderOptions): NotificationPayload {
    // Convert data to string values (FCM requirement)
    const dataStrings: Record<string, string> = {
      type: options.type,
      navigationTarget: options.navigationTarget,
    };

    // Add optional fields
    if (options.actorId) {
      dataStrings.actorId = options.actorId;
    }

    if (options.actorName) {
      dataStrings.actorName = options.actorName;
    }

    if (options.referenceId) {
      dataStrings.referenceId = options.referenceId;
    }

    if (options.navigationParams) {
      dataStrings.navigationParams = JSON.stringify(options.navigationParams);
    }

    // Build payload with platform-specific configuration
    return {
      notification: {
        title: options.title,
        body: options.body,
        imageUrl: options.actorAvatarUrl,
      },
      data: dataStrings,
      android: {
        channelId: 'social_notifications',
        priority: 'high',
        sound: 'default',
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };
  }

  /**
   * Build payload for friend request notification
   * Format: "[Name] sent you a friend request"
   * 
   * Requirements: 3.3, 3.4, 3.7
   * 
   * @param options - Friend request payload options
   * @returns FCM notification payload
   */
  static buildFriendRequestPayload(
    options: FriendRequestPayloadOptions
  ): NotificationPayload {
    return this.buildPayload({
      type: 'friend_request',
      title: 'New Friend Request',
      body: `${options.fromUserName} sent you a friend request`,
      actorId: options.fromUserId,
      actorName: options.fromUserName,
      actorAvatarUrl: options.fromUserAvatarUrl,
      navigationTarget: 'FriendRequests',
      navigationParams: {
        fromUserId: options.fromUserId,
      },
    });
  }

  /**
   * Build payload for friend accepted notification
   * Format: "[Name] accepted your friend request"
   * 
   * Requirements: 4.3, 4.4, 4.7
   * 
   * @param options - Friend accepted payload options
   * @returns FCM notification payload
   */
  static buildFriendAcceptedPayload(
    options: FriendAcceptedPayloadOptions
  ): NotificationPayload {
    return this.buildPayload({
      type: 'friend_accepted',
      title: 'Friend Request Accepted',
      body: `${options.accepterName} accepted your friend request`,
      actorId: options.accepterId,
      actorName: options.accepterName,
      actorAvatarUrl: options.accepterAvatarUrl,
      navigationTarget: 'UserProfile',
      navigationParams: {
        userId: options.accepterId,
      },
    });
  }

  /**
   * Build payload for venue share notification
   * Format: "[Name] shared [Venue] with you"
   * 
   * Requirements: 5.4, 5.7
   * 
   * @param options - Venue share payload options
   * @returns FCM notification payload
   */
  static buildVenueSharePayload(
    options: VenueSharePayloadOptions
  ): NotificationPayload {
    return this.buildPayload({
      type: 'venue_share',
      title: 'Venue Shared',
      body: `${options.fromUserName} shared ${options.venueName} with you`,
      actorId: options.fromUserId,
      actorName: options.fromUserName,
      actorAvatarUrl: options.fromUserAvatarUrl,
      referenceId: options.shareId,
      navigationTarget: 'VenueDetail',
      navigationParams: {
        venueId: options.venueId,
        shareId: options.shareId,
        message: options.message,
      },
    });
  }

  /**
   * Build payload for collection follow notification
   * Format: "[Name] started following your collection [Collection Name]"
   * 
   * @param followerId - ID of user who followed
   * @param followerName - Name of user who followed
   * @param followerAvatarUrl - Avatar URL of user who followed
   * @param collectionId - ID of collection followed
   * @param collectionName - Name of collection followed
   * @returns FCM notification payload
   */
  static buildCollectionFollowPayload(
    followerId: string,
    followerName: string,
    collectionId: string,
    collectionName: string,
    followerAvatarUrl?: string
  ): NotificationPayload {
    return this.buildPayload({
      type: 'collection_follow',
      title: 'New Collection Follower',
      body: `${followerName} started following your collection "${collectionName}"`,
      actorId: followerId,
      actorName: followerName,
      actorAvatarUrl: followerAvatarUrl,
      referenceId: collectionId,
      navigationTarget: 'CollectionDetail',
      navigationParams: {
        collectionId,
      },
    });
  }

  /**
   * Build payload for activity like notification
   * Format: "[Name] liked your check-in at [Venue]"
   * 
   * @param likerId - ID of user who liked
   * @param likerName - Name of user who liked
   * @param activityId - ID of activity liked
   * @param venueName - Name of venue in activity
   * @param likerAvatarUrl - Avatar URL of user who liked
   * @returns FCM notification payload
   */
  static buildActivityLikePayload(
    likerId: string,
    likerName: string,
    activityId: string,
    venueName: string,
    likerAvatarUrl?: string
  ): NotificationPayload {
    return this.buildPayload({
      type: 'activity_like',
      title: 'New Like',
      body: `${likerName} liked your check-in at ${venueName}`,
      actorId: likerId,
      actorName: likerName,
      actorAvatarUrl: likerAvatarUrl,
      referenceId: activityId,
      navigationTarget: 'ActivityFeed',
      navigationParams: {
        activityId,
      },
    });
  }

  /**
   * Build payload for activity comment notification
   * Format: "[Name] commented on your check-in at [Venue]"
   * 
   * @param commenterId - ID of user who commented
   * @param commenterName - Name of user who commented
   * @param activityId - ID of activity commented on
   * @param venueName - Name of venue in activity
   * @param commentText - Preview of comment text
   * @param commenterAvatarUrl - Avatar URL of user who commented
   * @returns FCM notification payload
   */
  static buildActivityCommentPayload(
    commenterId: string,
    commenterName: string,
    activityId: string,
    venueName: string,
    commentText: string,
    commenterAvatarUrl?: string
  ): NotificationPayload {
    // Truncate comment text for notification
    const truncatedComment = commentText.length > 50
      ? commentText.substring(0, 47) + '...'
      : commentText;

    return this.buildPayload({
      type: 'activity_comment',
      title: 'New Comment',
      body: `${commenterName} commented on your check-in at ${venueName}: "${truncatedComment}"`,
      actorId: commenterId,
      actorName: commenterName,
      actorAvatarUrl: commenterAvatarUrl,
      referenceId: activityId,
      navigationTarget: 'ActivityFeed',
      navigationParams: {
        activityId,
      },
    });
  }

  /**
   * Build payload for group outing invite notification
   * Format: "[Name] invited you to [Outing Title] at [Venue]"
   * 
   * @param inviterId - ID of user who invited
   * @param inviterName - Name of user who invited
   * @param outingId - ID of group outing
   * @param outingTitle - Title of group outing
   * @param venueName - Name of venue
   * @param inviterAvatarUrl - Avatar URL of user who invited
   * @returns FCM notification payload
   */
  static buildGroupOutingInvitePayload(
    inviterId: string,
    inviterName: string,
    outingId: string,
    outingTitle: string,
    venueName: string,
    inviterAvatarUrl?: string
  ): NotificationPayload {
    return this.buildPayload({
      type: 'group_outing_invite',
      title: 'Group Outing Invitation',
      body: `${inviterName} invited you to "${outingTitle}" at ${venueName}`,
      actorId: inviterId,
      actorName: inviterName,
      actorAvatarUrl: inviterAvatarUrl,
      referenceId: outingId,
      navigationTarget: 'GroupOuting',
      navigationParams: {
        outingId,
      },
    });
  }

  /**
   * Build payload for friend check-in nearby notification
   * Format: "[Name] just checked in at [Venue] nearby"
   * 
   * @param friendId - ID of friend who checked in
   * @param friendName - Name of friend who checked in
   * @param venueId - ID of venue
   * @param venueName - Name of venue
   * @param distance - Distance in meters
   * @param friendAvatarUrl - Avatar URL of friend
   * @returns FCM notification payload
   */
  static buildFriendCheckinNearbyPayload(
    friendId: string,
    friendName: string,
    venueId: string,
    venueName: string,
    distance: number,
    friendAvatarUrl?: string
  ): NotificationPayload {
    // Format distance
    const distanceText = distance < 1000
      ? `${Math.round(distance)}m`
      : `${(distance / 1000).toFixed(1)}km`;

    return this.buildPayload({
      type: 'friend_checkin_nearby',
      title: 'Friend Nearby',
      body: `${friendName} just checked in at ${venueName} (${distanceText} away)`,
      actorId: friendId,
      actorName: friendName,
      actorAvatarUrl: friendAvatarUrl,
      referenceId: venueId,
      navigationTarget: 'VenueDetail',
      navigationParams: {
        venueId,
        friendId,
      },
    });
  }
}
