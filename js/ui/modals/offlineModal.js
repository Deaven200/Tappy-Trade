/**
 * Offline Progress Modal
 * Displays earnings while player was away
 */

import { $ } from '../../utils/dom.js';
import { R } from '../../config/data.js';

export function showOfflineProgress(gainedItems, seconds) {
    const modalId = 'offline-modal';
    let modal = $(modalId);

    if (!modal) {
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-box">
                <div class="modal-head">
                    <h3>🌙 Welcome Back!</h3>
                    <div class="modal-close" onclick="document.getElementById('${modalId}').classList.remove('show')">×</div>
                </div>
                <div class="modal-body" id="offline-content"></div>
                <div class="modal-foot" style="padding:14px; text-align:center">
                    <button class="btn green" onclick="document.getElementById('${modalId}').classList.remove('show')">Awesome!</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    const content = modal.querySelector('#offline-content');

    // Format time
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m`;

    let html = `<p style="color:var(--muted); margin-bottom:16px">You were gone for <b>${timeStr}</b>. Here is what your workers gathered:</p>`;
    html += `<div class="list">`;

    for (const [key, qty] of Object.entries(gainedItems)) {
        const item = R[key] || { n: key, i: '📦' };
        html += `
            <div class="item">
                <div class="ic">${item.i}</div>
                <div class="nm">${item.n}</div>
                <div class="qt" style="color:var(--green)">+${qty}</div>
            </div>
        `;
    }
    html += `</div>`;

    content.innerHTML = html;
    setTimeout(() => modal.classList.add('show'), 500); // Small delay to ensure logic loads
}
