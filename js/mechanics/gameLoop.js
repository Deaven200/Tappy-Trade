/**
 * Game Loop
 * Main update cycle for resource regeneration and automation
 */

import { S } from '../core/state.js';
import { updatePlots } from './plots.js';
import { updateWorkers } from './workers.js';
import { save } from '../core/storage.js';

// Export for index.html to use
window.update = update;
window.startGameLoop = startGameLoop;
window.stopGameLoop = stopGameLoop;

let gameLoopId = null;
window.gameLoopId = null; // Expose for debugging

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
    // Security: Cap delta to prevent speedhacking (max 1 hour simulated per tick)
    if (delta > 3600) delta = 3600;
    // Also cap minimum to prevent negative time
    if (delta < 0) delta = 0;

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

    // Auto-save every 10 seconds
    saveTimer += delta;
    if (saveTimer >= 10) {
        save();
        saveTimer = 0;
    }

    // Update lastUpdate timestamp
    S.lastUpdate = Date.now();

    // Update UI at 60fps - state tracking prevents unnecessary re-renders
    renderTimer += delta;
    if (renderTimer >= 0.0167) {  // 60fps
        if (window.render) window.render();
        renderTimer = 0;
    }
}

/**
 * Start the game loop
 */
export function startGameLoop() {
    lastUpdate = Date.now();

    // Stop any existing loop first to avoid duplicates
    if (window.gameLoopId) stopGameLoop();

    function gameLoop() {
        try {
            const now = Date.now();
            const delta = (now - lastUpdate) / 1000; // Convert to seconds
            lastUpdate = now;

            // Cap delta to prevent huge jumps
            const cappedDelta = Math.min(delta, 1);

            update(cappedDelta);
        } catch (e) {
            console.error('Game Loop Error:', e);
        }
        gameLoopId = requestAnimationFrame(gameLoop);
        window.gameLoopId = gameLoopId;
    }

    gameLoopId = requestAnimationFrame(gameLoop);
    window.gameLoopId = gameLoopId;
    console.log('✅ Game loop started!');
}

/**
 * Stop the game loop
 */
export function stopGameLoop() {
    if (window.gameLoopId) {
        cancelAnimationFrame(window.gameLoopId);
        window.gameLoopId = null;
        gameLoopId = null;
        console.log('🛑 Game loop stopped');
    }
}
