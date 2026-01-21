/**
 * Plot Effects Module
 * Visual effects and bonus calculations for plots
 * Enhanced with new synergy and fertilizer systems
 */

// Import the detailed synergy calculations
import { calculateSynergyBonus as calculateDetailedSynergyBonus, getSynergyInfo } from './synergies.js';
import { getFertilizerBonus, isFertilized, getFertilizerTimeRemaining, formatFertilizerTime } from './fertilizer.js';

/**
 * Show confetti animation
 */
export function showConfetti() {
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999';
    document.body.appendChild(container);

    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `position:absolute;width:10px;height:10px;background:${['#ff0', '#f0f', '#0ff', '#f00', '#0f0', '#00f'][Math.floor(Math.random() * 6)]};top:-20px;left:${Math.random() * 100}%;animation:confetti-fall ${2 + Math.random() * 2}s linear forwards`;
        container.appendChild(confetti);
    }

    setTimeout(() => container.remove(), 4000);
}

/**
 * Calculate synergy bonus for a plot based on building diversity and adjacency
 * @param {Object} plot - Plot object (legacy signature)
 * @param {number} plotIndex - Plot index (new signature)
 * @param {number} subIndex - Subplot index (new signature)
 * @returns {number} - Bonus multiplier (1.0 = no bonus)
 */
export function calculateSynergyBonus(plotOrPlotIndex, subIndex) {
    // New signature: (plotIndex, subIndex)
    if (typeof plotOrPlotIndex === 'number' && typeof subIndex === 'number') {
        return calculateDetailedSynergyBonus(plotOrPlotIndex, subIndex);
    }

    // Legacy signature: (plot)
    const plot = plotOrPlotIndex;
    if (!plot || !plot.subs || plot.subs.length < 3) return 1.0;

    const types = new Set(plot.subs.map(s => s.t).filter(t => t));
    if (types.size >= 3) return 1.2; // 20% bonus for 3+ different types
    if (types.size >= 2) return 1.1; // 10% bonus for 2+ different types
    return 1.0;
}

/**
 * Get total production bonus for a subplot (synergy + fertilizer)
 * @param {number} plotIndex 
 * @param {number} subIndex 
 * @returns {number} Total multiplier
 */
export function getTotalProductionBonus(plotIndex, subIndex) {
    const synergyBonus = calculateDetailedSynergyBonus(plotIndex, subIndex);
    const fertBonus = getFertilizerBonus(plotIndex, subIndex);
    return synergyBonus * fertBonus;
}

/**
 * Get background color for a plot based on subplot types
 * @param {Object} plot - Plot object
 * @returns {string} - CSS color value
 */
export function getPlotBackground(plot) {
    if (!plot || !plot.subs || plot.subs.length < 3) return 'var(--bg2)';

    const types = plot.subs.map(s => window.T?.[s.t]?.category || 'none');
    const farmCount = types.filter(t => t === 'farm').length;
    const mineCount = types.filter(t => t === 'mine').length;

    if (farmCount >= 3) return 'linear-gradient(135deg, var(--bg2), #2d4a2d)'; // Green tint
    if (mineCount >= 3) return 'linear-gradient(135deg, var(--bg2), #4a3d2d)'; // Brown tint

    return 'var(--bg2)';
}

/**
 * Get bonus info for tooltip display
 * @param {number} plotIndex 
 * @param {number} subIndex 
 * @returns {Object} Bonus info for display
 */
export function getBonusInfo(plotIndex, subIndex) {
    const synergy = getSynergyInfo(plotIndex, subIndex);
    const isFert = isFertilized(plotIndex, subIndex);
    const fertTimeRemaining = getFertilizerTimeRemaining(plotIndex, subIndex);

    return {
        synergy: synergy,
        fertilized: isFert,
        fertilizerTime: isFert ? formatFertilizerTime(fertTimeRemaining) : null,
        total: getTotalProductionBonus(plotIndex, subIndex)
    };
}

// Export for use in main.js
export { getSynergyInfo, isFertilized, getFertilizerBonus };
