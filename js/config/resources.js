/**
 * Resource Definitions
 * Defines all harvestable/tradeable resources in the game
 */

export const RESOURCES = {
    // Raw Materials
    wood: { n: 'Wood', i: '🌲', p: 5 },
    berries: { n: 'Berries', i: '🍇', p: 8 },
    herbs: { n: 'Herbs', i: '🌿', p: 10 },
    stone: { n: 'Stone', i: '⛰️', p: 4 },

    // Crops
    wheat: { n: 'Wheat', i: '🌾', p: 6 },
    potato: { n: 'Potatoes', i: '🥔', p: 7 },
    carrot: { n: 'Carrots', i: '🥕', p: 7 },
    corn: { n: 'Corn', i: '🌽', p: 8 },
    soy: { n: 'Soybeans', i: '🌱', p: 9 },

    // Livestock Products
    egg: { n: 'Eggs', i: '🥚', p: 12 },
    chicken: { n: 'Chicken', i: '🍗', p: 25 },
    milk: { n: 'Milk', i: '🥛', p: 15 },
    beef: { n: 'Beef', i: '🥩', p: 40 },
    leather: { n: 'Leather', i: '👜', p: 30 },
    wool: { n: 'Wool', i: '🧶', p: 20 },
    mutton: { n: 'Mutton', i: '🍖', p: 35 },

    // Processed Goods
    planks: { n: 'Planks', i: '🪜', p: 15 },
    flour: { n: 'Flour', i: '🌾', p: 18 },
    cloth: { n: 'Cloth', i: '🧵', p: 50 },
    bread: { n: 'Bread', i: '🍞', p: 25 },
    fertilizer: { n: 'Fertilizer', i: '💩', p: 50 }
};

/**
 * Item Categories for UI organization
 */
export const ITEM_CATEGORIES = {
    raw: { n: 'Raw Materials', items: ['wood', 'stone', 'berries', 'herbs'] },
    crops: { n: 'Crops', items: ['wheat', 'potato', 'carrot', 'corn', 'soy'] },
    livestock: { n: 'Livestock', items: ['egg', 'chicken', 'milk', 'beef', 'leather', 'wool', 'mutton'] },
    processed: { n: 'Processed Goods', items: ['planks', 'flour', 'cloth', 'bread'] }
};

// Backwards compatibility - R is used throughout the codebase
export const R = RESOURCES;
export const ITEM_CATS = ITEM_CATEGORIES;
