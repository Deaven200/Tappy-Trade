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
        money: 0,
        inv: {},
        cap: CONFIG.BASE_INVENTORY_CAP,
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
        limitOrders: [],
        farmName: "Untitled Farm",
        hasRenamedFarm: false
    };
}

/**
 * Global game state - initialized with default values
 */
export const S = getDefaultState();

// Make S globally available for backwards compatibility
if (typeof window !== 'undefined') {
    window.S = S;
}
