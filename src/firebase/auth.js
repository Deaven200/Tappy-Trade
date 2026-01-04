/**
 * Firebase Authentication
 * 
 * For Tappy Trade, we use anonymous authentication so players
 * can start playing immediately without signup.
 */

import { getAuthInstance, isFirebaseConfigured } from './config.js';

let currentUser = null;

/**
 * Sign in anonymously
 * @returns {Promise<Object|null>} User object or null
 */
export async function signInAnonymously() {
    if (!isFirebaseConfigured()) {
        console.warn('Firebase not configured, using local user');
        return { uid: 'local-player', isAnonymous: true };
    }

    try {
        const auth = getAuthInstance();
        const { signInAnonymously: firebaseSignIn } = await import('firebase/auth');

        const result = await firebaseSignIn(auth);
        currentUser = result.user;

        console.log('✅ Signed in anonymously:', currentUser.uid);
        return currentUser;
    } catch (error) {
        console.error('Anonymous sign-in failed:', error);
        return null;
    }
}

/**
 * Get current user
 */
export function getCurrentUser() {
    return currentUser;
}

/**
 * Get current user ID
 */
export function getCurrentUserId() {
    return currentUser?.uid || 'local-player';
}

/**
 * Listen for auth state changes
 */
export async function onAuthStateChanged(callback) {
    if (!isFirebaseConfigured()) {
        callback({ uid: 'local-player', isAnonymous: true });
        return () => { };
    }

    try {
        const auth = getAuthInstance();
        const { onAuthStateChanged: firebaseOnAuth } = await import('firebase/auth');

        return firebaseOnAuth(auth, (user) => {
            currentUser = user;
            callback(user);
        });
    } catch (error) {
        console.error('Auth listener error:', error);
        return () => { };
    }
}
