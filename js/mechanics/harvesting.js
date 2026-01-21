/**
 * Harvesting Mechanics
 * Handles resource collection from plots (tap function)
 */

import { S } from '../core/state.js';
import { T, R } from '../config/data.js';
import { getInvTotal } from '../utils/inventory.js';
import { toast, playS } from '../utils/feedback.js';
import { save } from '../core/storage.js';

/**
 * Tap a subplot to harvest resources
 * @param {number} plotIndex - Index of the plot
 * @param {number} subplotIndex - Index of the subplot within the plot
 * @param {number} workerBonus - Multiplier from specialized workers (default 1.0)
 */
export function tap(plotIndex, subplotIndex, workerBonus = 1.0) {
    const subplot = S.plots[plotIndex]?.subs[subplotIndex];
    if (!subplot) return;

    const config = T[subplot.t];
    if (!config) return;

    const element = document.querySelector(`[data-p="${plotIndex}"][data-s="${subplotIndex}"]`);

    // Check inventory capacity
    if (getInvTotal(S.inv) >= S.cap) {
        toast('Inventory full!', 'err');
        playS('err');
        if (element) {
            element.classList.remove('shake');
            void element.offsetWidth; // Force reflow
            element.classList.add('shake');
        }
        return;
    }

    // Calculate amount to harvest (base 1, modified by worker bonus)
    const baseAmount = 1;
    const bonusAmount = Math.floor(baseAmount * workerBonus);
    const harvestAmount = Math.max(1, bonusAmount);

    // Wild subplot gives random resources from pool
    if (config.pool) {
        if (subplot.c < 1) return; // Check if resources available
        subplot.c--; // Decrement resource count
        const randomItem = config.pool[Math.floor(Math.random() * config.pool.length)];

        // Use window functions for compatibility, apply bonus
        window.addItem(randomItem, harvestAmount);
        S.stats.harvested += harvestAmount;
        playS('tap');
        // Only show floating text when on Home screen (element visible)
        if (window.getScreen && window.getScreen() === 'home') {
            const bonusText = harvestAmount > 1 ? ` (+${harvestAmount - 1})` : '';
            window.floatTextAt(`+${harvestAmount} ${R[randomItem]?.i}${bonusText}`, element);
        }

        const iconEl = element?.querySelector('.icon');
        if (iconEl) {
            iconEl.classList.remove('pop');
            void iconEl.offsetWidth;
            iconEl.classList.add('pop');
        }

        // Auto-save handles saves every 60s
        window.render();
        return;
    }

    // Manufacturing/crafting buildings (require input resources)
    if (config.req) {
        if (!window.hasItem(config.req, config.use)) {
            toast(`Need ${config.use} ${R[config.req]?.i || config.req}`, 'err');
            playS('err');
            if (element) {
                element.classList.remove('shake');
                void element.offsetWidth;
                element.classList.add('shake');
            }
            return;
        }

        window.remItem(config.req, config.use);
        window.addItem(config.o, harvestAmount);
        S.stats.harvested += harvestAmount;
        playS('tap');
        // Only show floating text when on Home screen
        if (window.getScreen && window.getScreen() === 'home') {
            const bonusText = harvestAmount > 1 ? ` (+${harvestAmount - 1})` : '';
            window.floatTextAt(`+${harvestAmount} ${R[config.o]?.i}${bonusText}`, element);
        }
    } else {
        // Regular resource buildings
        if (subplot.c < 1) return;
        subplot.c--;
        window.addItem(config.o, harvestAmount);
        S.stats.harvested += harvestAmount;
        playS('tap');
        // Only show floating text when on Home screen
        if (window.getScreen && window.getScreen() === 'home') {
            const bonusText = harvestAmount > 1 ? ` (+${harvestAmount - 1})` : '';
            window.floatTextAt(`+${harvestAmount} ${R[config.o]?.i}${bonusText}`, element);
        }

        const iconEl = element?.querySelector('.icon');
        if (iconEl) {
            iconEl.classList.remove('pop');
            void iconEl.offsetWidth;
            iconEl.classList.add('pop');
        }
    }

    // Auto-save handles saves every 60s
    window.render();
}
