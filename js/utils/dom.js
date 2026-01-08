/**
 * DOM Utilities
 * Helper functions for DOM manipulation and UI updates
 */

/**
 * Shorthand for document.getElementById
 * @param {string} id - Element ID
 * @returns {HTMLElement} - DOM element
 */
export const $ = id => document.getElementById(id);

/**
 * Last save time tracker
 */
let lastSaveTime = Date.now();

/**
 * Update the save indicator UI element
 */
export function updateSaveIndicator() {
    const indicator = $('save-indicator');
    if (!indicator) return;

    const elapsed = Math.floor((Date.now() - lastSaveTime) / 1000);
    if (elapsed < 3) {
        indicator.textContent = '💾 Saved!';
        indicator.style.color = 'var(--green)';
    } else if (elapsed < 60) {
        indicator.textContent = `💾 ${elapsed}s ago`;
        indicator.style.color = 'var(--muted)';
    } else {
        const mins = Math.floor(elapsed / 60);
        indicator.textContent = `💾 ${mins}m ago`;
        indicator.style.color = 'var(--muted)';
    }
}

/**
 * Set the last save time (called by save function)
 */
export function setLastSaveTime(time) {
    lastSaveTime = time;
    // Indicator will update on its own via setInterval
}

/**
 * Get the last save time
 */
export function getLastSaveTime() {
    return lastSaveTime;
}
