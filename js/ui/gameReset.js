/**
 * Game Reset Module
 * Handles complete game reset with cloud save deletion
 */

import { toast } from '../utils/feedback.js';

/**
 * Reset the entire game (local and cloud save)
 */
export function resetGame() {
    if (!confirm('Are you sure you want to reset ALL progress? This cannot be undone!')) {
        return;
    }

    // Clear ALL local storage
    localStorage.clear();

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
