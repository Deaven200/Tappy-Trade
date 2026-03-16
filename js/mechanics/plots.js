/**
 * Plot Management
 * Handles plot purchasing and expansion, and resource regeneration
 */

import { S } from '../core/state.js';
import { PLOTS, SUBPLOT_TYPES } from '../config/buildings.js';
import { toast, playS } from '../utils/feedback.js';
import { save } from '../core/storage.js';

/**
 * Get the cost of the next plot
 * @returns {number} Cost in money
 */
export function getPlotCost() {
    return PLOTS[S.plots.length] || 999999;
}

/**
 * Check if player can afford the next plot
 * @returns {boolean}
 */
export function canAffordPlot() {
    return S.money >= getPlotCost();
}

/**
 * Purchase a new plot
 */
export function buyPlot() {
    const cost = getPlotCost();

    if (S.money < cost) {
        toast('Not enough money!', 'err');
        playS('err');
        return;
    }

    S.money -= cost;

    // Create new plot with 3 wild subplots (User requested 3)
    S.plots.push({
        subs: [
            { t: 'wild', c: 12, lv: 1 },
            { t: 'wild', c: 12, lv: 1 },
            { t: 'wild', c: 12, lv: 1 }
        ]
    });

    // Increase storage capacity by 1000 per new plot
    S.cap += 1000;

    toast('New plot unlocked!', 'ok');
    playS('ach');
    save();
    window.render();
}

/**
 * Update all subplots - regenerate resources
 * Called by game loop every frame
 * @param {number} delta - Time in seconds
 */
export function updatePlots(delta) {
    // Get referral multipliers if available
    const referralMult = window.getReferralMultipliers ? window.getReferralMultipliers() : { combined: 1 };

    S.plots.forEach((plot, plotIndex) => {
        plot.subs.forEach((subplot, subIndex) => {
            const config = SUBPLOT_TYPES[subplot.t];
            if (!config) return;

            // Calculate regeneration rate with level bonus
            const level = subplot.lv || 1;
            const regenBonus = 1 + (level - 1) * 0.1; // 10% per level
            const baseRegenRate = (config.r || 0) * regenBonus;

            // Apply synergy bonus from adjacent buildings
            const synergyBonus = window.calculateSynergyBonus
                ? window.calculateSynergyBonus(plotIndex, subIndex)
                : 1.0;

            // Apply referral bonuses (permanent + 2x boost if active)
            const effectiveRate = baseRegenRate * synergyBonus * referralMult.combined;

            if (effectiveRate > 0) {
                const maxStorage = (config.m || 999) + (level - 1) * 10;

                // Regenerate resources
                subplot.c = Math.min(subplot.c + effectiveRate * delta, maxStorage);
            }
        });
    });
}

// Expose for index.html
window.updatePlots = updatePlots;
