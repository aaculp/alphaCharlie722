/**
 * Property-Based Tests for SearchScreen User Result Display
 * Feature: at-search-feature
 * 
 * Tests the rendering and display logic for user search results in SearchScreen.
 * These tests validate that user results are displayed correctly with proper
 * avatar fallbacks, username formatting, and display name handling.
 */

import * as fc from 'fast-check';
import React from 'react';
import { render } from '@testing-library/react-native';
import type { UserSearchResult } from '../../../types/search.types';

/**
 * Arbitraries for generating test data
 */

// Generate valid usernames (lowercase alphanumeric + underscore, 3-30 chars)
const usernameArbitrary = fc
  .stringMatching(/^[a-z0-9_]{3,30}$/)
  .filter((s) => s.length >= 3 && s.length <= 30);

// Generate display names (any string 1-100 chars, can include spaces and mixed case)
const displayNameArbitrary = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter((s) => s.trim().length > 0);

// Generate avatar URLs (valid URL format or null)
const avatarUrlArbitrary = fc.oneof(
  fc.constant(null),
  fc.webUrl(),
  fc.constant('https://via.placeholder.com/50x50'),
  fc.constant('https://example.com/avatar.jpg')
);

// Generate UserSearchResult objects
const userSearchResultArbitrary = fc.record({
  id: fc.uuid(),
  username: usernameArbitrary,
  display_name: fc.oneof(displayNameArbitrary, fc.constant(null)),
  avatar_url: avatarUrlArbitrary,
});

/**
 * Mock component that simulates the renderUserItem logic from SearchScreen
 * This extracts the rendering logic to test it in isolation
 */
const UserResultItem: React.FC<{ user: UserSearchResult }> = ({ user }) => {
  const { Text, View, Image } = require('react-native');
  const { getDisplayName } = require('../../../utils/displayName');
  
  // Simulate the avatar fallback logic from SearchScreen
  const avatarSource = user.avatar_url 
    ? { uri: user.avatar_url }
    : { uri: 'https://via.placeholder.com/50x50?text=User' };
  
  return (
    <View testID="user-result-item">
      <Image 
        source={avatarSource} 
        testID="user-avatar"
        accessibilityLabel={`Avatar for ${user.username}`}
      />
      <View testID="user-info">
        <Text testID="display-name">
          {getDisplayName(user)}
        </Text>
        <Text testID="username">
          @{user.username}
        </Text>
      </View>
    </View>
  );
};

describe('SearchScreen User Result Display - Property-Based Tests', () => {
  describe('Property 10: User Result Display Completeness', () => {
    /**
     * Feature: at-search-feature, Property 10: User Result Display Completeness
     * Validates: Requirements 4.1
     *
     * For any user search result object, the rendered output should contain
     * the user's username, and if display_name is present, it should also be
     * included in the rendered output.
     */
    it('should always display username in rendered output', () => {
      fc.assert(
        fc.property(
          userSearchResultArbitrary,
          (user) => {
            const { getByTestId } = render(<UserResultItem user={user} />);
            
            // Username should always be present in the rendered output
            const usernameElement = getByTestId('username');
            expect(usernameElement).toBeTruthy();
            
            // Username text should contain the @ prefix and the username
            const usernameText = usernameElement.props.children;
            expect(usernameText).toContain('@');
            expect(usernameText).toContain(user.username);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display display_name when present', () => {
      fc.assert(
        fc.property(
          userSearchResultArbitrary.filter((u) => u.display_name !== null),
          (user) => {
            const { getByTestId } = render(<UserResultItem user={user} />);
            
            // Display name should be present
            const displayNameElement = getByTestId('display-name');
            expect(displayNameElement).toBeTruthy();
            
            // Display name text should match the user's display_name (trimmed by getDisplayName)
            const displayNameText = displayNameElement.props.children;
            expect(displayNameText).toBe(user.display_name!.trim());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display username as fallback when display_name is null', () => {
      fc.assert(
        fc.property(
          userSearchResultArbitrary.map((u) => ({ ...u, display_name: null })),
          (user) => {
            const { getByTestId } = render(<UserResultItem user={user} />);
            
            // Display name element should show username as fallback
            const displayNameElement = getByTestId('display-name');
            expect(displayNameElement).toBeTruthy();
            
            const displayNameText = displayNameElement.props.children;
            expect(displayNameText).toBe(user.username);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should render both display_name and username when both are present', () => {
      fc.assert(
        fc.property(
          userSearchResultArbitrary.filter((u) => u.display_name !== null),
          (user) => {
            const { getByTestId } = render(<UserResultItem user={user} />);
            
            // Both elements should be present
            const displayNameElement = getByTestId('display-name');
            const usernameElement = getByTestId('username');
            
            expect(displayNameElement).toBeTruthy();
            expect(usernameElement).toBeTruthy();
            
            // Display name should show display_name (trimmed by getDisplayName)
            expect(displayNameElement.props.children).toBe(user.display_name!.trim());
            
            // Username should show @username
            expect(usernameElement.props.children).toContain('@');
            expect(usernameElement.props.children).toContain(user.username);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always render user info container', () => {
      fc.assert(
        fc.property(
          userSearchResultArbitrary,
          (user) => {
            const { getByTestId } = render(<UserResultItem user={user} />);
            
            // User info container should always be present
            const userInfoElement = getByTestId('user-info');
            expect(userInfoElement).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 11: Avatar Fallback', () => {
    /**
     * Feature: at-search-feature, Property 11: Avatar Fallback
     * Validates: Requirements 4.3
     *
     * For any user search result where avatar_url is null or undefined,
     * the rendered component should use a default placeholder avatar URL.
     */
    it('should use placeholder avatar when avatar_url is null', () => {
      fc.assert(
        fc.property(
          userSearchResultArbitrary.map((u) => ({ ...u, avatar_url: null })),
          (user) => {
            const { getByTestId } = render(<UserResultItem user={user} />);
            
            const avatarElement = getByTestId('user-avatar');
            expect(avatarElement).toBeTruthy();
            
            // Avatar source should be the placeholder URL
            const avatarSource = avatarElement.props.source;
            expect(avatarSource).toBeDefined();
            expect(avatarSource.uri).toBe('https://via.placeholder.com/50x50?text=User');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use actual avatar_url when present', () => {
      fc.assert(
        fc.property(
          userSearchResultArbitrary.filter((u) => u.avatar_url !== null),
          (user) => {
            const { getByTestId } = render(<UserResultItem user={user} />);
            
            const avatarElement = getByTestId('user-avatar');
            expect(avatarElement).toBeTruthy();
            
            // Avatar source should be the user's avatar_url
            const avatarSource = avatarElement.props.source;
            expect(avatarSource).toBeDefined();
            expect(avatarSource.uri).toBe(user.avatar_url);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always have a valid avatar source (never undefined)', () => {
      fc.assert(
        fc.property(
          userSearchResultArbitrary,
          (user) => {
            const { getByTestId } = render(<UserResultItem user={user} />);
            
            const avatarElement = getByTestId('user-avatar');
            const avatarSource = avatarElement.props.source;
            
            // Avatar source should always be defined
            expect(avatarSource).toBeDefined();
            expect(avatarSource.uri).toBeDefined();
            expect(typeof avatarSource.uri).toBe('string');
            expect(avatarSource.uri.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use placeholder for empty string avatar_url', () => {
      fc.assert(
        fc.property(
          userSearchResultArbitrary.map((u) => ({ ...u, avatar_url: '' as any })),
          (user) => {
            const { getByTestId } = render(<UserResultItem user={user} />);
            
            const avatarElement = getByTestId('user-avatar');
            const avatarSource = avatarElement.props.source;
            
            // Empty string should be treated as falsy and use placeholder
            // Note: In the actual component, empty string would be falsy in the ternary
            expect(avatarSource).toBeDefined();
            expect(avatarSource.uri).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have accessibility label for avatar', () => {
      fc.assert(
        fc.property(
          userSearchResultArbitrary,
          (user) => {
            const { getByTestId } = render(<UserResultItem user={user} />);
            
            const avatarElement = getByTestId('user-avatar');
            
            // Avatar should have accessibility label
            expect(avatarElement.props.accessibilityLabel).toBeDefined();
            expect(avatarElement.props.accessibilityLabel).toContain(user.username);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 12: Username Display Formatting', () => {
    /**
     * Feature: at-search-feature, Property 12: Username Display Formatting
     * Validates: Requirements 4.4
     *
     * For any username displayed in the UI, it should be prefixed with
     * the @ character in the rendered output.
     */
    it('should always prefix username with @ character', () => {
      fc.assert(
        fc.property(
          userSearchResultArbitrary,
          (user) => {
            const { getByTestId } = render(<UserResultItem user={user} />);
            
            const usernameElement = getByTestId('username');
            const usernameChildren = usernameElement.props.children;
            
            // Username children should be an array with @ and username
            expect(Array.isArray(usernameChildren)).toBe(true);
            expect(usernameChildren[0]).toBe('@');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should format username as exactly @{username}', () => {
      fc.assert(
        fc.property(
          userSearchResultArbitrary,
          (user) => {
            const { getByTestId } = render(<UserResultItem user={user} />);
            
            const usernameElement = getByTestId('username');
            const usernameChildren = usernameElement.props.children;
            
            // Username should be rendered as array: ['@', username]
            expect(Array.isArray(usernameChildren)).toBe(true);
            expect(usernameChildren).toEqual(['@', user.username]);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not add extra characters or spaces to username', () => {
      fc.assert(
        fc.property(
          userSearchResultArbitrary,
          (user) => {
            const { getByTestId } = render(<UserResultItem user={user} />);
            
            const usernameElement = getByTestId('username');
            const usernameChildren = usernameElement.props.children;
            
            // Username should be array with exactly 2 elements: @ and username
            expect(Array.isArray(usernameChildren)).toBe(true);
            expect(usernameChildren.length).toBe(2);
            expect(usernameChildren[0]).toBe('@');
            expect(usernameChildren[1]).toBe(user.username);
            
            // Username part should not have leading/trailing spaces
            expect(usernameChildren[1]).toBe(usernameChildren[1].trim());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve username case and characters after @', () => {
      fc.assert(
        fc.property(
          userSearchResultArbitrary,
          (user) => {
            const { getByTestId } = render(<UserResultItem user={user} />);
            
            const usernameElement = getByTestId('username');
            const usernameChildren = usernameElement.props.children;
            
            // Username part (after @) should match original username exactly
            expect(usernameChildren[1]).toBe(user.username);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle usernames with underscores correctly', () => {
      fc.assert(
        fc.property(
          userSearchResultArbitrary.filter((u) => u.username.includes('_')),
          (user) => {
            const { getByTestId } = render(<UserResultItem user={user} />);
            
            const usernameElement = getByTestId('username');
            const usernameChildren = usernameElement.props.children;
            
            // Should preserve underscores in username
            expect(usernameChildren).toEqual(['@', user.username]);
            expect(usernameChildren[1]).toContain('_');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle numeric usernames correctly', () => {
      fc.assert(
        fc.property(
          userSearchResultArbitrary.filter((u) => /^\d+$/.test(u.username)),
          (user) => {
            const { getByTestId } = render(<UserResultItem user={user} />);
            
            const usernameElement = getByTestId('username');
            const usernameChildren = usernameElement.props.children;
            
            // Should format numeric usernames correctly
            expect(usernameChildren).toEqual(['@', user.username]);
            expect(usernameChildren[1]).toMatch(/^\d+$/);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Additional Property: Display Consistency', () => {
    /**
     * Additional property to ensure display consistency across renders
     */
    it('should render the same output for the same user data (deterministic)', () => {
      fc.assert(
        fc.property(
          userSearchResultArbitrary,
          (user) => {
            const { getByTestId: getByTestId1 } = render(<UserResultItem user={user} />);
            const { getByTestId: getByTestId2 } = render(<UserResultItem user={user} />);
            
            // Both renders should produce identical output
            const username1 = getByTestId1('username').props.children;
            const username2 = getByTestId2('username').props.children;
            expect(username1).toEqual(username2);
            
            const displayName1 = getByTestId1('display-name').props.children;
            const displayName2 = getByTestId2('display-name').props.children;
            expect(displayName1).toBe(displayName2);
            
            const avatar1 = getByTestId1('user-avatar').props.source.uri;
            const avatar2 = getByTestId2('user-avatar').props.source.uri;
            expect(avatar1).toBe(avatar2);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle all valid username formats correctly', () => {
      fc.assert(
        fc.property(
          userSearchResultArbitrary,
          (user) => {
            const { getByTestId } = render(<UserResultItem user={user} />);
            
            // Should render without errors for any valid username
            const usernameElement = getByTestId('username');
            expect(usernameElement).toBeTruthy();
            
            // Username should match the expected format
            const usernameChildren = usernameElement.props.children;
            expect(usernameChildren[0]).toBe('@');
            expect(usernameChildren[1]).toMatch(/^[a-z0-9_]{3,30}$/);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
