/**
 * Workers Screen Renderer
 * Handles worker management and hiring interface
 * Now supports specialized worker types with bonuses
 */

import { S } from '../../core/state.js';
import { T } from '../../config/data.js';
import { WORKER_TYPES, getWorkerCost } from '../../config/workerTypes.js';

let lastWorkersState = null;
let isWorkersInitialized = false;

/**
 * Reset initialization flag (called on screen switch)
 */
export function resetWorkersInit() {
    isWorkersInitialized = false;
    lastWorkersState = null;
}

/**
 * Render the workers screen
 * @param {HTMLElement} container - Container element to render into
 */
export function renderWorkersScreen(container) {
    // Check if workers changed
    const currentWorkersState = JSON.stringify(S.workers);
    const workersChanged = currentWorkersState !== lastWorkersState;

    // Only re-render if workers changed or first render
    if (!isWorkersInitialized || workersChanged) {
        let html = `<div class="panel">
            <h3>👷 Workers (${S.workers.length}/10)</h3>
            <p style="color:var(--muted);font-size:0.8rem;margin-bottom:12px">
                Workers auto-harvest every 5 seconds. Specialized workers get +25% bonus!
            </p>`;

        // Current workers list
        if (S.workers.length === 0) {
            html += `<div class="empty">No workers yet</div>`;
        } else {
            html += `<div class="list">`;
            S.workers.forEach((worker, index) => {
                html += renderWorker(worker, index);
            });
            html += `</div>`;
        }

        html += `</div>`;

        // Hiring panel
        html += renderHiringPanel();

        container.innerHTML = html;

        lastWorkersState = currentWorkersState;
        isWorkersInitialized = true;
    }
}

/**
 * Render a single worker card
 * @param {Object} worker - Worker data
 * @param {number} index - Worker index
 * @returns {string} HTML string
 */
function renderWorker(worker, index) {
    const subplot = S.plots[worker.plot]?.subs[worker.sub];
    const config = subplot ? T[subplot.t] : null;

    // Get worker type info (default to general for legacy workers)
    const workerType = worker.type || 'general';
    const typeInfo = WORKER_TYPES[workerType] || WORKER_TYPES.general;

    return `<div class="npc">
        <div class="ic">${typeInfo.icon}</div>
        <div class="info">
            <div class="nm">${typeInfo.name} #${index + 1}</div>
            <div class="rate" style="display:flex;flex-direction:column;gap:2px">
                <span>📍 Plot ${worker.plot + 1} - ${config?.n || '?'}</span>
                <span style="color:var(--green);font-size:0.75rem">${typeInfo.description}</span>
            </div>
        </div>
        <button class="btn red" data-action="fire-worker" data-index="${index}">Fire</button>
    </div>`;
}

/**
 * Render the hiring panel showing available plots
 * @returns {string} HTML string
 */
function renderHiringPanel() {
    const baseCost = getWorkerCost(S.workers.length, 'general');

    let html = `<div class="panel">
        <h3>➕ Hire for Plot</h3>
        <p style="color:var(--muted);font-size:0.75rem;margin-bottom:8px">
            Tap to select worker type. Base cost: $${baseCost}
        </p>
        <div class="list">`;

    S.plots.forEach((plot, plotIndex) => {
        plot.subs.forEach((subplot, subIndex) => {
            const config = T[subplot.t];
            if (!config) return;

            // Check if already has a worker
            const hasWorker = S.workers.some(w => w.plot === plotIndex && w.sub === subIndex);

            if (hasWorker) {
                html += `<div class="item" style="opacity:0.5">
                    <span class="ic">${config.i}</span>
                    <span class="nm">Plot ${plotIndex + 1} - ${config.n}</span>
                    <span style="color:var(--muted);font-size:0.8rem">✓ Has worker</span>
                </div>`;
            } else {
                html += `<div class="item">
                    <span class="ic">${config.i}</span>
                    <span class="nm">Plot ${plotIndex + 1} - ${config.n}</span>
                    <button class="btn green" data-action="hire-worker" data-plot="${plotIndex}" data-sub="${subIndex}">
                        Hire $${baseCost}+
                    </button>
                </div>`;
            }
        });
    });

    html += `</div></div>`;
    return html;
}
