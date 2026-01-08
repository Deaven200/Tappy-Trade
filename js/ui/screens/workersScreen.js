/**
 * Workers Screen Renderer
 * Handles worker management and hiring interface
 */

import { S } from '../../core/state.js';
import { T } from '../../config/data.js';

/**
 * Render the workers screen
 * @param {HTMLElement} container - Container element to render into
 */
export function renderWorkersScreen(container) {
    let html = `<div class="panel">
        <h3>👷 Workers (${S.workers.length}/10)</h3>
        <p style="color:var(--muted);font-size:0.8rem;margin-bottom:12px">
            Workers auto-harvest every 5 seconds. Tap a plot on Home screen, then "Hire Worker" below.
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

    return `<div class="npc">
        <div class="ic">👷</div>
        <div class="info">
            <div class="nm">Worker #${index + 1}</div>
            <div class="rate">On: ${config?.n || '?'} (Plot ${worker.plot + 1})</div>
        </div>
        <button class="btn red" data-action="fire-worker" data-index="${index}">Fire</button>
    </div>`;
}

/**
 * Render the hiring panel showing available plots
 * @returns {string} HTML string
 */
function renderHiringPanel() {
    let html = `<div class="panel">
        <h3>➕ Hire for Plot</h3>
        <div class="list">`;

    S.plots.forEach((plot, plotIndex) => {
        plot.subs.forEach((subplot, subIndex) => {
            const config = T[subplot.t];
            if (!config) return;

            const cost = 500 + S.workers.length * 200;
            html += `<div class="item">
                <span class="ic">${config.i}</span>
                <span class="nm">Plot ${plotIndex + 1} - ${config.n}</span>
                <button class="btn green" data-action="hire-worker" data-plot="${plotIndex}" data-sub="${subIndex}">$${cost}</button>
            </div>`;
        });
    });

    html += `</div></div>`;
    return html;
}
