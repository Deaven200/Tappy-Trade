/**
 * Toast notification system
 */

let toastTimeout = null;

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - 'success', 'error', or 'info'
 */
export function showToast(message, type = 'info') {
    // Remove existing toast
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }

    // Clear any existing timeout
    if (toastTimeout) {
        clearTimeout(toastTimeout);
    }

    // Set content and type
    toast.textContent = message;
    toast.className = `toast ${type}`;

    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Hide after delay
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}
