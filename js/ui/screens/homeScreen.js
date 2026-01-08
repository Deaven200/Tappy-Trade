/**
 * Home Screen Renderer (Optimized)
 * Uses selective DOM updates instead of innerHTML replacement
 */

import { S } from '../../core/state.js';
import { T, R, PLOTS } from '../../config/data.js';

let isInitialized = false;
let lastPlotCount = 0;
let lastBuildingLevels = '';

/**
 * Reset initialization flag (called on screen switch)
 */
export function resetHomeInit() {
    isInitialized = false;
    lastPlotCount = 0;
    lastBuildingLevels = '';
}

/**
 * Render the home screen with plot grid
 * @param {HTMLElement} container - Container element to render into
 */
export function renderHomeScreen(container) {
    // Check if structural changes occurred (plots added/removed, buildings upgraded)
    const currentPlotCount = S.plots.length;
    const currentBuildingLevels = S.plots.map(p => p.subs.map(s => s.lv || 1).join(',')).join(';');
    const structureChanged = currentPlotCount !== lastPlotCount || currentBuildingLevels !== lastBuildingLevels;

    // First render: create DOM structure
    if (!isInitialized || container.children.length === 0 || structureChanged) {
        buildInitialDOM(container);
        isInitialized = true;
        lastPlotCount = currentPlotCount;
        lastBuildingLevels = currentBuildingLevels;
    }

    // Subsequent renders: only update changing values
    updatePlotValues(container);
}

/**
 * Build initial DOM structure (called once)
 */
function buildInitialDOM(container) {
    let html = '';

    // Render existing plots
    S.plots.forEach((plot, plotIndex) => {
        html += renderPlot(plot, plotIndex);
    });

    // Render "Buy Plot" locked slot
    html += renderBuyPlotSlot();

    container.innerHTML = html;
}

/**
 * Update only the changing values in existing DOM elements
 */
function updatePlotValues(container) {
    // Update each subplot's display values
    S.plots.forEach((plot, plotIndex) => {
        plot.subs.forEach((subplot, subIndex) => {
            updateSubplotDisplay(plotIndex, subIndex, subplot);
        });
    });

    // Update buy plot button
    updateBuyPlotButton(container);
}

/**
 * Update a single subplot's display without recreating it
 */
function updateSubplotDisplay(plotIndex, subIndex, subplot) {
    const element = document.querySelector(`[data-p="${plotIndex}"][data-s="${subIndex}"]`);
    if (!element) return;

    const config = T[subplot.t];
    if (!config) return;

    const level = subplot.lv || 1;
    const storageBonus = (level - 1) * 10;
    const maxStorage = (config.m || 999) + storageBonus;
    const count = Math.floor(subplot.c);

    // Progress indicators
    const nextPct = config.m ? Math.round((subplot.c % 1) * 100) : 0;
    const fillPct = config.m ? Math.round((count / maxStorage) * 100) : 0;
    const isFull = config.m && count >= maxStorage;

    // Update CSS classes
    element.classList.toggle('ready', isFull);

    // Update progress ring
    const progressRing = element.querySelector('.progress-ring');
    if (progressRing) {
        progressRing.classList.toggle('full', isFull);
        progressRing.style.setProperty('--progress', `${isFull ? 100 : nextPct}%`);
    }

    // Update count text
    const countSpan = element.querySelector('.progress-ring-inner span');
    if (countSpan) {
        countSpan.textContent = `${count}/${maxStorage}`;
    }

    // Update fill gradient
    const progressInner = element.querySelector('.progress-ring-inner');
    if (progressInner) {
        progressInner.style.background = `linear-gradient(to top, var(--green) ${fillPct}%, var(--card) ${fillPct}%)`;
    }
}

/**
 * Update buy plot button state
 */
function updateBuyPlotButton(container) {
    const buyPlotContainer = container.querySelector('.plot.locked');
    if (!buyPlotContainer) return;

    const nextPlotCost = PLOTS[S.plots.length] || 999999;
    const canAfford = S.money >= nextPlotCost;

    // Update CSS class
    buyPlotContainer.classList.toggle('can', canAfford);

    // Update button state and text
    const button = buyPlotContainer.querySelector('button');
    if (button) {
        button.disabled = !canAfford;
        button.textContent = canAfford ? 'Buy Plot' : 'Need $' + (nextPlotCost - S.money).toLocaleString();
    }
}

/**
 * Render a single plot with its subplots (initial render only)
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
 * Render a single subplot (initial render only)
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
    const ready = isFull;

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

/**
 * Render buy plot slot (initial render only)
 */
function renderBuyPlotSlot() {
    const nextPlotCost = PLOTS[S.plots.length] || 999999;
    const canAfford = S.money >= nextPlotCost;

    return `<div class="plot locked ${canAfford ? 'can' : ''}">
        <div style="font-size:1.8rem;opacity:0.5">🔒</div>
        <h4>$${nextPlotCost.toLocaleString()}</h4>
        <button ${canAfford ? '' : 'disabled'} data-action="buy-plot">
            ${canAfford ? 'Buy Plot' : 'Need $' + (nextPlotCost - S.money).toLocaleString()}
        </button>
    </div>`;
}
