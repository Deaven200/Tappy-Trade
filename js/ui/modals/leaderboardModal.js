/**
 * Leaderboard Modal UI
 * Displays 24-hour money leaderboard
 */

import { $ } from '../../utils/dom.js';
import { subscribeLeaderboard, getDailyEarned, getUTCDayId } from '../../firebase/leaderboard.js';

let unsubscribe = null;

/**
 * Show Leaderboard Modal
 */
export function showLeaderboard() {
    const modal = $('leaderboard-modal');
    if (!modal) return;

    // Build Modal Structure if empty
    if (!modal.innerHTML.trim()) {
        modal.innerHTML = `
            <div class="modal-content" style="max-width:500px">
                <div class="modal-header">
                    <h2>🏆 Daily Money Maker</h2>
                    <button class="close-btn" onclick="closeLeaderboard()">×</button>
                </div>
                <div class="modal-body">
                    <p style="text-align:center;color:var(--muted);margin-bottom:15px">
                        Top earners for <b id="lb-date">Today</b> (UTC).<br>
                        Resets every 24 hours!
                    </p>
                    
                    <div class="lb-my-score" style="background:var(--bg2);padding:10px;border-radius:8px;margin-bottom:15px;display:flex;justify-content:space-between;align-items:center;border:1px solid var(--accent)">
                        <span>Your Daily Earnings:</span>
                        <span style="font-size:1.2rem;font-weight:bold;color:var(--gold)">$0</span>
                    </div>

                    <div id="lb-list" style="min-height:200px">
                        <div style="text-align:center;padding:20px">Loading...</div>
                    </div>
                </div>
            </div>
        `;
    }

    // Update Your Score
    const myScoreEl = modal.querySelector('.lb-my-score span:last-child');
    if (myScoreEl) {
        myScoreEl.textContent = '$' + (getDailyEarned() || 0).toLocaleString();
    }

    // Update Date
    const dateEl = modal.querySelector('#lb-date');
    if (dateEl) dateEl.textContent = getUTCDayId();

    // Subscribe to updates
    if (unsubscribe) unsubscribe();
    unsubscribe = subscribeLeaderboard((data) => {
        renderLeaderboardList(data);
    });

    modal.classList.add('show');
}

/**
 * Close Leaderboard Modal
 */
export function closeLeaderboard() {
    const modal = $('leaderboard-modal');
    if (modal) {
        modal.classList.remove('show');
    }
    if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
    }
}

/**
 * Render the list of scores
 */
function renderLeaderboardList(data) {
    const list = document.getElementById('lb-list');
    if (!list) return;

    if (data.length === 0) {
        list.innerHTML = `<div style="text-align:center;color:var(--muted);padding:20px">No scores yet today. Be the first!</div>`;
        return;
    }

    let html = '<table style="width:100%;border-collapse:collapse">';
    html += `<tr style="color:var(--muted);text-align:left"><th style="padding:5px">#</th><th style="padding:5px">Player</th><th style="padding:5px;text-align:right">Earned</th></tr>`;

    data.forEach((entry, index) => {
        const rank = index + 1;
        const isMe = entry.id === window.userId;
        const rowStyle = isMe ? 'background:rgba(255,215,0,0.1);font-weight:bold' : '';
        const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;

        html += `
            <tr style="border-bottom:1px solid var(--bg1);${rowStyle}">
                <td style="padding:8px">${rankIcon}</td>
                <td style="padding:8px">
                    <div style="font-size:0.9rem">${entry.username}</div>
                    <div style="font-size:0.75rem;color:var(--muted)">${entry.farmName}</div>
                </td>
                <td style="padding:8px;text-align:right;color:var(--gold)">
                    $${entry.money.toLocaleString()}
                </td>
            </tr>
        `;
    });
    html += '</table>';

    list.innerHTML = html;
}

// Global exposure
window.showLeaderboard = showLeaderboard;
window.closeLeaderboard = closeLeaderboard;
