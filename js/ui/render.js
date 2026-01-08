/**
 * Main Render Coordinator
 * Manages screen switching and delegates to screen-specific renderers
 */

import { S } from '../core/state.js';
import { renderHomeScreen } from './screens/homeScreen.js';
import { renderInventoryScreen, setInventoryView, setInventorySort } from './screens/inventoryScreen.js';
import { renderWorkersScreen } from './screens/workersScreen.js';
import { renderStatsScreen } from './screens/statsScreen.js';

// Current screen state
let currentScreen = 'home';

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
    render();
}

/**
 * Update top stats bar (money, inventory count)
 */
export function updateStats() {
    const moneyEl = document.getElementById('money');
    const invEl = document.getElementById('inv');

    if (moneyEl) moneyEl.textContent = '$' + S.money.toLocaleString();
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
        default:
            // Unknown screen - show home
            renderHomeScreen(container);
    }

    // Update nav button active states
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

export function showAchievements() {
    switchScreen('stats'); // Achievements are on stats screen for now
}
