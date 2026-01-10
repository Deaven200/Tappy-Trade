/**
 * Main Render Coordinator
 * Manages screen switching and delegates to screen-specific renderers
 */

import { S } from '../core/state.js';
import { renderHomeScreen, resetHomeInit } from './screens/homeScreen.js';
import { renderInventoryScreen, setInventoryView, setInventorySort, resetInventoryInit } from './screens/inventoryScreen.js';
import { renderWorkersScreen, resetWorkersInit } from './screens/workersScreen.js';
import { renderStatsScreen } from './screens/statsScreen.js';

// Current screen state
let currentScreen = 'home';

/**
 * Reset all screen initialization flags
 */
function resetScreenInitFlags() {
    if (resetHomeInit) resetHomeInit();
    if (resetInventoryInit) resetInventoryInit();
    if (resetWorkersInit) resetWorkersInit();
    if (window.resetMarketInit) window.resetMarketInit();
}

/**
 * Get current screen
 */
export function getScreen() {
    return currentScreen;
}

// Make available globally for game loop
if (typeof window !== 'undefined') {
    window.getScreen = getScreen;
}

/**
 * Switch to a different screen
 */
export function switchScreen(screenName) {
    currentScreen = screenName;

    // Reset screen initialization flags to force re-render on switch
    if (typeof resetScreenInitFlags === 'function') {
        resetScreenInitFlags();
    }

    render();
}

/**
 * Format large numbers (e.g. 1.2k, 1.5M, 1.5B)
 */
function formatNumber(num) {
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toLocaleString();
}

/**
 * Update top stats bar (money, inventory count)
 */
export function updateStats() {
    const moneyEl = document.getElementById('money');
    const invEl = document.getElementById('inv');

    if (moneyEl) moneyEl.textContent = '$' + formatNumber(S.money);
    if (invEl) invEl.textContent = window.getInvTotal();
}

/**
 * Main render function - renders current screen
 */
export function render() {
    // Don't re-render if user is typing
    const focused = document.activeElement;
    if (focused && (focused.tagName === 'INPUT' || focused.tagName === 'TEXTAREA' || focused.tagName === 'SELECT')) {
        return;
    }

    // Update stats
    updateStats();

    // Get main container
    const container = document.getElementById('main');
    if (!container) return;

    // Render current screen
    switch (currentScreen) {
        case 'home':
            renderHomeScreen(container);
            break;
        case 'inventory':
            renderInventoryScreen(container);
            break;
        case 'workers':
            renderWorkersScreen(container);
            break;
        case 'player':
            renderPlayerMarketScreen(container);
            break;
        case 'stats':
            renderStatsScreen(container);
            break;
        case 'help':
            renderHelpScreen(container);
            break;
        case 'prices':
            if (window.renderPriceList) window.renderPriceList(container);
            else container.innerHTML = '<div class="panel">Loading...</div>';
            break;
        default:
            // Unknown screen - show home
            renderHomeScreen(container);
    }

    document.querySelectorAll('.nav button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.s === currentScreen);
    });
}

// Render player market (from markets.js module)
function renderPlayerMarketScreen(container) {
    // Call the real market renderer from the markets module
    if (window.renderPlayerMarket) {
        window.renderPlayerMarket(container);
    } else {
        // Fallback if module not loaded
        container.innerHTML = `<div class="panel">
            <h3>🏪 Player Market</h3>
            <p class="empty" style="padding:40px 20px;text-align:center">
                <div style="font-size:3rem;margin-bottom:12px;opacity:0.5">⚠️</div>
                <div style="color:var(--muted)">Market module not loaded</div>
            </p>
        </div>`;
    }
}

// Placeholder for help screen
function renderHelpScreen(container) {
    // Use the module if loaded, otherwise fallback
    if (window.renderHelp) {
        window.renderHelp(container);
        return;
    }

    container.innerHTML = `<div class="panel">
        <h3>❓ Help</h3>
        <p>Tappy Trade - A farming idle game</p>
        <p style="color:var(--muted);margin-top:10px">More help content coming soon...</p>
    </div>`;
}

// Export helper functions for inventory controls
export function setInvView(view) {
    setInventoryView(view);
    render();
}

export function setInvSort(sort) {
    setInventorySort(sort);
    render();
}

// Screen switching helpers for HTML onclick handlers
export function showHome() {
    switchScreen('home');
}

export function showInventory() {
    switchScreen('inventory');
}

export function showWorkers() {
    switchScreen('workers');
}

export function showPlayerMarket() {
    switchScreen('player');
}

export function showStats() {
    switchScreen('stats');
}

export function showHelp() {
    switchScreen('help');
}

export function showPriceList() {
    switchScreen('prices');
    if (window.closeMenu) window.closeMenu();
}

export function showAchievements() {
    switchScreen('stats'); // Achievements are on stats screen for now
}
