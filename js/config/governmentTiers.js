/**
 * Personal Government Tier System Configuration
 * Each player has their own tier progression per category
 * Selling to government unlocks better prices
 */

/**
 * Resource Categories for Government Development
 */
export const GOVERNMENT_CATEGORIES = {
    farming: {
        name: 'Farming Development',
        icon: '🌾',
        resources: ['wheat', 'potato', 'carrot', 'corn', 'soy'],
        description: 'Agricultural products'
    },
    forestry: {
        name: 'Forestry Development',
        icon: '🌲',
        resources: ['wood', 'berries', 'herbs'],
        description: 'Forest resources'
    },
    mining: {
        name: 'Mining Development',
        icon: '⛰️',
        resources: ['stone'],
        description: 'Mining products'
    },
    livestock: {
        name: 'Livestock Development',
        icon: '🐄',
        resources: ['egg', 'chicken', 'milk', 'beef', 'leather', 'wool', 'mutton'],
        description: 'Animal products'
    },
    manufacturing: {
        name: 'Manufacturing Development',
        icon: '🏭',
        resources: ['planks', 'flour', 'cloth', 'bread'],
        description: 'Crafted goods'
    }
};

/**
 * Government Tier Structure (20 tiers)
 * Scales from 100 sold → 10,000,000 sold
 * Bonus scales from +2% → +200% (3x multiplier)
 */
export const GOVERNMENT_TIERS = [
    // Tier 0: Starting
    { sold: 0, bonus: 0.00, label: 'Novice' },

    // Early (Easy to unlock)
    { sold: 100, bonus: 0.02, label: 'Beginner' },
    { sold: 500, bonus: 0.05, label: 'Apprentice' },
    { sold: 1500, bonus: 0.10, label: 'Skilled' },
    { sold: 4000, bonus: 0.15, label: 'Experienced' },
    { sold: 10000, bonus: 0.20, label: 'Expert' },

    // Mid (Steady grind)
    { sold: 25000, bonus: 0.30, label: 'Master' },
    { sold: 50000, bonus: 0.40, label: 'Grandmaster' },
    { sold: 100000, bonus: 0.50, label: 'Elite' },
    { sold: 200000, bonus: 0.65, label: 'Champion' },
    { sold: 400000, bonus: 0.80, label: 'Legendary' },

    // Late (Major commitments)
    { sold: 750000, bonus: 1.00, label: 'Mythic' },
    { sold: 1250000, bonus: 1.20, label: 'Epic' },
    { sold: 2000000, bonus: 1.40, label: 'Fabled' },
    { sold: 3000000, bonus: 1.60, label: 'Ascended' },
    { sold: 4500000, bonus: 1.75, label: 'Divine' },

    // End Game (Extreme dedication)
    { sold: 6000000, bonus: 1.85, label: 'Celestial' },
    { sold: 7500000, bonus: 1.92, label: 'Eternal' },
    { sold: 9000000, bonus: 1.96, label: 'Immortal' },
    { sold: 10000000, bonus: 2.00, label: 'Transcendent' }
];

/**
 * Get category for a resource
 */
export function getResourceCategory(resourceKey) {
    for (const [categoryKey, category] of Object.entries(GOVERNMENT_CATEGORIES)) {
        if (category.resources.includes(resourceKey)) {
            return categoryKey;
        }
    }
    return null;
}

/**
 * Get current tier based on total sold
 */
export function getCurrentTier(totalSold) {
    let currentTier = 0;
    for (let i = GOVERNMENT_TIERS.length - 1; i >= 0; i--) {
        if (totalSold >= GOVERNMENT_TIERS[i].sold) {
            currentTier = i;
            break;
        }
    }
    return currentTier;
}

/**
 * Get tier bonus multiplier
 */
export function getTierBonus(tier) {
    if (tier < 0 || tier >= GOVERNMENT_TIERS.length) return 0;
    return GOVERNMENT_TIERS[tier].bonus;
}

/**
 * Calculate personal government price
 */
export function getPersonalGovPrice(basePrice, tierBonus) {
    return Math.round(basePrice * (1 + tierBonus) * 100) / 100;
}
