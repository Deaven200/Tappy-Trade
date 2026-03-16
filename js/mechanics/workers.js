/**
 * Worker Mechanics
 * Simple, generic workers that auto-harvest their assigned subplot.
 * No specialized types — just hire a worker and assign them a plot.
 */

import { S } from '../core/state.js';
import { T } from '../config/buildings.js';
import { toast, playS } from '../utils/feedback.js';
import { save } from '../core/storage.js';

/** Fixed harvest bonus all workers apply (25%) */
const WORKER_HARVEST_BONUS = 1.25;

/**
 * Get the cost of hiring the next worker.
 * Scales with number of workers already hired.
 * @returns {number}
 */
export function getWorkerCost() {
    return 200 + S.workers.length * 150;
}

/**
 * Get the maximum allowed workers (3 per owned plot).
 * @returns {number}
 */
export function getWorkerCap() {
    return S.plots.length * 3;
}

/**
 * Hire a worker and assign them to a subplot.
 * @param {number} plotIndex - Plot index
 * @param {number} subplotIndex - Subplot index
 */
export function hireWorker(plotIndex, subplotIndex) {
    const cap = getWorkerCap();
    if (S.workers.length >= cap) {
        toast(`Max ${cap} workers! Buy more land to hire more.`, 'err');
        playS('err');
        return;
    }

    const cost = getWorkerCost();
    if (S.money < cost) {
        toast(`Need $${cost} to hire a worker!`, 'err');
        playS('err');
        return;
    }

    S.money -= cost;
    S.workers.push({ plot: plotIndex, sub: subplotIndex });

    toast(`👷 Worker hired for $${cost}!`, 'ok');
    playS('ach');
    save();
    window.render();
}

/**
 * Fire a worker by index.
 * @param {number} index - Worker array index
 */
export function fireWorker(index) {
    // Show custom in-game confirmation modal instead of native confirm()
    showFireWorkerConfirm(index);
}

/**
 * Show a custom confirmation modal before firing a worker.
 * @param {number} index - Worker index
 */
function showFireWorkerConfirm(index) {
    const existing = document.getElementById('fire-worker-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'fire-worker-modal';
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-box" style="max-width:340px">
            <div class="modal-head">
                <h3>👷 Fire Worker?</h3>
                <button class="modal-close" onclick="document.getElementById('fire-worker-modal')?.remove()">×</button>
            </div>
            <div class="modal-body" style="text-align:center;padding:16px">
                <div style="font-size:2.5rem;margin-bottom:12px">😢</div>
                <p style="margin-bottom:20px;color:var(--muted)">This worker will stop harvesting their assigned subplot.</p>
                <div style="display:flex;gap:8px">
                    <button class="btn" style="flex:1;background:var(--red)"
                        onclick="window._confirmFireWorker(${index})">Fire</button>
                    <button class="btn" style="flex:1"
                        onclick="document.getElementById('fire-worker-modal')?.remove()">Cancel</button>
                </div>
            </div>
        </div>`;
    document.body.appendChild(modal);
}

// Internal confirm handler exposed on window for the modal button
window._confirmFireWorker = function (index) {
    document.getElementById('fire-worker-modal')?.remove();
    S.workers.splice(index, 1);
    toast('Worker let go', 'ok');
    save();
    window.render();
};

/**
 * Update all workers — auto-harvest their assigned subplots.
 * Called from game loop every 5 seconds.
 * Manufacturing buildings are handled specially (they process inventory).
 */
export function updateWorkers() {
    S.workers.forEach(w => {
        const subplot = S.plots[w.plot]?.subs[w.sub];
        if (!subplot) return;

        const config = T[subplot.t];
        if (!config) return;

        // Check inventory capacity first
        const invTotal = window.getInvTotal ? window.getInvTotal() : 0;
        if (invTotal >= S.cap) return;

        if (config.pool) {
            // Wild subplot — random resource from pool
            if (subplot.c >= 1) {
                subplot.c--;
                const item = config.pool[Math.floor(Math.random() * config.pool.length)];
                window.addItem?.(item, 1);
                S.stats.harvested = (S.stats.harvested || 0) + 1;
            }
        } else if (config.req) {
            // Manufacturing building — consume input, produce output
            const available = (S.inv[config.req] || 0);
            if (available >= config.use && config.o) {
                window.remItem?.(config.req, config.use);
                window.addItem?.(config.o, 1);
                S.stats.harvested = (S.stats.harvested || 0) + 1;
            }
        } else if (config.o && config.r) {
            // Regular resource building — harvest when ready
            if (subplot.c >= 1) {
                const amount = Math.max(1, Math.floor(WORKER_HARVEST_BONUS));
                subplot.c -= 1;
                window.addItem?.(config.o, amount);
                S.stats.harvested = (S.stats.harvested || 0) + amount;

                // Handle bonus drops (livestock extras: beef, leather, mutton, etc.)
                if (config.x) {
                    for (const [bonusItem, bonusRate] of Object.entries(config.x)) {
                        if (Math.random() < bonusRate) {
                            window.addItem?.(bonusItem, 1);
                        }
                    }
                }
            }
        }
    });
}
