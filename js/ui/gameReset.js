/**
 * Game Reset Module
 * Handles complete game reset with cloud save deletion
 */

import { S, getDefaultState } from '../core/state.js';
import { toast } from '../utils/feedback.js';

/**
 * Reset the entire game (local and cloud save)
 */
export function resetGame() {
    if (!confirm('Are you sure you want to reset ALL progress? This cannot be undone!')) {
        return;
    }

    // Prevent beforeunload from saving over our reset
    window.isResetting = true;

    // Stop loop to prevent auto-saves or updates
    if (window.stopGameLoop) window.stopGameLoop();

    // Clear local storage
    localStorage.removeItem('tt4');

    // Reset in-memory state immediately
    const newState = getDefaultState();
    // Preserve some settings if desired, or wipe clean. Wiping clean is safer for hard reset.
    Object.keys(S).forEach(key => delete S[key]);
    Object.assign(S, newState);

    // Clear cloud save if logged in
    const loggedInUser = window.loggedInUser;
    const db = window.db;

    if (loggedInUser && db) {
        db.collection('saves').doc(loggedInUser.id).delete()
            .then(() => {
                toast('Game reset!', 'ok');
                setTimeout(() => location.reload(), 500);
            })
            .catch(e => {
                console.log('Cloud delete failed:', e);
                location.reload();
            });
    } else {
        toast('Game reset!', 'ok');
        setTimeout(() => location.reload(), 500);
    }
}
