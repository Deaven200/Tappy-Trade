/**
 * Building Synergy System
 * Provides bonuses for adjacent buildings
 */

import { S } from '../core/state.js';
import { T } from '../config/buildings.js';

/**
 * Synergy Rules - define what buildings benefit from being adjacent
 */
export const SYNERGY_RULES = {
    // Sawmill next to forest = +20% wood bonus to sawmill
    sawmill: {
        adjacentTo: ['forest'],
        bonus: 0.20,
        description: '+20% output near Forest'
    },
    // Mill next to wheat farm = +15% flour bonus
    mill: {
        adjacentTo: ['wheatFarm'],
        bonus: 0.15,
        description: '+15% output near Wheat Farm'
    },
    // Bakery next to mill = +15% bread bonus
    bakery: {
        adjacentTo: ['mill'],
        bonus: 0.15,
        description: '+15% output near Mill'
    },
    // Loom next to sheep pen = +15% cloth bonus
    loom: {
        adjacentTo: ['sheepPen'],
        bonus: 0.15,
        description: '+15% output near Sheep Pen'
    },
    // Farm synergies - farms benefit from each other
    wheatFarm: {
        adjacentTo: ['wheatFarm', 'potatoFarm', 'carrotFarm', 'cornFarm', 'soyFarm'],
        bonus: 0.05,
        description: '+5% output per adjacent farm'
    },
    potatoFarm: {
        adjacentTo: ['wheatFarm', 'potatoFarm', 'carrotFarm', 'cornFarm', 'soyFarm'],
        bonus: 0.05,
        description: '+5% output per adjacent farm'
    },
    carrotFarm: {
        adjacentTo: ['wheatFarm', 'potatoFarm', 'carrotFarm', 'cornFarm', 'soyFarm'],
        bonus: 0.05,
        description: '+5% output per adjacent farm'
    },
    cornFarm: {
        adjacentTo: ['wheatFarm', 'potatoFarm', 'carrotFarm', 'cornFarm', 'soyFarm'],
        bonus: 0.05,
        description: '+5% output per adjacent farm'
    },
    soyFarm: {
        adjacentTo: ['wheatFarm', 'potatoFarm', 'carrotFarm', 'cornFarm', 'soyFarm'],
        bonus: 0.05,
        description: '+5% output per adjacent farm'
    },
    // Livestock synergies
    chickenCoop: {
        adjacentTo: ['chickenCoop', 'cowPasture', 'sheepPen'],
        bonus: 0.05,
        description: '+5% output per adjacent livestock'
    },
    cowPasture: {
        adjacentTo: ['chickenCoop', 'cowPasture', 'sheepPen'],
        bonus: 0.05,
        description: '+5% output per adjacent livestock'
    },
    sheepPen: {
        adjacentTo: ['chickenCoop', 'cowPasture', 'sheepPen'],
        bonus: 0.05,
        description: '+5% output per adjacent livestock'
    }
};

/**
 * Get adjacent subplots for a given position
 * Within a plot: subplots 0, 1, 2 are in a row, so 0 is adjacent to 1, 1 is adjacent to 0 and 2, etc.
 * @param {number} plotIndex - Plot index
 * @param {number} subIndex - Subplot index within plot
 * @returns {Array} Array of {plotIndex, subIndex} for adjacent subplots
 */
export function getAdjacentSubplots(plotIndex, subIndex) {
    const adjacent = [];

    // Subplots within the same plot are adjacent
    // In a row of 3: 0-1 adjacent, 1-2 adjacent
    if (subIndex > 0) {
        adjacent.push({ plotIndex, subIndex: subIndex - 1 });
    }
    if (subIndex < 2) {
        adjacent.push({ plotIndex, subIndex: subIndex + 1 });
    }

    // Adjacent plots (if they exist)
    // Same subplot position across plots could be considered adjacent
    // This makes placement more strategic
    if (plotIndex > 0 && S.plots[plotIndex - 1]) {
        adjacent.push({ plotIndex: plotIndex - 1, subIndex });
    }
    if (S.plots[plotIndex + 1]) {
        adjacent.push({ plotIndex: plotIndex + 1, subIndex });
    }

    return adjacent;
}

/**
 * Calculate synergy bonus for a specific subplot
 * @param {number} plotIndex - Plot index
 * @param {number} subIndex - Subplot index
 * @returns {number} Total bonus multiplier (e.g., 1.20 = +20%)
 */
export function calculateSynergyBonus(plotIndex, subIndex) {
    const subplot = S.plots[plotIndex]?.subs[subIndex];
    if (!subplot) return 1.0;

    const rule = SYNERGY_RULES[subplot.t];
    if (!rule) return 1.0;

    const adjacentSubplots = getAdjacentSubplots(plotIndex, subIndex);
    let totalBonus = 0;

    adjacentSubplots.forEach(adj => {
        const adjSubplot = S.plots[adj.plotIndex]?.subs[adj.subIndex];
        if (adjSubplot && rule.adjacentTo.includes(adjSubplot.t)) {
            totalBonus += rule.bonus;
        }
    });

    // Cap at 50% bonus
    return 1 + Math.min(totalBonus, 0.5);
}

/**
 * Get synergy info for display in building tooltips
 * @param {number} plotIndex 
 * @param {number} subIndex 
 * @returns {Object|null} Synergy info or null if no synergy
 */
export function getSynergyInfo(plotIndex, subIndex) {
    const subplot = S.plots[plotIndex]?.subs[subIndex];
    if (!subplot) return null;

    const rule = SYNERGY_RULES[subplot.t];
    if (!rule) return null;

    const bonus = calculateSynergyBonus(plotIndex, subIndex);
    if (bonus <= 1.0) return null;

    return {
        bonus: Math.round((bonus - 1) * 100),
        description: rule.description
    };
}

// Expose for global access
window.calculateSynergyBonus = calculateSynergyBonus;
window.getSynergyInfo = getSynergyInfo;
