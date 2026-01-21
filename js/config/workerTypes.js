/**
 * Worker Types Configuration
 * Defines specialized worker types with bonuses
 */

export const WORKER_TYPES = {
    general: {
        name: 'General Worker',
        icon: '👷',
        description: 'Jack of all trades',
        bonus: 1.0, // No bonus
        affectsResources: [], // Affects nothing specifically
        costMultiplier: 1.0
    },
    farmer: {
        name: 'Farmer',
        icon: '🧑‍🌾',
        description: '+25% crop yield',
        bonus: 1.25,
        affectsResources: ['wheat', 'potato', 'carrot', 'corn', 'soy'],
        affectsBuildings: ['wheatFarm', 'potatoFarm', 'carrotFarm', 'cornFarm', 'soyFarm'],
        costMultiplier: 1.2
    },
    miner: {
        name: 'Miner',
        icon: '⛏️',
        description: '+25% mining yield',
        bonus: 1.25,
        affectsResources: ['stone'],
        affectsBuildings: ['quarry'],
        costMultiplier: 1.2
    },
    rancher: {
        name: 'Rancher',
        icon: '🤠',
        description: '+25% livestock yield',
        bonus: 1.25,
        affectsResources: ['egg', 'chicken', 'milk', 'beef', 'leather', 'wool', 'mutton'],
        affectsBuildings: ['chickenCoop', 'cowPasture', 'sheepPen'],
        costMultiplier: 1.2
    },
    lumberjack: {
        name: 'Lumberjack',
        icon: '🪓',
        description: '+25% wood yield',
        bonus: 1.25,
        affectsResources: ['wood', 'berries', 'herbs'],
        affectsBuildings: ['forest', 'berryBush', 'herbPatch'],
        costMultiplier: 1.2
    }
};

/**
 * Get worker type bonus for a specific building/resource
 * @param {string} workerType - Worker type ID
 * @param {string} buildingType - Building type ID
 * @param {string} resourceId - Resource being harvested
 * @returns {number} Multiplier (1.0 = no bonus, 1.25 = +25%)
 */
export function getWorkerBonus(workerType, buildingType, resourceId) {
    const type = WORKER_TYPES[workerType];
    if (!type) return 1.0;

    // Check if worker type affects this building or resource
    if (type.affectsBuildings && type.affectsBuildings.includes(buildingType)) {
        return type.bonus;
    }
    if (type.affectsResources && type.affectsResources.includes(resourceId)) {
        return type.bonus;
    }

    return 1.0;
}

/**
 * Get cost for a worker type
 * @param {number} workerCount - Current number of workers
 * @param {string} workerType - Worker type ID
 * @returns {number} Cost in money
 */
export function getWorkerCost(workerCount, workerType = 'general') {
    const baseCost = 200 + workerCount * 150;
    const type = WORKER_TYPES[workerType];
    const multiplier = type?.costMultiplier || 1.0;
    return Math.floor(baseCost * multiplier);
}
