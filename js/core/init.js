/**
 * Game Initialization Module
 * Handles game startup, offline progress, and initial setup
 */

import { S } from './state.js';
import { load, save } from './storage.js';
import { toast, notif } from '../utils/feedback.js';
import { $ } from '../utils/dom.js';
import { updateDayNight, startDayNightCycle } from '../ui/dayNight.js';

/**
 * Initialize the game
 */
export function init() {
    console.log('🎮 Init function starting...');

    // Restore logged-in account
    if (window.loadSavedUser) window.loadSavedUser();

    // Setup Enter key for chat
    if (window.setupChatKeyboard) window.setupChatKeyboard();

    // Load saved game
    if (load()) {
        // Apply saved theme/font
        if (window.applySettings) window.applySettings();
        if (window.updateThemeButton) window.updateThemeButton();

        // Calculate offline progress
        const off = Date.now() - S.lastUpdate;
        if (off > 1000) {
            const beforeHarvested = S.stats?.harvested || 0;
            const beforeInv = window.getInvTotal();
            window.update(Math.min(off, 8 * 3600000));
            const harvested = (S.stats?.harvested || 0) - beforeHarvested;
            const gained = window.getInvTotal() - beforeInv;
            const hours = Math.floor(off / 3600000);
            const mins = Math.floor((off % 3600000) / 60000);
            if (hours > 0 || mins > 5) {
                if (harvested > 0 || gained > 0) {
                    notif(`⏰ Offline for ${hours}h ${mins}m — workers gathered +${Math.max(0, gained)} items`);
                }
            }
        }
        toast('Welcome back!');
    } else {
        // New game - show tutorial
        const tut = $('tutorial');
        if (tut) tut.style.display = 'flex';
    }

    // Setup sound button
    const soundBtn = $('sound-btn');
    if (soundBtn) {
        soundBtn.onclick = () => {
            S.sound = S.sound ? 0 : 1;
            soundBtn.textContent = S.sound ? '🔊 Sound ON' : '🔇 Sound OFF';

            // Control music
            if (window.bgMusic) {
                window.bgMusic.muted = !S.sound;
            }

            // Start music if enabling sound
            if (S.sound && window.__ttStartMusic) {
                window.__ttStartMusic();
            }
            save();
        };
        soundBtn.textContent = S.sound ? '🔊 Sound ON' : '🔇 Sound OFF';
    }

    // Initial render
    try {
        window.render();
    } catch (e) {
        console.error('Initial render failed:', e);
        // Fallback: try to show home screen at least
        if (window.showHome) window.showHome();
    }

    // Initialize event delegation (must be after render since it needs #main to exist)
    if (window.initializeEventHandlers) {
        window.initializeEventHandlers();
    }

    // NOTE: initFirebase() is called from index.html after it's defined
    // (can't call it here because it's not defined yet when module loads)

    // Update save indicator every second
    if (window.updateSaveIndicator) {
        setInterval(window.updateSaveIndicator, 1000);
    }

    // Start day/night cycle
    startDayNightCycle();

    // Initialize music
    if (window.initMusic) window.initMusic();

    // Update lastUpdate timestamp
    S.lastUpdate = now;

    // Update lastUpdate timestamp
    S.lastUpdate = now;

    // ===== START MODULAR GAME LOOP =====
    console.log('🎮 Starting modular game loop...');
    window.startGameLoop();
}
