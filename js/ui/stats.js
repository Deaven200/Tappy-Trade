/**
 * Statistics Screen Module
 * Displays player stats and achievements
 */

import { S } from '../core/state.js';

/**
 * Render statistics screen
 * @param {HTMLElement} container - Container element to render into
 */
export function renderStats(container) {
    if (!container) return;

    let h = `<div class="panel"><h3>📈 Statistics</h3><div class="list">`;
    h += `<div class="item"><span class="ic">🌾</span><span class="nm">Total Harvested</span><span class="qt">${S.stats.harvested}</span></div>`;
    h += `<div class="item"><span class="ic">💰</span><span class="nm">Total Earned</span><span class="qt">$${S.stats.earned.toLocaleString()}</span></div>`;
    h += `<div class="item"><span class="ic">📦</span><span class="nm">Items Sold</span><span class="qt">${S.stats.sold}</span></div>`;
    h += `<div class="item"><span class="ic">🏗️</span><span class="nm">Buildings Built</span><span class="qt">${S.stats.built}</span></div>`;
    h += `<div class="item"><span class="ic">👷</span><span class="nm">Workers</span><span class="qt">${S.workers.length}</span></div>`;
    h += `<div class="item"><span class="ic">🏞️</span><span class="nm">Plots Owned</span><span class="qt">${S.plots.length}</span></div>`;
    h += `</div></div>`;
    container.innerHTML = h;
}
