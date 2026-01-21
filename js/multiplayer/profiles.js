/**
 * Player Profile System
 * View player profiles with stats, achievements, and comparison
 */

import { S } from '../core/state.js';
import { R } from '../config/resources.js';
import { getUnlockedTitles, getSelectedTitle, getTitleDisplay } from '../mechanics/titles.js';

/**
 * Calculate empire value (total worth including money, inventory, buildings)
 * @param {Object} state - Game state object
 * @returns {number} Total empire value
 */
export function calculateEmpireValue(state = S) {
    let total = state.money || 0;

    // Add inventory value
    for (const [itemId, qty] of Object.entries(state.inv || {})) {
        const resource = R[itemId];
        if (resource) {
            total += resource.p * qty;
        }
    }

    // Add plot value (each plot worth 5000 base)
    total += (state.plots?.length || 1) * 5000;

    // Add building value (rough estimate)
    if (state.plots) {
        for (const plot of state.plots) {
            for (const sub of plot.subs || []) {
                if (sub.t !== 'wild') {
                    // Buildings are worth their base cost + upgrades
                    total += 1000 * (sub.lv || 1);
                }
            }
        }
    }

    // Add worker value
    total += (state.workers?.length || 0) * 500;

    return total;
}

/**
 * Get formatted stats for display
 * @param {Object} state - Game state object
 * @returns {Object} Formatted stats
 */
export function getProfileStats(state = S) {
    return {
        money: state.money || 0,
        empireValue: calculateEmpireValue(state),
        plots: state.plots?.length || 1,
        buildings: state.plots?.reduce((sum, p) =>
            sum + (p.subs?.filter(s => s.t !== 'wild').length || 0), 0) || 0,
        workers: state.workers?.length || 0,
        harvested: state.stats?.harvested || 0,
        sold: state.stats?.sold || 0,
        earned: state.stats?.earned || 0,
        achievements: Object.keys(state.ach || {}).length,
        dailyStreak: state.dailyStreak || 0,
        referrals: state.referralRewards?.successfulReferrals || 0
    };
}

/**
 * View my own profile
 */
export function showMyProfile() {
    showProfileModal(S, window.loggedInUser?.username || 'Guest', true);
}

/**
 * View a friend's profile (from Firebase)
 * @param {string} userId - User ID to view
 */
export async function viewFriendProfile(userId) {
    try {
        if (!window.db) {
            toast('Offline - cannot view profiles', 'err');
            return;
        }

        const userDoc = await window.db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            window.toast?.('User not found', 'err');
            return;
        }

        const userData = userDoc.data();
        const username = userData.username || 'Unknown';

        // Create a minimal state object from stored data
        const state = {
            money: userData.money || 0,
            plots: userData.plots || [{ subs: [] }],
            workers: userData.workers || [],
            stats: userData.stats || {},
            ach: userData.ach || {},
            dailyStreak: userData.dailyStreak || 0,
            referralRewards: userData.referralRewards || {},
            governmentTiers: userData.governmentTiers || {},
            inv: {} // Don't show inventory for privacy
        };

        showProfileModal(state, username, false);
    } catch (error) {
        console.error('View profile failed:', error);
        window.toast?.('Failed to load profile', 'err');
    }
}

/**
 * Show profile modal
 * @param {Object} state - Game state to display
 * @param {string} username - Username
 * @param {boolean} isSelf - Is this the current player's profile
 */
function showProfileModal(state, username, isSelf) {
    window.closeMenu?.();

    const existingModal = document.getElementById('profile-modal');
    if (existingModal) existingModal.remove();

    const stats = getProfileStats(state);
    const title = isSelf ? getTitleDisplay() : '';

    let html = `
        <div class="modal-box" style="max-height:85vh;overflow-y:auto">
            <div class="modal-head">
                <h3>👤 ${isSelf ? 'My Profile' : username}</h3>
                <button class="modal-close" onclick="closeProfileModal()">×</button>
            </div>
            <div class="modal-body">
                <!-- Header -->
                <div style="text-align:center;padding:16px 0;margin-bottom:16px;background:linear-gradient(135deg, var(--bg2), var(--card));border-radius:12px">
                    <div style="font-size:3rem;margin-bottom:8px">🏰</div>
                    <div style="font-size:1.2rem;font-weight:600">${username}</div>
                    ${title ? `<div style="color:var(--gold);font-size:0.9rem;margin-top:4px">${title}</div>` : ''}
                </div>
                
                <!-- Empire Value -->
                <div style="text-align:center;padding:16px;background:var(--bg2);border-radius:10px;margin-bottom:16px">
                    <div style="color:var(--muted);font-size:0.8rem">Empire Value</div>
                    <div style="font-size:1.5rem;font-weight:700;color:var(--gold)">$${stats.empireValue.toLocaleString()}</div>
                </div>
                
                <!-- Stats Grid -->
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
                    <div style="background:var(--card);padding:12px;border-radius:8px;text-align:center">
                        <div style="font-size:1.2rem;font-weight:600">$${formatNumber(stats.money)}</div>
                        <div style="font-size:0.75rem;color:var(--muted)">Current Money</div>
                    </div>
                    <div style="background:var(--card);padding:12px;border-radius:8px;text-align:center">
                        <div style="font-size:1.2rem;font-weight:600">${stats.plots}</div>
                        <div style="font-size:0.75rem;color:var(--muted)">Plots Owned</div>
                    </div>
                    <div style="background:var(--card);padding:12px;border-radius:8px;text-align:center">
                        <div style="font-size:1.2rem;font-weight:600">${stats.buildings}</div>
                        <div style="font-size:0.75rem;color:var(--muted)">Buildings</div>
                    </div>
                    <div style="background:var(--card);padding:12px;border-radius:8px;text-align:center">
                        <div style="font-size:1.2rem;font-weight:600">${stats.workers}</div>
                        <div style="font-size:0.75rem;color:var(--muted)">Workers</div>
                    </div>
                </div>
                
                <!-- Lifetime Stats -->
                <h4 style="font-size:0.9rem;margin-bottom:8px">📊 Lifetime Stats</h4>
                <div style="background:var(--bg2);padding:12px;border-radius:8px;margin-bottom:16px">
                    <div style="display:flex;justify-content:space-between;padding:4px 0">
                        <span style="color:var(--muted)">Items Harvested</span>
                        <span>${formatNumber(stats.harvested)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:4px 0">
                        <span style="color:var(--muted)">Items Sold</span>
                        <span>${formatNumber(stats.sold)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:4px 0">
                        <span style="color:var(--muted)">Total Earned</span>
                        <span style="color:var(--gold)">$${formatNumber(stats.earned)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:4px 0">
                        <span style="color:var(--muted)">Achievements</span>
                        <span>${stats.achievements}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:4px 0">
                        <span style="color:var(--muted)">Daily Streak</span>
                        <span>🔥 ${stats.dailyStreak}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:4px 0">
                        <span style="color:var(--muted)">Friends Referred</span>
                        <span>👥 ${stats.referrals}</span>
                    </div>
                </div>`;

    // Self-profile options
    if (isSelf) {
        html += `
                <div style="display:flex;flex-direction:column;gap:8px">
                    <button class="btn purple" onclick="showTitleModal();closeProfileModal();">
                        🏷️ Change Title
                    </button>
                    <button class="btn" onclick="showDataModal();closeProfileModal();">
                        💾 Export/Import Data
                    </button>
                </div>`;
    }

    html += `</div></div>`;

    const modal = document.createElement('div');
    modal.id = 'profile-modal';
    modal.className = 'modal show';
    modal.innerHTML = html;

    document.body.appendChild(modal);
}

/**
 * Close profile modal
 */
export function closeProfileModal() {
    const modal = document.getElementById('profile-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

/**
 * Format large numbers
 */
function formatNumber(num) {
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
}

// Global exports
window.calculateEmpireValue = calculateEmpireValue;
window.getProfileStats = getProfileStats;
window.showMyProfile = showMyProfile;
window.viewFriendProfile = viewFriendProfile;
window.closeProfileModal = closeProfileModal;
