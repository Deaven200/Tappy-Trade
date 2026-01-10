/**
 * Daily Rewards System Module
 * Handles daily login rewards and streak tracking
 */

import { S } from '../core/state.js';
import { save } from '../core/storage.js';
import { DAILY_REWARDS } from '../config/constants.js';
import { toast, notif } from '../utils/feedback.js';
import { addItem } from '../utils/inventory.js';

/**
 * Check if daily reward can be claimed
 * @returns {boolean}
 */
export function canClaimDaily() {
    const lastClaim = S.lastDailyReward || 0;
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    // Time Travel Protection: If last claim is in the future, prevent claim
    if (lastClaim > now) {
        return false;
    }

    return (now - lastClaim) >= oneDayMs;
}

/**
 * Claim daily login reward
 */
export function claimDaily() {
    if (!canClaimDaily()) {
        toast('Already claimed today!', 'err');
        return;
    }

    const now = Date.now();
    const lastClaim = S.lastDailyReward || 0;
    const twoDaysMs = 48 * 60 * 60 * 1000;

    // Check if streak continues or resets
    if ((now - lastClaim) > twoDaysMs) {
        S.dailyStreak = 1; // Reset streak if missed a day
    } else {
        S.dailyStreak = (S.dailyStreak || 0) + 1;
    }

    S.lastDailyReward = now;

    // Calculate reward tier based on streak
    const tier = Math.min(Math.floor(S.dailyStreak / 3), DAILY_REWARDS.length - 1);
    const reward = DAILY_REWARDS[tier];

    // Give reward
    if (typeof reward.reward === 'number') {
        S.money += reward.reward;
    }
    // Legacy support or fallback if structure changes to .m key
    else if (reward.m) {
        S.money += reward.m;
    }

    if (reward.items) {
        for (const [itemId, qty] of Object.entries(reward.items)) {
            addItem(itemId, qty);
        }
    }

    save();
    toast(`Day ${S.dailyStreak} reward claimed!`, 'ok');
    notif(`🎁 Daily Reward: +$${reward.reward || reward.m || 0}!`);

    // Update UI to reflect new money and refresh modal
    if (window.render) window.render();
    if (window.showDaily) window.showDaily(); // Refresh modal to update button state
}

/**
 * Get current streak and next reward info
 * @returns {{streak: number, nextReward: Object, canClaim: boolean}}
 */
export function getDailyRewardInfo() {
    const streak = S.dailyStreak || 0;
    const tier = Math.min(Math.floor(streak / 3), DAILY_REWARDS.length - 1);
    const nextReward = DAILY_REWARDS[tier];

    return {
        streak,
        nextReward,
        canClaim: canClaimDaily()
    };
}

/**
 * Show daily rewards modal with calendar UI
 */
export function showDaily() {
    const modal = document.getElementById('daily-modal');
    const cal = document.getElementById('daily-calendar');
    const streakEl = document.getElementById('daily-streak');
    const btn = document.getElementById('claim-daily-btn');

    if (!modal || !cal || !streakEl || !btn) return;

    // Render 7-day calendar
    let h = '';
    for (let i = 0; i < 7; i++) {
        const day = i + 1;
        const reward = DAILY_REWARDS[i];
        const claimed = (S.dailyStreak || 0) >= day && !canClaimDaily();
        const current = ((S.dailyStreak || 0) % 7) + 1 === day && canClaimDaily();
        const borderColor = current ? 'var(--gold)' : 'transparent';
        h += `<div style="text-align:center;padding:8px 4px;background:var(--bg2);border-radius:6px;border:2px solid ${borderColor}">
            <div style="font-size:0.75rem;color:var(--muted)">Day ${day}</div>
            <div style="font-size:1.2rem">${claimed ? '✅' : '💰'}</div>
            <div style="font-size:0.7rem;color:var(--gold)">${reward.desc}</div>
        </div>`;
    }
    cal.innerHTML = h;

    // Update streak display
    streakEl.innerHTML = `🔥 Current Streak: <b>${S.dailyStreak || 0}</b> days`;

    // Update button
    if (canClaimDaily()) {
        const nextDay = ((S.dailyStreak || 0) % 7);
        const reward = DAILY_REWARDS[nextDay];
        btn.disabled = false;
        btn.textContent = `🎁 Claim ${reward.desc}!`;
        btn.classList.remove('off');
    } else {
        btn.disabled = true;
        btn.textContent = '⏰ Come back tomorrow!';
        btn.classList.add('off');
    }

    modal.classList.add('show');

    // Close menu if open
    const menuModal = document.getElementById('menu-modal');
    if (menuModal) menuModal.classList.remove('show');
}

/**
 * Close daily rewards modal
 */
export function closeDaily() {
    const modal = document.getElementById('daily-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}
