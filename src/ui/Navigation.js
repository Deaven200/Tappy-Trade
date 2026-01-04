/**
 * Navigation controller for bottom nav bar
 */

import { gameState } from '../game/GameState.js';

export const SCREENS = {
    HOME: 'home',
    INVENTORY: 'inventory',
    PLAYER_MARKET: 'player-market',
    GOV_MARKET: 'gov-market',
};

class Navigation {
    constructor() {
        this.currentScreen = SCREENS.HOME;
        this.previousScreen = null;
        this.listeners = new Set();
    }

    /**
     * Subscribe to navigation changes
     */
    subscribe(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    /**
     * Notify listeners of screen change
     */
    notify() {
        for (const callback of this.listeners) {
            callback(this.currentScreen);
        }
    }

    /**
     * Navigate to a screen
     */
    navigateTo(screen) {
        if (screen === this.currentScreen) return;

        this.previousScreen = this.currentScreen;
        this.currentScreen = screen;
        this.updateActiveButton();
        this.notify();
    }

    /**
     * Toggle between Home and Inventory (Button 1 behavior)
     */
    toggleHomeInventory() {
        if (this.currentScreen === SCREENS.HOME) {
            this.navigateTo(SCREENS.INVENTORY);
        } else {
            this.navigateTo(SCREENS.HOME);
        }
    }

    /**
     * Update active state on nav buttons
     */
    updateActiveButton() {
        const buttons = document.querySelectorAll('.nav-btn');
        buttons.forEach(btn => btn.classList.remove('active'));

        // Map screen to button
        let activeBtn;
        switch (this.currentScreen) {
            case SCREENS.HOME:
            case SCREENS.INVENTORY:
                activeBtn = document.getElementById('nav-btn-1');
                break;
            case SCREENS.PLAYER_MARKET:
                activeBtn = document.getElementById('nav-btn-2');
                break;
            case SCREENS.GOV_MARKET:
                activeBtn = document.getElementById('nav-btn-3');
                break;
        }

        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        // Update button 1 label based on current screen
        const btn1Label = document.querySelector('#nav-btn-1 .nav-label');
        if (btn1Label) {
            btn1Label.textContent = this.currentScreen === SCREENS.INVENTORY ? 'Home' : 'Inventory';
        }
    }

    /**
     * Initialize navigation event listeners
     */
    init() {
        const btn1 = document.getElementById('nav-btn-1');
        const btn2 = document.getElementById('nav-btn-2');
        const btn3 = document.getElementById('nav-btn-3');

        btn1?.addEventListener('click', () => this.toggleHomeInventory());
        btn2?.addEventListener('click', () => this.navigateTo(SCREENS.PLAYER_MARKET));
        btn3?.addEventListener('click', () => this.navigateTo(SCREENS.GOV_MARKET));

        this.updateActiveButton();
    }
}

export const navigation = new Navigation();
