import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
  // Rimuoviamo databaseURL visto che non usiamo Realtime Database
};

// Initialize Firebase (prevent duplicate initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize services (prevent duplicate initialization)
let db, auth;

try {
  db = getFirestore(app);
  auth = getAuth(app);
} catch (error) {
  console.warn('Firebase services already initialized:', error.message);
}

// Track if emulators are already connected
let emulatorsConnected = false;

// Connect to emulators in development (only once)
if (import.meta.env.DEV && !emulatorsConnected && import.meta.env.VITE_USE_EMULATORS === 'true') {
  try {
    if (db && !db._delegate._terminated) {
      connectFirestoreEmulator(db, 'localhost', 8080);
    }
    if (auth) {
      connectAuthEmulator(auth, 'http://localhost:9099');
    }
    emulatorsConnected = true;
    console.log('Firebase emulators connected');
  } catch (error) {
    console.log('Emulators already connected or not available:', error.message);
    emulatorsConnected = true; // Mark as connected to prevent retry
  }
}

export { db, auth };

export default app;