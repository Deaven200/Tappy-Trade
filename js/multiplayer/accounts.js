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
export async function registerAccount(userArg, passArg) {
    const usernameInput = document.getElementById('auth-user');
    const passwordInput = document.getElementById('auth-pass');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const submitBtn = document.querySelector('[onclick="registerAccount()"]');

    // Use arguments if provided, otherwise get from DOM
    const username = userArg || usernameInput?.value.trim();
    const password = passArg || passwordInput?.value;
    const rememberMe = rememberMeCheckbox?.checked ?? true;

    // Validation
    if (!username || !password) {
        toast('Please fill all fields!', 'err');
        return;
    }

    if (username.length < 3 || username.length > 20) {
        toast('Username must be 3-20 characters', 'err');
        return;
    }

    if (password.length < 6) {
        toast('Password must be at least 6 characters', 'err');
        return;
    }

    // Show loading state
    const originalText = submitBtn?.textContent;
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '🔄 Creating Account...';
    }

    try {
        // Simulate async registration
        await new Promise(resolve => setTimeout(resolve, 500));

        // Simple registration (would use Firebase Auth in production)
        const cleanId = username.toLowerCase().replace(/[^a-z0-9]/g, '');
        loggedInUser = { id: 'user_' + cleanId, username };
        window.loggedInUser = loggedInUser;

        // Save based on Remember Me
        if (rememberMe) {
            localStorage.setItem('tt4_user', JSON.stringify(loggedInUser));
        }

        toast('Account created! ✨', 'ok');
        playS('ach');
        updateAccountUI();
        updateAccountButton();

        // Load government tiers
        if (window.loadGovernmentTiers) {
            window.loadGovernmentTiers(loggedInUser.id);
        }

        // Trigger initial cloud save
        if (window.saveToCloud) {
            await window.saveToCloud();
        }

        usernameInput.value = '';
        passwordInput.value = '';

        setTimeout(() => closeAccount(), 300);

    } catch (error) {
        toast('Registration failed. Try again!', 'err');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
}

/**
 * Login to existing account
 */
export async function loginAccount(userArg, passArg) {
    const usernameInput = document.getElementById('auth-user');
    const passwordInput = document.getElementById('auth-pass');
    const rememberMeCheckbox = document.getElementById('remember-me');
    const submitBtn = document.querySelector('[onclick="loginAccount()"]');

    // Use arguments if provided, otherwise get from DOM
    const username = userArg || usernameInput?.value.trim();
    const password = passArg || passwordInput?.value;
    const rememberMe = rememberMeCheckbox?.checked ?? true;

    if (!username || !password) {
        toast('Please fill all fields!', 'err');
        return;
    }

    // Show loading state
    const originalText = submitBtn?.textContent;
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '🔄 Logging In...';
    }

    try {
        // Simulate async login
        await new Promise(resolve => setTimeout(resolve, 500));

        // Simple login (would use Firebase Auth in production)
        // FIX: Use username as ID to ensure consistent save lookup
        const cleanId = username.toLowerCase().replace(/[^a-z0-9]/g, '');
        loggedInUser = { id: 'user_' + cleanId, username };
        window.loggedInUser = loggedInUser;

        // Save based on Remember Me
        if (rememberMe) {
            localStorage.setItem('tt4_user', JSON.stringify(loggedInUser));
        }

        toast('Welcome back! 🎮', 'ok');
        playS('ach');
        updateAccountUI();
        updateAccountButton();

        // Load government tiers
        if (window.loadGovernmentTiers) {
            window.loadGovernmentTiers(loggedInUser.id);
        }

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

        setTimeout(() => closeAccount(), 300);

    } catch (error) {
        toast('Login failed. Check credentials!', 'err');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
}

/**
 * Logout from account
 */
export function logoutAccount() {
    loggedInUser = null;
    window.loggedInUser = null;
    localStorage.removeItem('tt4_user');
    toast('Logged out. Refreshing...', 'ok');

    // Refresh page after short delay for new player experience
    setTimeout(() => {
        window.location.reload();
    }, 800);
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

/**
 * Update account button to show username when logged in
 */
export function updateAccountButton() {
    const accountBtn = document.getElementById('account-btn');
    if (!accountBtn) return;

    if (loggedInUser) {
        // Show username with green dot
        accountBtn.innerHTML = `🟢 ${loggedInUser.username}`;
        accountBtn.title = 'Account Settings';
    } else {
        // Default state
        accountBtn.innerHTML = '👤 Account';
        accountBtn.title = 'Login or Register';
    }
}
