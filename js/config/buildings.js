/**
 * Building and Subplot Type Definitions
 * Defines all building types, production rates, and requirements
 */

/**
 * Subplot Types (T)
 * Each type defines: name, icon, output, regeneration rate, max storage, etc.
 */
export const SUBPLOT_TYPES = {
    // Starting type
    wild: {
        n: 'Wilderness',
        i: '🌿',
        m: 10,
        r: 0.05,
        tap: 1,
        pool: ['wood', 'berries', 'herbs', 'stone']
    },

    // Gathering
    forest: { n: 'Forest', i: '🌲', o: 'wood', r: 0.08, m: 10 },
    berryBush: { n: 'Berries', i: '🍇', o: 'berries', r: 0.1, m: 10 },
    herbPatch: { n: 'Herbs', i: '🌿', o: 'herbs', r: 0.06, m: 10 },
    quarry: { n: 'Quarry', i: '⛰️', o: 'stone', r: 0.04, m: 10 },

    // Farms
    wheatFarm: { n: 'Wheat', i: '🌾', o: 'wheat', r: 0.12, m: 10, b: 1 },
    potatoFarm: { n: 'Potato', i: '🥔', o: 'potato', r: 0.1, m: 10, b: 1 },
    carrotFarm: { n: 'Carrot', i: '🥕', o: 'carrot', r: 0.1, m: 10, b: 1 },
    cornFarm: { n: 'Corn', i: '🌽', o: 'corn', r: 0.08, m: 10, b: 1 },
    soyFarm: { n: 'Soy', i: '🌱', o: 'soy', r: 0.07, m: 10, b: 1 },

    // Livestock
    chickenCoop: {
        n: 'Chickens',
        i: '🐔',
        o: 'egg',
        r: 0.05,
        m: 10,
        b: 1,
        x: { chicken: 0.01 }
    },
    cowPasture: {
        n: 'Cows',
        i: '🐄',
        o: 'milk',
        r: 0.03,
        m: 10,
        b: 1,
        x: { beef: 0.005, leather: 0.008 }
    },
    sheepPen: {
        n: 'Sheep',
        i: '🐑',
        o: 'wool',
        r: 0.04,
        m: 10,
        b: 1,
        x: { mutton: 0.007 }
    },

    // Manufacturing
    sawmill: { n: 'Sawmill', i: '🏭', o: 'planks', m: 10, b: 1, req: 'wood', use: 2, tap: 1 },
    mill: { n: 'Mill', i: '🏭', o: 'flour', m: 10, b: 1, req: 'wheat', use: 3, tap: 1 },
    loom: { n: 'Loom', i: '🧵', o: 'cloth', m: 10, b: 1, req: 'wool', use: 3, tap: 1 },
    bakery: { n: 'Bakery', i: '🥖', o: 'bread', m: 10, b: 1, req: 'flour', use: 2, tap: 1 },

    // Utility
    storage: { n: 'Storage', i: '📦', b: 1, cap: 250 }
};

/**
 * Building Categories (B)
 * Organized by type with costs
 */
export const BUILDINGS = {
    gathering: [
        { t: 'forest', c: { m: 200 } },
        { t: 'berryBush', c: { m: 200 } },
        { t: 'herbPatch', c: { m: 200 } },
        { t: 'quarry', c: { m: 200 } }
    ],
    farms: [
        { t: 'wheatFarm', c: { m: 500, wood: 20 } },
        { t: 'potatoFarm', c: { m: 600, wood: 25 } },
        { t: 'carrotFarm', c: { m: 600, wood: 25 } },
        { t: 'cornFarm', c: { m: 700, wood: 30 } },
        { t: 'soyFarm', c: { m: 800, wood: 35 } }
    ],
    livestock: [
        { t: 'chickenCoop', c: { m: 1000, wood: 40, wheat: 20 } },
        { t: 'cowPasture', c: { m: 2500, wood: 60, wheat: 50 } },
        { t: 'sheepPen', c: { m: 1500, wood: 50, wheat: 30 } }
    ],
    manufacturing: [
        { t: 'sawmill', c: { m: 2000, stone: 50 } },
        { t: 'mill', c: { m: 1500, stone: 30, wood: 40 } },
        { t: 'loom', c: { m: 3000, wood: 60, stone: 30 } },
        { t: 'bakery', c: { m: 2500, stone: 40, wood: 30 } }
    ],
    utility: [
        { t: 'storage', c: { m: 1000, wood: 50 } }
    ]
};

/**
 * Plot unlock costs
 */
export const PLOT_COSTS = [0, 5000, 15000, 35000, 75000];

// Backwards compatibility
export const T = SUBPLOT_TYPES;
export const B = BUILDINGS;
export const PLOTS = PLOT_COSTS;
