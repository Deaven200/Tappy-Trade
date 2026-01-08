/**
 * Menu System Module
 * Handles game menu modal and navigation
 */

import { S } from '../core/state.js';
import { $ } from '../utils/dom.js';

/**
 * Show/toggle the menu modal
 */
export function showMenu() {
    const modal = $('menu-modal');
    if (modal) {
        modal.classList.add('show');
        // Update farm name display
        const farmNameEl = $('farm-name-display');
        if (farmNameEl) {
            farmNameEl.textContent = S.farmName || "Untitled Farm";
        }
    }
}

/**
 * Toggle menu open/closed
 */
export function toggleMenu() {
    const modal = $('menu-modal');
    if (!modal) return;

    if (modal.classList.contains('show')) {
        closeMenu();
    } else {
        showMenu();
    }
}

/**
 * Close the menu modal
 */
export function closeMenu() {
    const modal = $('menu-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

/**
 * Navigate to stats screen
 */
export function showStats() {
    closeMenu();
    window.switchScreen('stats');
}

/**
 * Navigate to help screen
 */
export function showHelp() {
    closeMenu();
    window.switchScreen('help');
}
