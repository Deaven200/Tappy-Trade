/**
 * Event Delegation System
 * Centralized event handling to persist across re-renders
 */

import { tap } from '../mechanics/harvesting.js';
import { buyPlot } from '../mechanics/plots.js';
import { hireWorker, fireWorker } from '../mechanics/workers.js';
import { sell, sellAll } from '../mechanics/market.js';
import { setInvView, setInvSort } from './render.js';

/**
 * Initialize event delegation - call once on app startup
 */
export function initializeEventHandlers() {
    const mainContainer = document.getElementById('main');
    if (!mainContainer) {
        console.error('Main container not found - event delegation not initialized');
        return;
    }

    // Single click listener for all interactions
    mainContainer.addEventListener('click', handleClick);

    // Handle select/dropdown changes
    mainContainer.addEventListener('change', handleChange);

    console.log('✅ Event delegation initialized');
}

/**
 * Central click handler - routes to appropriate action based on data attributes
 */
function handleClick(event) {
    const target = event.target.closest('[data-action]');
    if (!target) return;

    const action = target.dataset.action;

    // Prevent default for buttons and links
    event.preventDefault();

    // Route to appropriate handler
    switch (action) {
        case 'tap':
            handleTap(target);
            break;
        case 'buy-plot':
            handleBuyPlot();
            break;
        case 'set-view':
            handleSetView(target);
            break;
        case 'sell':
            handleSell(target);
            break;
        case 'sell-all':
            handleSellAll();
            break;
        case 'fire-worker':
            handleFireWorker(target);
            break;
        case 'hire-worker':
            handleHireWorker(target);
            break;
        default:
            console.warn('Unknown action:', action);
    }
}

/**
 * Handle dropdown/select changes
 */
function handleChange(event) {
    const target = event.target.closest('[data-action]');
    if (!target) return;

    const action = target.dataset.action;

    switch (action) {
        case 'set-sort':
            handleSetSort(target);
            break;
        default:
            // Not an action we handle
            break;
    }
}

// ===== ACTION HANDLERS =====

/**
 * Handle subplot tap (harvest resources)
 */
function handleTap(element) {
    const plotIndex = parseInt(element.dataset.p, 10);
    const subIndex = parseInt(element.dataset.s, 10);

    if (isNaN(plotIndex) || isNaN(subIndex)) {
        console.error('Invalid plot/subplot indices');
        return;
    }

    tap(plotIndex, subIndex);
}

/**
 * Handle buy plot action
 */
function handleBuyPlot() {
    buyPlot();
}

/**
 * Handle inventory view change (list/grid)
 */
function handleSetView(element) {
    const view = element.dataset.view;
    if (view) {
        setInvView(view);
    }
}

/**
 * Handle inventory sort change
 */
function handleSetSort(element) {
    const sort = element.value;
    if (sort) {
        setInvSort(sort);
    }
}

/**
 * Handle sell item action
 */
function handleSell(element) {
    const itemId = element.dataset.item;
    const qty = parseInt(element.dataset.qty, 10);

    if (!itemId || isNaN(qty)) {
        console.error('Invalid sell parameters');
        return;
    }

    sell(itemId, qty);
}

/**
 * Handle sell all action
 */
function handleSellAll() {
    sellAll();
}

/**
 * Handle fire worker action
 */
function handleFireWorker(element) {
    const index = parseInt(element.dataset.index, 10);

    if (isNaN(index)) {
        console.error('Invalid worker index');
        return;
    }

    fireWorker(index);
}

/**
 * Handle hire worker action
 */
function handleHireWorker(element) {
    const plotIndex = parseInt(element.dataset.plot, 10);
    const subIndex = parseInt(element.dataset.sub, 10);

    if (isNaN(plotIndex) || isNaN(subIndex)) {
        console.error('Invalid hire worker parameters');
        return;
    }

    hireWorker(plotIndex, subIndex);
}
