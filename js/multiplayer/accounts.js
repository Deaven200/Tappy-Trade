/**
 * Account Management
 * Handles user registration, login, logout
 */

import { toast, playS } from '../utils/feedback.js';
import { save, loadFromCloud } from '../core/storage.js';

// Global state (shared with index.html)
let loggedInUser = null;

/**
 * Show account modal
 */
export function showAccount() {
    window.closeMenu();
    const modal = document.getElementById('account-modal');
    if (modal) {
        modal.classList.add('show');
        updateAccountUI();
    }
}

/**
 * Close account modal
 */
export function closeAccount() {
    const modal = document.getElementById('account-modal');
    if (modal) modal.classList.remove('show');
}

/**
 * Update account UI display
 */
export function updateAccountUI() {
    const authSection = document.getElementById('auth-section');
    const profileSection = document.getElementById('profile-section');
    const usernameDisplay = document.getElementById('username-display');

    if (loggedInUser) {
        if (authSection) authSection.style.display = 'none';
        if (profileSection) profileSection.style.display = 'block';
        if (usernameDisplay) usernameDisplay.textContent = loggedInUser.username;
    } else {
        if (authSection) authSection.style.display = 'block';
        if (profileSection) profileSection.style.display = 'none';
    }
}

/**
 * Register new account
 */
export async function registerAccount() {
    const usernameInput = document.getElementById('auth-user');
    const passwordInput = document.getElementById('auth-pass');

    if (!usernameInput || !passwordInput) return;

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
        toast('Fill all fields!', 'err');
        return;
    }

    if (username.length < 3 || username.length > 20) {
        toast('Username must be 3-20 chars', 'err');
        return;
    }

    // Simple registration (would use Firebase Auth in production)
    loggedInUser = { id: Date.now().toString(), username };
    window.loggedInUser = loggedInUser; // Expose globally
    localStorage.setItem('tt4_user', JSON.stringify(loggedInUser));

    toast('Account created!', 'ok');
    playS('ach');
    updateAccountUI();

    // Trigger initial cloud save
    if (window.saveToCloud) {
        await window.saveToCloud();
    }

    usernameInput.value = '';
    passwordInput.value = '';

    closeAccount();
}

/**
 * Login to existing account
 */
export async function loginAccount() {
    const usernameInput = document.getElementById('auth-user');
    const passwordInput = document.getElementById('auth-pass');

    if (!usernameInput || !passwordInput) return;

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
        toast('Fill all fields!', 'err');
        return;
    }

    // Simple login (would use Firebase Auth in production)
    loggedInUser = { id: Date.now().toString(), username };
    window.loggedInUser = loggedInUser; // Expose globally
    localStorage.setItem('tt4_user', JSON.stringify(loggedInUser));

    toast('Logged in!', 'ok');
    playS('ach');
    updateAccountUI();

    // Try to load cloud save
    try {
        const loaded = await loadFromCloud(loggedInUser.id);
        if (!loaded) {
            console.log('No cloud save found, will create new one on next save');
        }
    } catch (e) {
        console.log('No cloud save found:', e);
    }

    usernameInput.value = '';
    passwordInput.value = '';

    // Close the modal
    closeAccount();
}

/**
 * Logout from account
 */
export function logoutAccount() {
    loggedInUser = null;
    localStorage.removeItem('tt4_user');
    toast('Logged out', 'ok');
    updateAccountUI();
    closeAccount();
}

/**
 * Load saved user on game start
 */
export function loadSavedUser() {
    try {
        const saved = localStorage.getItem('tt4_user');
        if (saved) {
            loggedInUser = JSON.parse(saved);
            window.userName = loggedInUser.username;
        }
    } catch (e) {
        console.error('Failed to load user:', e);
    }
}

/**
 * Get current logged in user
 */
export function getLoggedInUser() {
    return loggedInUser;
}
