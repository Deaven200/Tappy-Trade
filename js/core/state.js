/**
 * Game State Management
 * Central game state object and default state initialization
 */

import { CONFIG, SAVE_VERSION } from '../config/constants.js';

/**
 * Default game state structure
 */
export function getDefaultState() {
    return {
        saveVersion: SAVE_VERSION,
        money: 100, // Starter money to help new players get going
        inv: {},
        cap: CONFIG.BASE_INVENTORY_CAP,
        invSort: 'name',
        invView: 'list',
        sound: 1,
        theme: 'dark',
        fontSize: 'normal',
        plots: [{
            subs: [
                { t: 'wild', c: 10, lv: 1 },
                { t: 'wild', c: 10, lv: 1 },
                { t: 'wild', c: 10, lv: 1 }
            ]
        }],
        workers: [],
        stats: {
            harvested: 0,
            sold: 0,
            earned: 0,
            built: 0
        },
        ach: {},
        prices: {},
        priceDir: {},
        tutorial: 0,
        lastUpdate: Date.now(),
        activeEvent: null,
        eventEndsAt: 0,
        nextEventAt: Date.now() + CONFIG.EVENT_CHECK_INTERVAL,
        lastDailyReward: 0,
        dailyStreak: 0,
        streakBonus: 0,
        limitOrders: [],
        farmName: 'Untitled Farm',
        hasRenamedFarm: false,
        governmentTiers: {
            farming: { totalSold: 0, currentTier: 0 },
            forestry: { totalSold: 0, currentTier: 0 },
            mining: { totalSold: 0, currentTier: 0 },
            livestock: { totalSold: 0, currentTier: 0 },
            manufacturing: { totalSold: 0, currentTier: 0 }
        },
        // Leaderboard / Daily Earnings
        dayId: new Date().toISOString().split('T')[0],
        startOfDayEarned: 0,
        tempDailyEarned: 0,

        // Referral System
        referredBy: null,
        referralPlaytimeVerified: false,
        gameStartTime: Date.now(),
        totalPlaytime: 0,
        referralRewards: {
            permanentBonus: 0,
            regenBoostUntil: 0,
            successfulReferrals: 0
        }
    };
}

/**
 * Migrate a loaded save to fill in any keys missing from older save versions.
 * This prevents crashes when loading saves that predate new state fields.
 * @param {Object} loaded - The raw loaded state object
 */
export function migrateState(loaded) {
    const defaults = getDefaultState();
    // Fill in any top-level keys that are missing
    for (const key of Object.keys(defaults)) {
        if (loaded[key] === undefined) {
            loaded[key] = defaults[key];
        }
    }
    // Ensure nested stats exist
    if (!loaded.stats) loaded.stats = defaults.stats;
    for (const key of Object.keys(defaults.stats)) {
        if (loaded.stats[key] === undefined) loaded.stats[key] = 0;
    }
    // Ensure referralRewards exist
    if (!loaded.referralRewards) loaded.referralRewards = defaults.referralRewards;
    // Ensure governmentTiers exist
    if (!loaded.governmentTiers) loaded.governmentTiers = defaults.governmentTiers;
    // Strip any leftover 'type' field from workers (worker simplification)
    if (Array.isArray(loaded.workers)) {
        loaded.workers = loaded.workers.map(w => ({ plot: w.plot, sub: w.sub }));
    }
    return loaded;
}

/**
 * Global game state - initialized with default values
 */
export const S = getDefaultState();

// Make S globally available for backwards compatibility
if (typeof window !== 'undefined') {
    window.S = S;
}
