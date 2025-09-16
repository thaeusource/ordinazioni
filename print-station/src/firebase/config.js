/**
 * Firebase Configuration per Print Station
 * Usa le stesse credenziali della React app (Client SDK)
 * SENZA autenticazione - solo regole Firestore
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Initialize Firebase (prevent duplicate initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore only
const db = getFirestore(app);

// Connect to emulators in development (only if explicitly enabled)
if (process.env.NODE_ENV === 'development' && process.env.USE_EMULATORS === 'true') {
  try {
    if (!db._delegate._terminated) {
      connectFirestoreEmulator(db, 'localhost', 8080);
      console.log('🔧 Connected to Firestore emulator');
    }
  } catch (error) {
    console.log('Emulator already connected or not available');
  }
}

export { app, db };
export default app;