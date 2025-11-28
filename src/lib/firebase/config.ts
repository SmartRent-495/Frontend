/**
 * Firebase Configuration for SmartRent Frontend
 * 
 * This file initializes Firebase client SDK for authentication
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator, FirebaseStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// Get these from Firebase Console > Project Settings > Your Apps > Web App
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ''
};

// Validate required Firebase config
const requiredConfigKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missingKeys = requiredConfigKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);

if (missingKeys.length > 0) {
  console.error('❌ Missing Firebase config keys:', missingKeys);
  console.error('Please check your .env.local file');
}

// Debug: Log Firebase config (remove in production)
if (process.env.NODE_ENV === 'development') {
  console.log('🔥 Firebase Config:', {
    apiKey: firebaseConfig.apiKey ? '✓ Set' : '✗ Missing',
    authDomain: firebaseConfig.authDomain || '✗ Missing',
    projectId: firebaseConfig.projectId || '✗ Missing',
    appId: firebaseConfig.appId ? '✓ Set' : '✗ Missing',
    storageBucket: firebaseConfig.storageBucket || '✗ Missing'
  });
}

// Initialize Firebase (only once)
let app: FirebaseApp;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase App initialized');
} else {
  app = getApps()[0];
  console.log('ℹ️ Firebase App already initialized');
}

// Initialize Firebase Authentication
export const auth: Auth = getAuth(app);

// Initialize Firestore and Storage (optional - may not be enabled)
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

try {
  dbInstance = getFirestore(app);
  storageInstance = getStorage(app);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Firestore and Storage initialized');
  }
} catch (error) {
  if (process.env.NODE_ENV === 'development') {
    console.log('ℹ️ Firestore/Storage not enabled - using Firebase Auth only');
  }
}

export const db = dbInstance;
export const storage = storageInstance;

// Connect to emulators in development (optional)
// Only connect if explicitly enabled via environment variable
if (
  typeof window !== 'undefined' && 
  process.env.NODE_ENV === 'development' && 
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true'
) {
  try {
    // Check if already connected to avoid reconnection errors
    // @ts-ignore - checking internal property
    if (!auth._canInitEmulator) {
      console.log('ℹ️ Auth emulator already connected');
    } else {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      console.log('🔥 Connected to Auth Emulator');
    }
    
    if (dbInstance) {
      // @ts-ignore - checking internal property
      if (dbInstance._settings?.host !== 'localhost:8080') {
        connectFirestoreEmulator(dbInstance, 'localhost', 8080);
        console.log('🔥 Connected to Firestore Emulator');
      }
    }
    
    if (storageInstance) {
      connectStorageEmulator(storageInstance, 'localhost', 9199);
      console.log('🔥 Connected to Storage Emulator');
    }
  } catch (error) {
    console.log('ℹ️ Emulator connection skipped (may already be connected)');
  }
}

export default app;