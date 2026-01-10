/**
 * Personal Government Tier Management
 * Handles tracking and updating player government tiers
 */

import { GOVERNMENT_CATEGORIES, GOVERNMENT_TIERS, getResourceCategory, getCurrentTier, getTierBonus, getPersonalGovPrice } from '../config/governmentTiers.js';
import { toast, playS } from '../utils/feedback.js';

// In-memory tier data is now in S.governmentTiers for persistence
import { S } from '../core/state.js';

/**
 * Load player's government tiers from Firebase
 */
export async function loadGovernmentTiers(userId) {
    if (!userId || !window.db) return;

    try {
        const doc = await window.db.collection('users').doc(userId).get();
        if (doc.exists && doc.data().governmentTiers) {
            S.governmentTiers = doc.data().governmentTiers;
        }
    } catch (error) {
        console.error('Failed to load government tiers:', error);
    }
}

/**
 * Record a sale to government and update tiers
 */
export async function recordGovernmentSale(resourceKey, amount) {
    const category = getResourceCategory(resourceKey);
    if (!category) return;

    // Ensure state initialized (migration safety)
    if (!S.governmentTiers) {
        S.governmentTiers = {
            farming: { totalSold: 0, currentTier: 0 },
            forestry: { totalSold: 0, currentTier: 0 },
            mining: { totalSold: 0, currentTier: 0 },
            livestock: { totalSold: 0, currentTier: 0 },
            manufacturing: { totalSold: 0, currentTier: 0 }
        };
    }

    // Update global state data
    if (!S.governmentTiers[category]) {
        S.governmentTiers[category] = { totalSold: 0, currentTier: 0 };
    }

    const oldTier = S.governmentTiers[category].currentTier;
    S.governmentTiers[category].totalSold += amount;
    S.governmentTiers[category].currentTier = getCurrentTier(S.governmentTiers[category].totalSold);

    // Check for tier unlock
    const newTier = S.governmentTiers[category].currentTier;
    if (newTier > oldTier) {
        handleTierUnlock(category, newTier);
    }

    // Save to Firebase ONLY if logged in
    const userId = window.loggedInUser?.id;
    if (userId && window.db) {
        try {
            await window.db.collection('users').doc(userId).set({
                governmentTiers: S.governmentTiers
            }, { merge: true });
        } catch (error) {
            console.error('Failed to save government tiers:', error);
        }
    }
    // Guest players now auto-save via the main game save loop since it's in S
}

/**
 * Handle tier unlock notification
 */
function handleTierUnlock(category, tier) {
    const categoryData = GOVERNMENT_CATEGORIES[category];
    const tierData = GOVERNMENT_TIERS[tier];

    const bonusPercent = Math.round(tierData.bonus * 100);

    toast(`🎉 ${categoryData.icon} ${categoryData.name} Tier ${tier}! +${bonusPercent}%`, 'ok');
    playS('ach');

    console.log(`Tier unlocked: ${category} → Tier ${tier} (${tierData.label})`);
}

/**
 * Get player's current tier for a category
 */
export function getPlayerTier(category) {
    return (S.governmentTiers && S.governmentTiers[category]) || { totalSold: 0, currentTier: 0 };
}

/**
 * Calculate government price for a resource based on player's tier
 */
export function calculateGovernmentPrice(resourceKey, basePrice) {
    const category = getResourceCategory(resourceKey);
    if (!category) return basePrice;

    const tier = getPlayerTier(category).currentTier;
    const bonus = getTierBonus(tier);

    return getPersonalGovPrice(basePrice, bonus);
}

/**
 * Get all player tiers (for UI display)
 */
export function getAllPlayerTiers() {
    return S.governmentTiers || {};
}
