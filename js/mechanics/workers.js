/**
 * Worker Mechanics
 * Handles worker hiring, firing, and automation
 */

import { S } from '../core/state.js';
import { toast, playS } from '../utils/feedback.js';
import { save } from '../core/storage.js';

/**
 * Hire a worker for a specific plot and subplot
 * @param {number} plotIndex - Plot index
 * @param {number} subplotIndex - Subplot index
 */
export function hireWorker(plotIndex, subplotIndex) {
    if (S.workers.length >= 10) {
        toast('Max 10 workers!', 'err');
        playS('err');
        return;
    }

    const cost = 500 + S.workers.length * 200;
    if (S.money < cost) {
        toast('Not enough money!', 'err');
        playS('err');
        return;
    }

    S.money -= cost;
    S.workers.push({ plot: plotIndex, sub: subplotIndex });
    toast('Worker hired!', 'ok');
    playS('ach');
    save();
    window.render();
}

/**
 * Fire a worker by index
 * @param {number} index - Worker index to remove
 */
export function fireWorker(index) {
    if (!confirm('Fire this worker?')) return;
    S.workers.splice(index, 1);
    toast('Worker fired', 'ok');
    save();
    window.render();
}

/**
 * Update workers - auto-harvest their assigned plots
 * Called from game loop every 5 seconds
 */
export function updateWorkers() {
    S.workers.forEach(w => {
        const subplot = S.plots[w.plot]?.subs[w.sub];
        if (!subplot) return;

        // Workers auto-tap their assigned subplot
        window.tap(w.plot, w.sub);
    });
}
