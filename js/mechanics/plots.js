/**
 * Plot Management
 * Handles plot purchasing and expansion, and resource regeneration
 */

import { S } from '../core/state.js';
import { PLOTS } from '../config/data.js';
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

    // Create new plot with 4 wild subplots
    S.plots.push({
        subs: [
            { t: 'wild', c: 12, lv: 1 },
            { t: 'wild', c: 12, lv: 1 },
            { t: 'wild', c: 12, lv: 1 },
            { t: 'wild', c: 12, lv: 1 }
        ]
    });

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
    S.plots.forEach(plot => {
        plot.subs.forEach(subplot => {
            const config = window.T[subplot.t];
            if (!config) return;

            // Calculate regeneration rate with level bonus
            const level = subplot.lv || 1;
            const regenBonus = 1 + (level - 1) * 0.1; // 10% per level
            const regenRate = (config.r || 0) * regenBonus;

            if (regenRate > 0) {
                const maxStorage = (config.m || 999) + (level - 1) * 10;

                // Regenerate resources
                subplot.c = Math.min(subplot.c + regenRate * delta, maxStorage);
            }
        });
    });
}

// Expose for index.html
window.updatePlots = updatePlots;
