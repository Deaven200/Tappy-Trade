/**
 * Home Screen - Sub-plot display and harvesting
 */

import { gameState } from '../game/GameState.js';
import { SUB_PLOT_TYPES, RESOURCES } from '../game/Resources.js';
import { showToast } from './Toast.js';

/**
 * Render the home screen content
 */
export function renderHomeScreen(container) {
    const subPlot = gameState.getSelectedSubPlot();
    const config = subPlot.getTypeConfig();
    const isReady = subPlot.isReady();

    container.innerHTML = `
    <div class="sub-plot-details fade-in">
      <h2>${config.icon} ${config.name}</h2>
      <p class="resources-available">
        ${isReady ? 'Resources ready to harvest!' : 'Regrowing...'}
      </p>
      
      ${isReady ? renderResourceList(subPlot) : ''}
      
      <button class="harvest-btn" id="harvest-btn" ${!isReady ? 'disabled' : ''}>
        ${isReady ? '🌾 HARVEST ALL' : '⏳ Regrowing...'}
      </button>
      
      ${!isReady ? `
        <div class="regrow-timer" id="regrow-timer">
          ⏱️ ${subPlot.getRegrowthString()} remaining
        </div>
      ` : ''}
    </div>
  `;

    // Add harvest button listener
    const harvestBtn = document.getElementById('harvest-btn');
    harvestBtn?.addEventListener('click', handleHarvest);

    // Start timer updates if regrowing
    if (!isReady) {
        startTimerUpdates(container);
    }
}

/**
 * Render the resource list for a sub-plot
 */
function renderResourceList(subPlot) {
    const pending = subPlot.pendingYield || {};

    let html = '<div class="resource-list">';

    for (const [resourceId, amount] of Object.entries(pending)) {
        const resource = RESOURCES[resourceId];
        if (!resource) continue;

        html += `
      <div class="resource-item">
        <div class="resource-info">
          <span class="resource-icon">${resource.icon}</span>
          <span class="resource-name">${resource.name}</span>
        </div>
        <span class="resource-qty">+${amount}</span>
      </div>
    `;
    }

    html += '</div>';
    return html;
}

/**
 * Handle harvest button click
 */
function handleHarvest() {
    const harvested = gameState.harvestSelected();

    if (harvested) {
        // Show toast with harvested resources
        const items = Object.entries(harvested)
            .filter(([_, qty]) => qty > 0)
            .map(([id, qty]) => `${RESOURCES[id]?.icon || ''} +${qty}`)
            .join('  ');

        showToast(`Harvested: ${items}`, 'success');

        // Animate button
        const btn = document.getElementById('harvest-btn');
        btn?.classList.add('animate-pulse');
    }
}

/**
 * Start periodic timer updates for regrowth display
 */
let timerInterval = null;

function startTimerUpdates(container) {
    // Clear any existing interval
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    timerInterval = setInterval(() => {
        const subPlot = gameState.getSelectedSubPlot();
        const timerEl = document.getElementById('regrow-timer');

        if (subPlot.isReady()) {
            // Regrowth complete, re-render
            clearInterval(timerInterval);
            timerInterval = null;
            renderHomeScreen(container);
            showToast('🌱 Resources have regrown!', 'info');
        } else if (timerEl) {
            timerEl.textContent = `⏱️ ${subPlot.getRegrowthString()} remaining`;
        }
    }, 1000);
}

/**
 * Update sub-plot display boxes in the header
 */
export function updateSubPlotBoxes() {
    const plot = gameState.getCurrentPlot();

    for (let i = 0; i < 3; i++) {
        const subPlot = plot.getSubPlot(i);
        const element = document.getElementById(`sub-plot-${i}`);
        if (!element || !subPlot) continue;

        const config = subPlot.getTypeConfig();
        const isReady = subPlot.isReady();
        const isSelected = gameState.selectedSubPlotIndex === i;

        // Update content
        element.querySelector('.sub-plot-icon').textContent = config.icon;
        element.querySelector('.sub-plot-label').textContent = config.name;
        element.querySelector('.sub-plot-status').textContent =
            isReady ? 'Ready' : subPlot.getRegrowthString();

        // Update classes
        element.classList.toggle('selected', isSelected);
        element.classList.toggle('regrowing', !isReady);
    }
}

/**
 * Initialize sub-plot click handlers
 */
export function initSubPlotHandlers(onSelectCallback) {
    const subPlotElements = document.querySelectorAll('.sub-plot');

    subPlotElements.forEach(element => {
        element.addEventListener('click', () => {
            const index = parseInt(element.dataset.index, 10);
            gameState.selectSubPlot(index);
            updateSubPlotBoxes();
            if (onSelectCallback) onSelectCallback();
        });
    });
}

/**
 * Cleanup function
 */
export function cleanupHomeScreen() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}
