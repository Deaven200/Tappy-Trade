/**
 * Government Development UI
 * Shows player's tier progress for all categories
 */

import { GOVERNMENT_CATEGORIES, GOVERNMENT_TIERS } from '../config/governmentTiers.js';
import { getAllPlayerTiers } from '../mechanics/governmentTiers.js';
import { $ } from '../utils/dom.js';

/**
 * Show government development modal
 */
export function showGovernmentDev() {
    const modal = $('gov-dev-modal');
    if (modal) {
        modal.classList.add('show');
        renderGovernmentDev();
    }

    // Close menu if open
    const menuModal = $('menu-modal');
    if (menuModal) menuModal.classList.remove('show');
}

/**
 * Close government development modal
 */
export function closeGovernmentDev() {
    const modal = $('gov-dev-modal');
    if (modal) modal.classList.remove('show');
}

/**
 * Render government development screen
 */
function renderGovernmentDev() {
    const container = $('gov-dev-content');
    if (!container) return;

    const playerTiers = getAllPlayerTiers();
    let html = '<div style="padding:8px">';

    html += '<p style="color:var(--muted);font-size:0.85rem;margin-bottom:16px">Sell resources to the government to unlock better prices!</p>';

    // Render each category
    for (const [categoryKey, category] of Object.entries(GOVERNMENT_CATEGORIES)) {
        const tierData = playerTiers[categoryKey] || { totalSold: 0, currentTier: 0 };
        const currentTier = tierData.currentTier;
        const totalSold = tierData.totalSold;

        const currentTierData = GOVERNMENT_TIERS[currentTier];
        const nextTierData = GOVERNMENT_TIERS[currentTier + 1];

        const bonusPercent = Math.round(currentTierData.bonus * 100);

        html += `<div style="margin-bottom:20px;padding:12px;background:var(--card);border-radius:8px;border:2px solid var(--border)">`;

        // Category header
        html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">`;
        html += `<div style="font-weight:600">${category.icon} ${category.name}</div>`;
        html += `<div style="color:var(--green);font-size:0.9rem">+${bonusPercent}%</div>`;
        html += `</div>`;

        // Tier label and progress
        html += `<div style="font-size:0.8rem;color:var(--muted);margin-bottom:4px">`;
        html += `Tier ${currentTier}: ${currentTierData.label}`;
        html += `</div>`;

        // Progress bar
        if (nextTierData) {
            const progress = Math.min(100, (totalSold / nextTierData.sold) * 100);
            const remaining = nextTierData.sold - totalSold;

            html += `<div style="background:var(--bg2);border-radius:4px;height:8px;margin-bottom:6px;overflow:hidden">`;
            html += `<div style="background:var(--blue);height:100%;width:${progress}%;transition:width 0.3s"></div>`;
            html += `</div>`;

            html += `<div style="font-size:0.75rem;color:var(--muted)">`;
            html += `${totalSold.toLocaleString()} / ${nextTierData.sold.toLocaleString()} sold`;
            html += ` (${remaining.toLocaleString()} to next tier)`;
            html += `</div>`;
        } else {
            // Max tier reached
            html += `<div style="color:var(--gold);font-size:0.8rem;font-weight:600">🏆 MAX TIER REACHED!</div>`;
            html += `<div style="font-size:0.75rem;color:var(--muted)">${totalSold.toLocaleString()} total sold</div>`;
        }

        // Resources in this category
        html += `<div style="margin-top:8px;font-size:0.75rem;color:var(--muted)">`;
        html += `Resources: ${category.resources.join(', ')}`;
        html += `</div>`;

        html += `</div>`;
    }

    html += '</div>';
    container.innerHTML = html;
}
