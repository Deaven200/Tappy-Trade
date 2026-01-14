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

    // Build Modal Structure using consistent modal-box design
    if (!modal.innerHTML.trim() || !modal.querySelector('#lb-list')) {
        modal.innerHTML = `
            <div class="modal-box" style="max-width:420px">
                <div class="modal-head">
                    <h3>🏆 Daily Leaderboard</h3>
                    <button class="modal-close" onclick="closeLeaderboard()">×</button>
                </div>
                <div class="modal-body">
                    <p style="text-align:center;color:var(--muted);margin-bottom:12px;font-size:0.85rem">
                        Top earners for <b id="lb-date">Today</b> (UTC)<br>
                        <span style="font-size:0.75rem">Resets every 24 hours!</span>
                    </p>
                    
                    <div style="background:linear-gradient(135deg, var(--bg2), var(--card));padding:12px;border-radius:10px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;border:1px solid var(--purple)">
                        <span style="font-size:0.9rem">📊 Your Daily Earnings:</span>
                        <span id="lb-my-score" style="font-size:1.3rem;font-weight:bold;color:var(--gold)">$0</span>
                    </div>

                    <div id="lb-list" style="min-height:180px;max-height:50vh;overflow-y:auto">
                        <div style="text-align:center;padding:20px;color:var(--muted)">Loading...</div>
                    </div>
                </div>
            </div>
        `;
    }

    // Update Your Score
    const myScoreEl = modal.querySelector('#lb-my-score');
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
 * Render the list of scores with improved styling
 */
function renderLeaderboardList(data) {
    const list = document.getElementById('lb-list');
    if (!list) return;

    if (data.length === 0) {
        if (!window.db) {
            list.innerHTML = `<div style="text-align:center;color:var(--red);padding:20px">⚠️ Database not connected.<br><span style="font-size:0.8em;color:var(--muted)">Check your internet connection.</span></div>`;
        } else {
            list.innerHTML = `<div style="text-align:center;color:var(--muted);padding:20px">No scores yet today.<br>Be the first to earn! 🚀</div>`;
        }
        return;
    }

    let html = '<div class="list" style="gap:8px">';

    data.forEach((entry, index) => {
        const rank = index + 1;
        const isMe = entry.id === (window.loggedInUser ? window.loggedInUser.id : null);
        const bgStyle = isMe ? 'background:linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,215,0,0.05));border:1px solid var(--gold)' : 'background:var(--bg2)';

        let rankDisplay = '';
        if (rank === 1) rankDisplay = '<span style="font-size:1.5rem">🥇</span>';
        else if (rank === 2) rankDisplay = '<span style="font-size:1.4rem">🥈</span>';
        else if (rank === 3) rankDisplay = '<span style="font-size:1.3rem">🥉</span>';
        else rankDisplay = `<span style="color:var(--muted);font-weight:bold;font-size:1rem">#${rank}</span>`;

        html += `
            <div class="item" style="${bgStyle};padding:10px 12px;border-radius:8px;display:flex;align-items:center;gap:12px">
                <div style="width:40px;text-align:center">${rankDisplay}</div>
                <div style="flex:1;min-width:0">
                    <div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${entry.username}</div>
                    <div style="font-size:0.75rem;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${entry.farmName || 'Unnamed Farm'}</div>
                </div>
                <div style="font-weight:bold;color:var(--gold);font-size:1.1rem">
                    $${entry.money.toLocaleString()}
                </div>
            </div>
        `;
    });
    html += '</div>';

    list.innerHTML = html;
}


// Global exposure
window.showLeaderboard = showLeaderboard;
window.closeLeaderboard = closeLeaderboard;
