/**
 * Firebase Configuration
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to https://console.firebase.google.com
 * 2. Create a new project (or use existing)
 * 3. Enable Authentication > Anonymous Sign-in
 * 4. Enable Firestore Database
 * 5. Copy your config values below
 */

// TODO: Replace with your Firebase config
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Firebase will be initialized when config is added
let app = null;
let db = null;
let auth = null;

/**
 * Check if Firebase is configured
 */
export function isFirebaseConfigured() {
    return firebaseConfig.apiKey !== "YOUR_API_KEY";
}

/**
 * Initialize Firebase (call once on app start)
 */
export async function initFirebase() {
    if (!isFirebaseConfigured()) {
        console.warn('Firebase not configured. Player Market disabled.');
        return false;
    }

    try {
        // Dynamic import to avoid loading Firebase if not configured
        const { initializeApp } = await import('firebase/app');
        const { getFirestore } = await import('firebase/firestore');
        const { getAuth } = await import('firebase/auth');

        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);

        console.log('✅ Firebase initialized');
        return true;
    } catch (error) {
        console.error('Failed to initialize Firebase:', error);
        return false;
    }
}

/**
 * Get Firestore instance
 */
export function getDb() {
    return db;
}

/**
 * Get Auth instance
 */
export function getAuthInstance() {
    return auth;
}
