/**
 * Game Constants and Configuration
 * Version info, game constants, events, and daily rewards
 */

// Version information
export const GAME_VERSION = 'v1.3.4-modular';
export const VERSION_DATE = '2026-01-06 16:08';
export const SAVE_VERSION = 2;

// Game configuration
export const CONFIG = {
    BASE_INVENTORY_CAP: 1000,
    STORAGE_CAP_PER_BUILDING: 250,
    EVENT_CHECK_INTERVAL: 300000, // 5 minutes
    SAVE_INTERVAL: 10000, // 10 seconds
    MAX_OFFLINE_HOURS: 8,
    DEBUG_MODE: false // Set to false for production
};

/**
 * Random Events
 */
export const EVENTS = [
    { id: 'rain', n: '🌧️ Rain Bonus', d: 'All farms produce 2x!', duration: 180000, effect: 'farmBoost', mult: 2 },
    { id: 'merchant', n: '💰 Merchant Visit', d: 'Sell prices +50%!', duration: 120000, effect: 'priceBoost', mult: 1.5 },
    { id: 'gold', n: '🎉 Gold Rush', d: 'Found buried treasure!', duration: 0, effect: 'bonus', amount: 500 },
    { id: 'bountiful', n: '🌾 Bountiful Harvest', d: 'All resources ready to harvest!', duration: 0, effect: 'fillAll' },
    { id: 'drought', n: '🏜️ Drought', d: 'Farms produce 50% less!', duration: 120000, effect: 'farmBoost', mult: 0.5 },
    { id: 'workerBonus', n: '⚡ Worker Bonus', d: 'Workers work 2x faster!', duration: 180000, effect: 'workerBoost', mult: 2 },
    { id: 'lucky', n: '🍀 Lucky Find', d: 'Found random resources!', duration: 0, effect: 'randomItems' },
];

/**
 * Daily Rewards (7-day cycle)
 */
export const DAILY_REWARDS = [
    { day: 1, reward: 100, desc: '$100' },
    { day: 2, reward: 150, desc: '$150' },
    { day: 3, reward: 200, desc: '$200' },
    { day: 4, reward: 300, desc: '$300' },
    { day: 5, reward: 500, desc: '$500' },
    { day: 6, reward: 750, desc: '$750' },
    { day: 7, reward: 1000, desc: '$1000 🎉' },
];
