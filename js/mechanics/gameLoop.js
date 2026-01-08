/**
 * Game Loop
 * Main update cycle for resource regeneration and automation
 */

import { S } from '../core/state.js';
import { updatePlots } from './plots.js';
import { updateWorkers } from './workers.js';
import { save } from '../core/storage.js';

let lastUpdate = Date.now();
let workerTimer = 0;
let saveTimer = 0;
let limitOrderTimer = 0;
let achievementTimer = 0; // Check achievements periodically
let renderTimer = 0; // Throttle render calls

/**
 * Main game loop update function
 * @param {number} delta - Time delta in seconds
 */
export function update(delta) {
    // Update resource regeneration
    updatePlots(delta);

    // Update workers (auto-harvest) every 5 seconds
    workerTimer += delta;
    while (workerTimer >= 5) {
        updateWorkers();
        workerTimer -= 5;
    }

    // Process limit orders every 10 seconds
    limitOrderTimer += delta;
    if (limitOrderTimer >= 10) {
        if (typeof window.processLimitOrders === 'function') {
            window.processLimitOrders();
        }
        limitOrderTimer = 0;
    }

    // Check achievements every 15 seconds
    achievementTimer += delta;
    if (achievementTimer >= 15) {
        if (typeof window.checkAchievements === 'function') {
            window.checkAchievements();
        }
        achievementTimer = 0;
    }

    // Auto-save every 60 seconds
    saveTimer += delta;
    if (saveTimer >= 60) {
        save();
        saveTimer = 0;
    }

    // Update lastUpdate timestamp
    S.lastUpdate = Date.now();

    // Update UI every 200ms (5 times per second) to avoid destroying click handlers
    renderTimer += delta;
    if (renderTimer >= 1) {
        if (window.render) window.render();
        renderTimer = 0;
    }
}

/**
 * Start the game loop
 */
export function startGameLoop() {
    lastUpdate = Date.now();

    function gameLoop() {
        const now = Date.now();
        const delta = (now - lastUpdate) / 1000; // Convert to seconds
        lastUpdate = now;

        // Cap delta to prevent huge jumps
        const cappedDelta = Math.min(delta, 1);

        update(cappedDelta);
        requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame(gameLoop);
    console.log('✅ Game loop started!');
}

// Export for index.html to use
window.update = update;
window.startGameLoop = startGameLoop;
