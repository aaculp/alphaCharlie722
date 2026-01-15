/**
 * Example usage of FollowersCard component
 * 
 * This file demonstrates how to use the FollowersCard component
 * with sample data.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { FollowersCard } from './FollowersCard';
import type { SocialProfile } from '../../types/social.types';

// Sample follower data
const sampleFollowers: SocialProfile[] = [
  {
    id: '1',
    email: 'alice@example.com',
    name: 'Alice Johnson',
    username: 'alice_j',
    bio: 'Coffee lover ☕',
    avatar_url: 'https://i.pravatar.cc/150?img=1',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    email: 'bob@example.com',
    name: 'Bob Smith',
    username: 'bob_smith',
    bio: 'Tech enthusiast',
    avatar_url: 'https://i.pravatar.cc/150?img=2',
    created_at: '2024-01-02T00:00:00Z',
  },
  {
    id: '3',
    email: 'charlie@example.com',
    name: 'Charlie Brown',
    username: 'charlie_b',
    bio: 'Foodie 🍕',
    avatar_url: null, // Test placeholder avatar
    created_at: '2024-01-03T00:00:00Z',
  },
  {
    id: '4',
    email: 'diana@example.com',
    name: 'Diana Prince',
    username: 'diana_p',
    bio: 'Adventure seeker',
    avatar_url: 'https://i.pravatar.cc/150?img=4',
    created_at: '2024-01-04T00:00:00Z',
  },
];

export const FollowersCardExample: React.FC = () => {
  const handleInvitePress = () => {
    console.log('Invite friend pressed');
  };

  return (
    <View style={styles.container}>
      {/* Example with followers */}
      <FollowersCard
        followerCount={1255}
        recentFollowers={sampleFollowers}
        onInvitePress={handleInvitePress}
      />

      {/* Example with no followers */}
      <FollowersCard
        followerCount={0}
        recentFollowers={[]}
        onInvitePress={handleInvitePress}
      />

      {/* Example with 1 follower */}
      <FollowersCard
        followerCount={1}
        recentFollowers={[sampleFollowers[0]]}
        onInvitePress={handleInvitePress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
  },
});
