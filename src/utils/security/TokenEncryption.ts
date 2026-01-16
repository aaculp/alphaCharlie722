/**
 * TokenEncryption
 * 
 * Provides encryption and decryption for device tokens at rest.
 * Uses AES-256-GCM encryption for secure token storage.
 * 
 * Requirements: 15.6
 * 
 * Note: In production, the encryption key should be stored securely
 * (e.g., in environment variables, AWS Secrets Manager, or similar).
 * This implementation uses a placeholder that should be replaced.
 */

import CryptoJS from 'crypto-js';

/**
 * Encryption configuration
 */
const ENCRYPTION_CONFIG = {
  // In production, this should come from secure environment variables
  // DO NOT hardcode encryption keys in production code
  ENCRYPTION_KEY: process.env.DEVICE_TOKEN_ENCRYPTION_KEY || 'REPLACE_WITH_SECURE_KEY_IN_PRODUCTION',
  
  // Algorithm: AES-256-GCM (via CryptoJS)
  ALGORITHM: 'AES',
};

export class TokenEncryption {
  /**
   * Encrypt a device token
   * 
   * @param token - Plain text device token
   * @returns Encrypted token (base64 encoded)
   */
  static encrypt(token: string): string {
    if (!token) {
      throw new Error('Token is required for encryption');
    }

    try {
      // Encrypt using AES
      const encrypted = CryptoJS.AES.encrypt(
        token,
        ENCRYPTION_CONFIG.ENCRYPTION_KEY
      );

      // Return as base64 string
      return encrypted.toString();
    } catch (error) {
      console.error('Error encrypting token:', error);
      throw new Error('Failed to encrypt device token');
    }
  }

  /**
   * Decrypt a device token
   * 
   * @param encryptedToken - Encrypted token (base64 encoded)
   * @returns Decrypted plain text token
   */
  static decrypt(encryptedToken: string): string {
    if (!encryptedToken) {
      throw new Error('Encrypted token is required for decryption');
    }

    try {
      // Decrypt using AES
      const decrypted = CryptoJS.AES.decrypt(
        encryptedToken,
        ENCRYPTION_CONFIG.ENCRYPTION_KEY
      );

      // Convert to UTF-8 string
      const plainText = decrypted.toString(CryptoJS.enc.Utf8);

      if (!plainText) {
        throw new Error('Decryption resulted in empty string');
      }

      return plainText;
    } catch (error) {
      console.error('Error decrypting token:', error);
      throw new Error('Failed to decrypt device token');
    }
  }

  /**
   * Hash a token for comparison purposes
   * Useful for checking if a token exists without decrypting all tokens
   * 
   * @param token - Plain text token
   * @returns SHA-256 hash of the token
   */
  static hash(token: string): string {
    if (!token) {
      throw new Error('Token is required for hashing');
    }

    try {
      const hash = CryptoJS.SHA256(token);
      return hash.toString(CryptoJS.enc.Hex);
    } catch (error) {
      console.error('Error hashing token:', error);
      throw new Error('Failed to hash device token');
    }
  }

  /**
   * Verify that encryption is properly configured
   * Should be called on app startup
   * 
   * @returns True if encryption is properly configured
   */
  static verifyConfiguration(): boolean {
    // Check if encryption key is set
    if (!ENCRYPTION_CONFIG.ENCRYPTION_KEY || 
        ENCRYPTION_CONFIG.ENCRYPTION_KEY === 'REPLACE_WITH_SECURE_KEY_IN_PRODUCTION') {
      console.warn('⚠️ WARNING: Device token encryption key is not properly configured!');
      console.warn('⚠️ Set DEVICE_TOKEN_ENCRYPTION_KEY environment variable in production');
      return false;
    }

    // Test encryption/decryption
    try {
      const testToken = 'test_token_12345';
      const encrypted = this.encrypt(testToken);
      const decrypted = this.decrypt(encrypted);

      if (decrypted !== testToken) {
        console.error('❌ Encryption verification failed: decrypted value does not match original');
        return false;
      }

      console.log('✅ Token encryption configured correctly');
      return true;
    } catch (error) {
      console.error('❌ Encryption verification failed:', error);
      return false;
    }
  }
}
