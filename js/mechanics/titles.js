/**
 * Title and Badge System
 * Allows players to earn and display titles based on achievements and milestones
 */

import { S } from '../core/state.js';
import { toast, playS } from '../utils/feedback.js';
import { save } from '../core/storage.js';

/**
 * Available titles organized by category
 */
export const TITLES = {
    // Achievement-based titles
    achievement: {
        h100: { name: 'Novice Harvester', icon: '🌱', requirement: 'Harvest 100 items' },
        h1000: { name: 'Expert Harvester', icon: '🌿', requirement: 'Harvest 1,000 items' },
        h5000: { name: 'Master Harvester', icon: '🌳', requirement: 'Harvest 5,000 items' },
        m1000: { name: 'Budding Trader', icon: '💵', requirement: 'Earn $1,000' },
        m10000: { name: 'Wealthy Merchant', icon: '💰', requirement: 'Earn $10,000' },
        m50000: { name: 'Trade Tycoon', icon: '💎', requirement: 'Earn $50,000' },
        p2: { name: 'Landowner', icon: '🏡', requirement: 'Own 2 plots' },
        p4: { name: 'Estate Owner', icon: '🏰', requirement: 'Own 4 plots' },
        b1: { name: 'Builder', icon: '🔨', requirement: 'Build 1 building' },
        b5: { name: 'Architect', icon: '🏗️', requirement: 'Build 5 buildings' },
        b10: { name: 'Developer', icon: '🌆', requirement: 'Build 10 buildings' },
        w1: { name: 'Employer', icon: '👔', requirement: 'Hire 1 worker' },
        w5: { name: 'Manager', icon: '📋', requirement: 'Hire 5 workers' },
        w10: { name: 'CEO', icon: '👑', requirement: 'Hire 10 workers' },
    },

    // Government tier titles
    government: {
        tier5: { name: 'Government Partner', icon: '🏛️', requirement: 'Reach Tier 5 in any category' },
        tier10: { name: 'Trade Ambassador', icon: '🎖️', requirement: 'Reach Tier 10 in any category' },
        tier15: { name: 'Economic Elite', icon: '⭐', requirement: 'Reach Tier 15 in any category' },
        tier20: { name: 'Transcendent Trader', icon: '✨', requirement: 'Reach max tier in any category' },
    },

    // Special titles
    special: {
        streaker: { name: 'Dedicated Player', icon: '🔥', requirement: '7-day login streak' },
        referrer: { name: 'Friend Bringer', icon: '🤝', requirement: 'Refer 5 friends' },
        whale: { name: 'Whale', icon: '🐋', requirement: 'Earn $1,000,000 total' },
        oldtimer: { name: 'Veteran', icon: '🎖️', requirement: 'Play for 30 days' },
    }
};

/**
 * Get list of unlocked titles for the current player
 */
export function getUnlockedTitles() {
    const unlocked = [];

    // Check achievement titles
    const ach = S.ach || {};
    for (const [achId, titleData] of Object.entries(TITLES.achievement)) {
        if (ach[achId]) {
            unlocked.push({ id: achId, category: 'achievement', ...titleData });
        }
    }

    // Check government tier titles
    const gov = S.governmentTiers || {};
    const maxTier = Math.max(
        ...Object.values(gov).map(g => g?.currentTier || 0)
    );

    if (maxTier >= 5) unlocked.push({ id: 'tier5', category: 'government', ...TITLES.government.tier5 });
    if (maxTier >= 10) unlocked.push({ id: 'tier10', category: 'government', ...TITLES.government.tier10 });
    if (maxTier >= 15) unlocked.push({ id: 'tier15', category: 'government', ...TITLES.government.tier15 });
    if (maxTier >= 19) unlocked.push({ id: 'tier20', category: 'government', ...TITLES.government.tier20 });

    // Check special titles
    if ((S.dailyStreak || 0) >= 7) {
        unlocked.push({ id: 'streaker', category: 'special', ...TITLES.special.streaker });
    }

    if ((S.referralRewards?.successfulReferrals || 0) >= 5) {
        unlocked.push({ id: 'referrer', category: 'special', ...TITLES.special.referrer });
    }

    if ((S.stats?.earned || 0) >= 1000000) {
        unlocked.push({ id: 'whale', category: 'special', ...TITLES.special.whale });
    }

    return unlocked;
}

/**
 * Get the currently selected title
 */
export function getSelectedTitle() {
    const selectedId = S.selectedTitle;
    if (!selectedId) return null;

    const unlocked = getUnlockedTitles();
    return unlocked.find(t => t.id === selectedId) || null;
}

/**
 * Set the selected title
 */
export function setSelectedTitle(titleId) {
    const unlocked = getUnlockedTitles();
    const title = unlocked.find(t => t.id === titleId);

    if (!title) {
        toast('You haven\'t unlocked this title!', 'err');
        return false;
    }

    S.selectedTitle = titleId;
    save();
    toast(`Title set: ${title.icon} ${title.name}`, 'ok');
    playS('ach');
    return true;
}

/**
 * Clear the selected title
 */
export function clearSelectedTitle() {
    S.selectedTitle = null;
    save();
    toast('Title cleared', 'ok');
}

/**
 * Get formatted title display for chat/profile
 */
export function getTitleDisplay() {
    const title = getSelectedTitle();
    if (!title) return '';
    return `${title.icon} ${title.name}`;
}

/**
 * Show title selection modal
 */
export function showTitleModal() {
    window.closeMenu?.();

    const existingModal = document.getElementById('title-modal');
    if (existingModal) existingModal.remove();

    const unlocked = getUnlockedTitles();
    const selected = S.selectedTitle;

    let html = `
        <div class="modal-box" style="max-height:80vh;overflow-y:auto">
            <div class="modal-head">
                <h3>🏷️ Titles & Badges</h3>
                <button class="modal-close" onclick="closeTitleModal()">×</button>
            </div>
            <div class="modal-body">
                <p style="color:var(--muted);font-size:0.8rem;margin-bottom:12px">
                    Select a title to display next to your name in chat.
                </p>`;

    if (unlocked.length === 0) {
        html += `<div class="empty" style="padding:20px;text-align:center">
            <div style="font-size:2rem;opacity:0.5;margin-bottom:8px">🔒</div>
            <div style="color:var(--muted)">No titles unlocked yet!</div>
            <div style="color:var(--muted);font-size:0.8rem;margin-top:4px">Complete achievements to earn titles.</div>
        </div>`;
    } else {
        // Clear title option
        html += `<button class="btn ${!selected ? 'gold' : ''}" onclick="clearSelectedTitle();closeTitleModal();" 
                         style="width:100%;margin-bottom:12px;text-align:left;padding:10px">
            ❌ No Title
        </button>`;

        html += `<div style="display:flex;flex-direction:column;gap:8px">`;

        for (const title of unlocked) {
            const isSelected = selected === title.id;
            html += `
                <button class="btn ${isSelected ? 'gold' : ''}" 
                        onclick="setSelectedTitle('${title.id}');closeTitleModal();"
                        style="text-align:left;padding:10px;display:flex;justify-content:space-between;align-items:center">
                    <span>
                        <span style="font-size:1.2rem;margin-right:8px">${title.icon}</span>
                        ${title.name}
                    </span>
                    ${isSelected ? '<span style="color:var(--gold)">✓</span>' : ''}
                </button>`;
        }

        html += `</div>`;
    }

    // Show locked titles
    html += `
        <div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.1)">
            <h4 style="font-size:0.9rem;margin-bottom:12px;color:var(--muted)">🔒 Locked Titles</h4>
            <div style="display:flex;flex-direction:column;gap:4px;font-size:0.8rem">`;

    const unlockedIds = unlocked.map(t => t.id);
    for (const [_, titles] of Object.entries(TITLES)) {
        for (const [id, title] of Object.entries(titles)) {
            if (!unlockedIds.includes(id)) {
                html += `<div style="color:var(--muted);opacity:0.6">
                    ${title.icon} ${title.name} - ${title.requirement}
                </div>`;
            }
        }
    }

    html += `</div></div></div></div>`;

    const modal = document.createElement('div');
    modal.id = 'title-modal';
    modal.className = 'modal show';
    modal.innerHTML = html;

    document.body.appendChild(modal);
}

/**
 * Close title modal
 */
export function closeTitleModal() {
    const modal = document.getElementById('title-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

// Global exports
window.getUnlockedTitles = getUnlockedTitles;
window.getSelectedTitle = getSelectedTitle;
window.setSelectedTitle = setSelectedTitle;
window.clearSelectedTitle = clearSelectedTitle;
window.getTitleDisplay = getTitleDisplay;
window.showTitleModal = showTitleModal;
window.closeTitleModal = closeTitleModal;
