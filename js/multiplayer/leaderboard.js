/**
 * Leaderboard Module
 * Shows top players ranked by money
 */

import { $ } from '../utils/dom.js';

/**
 * Show leaderboard modal and load top players
 */
export async function showLeaderboard() {
    const modal = $('leaderboard-modal');
    const body = $('leaderboard-body');

    // Close menu if open
    const menuModal = $('menu-modal');
    if (menuModal) menuModal.classList.remove('show');

    if (!modal || !body) return;

    modal.classList.add('show');
    body.innerHTML = '<div class="empty">Loading leaderboard...</div>';

    const db = window.db;

    if (!db) {
        body.innerHTML = '<div class="empty">⚠️ Connect to play online to view leaderboard</div>';
        return;
    }

    try {
        // Fetch top 20 players by money from cloud saves
        const snap = await db.collection('saves')
            .orderBy('money', 'desc')
            .limit(20)
            .get();

        if (snap.empty) {
            body.innerHTML = '<div class="empty">No players yet. Be the first!</div>';
            return;
        }

        let h = '<div class="list">';
        snap.docs.forEach((doc, i) => {
            const data = doc.data();
            const username = data.username || 'Anonymous';
            const money = data.money || 0;
            const rank = i + 1;

            let medal = '';
            if (rank === 1) medal = '🥇';
            else if (rank === 2) medal = '🥈';
            else if (rank === 3) medal = '🥉';
            else medal = `#${rank}`;

            h += `<div class="item">
                <span class="ic">${medal}</span>
                <span class="nm">${username}</span>
                <span class="pr" style="color:var(--gold)">$${money.toLocaleString()}</span>
            </div>`;
        });
        h += '</div>';

        body.innerHTML = h;
    } catch (e) {
        console.error('Leaderboard error:', e);
        body.innerHTML = '<div class="empty">⚠️ Failed to load leaderboard</div>';
    }
}

/**
 * Close leaderboard modal
 */
export function closeLeaderboard() {
    const modal = $('leaderboard-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}
