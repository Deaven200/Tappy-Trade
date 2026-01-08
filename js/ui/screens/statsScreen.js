/**
 * Stats Screen Renderer
 * Handles statistics and game progress display
 */

import { S } from '../../core/state.js';

/**
 * Render the stats screen
 * @param {HTMLElement} container - Container element to render into
 */
export function renderStatsScreen(container) {
    let h = `<div class="panel">
        <h3>📊 Statistics</h3>
        <div class="list">
            ${renderStat('💰 Money Earned', `$${(S.stats?.earned || 0).toLocaleString()}`)}
            ${renderStat('🌾 Resources Harvested', (S.stats?.harvested || 0).toLocaleString())}
            ${renderStat('🛒 Items Sold', (S.stats?.sold || 0).toLocaleString())}
            ${renderStat('🏗️ Buildings Built', (S.stats?.built || 0).toLocaleString())}
            ${renderStat('📦 Current Inventory', window.getInvTotal() + '/' + S.cap)}
            ${renderStat('🏞️ Plots Owned', S.plots.length)}
            ${renderStat('👷 Workers Hired', S.workers.length)}
            ${renderStat('⏱️ Days Played', Math.floor((S.stats?.playTime || 0) / 86400))}
        </div>
    </div>`;

    // Achievements Section
    h += `<div class="panel">
        <h3>🏆 Achievements (${window.getUnlockedCount ? window.getUnlockedCount() : 0}/${window.ACH ? window.ACH.length : 0})</h3>
        <div class="list">`;

    if (window.ACH && window.ACH.length > 0) {
        window.ACH.forEach(ach => {
            const unlocked = S.ach && S.ach[ach.id];
            const progress = window.getAchievementProgress ? window.getAchievementProgress(ach) : 0;
            const progressPct = Math.floor(progress * 100);

            h += `<div class="item" style="opacity:${unlocked ? '1' : '0.6'}">
                <span class="ic" style="font-size:1.5rem">${unlocked ? '✅' : '🔒'}</span>
                <div style="flex:1;min-width:0">
                    <div class="nm">${ach.n}</div>
                    <div style="font-size:0.7rem;color:var(--muted);margin-bottom:4px">${ach.d}</div>
                    ${!unlocked ? `<div style="background:var(--bg);border-radius:4px;height:8px;overflow:hidden">
                        <div style="width:${progressPct}%;height:100%;background:var(--gold);transition:width 0.3s"></div>
                    </div>
                    <div style="font-size:0.65rem;color:var(--muted);margin-top:2px">${progressPct}% - ${ach.req.toLocaleString()} required</div>` :
                    `<div style="font-size:0.7rem;color:var(--green)">Unlocked!</div>`}
                </div>
            </div>`;
        });
    } else {
        h += `<div class="empty">No achievements configured</div>`;
    }

    h += `</div></div>`;

    container.innerHTML = h;
}

/**
 * Render a single stat row
 * @param {string} label - Stat label
 * @param {string} value - Stat value
 * @returns {string} HTML string
 */
function renderStat(label, value) {
    return `<div class="item" style="padding:12px">
        <span class="nm">${label}</span>
        <span class="qt" style="color:var(--gold);font-weight:700">${value}</span>
    </div>`;
}
