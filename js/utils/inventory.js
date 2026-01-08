/**
 * Inventory Helper Functions
 * Common inventory operations used throughout the game
 */

import { S } from '../core/state.js';

/**
 * Get total inventory count
 * @param {Object} inv - Inventory object
 * @returns {number} - Total items in inventory
 */
export function getInvTotal(inv) {
    return Object.values(inv).reduce((a, b) => a + b, 0);
}

/**
 * Check if player has enough of an item
 * @param {Object} inv - Inventory object
 * @param {string} id - Item ID
 * @param {number} n - Quantity needed
 * @returns {boolean} - True if player has enough
 */
export function hasItem(inv, id, n) {
    return (inv[id] || 0) >= n;
}

/**
 * Add items to inventory
 * @param {Object} inv - Inventory object
 * @param {string} id - Item ID
 * @param {number} n - Quantity to add
 */
export function addItem(inv, id, n) {
    // Always store as numbers, converting any existing strings
    const current = parseInt(inv[id]) || 0;
    inv[id] = current + parseInt(n);
}

/**
 * Remove items from inventory (uses S.inv directly)
 * @param {string} id - Item ID
 * @param {number} n - Quantity to remove
 * @returns {number} - Actual quantity removed
 */
export function remItem(id, n) {
    // Convert to number in case it's a string (data corruption fix)
    const h = parseInt(S.inv[id]) || 0;
    const r = Math.min(h, n);
    S.inv[id] = h - r;
    if (S.inv[id] <= 0) delete S.inv[id];
    return r;
}
