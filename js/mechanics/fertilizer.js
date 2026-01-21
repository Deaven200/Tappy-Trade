/**
 * Fertilizer Mechanics
 * Allows players to apply fertilizer to farm plots for temporary 2x production
 */

import { S } from '../core/state.js';
import { T } from '../config/buildings.js';
import { toast, playS } from '../utils/feedback.js';
import { save } from '../core/storage.js';

// Fertilizer boost duration: 1 hour
const FERTILIZER_DURATION = 60 * 60 * 1000;

/**
 * Check if a subplot can be fertilized
 * @param {number} plotIndex 
 * @param {number} subIndex 
 * @returns {boolean}
 */
export function canFertilize(plotIndex, subIndex) {
    const subplot = S.plots[plotIndex]?.subs[subIndex];
    if (!subplot) return false;

    const config = T[subplot.t];
    if (!config) return false;

    // Only farms can be fertilized
    const farmTypes = ['wheatFarm', 'potatoFarm', 'carrotFarm', 'cornFarm', 'soyFarm'];
    if (!farmTypes.includes(subplot.t)) return false;

    // Check if already fertilized
    if (isFertilized(plotIndex, subIndex)) return false;

    // Check if player has fertilizer
    return (S.inv.fertilizer || 0) >= 1;
}

/**
 * Check if a subplot is currently fertilized
 * @param {number} plotIndex 
 * @param {number} subIndex 
 * @returns {boolean}
 */
export function isFertilized(plotIndex, subIndex) {
    const subplot = S.plots[plotIndex]?.subs[subIndex];
    if (!subplot) return false;

    return subplot.fertilizedUntil && subplot.fertilizedUntil > Date.now();
}

/**
 * Get remaining fertilizer time
 * @param {number} plotIndex 
 * @param {number} subIndex 
 * @returns {number} Time remaining in ms, or 0 if not fertilized
 */
export function getFertilizerTimeRemaining(plotIndex, subIndex) {
    const subplot = S.plots[plotIndex]?.subs[subIndex];
    if (!subplot || !subplot.fertilizedUntil) return 0;

    return Math.max(0, subplot.fertilizedUntil - Date.now());
}

/**
 * Apply fertilizer to a farm subplot
 * @param {number} plotIndex 
 * @param {number} subIndex 
 * @returns {boolean} Success
 */
export function applyFertilizer(plotIndex, subIndex) {
    if (!canFertilize(plotIndex, subIndex)) {
        toast('Cannot fertilize this plot!', 'err');
        playS('err');
        return false;
    }

    // Consume fertilizer
    S.inv.fertilizer = (S.inv.fertilizer || 0) - 1;
    if (S.inv.fertilizer <= 0) delete S.inv.fertilizer;

    // Apply fertilizer effect
    const subplot = S.plots[plotIndex].subs[subIndex];
    subplot.fertilizedUntil = Date.now() + FERTILIZER_DURATION;

    toast('🌱 Fertilizer applied! 2x production for 1 hour', 'ok');
    playS('ach');

    save();
    window.render();
    return true;
}

/**
 * Get fertilizer boost multiplier for a subplot
 * @param {number} plotIndex 
 * @param {number} subIndex 
 * @returns {number} Multiplier (2.0 if fertilized, 1.0 otherwise)
 */
export function getFertilizerBonus(plotIndex, subIndex) {
    return isFertilized(plotIndex, subIndex) ? 2.0 : 1.0;
}

/**
 * Format remaining time as human readable string
 * @param {number} ms Milliseconds remaining
 * @returns {string}
 */
export function formatFertilizerTime(ms) {
    if (ms <= 0) return '';

    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
        return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
}

// Expose functions globally
window.canFertilize = canFertilize;
window.isFertilized = isFertilized;
window.applyFertilizer = applyFertilizer;
window.getFertilizerBonus = getFertilizerBonus;
window.getFertilizerTimeRemaining = getFertilizerTimeRemaining;
window.formatFertilizerTime = formatFertilizerTime;
