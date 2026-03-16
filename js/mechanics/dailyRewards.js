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
    const oneDayMs = 24 * 60 * 60 * 1000;
    const twoDaysMs = 48 * 60 * 60 * 1000;

    // Use existing bonus or init to 0
    if (typeof S.streakBonus !== 'number') S.streakBonus = 0;

    // Check if streak continues or resets
    if ((now - lastClaim) > twoDaysMs && lastClaim !== 0) {
        // Streak broken
        S.dailyStreak = 1;

        // Calculate days missed for bonus decay
        // If > 48h, missed 1 day. > 72h, missed 2 days.
        const daysMissed = Math.floor((now - lastClaim) / oneDayMs) - 1;
        const decay = Math.max(1, daysMissed) * 2; // -2% per day missed
        S.streakBonus = Math.max(0, S.streakBonus - decay);

        toast(`Streak broken! Bonus lost: -${decay}%`, 'err');
    } else {
        // Streak continues
        S.dailyStreak = (S.dailyStreak || 0) + 1;

        // Increase bonus (+1% capped)
        S.streakBonus = Math.min((S.streakBonus || 0) + 1, CONFIG.MAX_STREAK_BONUS || 100);
    }

    S.lastDailyReward = now;

    // Calculate reward tier based on streak
    const tier = Math.min(Math.floor(S.dailyStreak / 3), DAILY_REWARDS.length - 1);
    const reward = DAILY_REWARDS[tier];

    // Calculate Bonus Multiplier
    const bonusMult = 1 + (S.streakBonus / 100);

    // Give reward — scales with progression (1% of lifetime earned, minimum = flat reward)
    let rewardAmount = 0;
    if (typeof reward.reward === 'number') {
        rewardAmount = reward.reward;
    } else if (reward.m) {
        rewardAmount = reward.m;
    }

    // Scale: 1% of lifetime earnings, but at least the base reward
    const progressionReward = Math.floor((S.stats?.earned || 0) * 0.01);
    rewardAmount = Math.max(rewardAmount, progressionReward);

    // Apply streak bonus
    const finalAmount = Math.floor(rewardAmount * bonusMult);
    S.money += finalAmount;

    if (reward.items) {
        for (const [itemId, qty] of Object.entries(reward.items)) {
            addItem(itemId, qty);
        }
    }

    save();

    // Detailed feedback
    if (S.streakBonus > 0) {
        toast(`Day ${S.dailyStreak} claimed! (+${S.streakBonus}% Bonus)`, 'ok');
        notif(`🎁 Daily: $${rewardAmount} + $${finalAmount - rewardAmount} (Bonus) = $${finalAmount}!`);
    } else {
        toast(`Day ${S.dailyStreak} reward claimed!`, 'ok');
        notif(`🎁 Daily Reward: +$${finalAmount}!`);
    }

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
    const currentBonus = S.streakBonus || 0;
    streakEl.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <span>🔥 Streak: <b>${S.dailyStreak || 0}</b> days</span>
            <span style="color:var(--gold)">⚡ Bonus: +${currentBonus}%</span>
        </div>
    `;

    // Update button
    if (canClaimDaily()) {
        const nextDay = ((S.dailyStreak || 0) % 7);
        const reward = DAILY_REWARDS[nextDay];

        // Preview bonus
        let baseAmt = reward.reward || reward.m || 0;
        let bonusAmt = Math.floor(baseAmt * (1 + (currentBonus + 1) / 100)); // +1 because claiming adds 1%

        btn.disabled = false;
        btn.innerHTML = `🎁 Claim $${baseAmt} <span style="font-size:0.8em;opacity:0.8">(+${currentBonus + 1}%)</span>`;
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
