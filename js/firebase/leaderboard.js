/**
 * Leaderboard & Daily Earnings Module
 * Handles 24-hour money leaderboard logic
 */

import { S } from '../core/state.js';
import { save } from '../core/storage.js';
import { toast } from '../utils/feedback.js';

/**
 * Get current UTC date string (YYYY-MM-DD)
 */
export function getUTCDayId() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Get amount earned today
 */
export function getDailyEarned() {
    const currentEarned = S.stats?.earned || 0;
    const startEarned = S.startOfDayEarned || 0;

    // Safety check: if stats.earned is LESS than start (shouldn't happen unless reset), return 0 or current
    if (currentEarned < startEarned) return currentEarned;

    return currentEarned - startEarned;
}

/**
 * Check if the day has changed and reset if needed
 * Should be called periodically (e.g., on save)
 */
export function checkDailyReset() {
    const today = getUTCDayId();

    if (S.dayId !== today) {
        console.log('📅 New Day! Resetting daily leaderboard tracker.');

        // Reset Logic
        S.dayId = today;
        S.startOfDayEarned = S.stats?.earned || 0;

        // Save immediately to persist the reset
        save();

        toast('Daily Leaderboard Reset! Good luck!', 'info');

        // Refresh UI if necessary
        if (window.render) window.render();
    }
}

/**
 * Submit score to Firebase Leaderboard
 * Throttled to avoid excessive writes
 */
let lastSubmit = 0;
const SUBMIT_INTERVAL = 60000; // 1 minute

export async function submitScore() {
    if (!window.db || !window.userId || !S.stats) return;

    const now = Date.now();
    if (now - lastSubmit < SUBMIT_INTERVAL) return;

    const earnedToday = getDailyEarned();
    if (earnedToday <= 0) return; // Don't spam 0 scores

    const today = getUTCDayId();

    try {
        await window.db.collection('leaderboards').doc(today)
            .collection('scores').doc(window.userId).set({
                username: window.loggedInUser?.username || S.farmName || 'Guest',
                farmName: S.farmName || 'Farm',
                money: earnedToday,
                lastUpdate: firebase.firestore.FieldValue.serverTimestamp(),
                tier: window.currentTier || 0 // Optional: show progress
            }, { merge: true });

        lastSubmit = now;
        // console.log('🏆 Score submitted:', earnedToday);
    } catch (e) {
        console.error('Leaderboard submit failed:', e);
    }
}

/**
 * Subscribe to top 10 leaderboard for ANY day (defaults to today)
 * @param {Function} callback 
 * @param {string} [dateId] - Optional specific date
 * @returns {Function} unsubscribe function
 */
export function subscribeLeaderboard(callback, dateId = null) {
    if (!window.db) {
        console.warn('⚠️ Leaderboard: window.db not found');
        callback([]); // Return empty list so UI doesn't hang
        return () => { };
    }

    const day = dateId || getUTCDayId();

    return window.db.collection('leaderboards').doc(day)
        .collection('scores')
        .orderBy('money', 'desc')
        .limit(10)
        .onSnapshot(snapshot => {
            const data = [];
            snapshot.forEach(doc => {
                data.push({ id: doc.id, ...doc.data() });
            });
            callback(data);
        }, err => {
            console.error('Leaderboard sub error:', err);
        });
}

// Global exposure for testing
if (typeof window !== 'undefined') {
    window.Leaderboard = {
        getUTCDayId,
        getDailyEarned,
        checkDailyReset,
        submitScore
    };
}
