/**
 * Contextual Tooltip System
 * Shows helpful tooltips on hover/long-press for UI elements
 */

import { R } from '../config/resources.js';
import { T } from '../config/buildings.js';
import { getBonusInfo } from '../mechanics/plotEffects.js';
import { WORKER_TYPES } from '../config/workerTypes.js';

let tooltipElement = null;
let tooltipTimeout = null;
let longPressTimeout = null;

/**
 * Initialize tooltip system
 */
export function initTooltips() {
    // Create tooltip element
    if (!tooltipElement) {
        tooltipElement = document.createElement('div');
        tooltipElement.id = 'game-tooltip';
        tooltipElement.className = 'tooltip';
        tooltipElement.style.cssText = `
            position: fixed;
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 10px 14px;
            font-size: 0.85rem;
            max-width: 250px;
            z-index: 10000;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        document.body.appendChild(tooltipElement);
    }

    // Setup hover listeners for tooltips
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);
    document.addEventListener('mousemove', updateTooltipPosition);

    // Long-press for mobile
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchmove', handleTouchEnd); // Cancel on move

    console.log('💡 Tooltip system initialized');
}

/**
 * Handle mouse entering an element
 */
function handleMouseOver(e) {
    const target = e.target.closest('[data-tooltip], .sub, .item, .npc, .btn');
    if (!target) return;

    // Clear any existing timeout
    clearTimeout(tooltipTimeout);

    // Delay showing tooltip slightly
    tooltipTimeout = setTimeout(() => {
        const content = generateTooltipContent(target);
        if (content) {
            showTooltip(content, e);
        }
    }, 400);
}

/**
 * Handle mouse leaving an element
 */
function handleMouseOut() {
    clearTimeout(tooltipTimeout);
    hideTooltip();
}

/**
 * Handle touch start (for long-press on mobile)
 */
function handleTouchStart(e) {
    const target = e.target.closest('[data-tooltip], .sub, .item, .npc');
    if (!target) return;

    longPressTimeout = setTimeout(() => {
        const content = generateTooltipContent(target);
        if (content) {
            showTooltip(content, e.touches[0]);
            // Vibrate for feedback
            if (navigator.vibrate) navigator.vibrate(50);
        }
    }, 500);
}

/**
 * Handle touch end (cancel long-press)
 */
function handleTouchEnd() {
    clearTimeout(longPressTimeout);
    setTimeout(hideTooltip, 100);
}

/**
 * Generate tooltip content based on element type
 */
function generateTooltipContent(element) {
    // Explicit data-tooltip
    if (element.dataset.tooltip) {
        return element.dataset.tooltip;
    }

    // Subplot card
    if (element.classList.contains('sub')) {
        const plotIndex = parseInt(element.dataset.p);
        const subIndex = parseInt(element.dataset.s);
        return generateSubplotTooltip(plotIndex, subIndex);
    }

    // Inventory item
    if (element.classList.contains('item') && element.dataset.item) {
        return generateItemTooltip(element.dataset.item);
    }

    // Worker card
    if (element.classList.contains('npc')) {
        return generateWorkerTooltip(element);
    }

    return null;
}

/**
 * Generate tooltip for a subplot
 */
function generateSubplotTooltip(plotIndex, subIndex) {
    if (isNaN(plotIndex) || isNaN(subIndex)) return null;

    const subplot = window.S?.plots?.[plotIndex]?.subs?.[subIndex];
    if (!subplot) return null;

    const config = T[subplot.t];
    if (!config) return null;

    const bonusInfo = getBonusInfo(plotIndex, subIndex);

    let html = `<div style="font-weight:600;margin-bottom:4px">${config.i} ${config.n}</div>`;
    html += `<div style="font-size:0.75rem;color:var(--muted)">Level ${subplot.lv || 1}</div>`;

    if (config.o) {
        const resource = R[config.o];
        html += `<div style="margin-top:6px">Produces: ${resource?.i || ''} ${resource?.n || config.o}</div>`;
    }

    if (bonusInfo.synergy) {
        html += `<div style="color:var(--purple);margin-top:4px">⚡ ${bonusInfo.synergy.description}</div>`;
    }

    if (bonusInfo.fertilized) {
        html += `<div style="color:var(--green);margin-top:4px">🌱 2x Fertilized (${bonusInfo.fertilizerTime})</div>`;
    }

    if (bonusInfo.total > 1) {
        html += `<div style="color:var(--gold);margin-top:4px;font-weight:600">Total Bonus: +${Math.round((bonusInfo.total - 1) * 100)}%</div>`;
    }

    return html;
}

/**
 * Generate tooltip for an inventory item
 */
function generateItemTooltip(itemId) {
    const resource = R[itemId];
    if (!resource) return null;

    return `
        <div style="font-weight:600;margin-bottom:4px">${resource.i} ${resource.n}</div>
        <div style="color:var(--gold)">Base Price: $${resource.p}</div>
    `;
}

/**
 * Generate tooltip for a worker
 */
function generateWorkerTooltip(element) {
    const workerType = element.querySelector('.nm')?.textContent || 'Worker';
    return `<div>👷 ${workerType}</div><div style="font-size:0.75rem;color:var(--muted)">Auto-harvests every 5 seconds</div>`;
}

/**
 * Show the tooltip at the given position
 */
function showTooltip(content, event) {
    if (!tooltipElement) return;

    tooltipElement.innerHTML = content;
    tooltipElement.style.opacity = '1';
    updateTooltipPosition(event);
}

/**
 * Update tooltip position based on cursor/touch
 */
function updateTooltipPosition(event) {
    if (!tooltipElement || tooltipElement.style.opacity === '0') return;

    const x = event.clientX || event.pageX || 0;
    const y = event.clientY || event.pageY || 0;

    // Position tooltip near cursor, avoiding edges
    const rect = tooltipElement.getBoundingClientRect();
    let left = x + 15;
    let top = y + 15;

    if (left + rect.width > window.innerWidth - 10) {
        left = x - rect.width - 15;
    }
    if (top + rect.height > window.innerHeight - 10) {
        top = y - rect.height - 15;
    }

    tooltipElement.style.left = `${Math.max(10, left)}px`;
    tooltipElement.style.top = `${Math.max(10, top)}px`;
}

/**
 * Hide the tooltip
 */
function hideTooltip() {
    if (tooltipElement) {
        tooltipElement.style.opacity = '0';
    }
}

// Auto-initialize on import
if (typeof document !== 'undefined') {
    // Wait for DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTooltips);
    } else {
        initTooltips();
    }
}

// Export for global access
window.initTooltips = initTooltips;
