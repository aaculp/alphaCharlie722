/**
 * Display Name Utility
 * 
 * Provides functions for determining the appropriate display name for a user
 * based on available profile fields with priority logic.
 */

export interface UserDisplayInfo {
  username?: string | null;
  display_name?: string | null;
  name?: string | null;
}

/**
 * Get the display name for a user with priority logic:
 * 1. If display_name exists, use it
 * 2. If only username exists, use username
 * 3. If only name exists, use name
 * 4. If all are null, return "Anonymous"
 * 
 * @param user - User object with username, display_name, and name fields
 * @returns The appropriate display name string
 */
export function getDisplayName(user: UserDisplayInfo | null | undefined): string {
  // Handle null/undefined user
  if (!user) {
    return 'Anonymous';
  }

  // Priority 1: display_name (trim whitespace)
  if (user.display_name && user.display_name.trim()) {
    return user.display_name.trim();
  }
  
  // Priority 2: username (trim whitespace)
  if (user.username && user.username.trim()) {
    return user.username.trim();
  }
  
  // Priority 3: name (trim whitespace)
  if (user.name && user.name.trim()) {
    return user.name.trim();
  }
  
  // Fallback: Anonymous
  return 'Anonymous';
}
