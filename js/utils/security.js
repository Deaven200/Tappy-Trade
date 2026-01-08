/**
 * Security Utilities
 * Functions for sanitizing user input and preventing XSS attacks
 */

/**
 * Sanitize HTML to prevent XSS attacks
 * @param {string} str - Input string to sanitize
 * @returns {string} - Sanitized HTML-safe string
 */
export function sanitizeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Validate and sanitize user input
 * @param {string} input - User input to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} - Sanitized and truncated input
 */
export function sanitizeInput(input, maxLength = 500) {
    if (!input || typeof input !== 'string') return '';
    return sanitizeHTML(input.trim().substring(0, maxLength));
}
