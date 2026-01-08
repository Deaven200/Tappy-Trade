/**
 * Settings & Theme Module
 * Handles theme switching and font size adjustments
 */

import { S } from '../core/state.js';
import { save } from '../core/storage.js';

/**
 * Apply saved settings (theme and font size)
 */
export function applySettings() {
    document.body.classList.remove('light', 'font-small', 'font-normal', 'font-large');
    if (S.theme === 'light') {
        document.body.classList.add('light');
    }
    document.body.classList.add('font-' + (S.fontSize || 'normal'));
}

/**
 * Set theme
 * @param {string} theme - 'dark' or 'light'
 */
export function setTheme(theme) {
    S.theme = theme;
    applySettings();
    save();
}

/**
 * Set font size
 * @param {string} size - 'small', 'normal', or 'large'
 */
export function setFontSize(size) {
    S.fontSize = size;
    applySettings();
    save();
}

/**
 * Toggle between light and dark theme
 */
export function toggleTheme() {
    S.theme = (S.theme === 'light') ? 'dark' : 'light';
    applySettings();
    save();
}

/**
 * Update theme button text
 */
export function updateThemeButton() {
    const btn = document.getElementById('theme-btn');
    if (btn) {
        btn.textContent = S.theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode';
    }
}
