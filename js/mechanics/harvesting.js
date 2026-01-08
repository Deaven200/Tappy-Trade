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
 */
export function tap(plotIndex, subplotIndex) {
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

    // Wild subplot gives random resources from pool
    if (config.pool) {
        if (subplot.c < 1) return; // Check if resources available
        subplot.c--; // Decrement resource count
        const randomItem = config.pool[Math.floor(Math.random() * config.pool.length)];

        // Use window functions for compatibility
        window.addItem(randomItem, 1);
        S.stats.harvested++;
        playS('tap');
        window.floatTextAt(`+1 ${R[randomItem]?.i}`, element);

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
        window.addItem(config.o, 1);
        S.stats.harvested++;
        playS('tap');
        window.floatTextAt(`+1 ${R[config.o]?.i}`, element);
    } else {
        // Regular resource buildings
        if (subplot.c < 1) return;
        subplot.c--;
        window.addItem(config.o, 1);
        S.stats.harvested++;
        playS('tap');
        window.floatTextAt(`+1 ${R[config.o]?.i}`, element);

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
