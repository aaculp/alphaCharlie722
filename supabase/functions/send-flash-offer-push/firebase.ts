/**
 * Firebase Admin SDK Initialization Module
 * 
 * This module handles the initialization of Firebase Admin SDK for sending
 * push notifications via Firebase Cloud Messaging (FCM).
 * 
 * Requirements:
 * - 2.1: Initialize Firebase_Admin_SDK with service account credentials
 * - 3.1: Store Firebase service account JSON in Supabase secrets
 * - 3.3: Load credentials from environment variables
 */

import { initializeApp, cert, App, ServiceAccount } from 'npm:firebase-admin@^12.0.0/app';
import { getMessaging, Messaging } from 'npm:firebase-admin@^12.0.0/messaging';

let firebaseApp: App | null = null;
let messagingInstance: Messaging | null = null;

/**
 * Parse Firebase service account credentials from environment variable
 * The credentials are stored as a JSON string in FIREBASE_SERVICE_ACCOUNT
 */
function parseServiceAccountCredentials(): ServiceAccount {
  const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
  
  if (!serviceAccountJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set');
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    
    // Validate required fields
    const requiredFields = ['project_id', 'private_key', 'client_email'];
    const missingFields = requiredFields.filter(field => !serviceAccount[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Service account missing required fields: ${missingFields.join(', ')}`);
    }
    
    return serviceAccount as ServiceAccount;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT is not valid JSON');
    }
    throw error;
  }
}

/**
 * Initialize Firebase Admin SDK
 * 
 * This function loads service account credentials from environment variables
 * and initializes the Firebase Admin SDK. It handles initialization errors
 * gracefully and ensures the SDK is only initialized once.
 * 
 * @returns Initialized Firebase App instance
 * @throws Error if initialization fails
 */
export function initializeFirebase(): App {
  // Return existing instance if already initialized
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    // Load and parse service account credentials
    const serviceAccount = parseServiceAccountCredentials();
    
    // Initialize Firebase Admin SDK
    firebaseApp = initializeApp({
      credential: cert(serviceAccount),
    });
    
    console.log('Firebase Admin SDK initialized successfully');
    return firebaseApp;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('FIREBASE_SERVICE_ACCOUNT')) {
        throw new Error('Firebase initialization failed: Missing or invalid service account credentials');
      }
      throw new Error(`Firebase initialization failed: ${error.message}`);
    }
    
    throw new Error('Firebase initialization failed: Unknown error');
  }
}

/**
 * Get Firebase Messaging instance
 * 
 * Returns the Firebase Messaging instance for sending push notifications.
 * Initializes Firebase if not already initialized.
 * 
 * @returns Firebase Messaging instance
 * @throws Error if Firebase initialization fails
 */
export function getFirebaseMessaging(): Messaging {
  // Return existing instance if available
  if (messagingInstance) {
    return messagingInstance;
  }

  try {
    // Initialize Firebase if needed
    const app = firebaseApp || initializeFirebase();
    
    // Get messaging instance
    messagingInstance = getMessaging(app);
    
    return messagingInstance;
  } catch (error) {
    console.error('Failed to get Firebase Messaging instance:', error);
    throw error;
  }
}

/**
 * Reset Firebase instances (for testing purposes)
 * This should only be used in test environments
 */
export function resetFirebaseInstances(): void {
  firebaseApp = null;
  messagingInstance = null;
}
