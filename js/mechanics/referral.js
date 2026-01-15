/**
 * Referral System
 * Handles friend referrals, tracking, and bonus rewards
 * 
 * Rewards:
 * - 2x regen boost for 1 hour per successful referral (stacks)
 * - +1% permanent production bonus per referral (caps at 50%)
 */

import { S } from '../core/state.js';
import { toast, notif } from '../utils/feedback.js';
import { save } from '../core/storage.js';

// Constants
const REFERRAL_PLAYTIME_THRESHOLD = 10 * 60; // 10 minutes in seconds
const REGEN_BOOST_DURATION = 60 * 60 * 1000; // 1 hour in ms
const MAX_PERMANENT_BONUS = 50; // Max 50% bonus from referrals

/**
 * Generate a unique referral code for the current user
 */
export function generateReferralCode() {
    if (!window.loggedInUser) {
        return null; // Only logged-in users get referral codes
    }

    // Use user ID to create deterministic code
    const userId = window.loggedInUser.id;
    const hash = userId.replace('user_', '').substring(0, 8).toUpperCase();
    return `REF-${hash}`;
}

/**
 * Get the shareable referral URL
 */
export function getReferralUrl() {
    const code = generateReferralCode();
    if (!code) return null;

    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?ref=${code}`;
}

/**
 * Check if current session was referred by someone
 */
export function checkReferralOnLoad() {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');

    if (refCode && !S.referredBy) {
        console.log('🔗 Referral detected:', refCode);
        S.referredBy = refCode;
        S.gameStartTime = Date.now();
        S.totalPlaytime = 0;
        save();

        // Clean URL without reloading
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);

        toast('🎁 You were invited by a friend!', 'ok');
    }
}

/**
 * Track playtime for referral verification
 * Called from game loop
 */
export function trackPlaytime(deltaSeconds) {
    if (!S.referredBy) return;
    if (S.referralPlaytimeVerified) return; // Already verified

    S.totalPlaytime = (S.totalPlaytime || 0) + deltaSeconds;

    // Check if threshold reached
    if (S.totalPlaytime >= REFERRAL_PLAYTIME_THRESHOLD) {
        verifyReferralPlaytime();
    }
}

/**
 * Mark referral as verified (10+ minutes played)
 */
async function verifyReferralPlaytime() {
    if (S.referralPlaytimeVerified) return;

    console.log('✅ Referral playtime threshold reached!');
    S.referralPlaytimeVerified = true;
    save();

    // Record to Firebase for the referrer to claim
    if (window.db && S.referredBy) {
        try {
            const refCode = S.referredBy;
            const refDoc = window.db.collection('referrals').doc(refCode);

            await refDoc.set({
                pendingRewards: window.firebase.firestore.FieldValue.increment(1),
                lastReferralAt: Date.now()
            }, { merge: true });

            console.log('📤 Recorded successful referral for:', refCode);
            notif('Your friend will receive a bonus!');
        } catch (e) {
            console.error('Failed to record referral:', e);
        }
    }
}

/**
 * Check and claim pending referral rewards
 * Called on login
 */
export async function claimPendingReferrals() {
    const code = generateReferralCode();
    if (!code || !window.db) return;

    try {
        const refDoc = await window.db.collection('referrals').doc(code).get();

        if (!refDoc.exists) return;

        const data = refDoc.data();
        const pendingRewards = data.pendingRewards || 0;

        if (pendingRewards > 0) {
            // Award bonuses
            awardReferralBonus(pendingRewards);

            // Clear pending
            await window.db.collection('referrals').doc(code).update({
                pendingRewards: 0,
                totalClaimed: window.firebase.firestore.FieldValue.increment(pendingRewards)
            });
        }
    } catch (e) {
        console.error('Failed to claim referral rewards:', e);
    }
}

/**
 * Award referral bonuses to the player
 */
function awardReferralBonus(count) {
    // Initialize if needed
    if (!S.referralRewards) {
        S.referralRewards = {
            permanentBonus: 0,
            regenBoostUntil: 0,
            successfulReferrals: 0
        };
    }

    // Add permanent bonus (1% per referral, max 50%)
    const bonusToAdd = Math.min(count, MAX_PERMANENT_BONUS - S.referralRewards.permanentBonus);
    S.referralRewards.permanentBonus += bonusToAdd;

    // Add 2x regen boost (1 hour per referral, stacks duration)
    const boostMs = count * REGEN_BOOST_DURATION;
    const now = Date.now();
    if (S.referralRewards.regenBoostUntil > now) {
        // Extend existing boost
        S.referralRewards.regenBoostUntil += boostMs;
    } else {
        // Start new boost
        S.referralRewards.regenBoostUntil = now + boostMs;
    }

    // Track total
    S.referralRewards.successfulReferrals += count;

    save();

    // Show notification
    const hoursAdded = count;
    toast(`🎉 +${count}% permanent bonus, +${hoursAdded}h 2x regen!`, 'ok');
    notif(`${count} friend${count > 1 ? 's' : ''} played your game!`);

    console.log('🎁 Referral rewards claimed:', {
        permanentBonus: S.referralRewards.permanentBonus,
        regenBoostUntil: new Date(S.referralRewards.regenBoostUntil),
        successfulReferrals: S.referralRewards.successfulReferrals
    });
}

/**
 * Get current referral multipliers for production
 */
export function getReferralMultipliers() {
    const permanentBonus = S.referralRewards?.permanentBonus || 0;
    const boostActive = Date.now() < (S.referralRewards?.regenBoostUntil || 0);

    return {
        permanent: 1 + (permanentBonus / 100), // e.g., 1.05 for 5%
        boost: boostActive ? 2 : 1,
        combined: (1 + permanentBonus / 100) * (boostActive ? 2 : 1)
    };
}

/**
 * Check if 2x boost is currently active
 */
export function isRegenBoostActive() {
    return Date.now() < (S.referralRewards?.regenBoostUntil || 0);
}

/**
 * Get time remaining on 2x boost
 */
export function getBoostTimeRemaining() {
    const endTime = S.referralRewards?.regenBoostUntil || 0;
    const remaining = endTime - Date.now();
    if (remaining <= 0) return null;

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return { hours, minutes, ms: remaining };
}

/**
 * Copy referral link to clipboard
 */
export async function copyReferralLink() {
    const url = getReferralUrl();
    if (!url) {
        toast('Login to get your referral link!', 'err');
        return false;
    }

    try {
        await navigator.clipboard.writeText(url);
        toast('📋 Link copied!', 'ok');
        return true;
    } catch (e) {
        // Fallback for older browsers
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        toast('📋 Link copied!', 'ok');
        return true;
    }
}

/**
 * Show referral share modal
 */
export function showReferralModal() {
    window.closeMenu();

    const code = generateReferralCode();
    const url = getReferralUrl();
    const stats = S.referralRewards || { permanentBonus: 0, successfulReferrals: 0, regenBoostUntil: 0 };
    const boostRemaining = getBoostTimeRemaining();

    const existingModal = document.getElementById('referral-modal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'referral-modal';
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-box">
            <div class="modal-head">
                <h3>🎁 Share with Friends</h3>
                <button class="modal-close" onclick="closeReferralModal()">×</button>
            </div>
            <div class="modal-body">
                ${code ? `
                    <p style="margin-bottom:12px;color:var(--muted)">
                        When your friends play for 10+ minutes, you get:
                    </p>
                    <div style="background:var(--bg2);padding:12px;border-radius:8px;margin-bottom:16px">
                        <div style="color:var(--green);font-weight:600">⚡ 2x Regen for 1 hour</div>
                        <div style="color:var(--gold);font-weight:600">📈 +1% Permanent Bonus</div>
                    </div>
                    
                    <div style="background:var(--bg);padding:12px;border-radius:8px;margin-bottom:12px">
                        <div style="font-size:0.75rem;color:var(--muted);margin-bottom:4px">Your Referral Link:</div>
                        <div style="font-size:0.8rem;word-break:break-all;color:var(--blue)">${url}</div>
                    </div>
                    
                    <button class="btn green" style="width:100%;padding:12px;font-size:1rem" onclick="copyReferralLink()">
                        📋 Copy Link
                    </button>
                    
                    <div style="margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.1)">
                        <div style="display:flex;justify-content:space-between;font-size:0.85rem">
                            <span>👥 Successful Referrals:</span>
                            <span style="color:var(--gold)">${stats.successfulReferrals}</span>
                        </div>
                        <div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-top:6px">
                            <span>📈 Permanent Bonus:</span>
                            <span style="color:var(--green)">+${stats.permanentBonus}%</span>
                        </div>
                        ${boostRemaining ? `
                        <div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-top:6px">
                            <span>⚡ 2x Boost Active:</span>
                            <span style="color:var(--purple)">${boostRemaining.hours}h ${boostRemaining.minutes}m left</span>
                        </div>
                        ` : ''}
                    </div>
                ` : `
                    <div style="text-align:center;padding:20px">
                        <div style="font-size:2rem;margin-bottom:12px">🔐</div>
                        <p style="color:var(--muted);margin-bottom:16px">
                            Create an account to get your referral link and earn bonuses!
                        </p>
                        <button class="btn purple" onclick="closeReferralModal(); showAccount();">
                            Create Account
                        </button>
                    </div>
                `}
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

/**
 * Close referral modal
 */
export function closeReferralModal() {
    const modal = document.getElementById('referral-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

// Expose functions globally
window.generateReferralCode = generateReferralCode;
window.getReferralUrl = getReferralUrl;
window.checkReferralOnLoad = checkReferralOnLoad;
window.trackPlaytime = trackPlaytime;
window.claimPendingReferrals = claimPendingReferrals;
window.getReferralMultipliers = getReferralMultipliers;
window.isRegenBoostActive = isRegenBoostActive;
window.getBoostTimeRemaining = getBoostTimeRemaining;
window.copyReferralLink = copyReferralLink;
window.showReferralModal = showReferralModal;
window.closeReferralModal = closeReferralModal;
