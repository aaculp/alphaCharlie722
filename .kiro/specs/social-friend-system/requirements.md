# Requirements Document: Social Friend System

## Introduction

This document outlines the requirements for implementing a comprehensive social friend system in the OTW application. The system will enable users to connect with friends, share venue experiences, follow each other's activities, and create personalized content collections for group outings and curated recommendations (like date night spots). This feature transforms OTW from a solo venue discovery app into a social experience platform.

## Glossary

- **User**: A registered customer account in the OTW application
- **Friend**: A User who has an accepted bidirectional connection with another User
- **Friend_Request**: A pending invitation from one User to another to establish a Friend connection
- **Follow**: A unidirectional relationship where one User subscribes to another User's public activity
- **Follower**: A User who follows another User's public activity
- **Following**: A User whose public activity is being followed by another User
- **Activity_Feed**: A chronological stream of Friend and Following activities including check-ins, favorites, and venue interactions
- **Venue_Share**: An action where a User sends a specific Venue recommendation to one or more Friends
- **Collection**: A curated list of Venues created by a User with a specific theme or purpose
- **Group_Outing**: A planned event at a Venue where multiple Friends can indicate interest or attendance
- **Social_Profile**: A User's public profile displaying their activity, collections, and social statistics
- **Privacy_Setting**: User-configurable options controlling visibility of their activities and profile information
- **Privacy_Level**: A visibility setting with four tiers: public, friends, close_friends, or private
- **Close_Friend**: A subset of Friends designated by the User for more intimate sharing
- **Notification**: An in-app alert informing Users of social interactions (friend requests, shares, mentions, etc.)
- **Block**: An action preventing all interactions between two Users
- **Report**: An action flagging inappropriate User behavior for moderation review

## Requirements

### Requirement 1: Friend Connection Management

**User Story:** As a user, I want to send and accept friend requests, so that I can connect with people I know and see their venue activities.

#### Acceptance Criteria

1. WHEN a User searches for another User by name or username, THE System SHALL display matching User profiles
2. WHEN a User sends a friend request to another User, THE System SHALL create a pending Friend_Request record
3. WHEN a User receives a friend request, THE System SHALL notify the recipient and display the request in their notifications
4. WHEN a User accepts a friend request, THE System SHALL create a bidirectional Friend relationship and remove the Friend_Request
5. WHEN a User declines a friend request, THE System SHALL delete the Friend_Request without creating a Friend relationship
6. WHEN a User views their friends list, THE System SHALL display all accepted Friend connections with profile information
7. WHEN a User removes a friend, THE System SHALL delete the bidirectional Friend relationship
8. THE System SHALL prevent duplicate friend requests between the same two Users
9. THE System SHALL prevent Users from sending friend requests to themselves
10. THE System SHALL allow Users to designate specific Friends as Close_Friends
11. WHEN a User designates a Friend as a Close_Friend, THE System SHALL update the Friend relationship with the close_friend flag
12. WHEN a User views their Close_Friends list, THE System SHALL display only Friends marked as Close_Friends
13. THE System SHALL allow Users to remove the Close_Friend designation without removing the Friend relationship

### Requirement 2: Follow System with Permissions

**User Story:** As a user, I want to follow other users without requiring mutual friendship, so that I can discover venues through influencers and interesting people in my area, while maintaining control over who can follow me.

#### Acceptance Criteria

1. WHEN a User with public follow settings is followed, THE System SHALL immediately create a unidirectional Follow relationship
2. WHEN a User with private follow settings receives a follow request, THE System SHALL create a pending follow request requiring approval
3. WHEN a User approves a follow request, THE System SHALL create the Follow relationship and notify the requester
4. WHEN a User denies a follow request, THE System SHALL delete the request and notify the requester
5. WHEN a User unfollows another User, THE System SHALL delete the Follow relationship
6. WHEN a User views their followers list, THE System SHALL display all Users who follow them with options to remove followers
7. WHEN a User views their following list, THE System SHALL display all Users they follow
8. THE System SHALL allow Users to follow others regardless of Friend status
9. THE System SHALL prevent Users from following themselves
10. THE System SHALL allow Users to remove followers at any time
11. THE System SHALL display follower and following counts on User profiles
12. THE System SHALL provide a setting to toggle between public follows (automatic) and private follows (require approval)

### Requirement 3: Social Activity Feed with Privacy Filtering

**User Story:** As a user, I want to see a feed of my friends' and followed users' venue activities, so that I can discover new places and stay connected with their experiences, while respecting their privacy preferences.

#### Acceptance Criteria

1. WHEN a User views their activity feed, THE System SHALL display recent activities from Friends and Following Users in chronological order
2. WHEN a Friend or Following User checks into a Venue, THE System SHALL add the check-in to the activity feed only if the User has permission based on Privacy_Level
3. WHEN a Friend or Following User favorites a Venue, THE System SHALL add the favorite action to the activity feed only if the User has permission based on Privacy_Level
4. WHEN a Friend or Following User creates a Collection, THE System SHALL add the collection creation to the activity feed only if the Collection privacy allows it
5. WHEN a Friend or Following User adds a Venue to a Collection, THE System SHALL add the collection update to the activity feed only if the Collection privacy allows it
6. THE System SHALL filter activity feed items based on the content creator's Privacy_Level settings
7. WHEN content is set to close_friends Privacy_Level, THE System SHALL only show it to designated Close_Friends
8. WHEN content is set to friends Privacy_Level, THE System SHALL only show it to Friends
9. WHEN content is set to public Privacy_Level, THE System SHALL show it to all Followers and Friends
10. WHEN content is set to private Privacy_Level, THE System SHALL not show it in any activity feed
11. THE System SHALL display the User's name, profile picture, action type, Venue information, and timestamp for each activity
12. THE System SHALL allow Users to filter the activity feed by activity type (check-ins, favorites, collections)
13. THE System SHALL support infinite scroll pagination for the activity feed
14. THE System SHALL refresh the activity feed when the User pulls to refresh
15. THE System SHALL display a privacy indicator icon on each activity showing its Privacy_Level

### Requirement 4: Venue Sharing

**User Story:** As a user, I want to share specific venues with my friends, so that I can recommend places and coordinate where to meet.

#### Acceptance Criteria

1. WHEN a User views a Venue detail page, THE System SHALL display a share button
2. WHEN a User taps the share button, THE System SHALL display a list of their Friends
3. WHEN a User selects one or more Friends and confirms, THE System SHALL create Venue_Share records and send notifications
4. WHEN a User receives a Venue share, THE System SHALL notify them and display the share in their notifications
5. WHEN a User taps a Venue share notification, THE System SHALL navigate to the shared Venue detail page
6. THE System SHALL include the sender's name and optional message with each Venue_Share
7. THE System SHALL allow Users to share Venues via external apps (Messages, WhatsApp, etc.) using deep links
8. THE System SHALL track share counts per Venue for analytics

### Requirement 5: Venue Collections

**User Story:** As a user, I want to create themed collections of venues (like "Date Night Spots" or "Weekend Brunch"), so that I can organize my favorite places and share curated lists with friends.

#### Acceptance Criteria

1. WHEN a User creates a Collection, THE System SHALL store the collection name, description, and privacy setting
2. WHEN a User adds a Venue to a Collection, THE System SHALL create a Collection_Venue association
3. WHEN a User removes a Venue from a Collection, THE System SHALL delete the Collection_Venue association
4. WHEN a User views their Collections, THE System SHALL display all Collections they created with venue counts
5. WHEN a User views a Collection detail, THE System SHALL display all Venues in the Collection with images and ratings
6. THE System SHALL allow Users to reorder Venues within a Collection
7. THE System SHALL support Collection privacy settings: public, friends-only, or private
8. WHEN a Collection is public or friends-only, THE System SHALL allow other Users to view the Collection
9. THE System SHALL allow Users to follow other Users' public Collections
10. WHEN a User follows a Collection, THE System SHALL notify them when new Venues are added
11. THE System SHALL display Collection creator information and follower count

### Requirement 6: Group Outings

**User Story:** As a user, I want to create group outings at specific venues and invite friends, so that we can coordinate plans and see who's interested in joining.

#### Acceptance Criteria

1. WHEN a User creates a Group_Outing, THE System SHALL store the Venue, date/time, description, and invited Friends
2. WHEN a User invites Friends to a Group_Outing, THE System SHALL send notifications to invited Friends
3. WHEN a Friend receives a Group_Outing invitation, THE System SHALL display the invitation with Venue details and event information
4. WHEN a Friend responds to a Group_Outing invitation, THE System SHALL record their response (interested, going, can't go)
5. WHEN a User views a Group_Outing, THE System SHALL display all invited Friends and their response status
6. THE System SHALL allow the Group_Outing creator to update event details
7. THE System SHALL notify all invited Friends when Group_Outing details change
8. THE System SHALL allow invited Friends to add the Group_Outing to their calendar
9. WHEN the Group_Outing date/time arrives, THE System SHALL send reminder notifications to Friends who responded "going"
10. THE System SHALL display upcoming Group_Outings on the User's home screen

### Requirement 7: Social Profile

**User Story:** As a user, I want a public profile showing my venue activity and collections, so that friends can see my favorite places and discover new venues through my recommendations.

#### Acceptance Criteria

1. WHEN a User views another User's profile, THE System SHALL display the User's name, profile picture, bio, and social statistics
2. THE System SHALL display social statistics including friend count, follower count, following count, and total check-ins
3. WHEN a User views another User's profile, THE System SHALL display their public Collections
4. WHEN a User views another User's profile, THE System SHALL display their recent check-ins (subject to privacy settings)
5. THE System SHALL display the User's favorite Venues (subject to privacy settings)
6. THE System SHALL allow Users to edit their own profile including name, bio, and profile picture
7. THE System SHALL display a "Add Friend" or "Follow" button on other Users' profiles based on current relationship status
8. WHEN viewing a Friend's profile, THE System SHALL display more detailed activity information than non-Friends

### Requirement 8: Privacy Controls and Safety

**User Story:** As a user, I want granular control over who can see my activities and profile information with multiple privacy levels, so that I can share appropriately with different audiences and protect myself from unwanted attention.

#### Acceptance Criteria

1. THE System SHALL provide four Privacy_Levels for content: public, friends, close_friends, and private
2. THE System SHALL provide privacy settings for check-in visibility with all four Privacy_Levels
3. THE System SHALL provide privacy settings for favorite Venues visibility with all four Privacy_Levels
4. THE System SHALL provide privacy settings for Collections with all four Privacy_Levels (configurable per collection)
5. THE System SHALL provide a privacy setting for profile visibility: public, friends, or private
6. THE System SHALL provide a privacy setting for follower approval: automatic (public) or require approval (private)
7. THE System SHALL allow Users to designate specific Friends as Close_Friends
8. WHEN a User's check-in privacy is set to close_friends, THE System SHALL only show check-ins to designated Close_Friends
9. WHEN a User's check-in privacy is set to friends, THE System SHALL show check-ins to all Friends
10. WHEN a User's check-in privacy is set to public, THE System SHALL show check-ins to all Users including Followers
11. WHEN a User's check-in privacy is set to private, THE System SHALL not show check-ins in any activity feed
12. WHEN a User's profile visibility is set to friends, THE System SHALL only show full profile details to Friends
13. WHEN a User's profile visibility is set to private, THE System SHALL only show basic profile information (name and profile picture) to non-Friends
14. THE System SHALL respect privacy settings when displaying User information in search results
15. THE System SHALL allow Users to block other Users, preventing all social interactions and visibility
16. WHEN a User blocks another User, THE System SHALL remove any existing Friend or Follow relationships
17. WHEN a User blocks another User, THE System SHALL hide the blocked User from search results and suggestions
18. THE System SHALL allow Users to report other Users for inappropriate behavior
19. WHEN a User reports another User, THE System SHALL create a moderation ticket for review
20. THE System SHALL provide a "Blocked Users" management screen where Users can view and unblock Users
21. THE System SHALL default new Users to friends-only privacy for check-ins and favorites
22. THE System SHALL provide a privacy settings screen with clear explanations of each Privacy_Level

### Requirement 9: Social Notifications

**User Story:** As a user, I want to receive notifications about social interactions, so that I stay informed about friend requests, shares, and group outing invitations.

#### Acceptance Criteria

1. WHEN a User receives a friend request, THE System SHALL send a push notification and in-app notification
2. WHEN a User's friend request is accepted, THE System SHALL send a notification
3. WHEN a User receives a Venue share, THE System SHALL send a notification with Venue preview
4. WHEN a User is invited to a Group_Outing, THE System SHALL send a notification with event details
5. WHEN a Friend checks in at a Venue, THE System SHALL send an optional notification (configurable)
6. WHEN a User's Collection is followed, THE System SHALL send a notification
7. WHEN a Friend adds a Venue to a followed Collection, THE System SHALL send a notification
8. THE System SHALL allow Users to configure notification preferences for each notification type
9. THE System SHALL display a notification badge count on the notifications tab
10. WHEN a User taps a notification, THE System SHALL navigate to the relevant content (profile, venue, group outing, etc.)

### Requirement 10: Friend Discovery

**User Story:** As a user, I want to discover friends through contacts, mutual friends, and nearby users, so that I can easily connect with people I know.

#### Acceptance Criteria

1. WHEN a User grants contacts permission, THE System SHALL scan contacts and suggest Users with matching phone numbers or emails
2. WHEN a User views friend suggestions, THE System SHALL display Users with mutual Friends
3. THE System SHALL display the number of mutual Friends for each suggestion
4. WHEN a User views a suggested User's profile, THE System SHALL highlight mutual Friends
5. THE System SHALL allow Users to dismiss friend suggestions
6. THE System SHALL provide a "Find Friends" screen with search, suggestions, and contact sync options
7. WHEN a User searches for friends, THE System SHALL support search by name, username, email, or phone number
8. THE System SHALL respect privacy settings when displaying Users in search results and suggestions

### Requirement 11: Social Engagement Metrics

**User Story:** As a user, I want to see engagement metrics on my shared content, so that I understand which venues and collections resonate with my friends.

#### Acceptance Criteria

1. WHEN a User views their Collections, THE System SHALL display view counts and follower counts
2. WHEN a User views a Venue they shared, THE System SHALL display how many Friends viewed the share
3. THE System SHALL track when Friends visit Venues from shares or Collections
4. THE System SHALL display "Trending with Friends" Venues based on recent Friend activity
5. THE System SHALL display "Popular Collections" based on follower counts and engagement
6. THE System SHALL provide a "Social Insights" section showing the User's most shared Venues and most popular Collections

### Requirement 12: Real-time Updates

**User Story:** As a user, I want to see real-time updates when friends check in or interact with venues, so that I can coordinate spontaneous meetups.

#### Acceptance Criteria

1. WHEN a Friend checks in at a nearby Venue, THE System SHALL send a real-time notification (if enabled)
2. WHEN viewing the activity feed, THE System SHALL automatically refresh with new activities without requiring manual refresh
3. WHEN multiple Friends are checked in at the same Venue, THE System SHALL display a "Friends here now" indicator
4. THE System SHALL use WebSocket or similar technology for real-time activity updates
5. THE System SHALL display "Active now" status for Friends who are currently checked in
6. WHEN a User views a Venue detail page, THE System SHALL display which Friends are currently checked in

### Requirement 13: Data Persistence and Synchronization

**User Story:** As a system administrator, I want all social data to be persisted reliably and synchronized across devices, so that users have a consistent experience.

#### Acceptance Criteria

1. THE System SHALL store all Friend relationships in the database with proper indexing
2. THE System SHALL store all Follow relationships in the database with proper indexing
3. THE System SHALL store all Collections and Collection_Venue associations in the database
4. THE System SHALL store all Group_Outings and invitation responses in the database
5. THE System SHALL store all Venue_Shares and share interactions in the database
6. THE System SHALL synchronize social data across all User devices in real-time
7. THE System SHALL handle offline scenarios gracefully, queuing actions for sync when connection is restored
8. THE System SHALL maintain referential integrity for all social relationships
9. THE System SHALL implement proper database indexes for efficient social queries
10. THE System SHALL implement Row Level Security (RLS) policies for all social tables

### Requirement 14: Performance and Scalability

**User Story:** As a system administrator, I want the social features to perform efficiently at scale, so that users have a fast and responsive experience.

#### Acceptance Criteria

1. WHEN a User loads their activity feed, THE System SHALL return results within 500ms for the first page
2. WHEN a User searches for friends, THE System SHALL return results within 300ms
3. THE System SHALL implement pagination for all list views (friends, followers, activity feed, collections)
4. THE System SHALL cache frequently accessed data (friend lists, follower counts) with appropriate TTL
5. THE System SHALL use database indexes on all foreign keys and frequently queried fields
6. THE System SHALL batch database queries where possible to reduce round trips
7. THE System SHALL implement rate limiting on social actions to prevent abuse
8. THE System SHALL handle concurrent friend requests and follows gracefully without race conditions
