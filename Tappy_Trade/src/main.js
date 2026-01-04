/**
 * Tappy Trade - Main Entry Point
 */

import './style.css';
import { gameState } from './game/GameState.js';
import { navigation, SCREENS } from './ui/Navigation.js';
import { renderHomeScreen, updateSubPlotBoxes, initSubPlotHandlers, cleanupHomeScreen } from './ui/HomeScreen.js';
import { renderInventoryScreen } from './ui/InventoryScreen.js';
import { renderGovMarketScreen } from './ui/GovMarketScreen.js';
import { renderPlayerMarketScreen } from './ui/PlayerMarketScreen.js';
import { showToast } from './ui/Toast.js';

// Main content container
let contentArea;

/**
 * Render the current screen based on navigation state
 */
function renderCurrentScreen() {
    if (!contentArea) return;

    // Cleanup previous screen
    cleanupHomeScreen();

    // Render new screen
    switch (navigation.currentScreen) {
        case SCREENS.HOME:
            renderHomeScreen(contentArea);
            break;
        case SCREENS.INVENTORY:
            renderInventoryScreen(contentArea);
            break;
        case SCREENS.PLAYER_MARKET:
            renderPlayerMarketScreen(contentArea);
            break;
        case SCREENS.GOV_MARKET:
            renderGovMarketScreen(contentArea);
            break;
    }
}

/**
 * Update the stats bar display
 */
function updateStatsBar() {
    const moneyDisplay = document.getElementById('money-display');
    const inventoryDisplay = document.getElementById('inventory-display');

    if (moneyDisplay) {
        moneyDisplay.textContent = `$${gameState.money.toLocaleString()}`;
    }

    if (inventoryDisplay) {
        const total = gameState.inventory.getTotalItems();
        const capacity = gameState.inventory.capacity;
        inventoryDisplay.textContent = `${total}/${capacity}`;
    }
}

/**
 * Game loop - updates timers and UI
 */
function gameLoop() {
    // Update game state (regrowth timers, etc.)
    gameState.update();

    // Update sub-plot status indicators
    updateSubPlotBoxes();

    // Schedule next frame
    requestAnimationFrame(gameLoop);
}

/**
 * Initialize the game
 */
function init() {
    console.log('🎮 Tappy Trade initializing...');

    // Get content container
    contentArea = document.getElementById('content-area');

    // Load saved game or start fresh
    const loaded = gameState.load();
    if (loaded) {
        console.log('📂 Loaded saved game');
        showToast('Welcome back! 🌱', 'info');
    } else {
        console.log('🆕 Starting new game');
        showToast('Welcome to Tappy Trade! 🌲', 'info');
    }

    // Subscribe to state changes
    gameState.subscribe(() => {
        updateStatsBar();
        renderCurrentScreen();
    });

    // Subscribe to navigation changes
    navigation.subscribe(() => {
        renderCurrentScreen();
    });

    // Initialize navigation
    navigation.init();

    // Initialize sub-plot click handlers
    initSubPlotHandlers(() => {
        // When a sub-plot is selected and we're on home, re-render
        if (navigation.currentScreen === SCREENS.HOME) {
            renderCurrentScreen();
        }
    });

    // Initial render
    updateStatsBar();
    updateSubPlotBoxes();
    renderCurrentScreen();

    // Start game loop
    gameLoop();

    console.log('✅ Tappy Trade ready!');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
