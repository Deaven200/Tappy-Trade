/**
 * Home Screen Renderer
 * Handles plot grid and subplot display
 */

import { S } from '../../core/state.js';
import { T, R, PLOTS } from '../../config/data.js';

/**
 * Render the home screen with plot grid
 * @param {HTMLElement} container - Container element to render into
 */
export function renderHomeScreen(container) {
    let html = '';

    // Render existing plots
    S.plots.forEach((plot, plotIndex) => {
        html += renderPlot(plot, plotIndex);
    });

    // Render "Buy Plot" locked slot
    const nextPlotCost = PLOTS[S.plots.length] || 999999;
    const canAfford = S.money >= nextPlotCost;
    html += `<div class="plot locked ${canAfford ? 'can' : ''}">
        <div style="font-size:1.8rem;opacity:0.5">🔒</div>
        <h4>$${nextPlotCost.toLocaleString()}</h4>
        <button ${canAfford ? '' : 'disabled'} data-action="buy-plot">
            ${canAfford ? 'Buy Plot' : 'Need $' + (nextPlotCost - S.money).toLocaleString()}
        </button>
    </div>`;

    container.innerHTML = html;
}

/**
 * Render a single plot with its subplots
 * @param {Object} plot - Plot data
 * @param {number} plotIndex - Index of the plot
 * @returns {string} HTML string
 */
function renderPlot(plot, plotIndex) {
    let html = `<div class="plot"><div class="subs">`;

    plot.subs.forEach((subplot, subIndex) => {
        html += renderSubplot(subplot, plotIndex, subIndex);
    });

    html += `</div></div>`;
    return html;
}

/**
 * Render a single subplot
 * @param {Object} subplot - Subplot data
 * @param {number} plotIndex - Parent plot index
 * @param {number} subIndex - Subplot index
 * @returns {string} HTML string
 */
function renderSubplot(subplot, plotIndex, subIndex) {
    const config = T[subplot.t];
    if (!config) return '';

    const level = subplot.lv || 1;
    const storageBonus = (level - 1) * 10;
    const maxStorage = (config.m || 999) + storageBonus;
    const count = Math.floor(subplot.c);

    // Progress indicators
    const nextPct = config.m ? Math.round((subplot.c % 1) * 100) : 0;
    const fillPct = config.m ? Math.round((count / maxStorage) * 100) : 0;
    const isFull = config.m && count >= maxStorage;
    const ready = isFull; // Only glow when at full capacity

    return `<div class="sub ${ready ? 'ready' : ''} ${config.b ? 'building' : ''}" 
                 data-action="tap"
                 data-p="${plotIndex}" data-s="${subIndex}" 
                 style="opacity:0.85;backdrop-filter:blur(2px)">
        <div class="icon">${config.i}</div>
        <div class="progress-ring ${isFull ? 'full' : ''}" style="--progress: ${isFull ? 100 : nextPct}%">
            <div class="progress-ring-inner" style="background: linear-gradient(to top, var(--green) ${fillPct}%, var(--card) ${fillPct}%)">
                <span style="text-shadow: 0 1px 2px rgba(0,0,0,0.5)">${count}/${maxStorage}</span>
            </div>
        </div>
        ${subplot.lv > 1 ? `<span class="lvl">Lv${subplot.lv}</span>` : ''}
    </div>`;
}
