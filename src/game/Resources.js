/**
 * Resource definitions for Tappy Trade
 */

export const RESOURCES = {
    wood: {
        id: 'wood',
        name: 'Wood',
        icon: '🪵',
        stackSize: 100,
        basePrice: 5,
        regrowthHours: 4,
    },
    berries: {
        id: 'berries',
        name: 'Berries',
        icon: '🫐',
        stackSize: 50,
        basePrice: 8,
        regrowthHours: 2,
    },
    herbs: {
        id: 'herbs',
        name: 'Herbs',
        icon: '🌿',
        stackSize: 50,
        basePrice: 10,
        regrowthHours: 3,
    },
    stone: {
        id: 'stone',
        name: 'Stone',
        icon: '🪨',
        stackSize: 100,
        basePrice: 3,
        regrowthHours: 6,
    },
    planks: {
        id: 'planks',
        name: 'Planks',
        icon: '📐',
        stackSize: 50,
        basePrice: 15,
        regrowthHours: null, // Processed, doesn't regrow
    },
};

/**
 * Sub-plot types and their yield configurations
 */
export const SUB_PLOT_TYPES = {
    forest: {
        id: 'forest',
        name: 'Forest',
        icon: '🌲',
        yields: {
            wood: { min: 15, max: 25 },
        },
        regrowthMs: 4 * 60 * 60 * 1000, // 4 hours
    },
    berryBush: {
        id: 'berryBush',
        name: 'Berries',
        icon: '🫐',
        yields: {
            berries: { min: 10, max: 20 },
        },
        regrowthMs: 2 * 60 * 60 * 1000, // 2 hours
    },
    herbPatch: {
        id: 'herbPatch',
        name: 'Herbs',
        icon: '🌿',
        yields: {
            herbs: { min: 8, max: 15 },
        },
        regrowthMs: 3 * 60 * 60 * 1000, // 3 hours
    },
};

/**
 * Government market prices (buy from player / sell to player)
 * Spread is the profit margin for the government
 */
export const GOV_MARKET_PRICES = {
    wood: { buy: 5, sell: 8 },   // Gov buys at 5, sells at 8
    berries: { buy: 8, sell: 12 },
    herbs: { buy: 10, sell: 15 },
    stone: { buy: 3, sell: 5 },
    planks: { buy: 15, sell: 20 },
};

/**
 * Plot costs (exponential scaling)
 */
export const PLOT_COSTS = [
    0,       // Plot 1: Free
    5000,    // Plot 2
    15000,   // Plot 3
    35000,   // Plot 4
    75000,   // Plot 5
    150000,  // Plot 6
];

/**
 * Get random yield amount for a resource from a sub-plot type
 */
export function getRandomYield(subPlotType) {
    const type = SUB_PLOT_TYPES[subPlotType];
    if (!type) return {};

    const result = {};
    for (const [resourceId, range] of Object.entries(type.yields)) {
        result[resourceId] = Math.floor(
            Math.random() * (range.max - range.min + 1) + range.min
        );
    }
    return result;
}
