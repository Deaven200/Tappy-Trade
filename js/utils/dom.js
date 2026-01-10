/**
 * DOM Utilities
 * Helper functions for DOM manipulation and UI updates
 */

/**
 * Shorthand for document.getElementById
 * @param {string} id - Element ID
 * @returns {HTMLElement} - DOM element
 */
export const $ = (id) => document.getElementById(id);

// Basic query selector alias

/**
 * Setup global error handler for broken images
 * Replaces broken src with a transparent pixel or placeholder
 */
export function setupImageErrorFallback() {
    window.addEventListener('error', function (e) {
        if (e.target.tagName === 'IMG') {
            console.warn('🖼️ Image load failed:', e.target.src);
            // Prevent infinite loop if placeholder fails
            if (e.target.dataset.failed) return;

            e.target.dataset.failed = 'true';
            // Use a generic placeholder or data URI
            e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50"><rect width="50" height="50" fill="%23333"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23666" font-size="20">?</text></svg>';
            e.target.style.border = '1px dashed var(--muted)';
        }
    }, true); // Capture phase to catch error events which don't bubble
}

/**
 * Last save time tracker
 */
let lastSaveTime = Date.now();

/**
 * Update the save indicator icon
 * @param {string} status - 'saved', 'saving', or ''
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
