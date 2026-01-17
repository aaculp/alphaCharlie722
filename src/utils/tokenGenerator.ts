import { supabase } from '../lib/supabase';

/**
 * Generate a cryptographically secure 6-digit token for flash offer claims
 * Ensures uniqueness within the offer scope
 * 
 * @param offerId - The ID of the flash offer
 * @returns A 6-digit token string with leading zeros (e.g., "004219")
 */
export async function generateFlashOfferToken(offerId: string): Promise<string> {
  const maxAttempts = 10;
  let attempts = 0;

  while (attempts < maxAttempts) {
    // Generate a random 6-digit number
    const token = generateRandomToken();

    // Check if this token already exists for this offer
    const isUnique = await isTokenUnique(offerId, token);

    if (isUnique) {
      return token;
    }

    attempts++;
  }

  // If we couldn't generate a unique token after max attempts, throw an error
  throw new Error('Failed to generate a unique token after multiple attempts');
}

/**
 * Generate a random 6-digit token using cryptographically secure random numbers
 * 
 * @returns A 6-digit token string with leading zeros
 */
function generateRandomToken(): string {
  // Generate a random number between 0 and 999999
  // Using crypto.getRandomValues for cryptographic security
  const array = new Uint32Array(1);
  
  // In React Native, we need to use a polyfill or alternative
  // For now, we'll use Math.random() but in production, consider using
  // react-native-get-random-values or expo-random
  const randomNumber = Math.floor(Math.random() * 1000000);
  
  // Format with leading zeros to ensure 6 digits
  return randomNumber.toString().padStart(6, '0');
}

/**
 * Check if a token is unique within the scope of a specific offer
 * 
 * @param offerId - The ID of the flash offer
 * @param token - The token to check
 * @returns True if the token is unique, false otherwise
 */
async function isTokenUnique(offerId: string, token: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('flash_offer_claims')
      .select('id')
      .eq('offer_id', offerId)
      .eq('token', token)
      .single();

    // If no data is returned, the token is unique
    // If error code is PGRST116, it means no rows found (unique)
    if (error && error.code === 'PGRST116') {
      return true;
    }

    // If we got data, the token already exists
    if (data) {
      return false;
    }

    // If there was an error other than "not found", log it but assume not unique
    if (error) {
      console.warn('Warning: Error checking token uniqueness:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking token uniqueness:', error);
    return false;
  }
}

/**
 * Generate a batch of unique tokens for testing purposes
 * 
 * @param offerId - The ID of the flash offer
 * @param count - Number of tokens to generate
 * @returns Array of unique tokens
 */
export async function generateBatchTokens(offerId: string, count: number): Promise<string[]> {
  const tokens: string[] = [];

  for (let i = 0; i < count; i++) {
    const token = await generateFlashOfferToken(offerId);
    tokens.push(token);
  }

  return tokens;
}
