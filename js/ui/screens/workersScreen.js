/**
 * Workers Screen Renderer
 * Simplified: generic workers only (no types/specializations)
 */

import { S } from '../../core/state.js';
import { SUBPLOT_TYPES } from '../../config/buildings.js';

let lastWorkersState = null;
let isWorkersInitialized = false;

export function resetWorkersInit() {
    isWorkersInitialized = false;
    lastWorkersState = null;
}

/**
 * Render the workers screen
 * @param {HTMLElement} container
 */
export function renderWorkersScreen(container) {
    const currentWorkersState = JSON.stringify(S.workers) + S.plots.length;
    if (!isWorkersInitialized || currentWorkersState !== lastWorkersState) {
        container.innerHTML = buildWorkersHTML();
        lastWorkersState = currentWorkersState;
        isWorkersInitialized = true;
    }
}

function buildWorkersHTML() {
    const cap = window.getWorkerCap ? window.getWorkerCap() : S.plots.length * 3;
    const cost = window.getWorkerCost ? window.getWorkerCost() : (200 + S.workers.length * 150);

    let html = `<div class="panel">
        <h3>👷 Workers (${S.workers.length}/${cap})</h3>
        <p style="color:var(--muted);font-size:0.8rem;margin-bottom:4px">
            Workers auto-harvest their assigned subplot every 5 seconds.
        </p>
        <p style="color:var(--blue);font-size:0.75rem;margin-bottom:12px">
            Worker cap: <b>${cap}</b> (3 per plot). Next hire: <b>$${cost}</b>
        </p>`;

    if (S.workers.length === 0) {
        html += `<div class="empty">No workers hired yet. Hire one below!</div>`;
    } else {
        html += `<div class="list">`;
        S.workers.forEach((worker, index) => {
            html += renderWorker(worker, index);
        });
        html += `</div>`;
    }

    html += `</div>` + renderHiringPanel(cost, cap);
    return html;
}

function renderWorker(worker, index) {
    const subplot = S.plots[worker.plot]?.subs[worker.sub];
    const config = subplot ? SUBPLOT_TYPES[subplot.t] : null;

    return `<div class="npc">
        <div class="ic">👷</div>
        <div class="info">
            <div class="nm">Worker #${index + 1}</div>
            <div class="rate" style="display:flex;flex-direction:column;gap:2px">
                <span>📍 Plot ${worker.plot + 1} — ${config?.n || '?'} ${config?.i || ''}</span>
                <span style="color:var(--green);font-size:0.75rem">Auto-harvests every 5s (+25% bonus)</span>
            </div>
        </div>
        <button class="btn red" data-action="fire-worker" data-index="${index}">Fire</button>
    </div>`;
}

function renderHiringPanel(cost, cap) {
    const atCap = S.workers.length >= cap;

    let html = `<div class="panel">
        <h3>➕ Assign Worker to Subplot</h3>
        ${atCap
            ? `<p style="color:var(--red);font-size:0.8rem;margin-bottom:8px">Worker cap reached (${cap}/${cap}). Buy more plots to hire more!</p>`
            : `<p style="color:var(--muted);font-size:0.75rem;margin-bottom:8px">Tap a subplot to assign a worker. Cost: <b style="color:var(--gold)">$${cost}</b></p>`
        }
        <div class="list">`;

    S.plots.forEach((plot, plotIndex) => {
        plot.subs.forEach((subplot, subIndex) => {
            const config = SUBPLOT_TYPES[subplot.t];
            if (!config) return;

            const hasWorker = S.workers.some(w => w.plot === plotIndex && w.sub === subIndex);

            if (hasWorker) {
                html += `<div class="item" style="opacity:0.5">
                    <span class="ic">${config.i}</span>
                    <span class="nm">Plot ${plotIndex + 1} — ${config.n}</span>
                    <span style="color:var(--muted);font-size:0.8rem">✓ Working</span>
                </div>`;
            } else {
                html += `<div class="item">
                    <span class="ic">${config.i}</span>
                    <span class="nm">Plot ${plotIndex + 1} — ${config.n}</span>
                    <button class="btn green" 
                        ${atCap ? 'disabled' : ''}
                        data-action="hire-worker" 
                        data-plot="${plotIndex}" 
                        data-sub="${subIndex}">
                        ${atCap ? '🔒' : `Hire $${cost}`}
                    </button>
                </div>`;
            }
        });
    });

    html += `</div></div>`;
    return html;
}
