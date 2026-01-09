/**
 * Login Screen Management
 * Handles startup login screen with login, register, and guest options
 */

import { $ } from '../utils/dom.js';
import { toast } from '../utils/feedback.js';

/**
 * Show login screen (called on startup)
 */
export function showLoginScreen() {
    const screen = $('login-screen');
    if (screen) {
        screen.classList.remove('hidden');
    }
}

/**
 * Hide login screen and start game
 */
export function hideLoginScreen() {
    const screen = $('login-screen');
    if (screen) {
        screen.classList.add('hidden');
        // Remove from DOM after animation
        setTimeout(() => {
            screen.style.display = 'none';
        }, 300);
    }
}

/**
 * Show login form
 */
export function showLoginForm() {
    $('login-main-buttons').style.display = 'none';
    $('login-form-container').style.display = 'block';
    $('register-form-container').style.display = 'none';
}

/**
 * Show register form
 */
export function showRegisterForm() {
    $('login-main-buttons').style.display = 'none';
    $('login-form-container').style.display = 'none';
    $('register-form-container').style.display = 'block';
}

/**
 * Back to main login screen
 */
export function backToMainLogin() {
    $('login-main-buttons').style.display = 'flex';
    $('login-form-container').style.display = 'none';
    $('register-form-container').style.display = 'none';

    // Clear inputs
    $('login-username').value = '';
    $('login-password').value = '';
    $('register-username').value = '';
    $('register-password').value = '';
    $('register-confirm').value = '';
}

/**
 * Handle login
 */
export async function handleLogin() {
    const username = $('login-username').value.trim();
    const password = $('login-password').value;

    if (!username || !password) {
        toast('Please enter username and password', 'err');
        return;
    }

    // Call existing login function
    if (window.loginAccount) {
        // Pass arguments to accounts.js (which now accepts them)
        await window.loginAccount(username, password);
        if (window.getLoggedInUser && window.getLoggedInUser()) {
            hideLoginScreen();
            if (window.init) window.init();
        }
    } else {
        console.error('window.loginAccount not found');
        toast('Login system not ready', 'err');
    }
}

/**
 * Handle registration
 */
export async function handleRegister() {
    const username = $('register-username').value.trim();
    const password = $('register-password').value;
    const confirm = $('register-confirm').value;

    if (!username || !password || !confirm) {
        toast('Please fill all fields', 'err');
        return;
    }

    if (password !== confirm) {
        toast('Passwords do not match', 'err');
        return;
    }

    if (password.length < 6) {
        toast('Password must be at least 6 characters', 'err');
        return;
    }

    // Call existing register function
    if (window.registerAccount) {
        // Pass arguments to accounts.js (which now accepts them)
        await window.registerAccount(username, password);
        if (window.getLoggedInUser && window.getLoggedInUser()) {
            hideLoginScreen();
            if (window.init) window.init();
        }
    } else {
        console.error('window.registerAccount not found');
        toast('Registration system not ready', 'err');
    }
}

/**
 * Continue as guest
 */
export function continueAsGuest() {
    console.log('👤 Continuing as guest');

    // Clear any existing save data to start fresh
    localStorage.removeItem('tt4');
    localStorage.removeItem('tt4_user');

    // Set guest flag in localStorage
    localStorage.setItem('tt4_guest', 'true');

    // Hide login screen
    hideLoginScreen();

    // Init game (will start with fresh default state)
    if (window.init) window.init();

    toast('Playing as Guest - Your progress will be saved locally!', 'info');

    // Show hint about creating account
    setTimeout(() => {
        toast('💡 Create an account from the menu to save to cloud!', 'info');
    }, 3000);
}

/**
 * Check if should show login screen on startup
 * @returns {boolean} True if should show login screen
 */
export function shouldShowLoginScreen() {
    // Check if user is already logged in
    if (window.loggedInUser) {
        return false;
    }

    // Check if user chose guest mode
    const isGuest = localStorage.getItem('tt4_guest') === 'true';
    if (isGuest) {
        return false;
    }

    // Show login screen for new/logged-out players
    return true;
}

/**
 * Convert guest to account (called from in-game menu)
 */
export async function convertGuestToAccount(username, password) {
    if (!window.registerUser) {
        toast('Registration not available', 'err');
        return false;
    }

    // Register new account
    const success = await window.registerUser(username, password);

    if (success) {
        // Clear guest flag
        localStorage.removeItem('tt4_guest');

        // Game state is already in localStorage (tt4)
        // The existing save/load system will handle uploading to cloud
        if (window.saveToCloud) {
            await window.saveToCloud();
        }

        toast('Account created! Your progress is now saved to the cloud!', 'ok');
        return true;
    }

    return false;
}
