/**
 * Offline Progress Modal
 * Displays items gained while the player was away
 */

import { $ } from '../../utils/dom.js';
import { R } from '../../config/resources.js';

/**
 * Show the offline progress modal
 * @param {Object} gained - Dictionary of gained items { itemId: quantity }
 * @param {number} seconds - Seconds offline
 */
export function showOfflineProgress(gained, seconds) {
    if (!gained || Object.keys(gained).length === 0) return;

    // Create modal structure if it doesn't exist
    if (!$('offline-modal')) {
        const modalHtml = `
        <div id="offline-modal" class="modal">
            <div class="modal-box">
                <div class="modal-head">
                    <h3>🌙 Welcome Back!</h3>
                    <div class="modal-close" onclick="document.getElementById('offline-modal').classList.remove('show')">×</div>
                </div>
                <div class="modal-body" id="offline-body">
                    <!-- Content injected here -->
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    const modal = $('offline-modal');
    const body = $('offline-body');

    // Format time
    let timeStr = '';
    if (seconds < 60) timeStr = `${Math.floor(seconds)}s`;
    else if (seconds < 3600) timeStr = `${Math.floor(seconds / 60)}m`;
    else timeStr = `${(seconds / 3600).toFixed(1)}h`;

    let html = `<p style="color:var(--muted);margin-bottom:12px">You were gone for <b style="color:var(--text)">${timeStr}</b>.</p>`;
    html += `<h4 style="margin-bottom:8px">Workers Collected:</h4>`;
    html += `<div class="list">`;

    let totalVal = 0;

    for (const [id, qty] of Object.entries(gained)) {
        const res = R[id];
        if (!res) continue;
        const val = qty * res.p;
        totalVal += val;

        html += `<div class="item">
            <span class="ic">${res.i}</span>
            <span class="nm">${res.n}</span>
            <span class="qt">+${qty}</span>
            <span class="pr">$${val}</span>
        </div>`;
    }

    html += `</div>`;
    html += `<div style="margin-top:16px;text-align:right;font-weight:bold;color:var(--gold)">Total Value ≈ $${totalVal.toLocaleString()}</div>`;
    html += `<button class="btn green" style="width:100%;margin-top:12px;padding:12px" onclick="document.getElementById('offline-modal').classList.remove('show')">Awesome!</button>`;

    body.innerHTML = html;

    // Show modal (small delay to ensure transition works if just appended)
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });
}
