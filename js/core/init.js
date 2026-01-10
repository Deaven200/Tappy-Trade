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
    console.log('🔍 DEBUG: Init started');

    // Restore logged-in account
    try {
        if (window.loadSavedUser) window.loadSavedUser();
        console.log('🔍 DEBUG: Step 1 - Saved User Loaded');
    } catch (e) { console.error('DEBUG Step 1 Error:', e); }

    // Setup Enter key for chat
    try {
        if (window.setupChatKeyboard) window.setupChatKeyboard();
        console.log('🔍 DEBUG: Step 2 - Chat Keyboard Setup');
    } catch (e) { console.error('DEBUG Step 2 Error:', e); }

    // Load saved game
    let saveLoaded = false;
    try {
        saveLoaded = load();
        console.log('🔍 DEBUG: Step 3 - Save Loaded:', saveLoaded);

        if (saveLoaded) {
            // Apply saved theme/font
            if (window.applySettings) window.applySettings();
            if (window.updateThemeButton) window.updateThemeButton();

            // Calculate offline progress
            const off = Date.now() - S.lastUpdate;
            console.log('🔍 DEBUG: Offline time:', off);

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
                console.log('🔍 DEBUG: Processing offline time calc...');
            }
            toast('Welcome back!');
        } else {
            // New game - show tutorial
            const tut = $('tutorial');
            if (tut) tut.style.display = 'flex';
            console.log('🔍 DEBUG: Step 3b - New Game Tutorial Shown');
        }
    } catch (e) { console.error('DEBUG Step 3 Error:', e); }

    // Setup sound button
    try {
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
        console.log('🔍 DEBUG: Step 4 - Sound Button Setup');
    } catch (e) { console.error('DEBUG Step 4 Error:', e); }

    // Initial render
    console.log('🔍 DEBUG: Step 5 - Attempting Render...');
    try {
        if (window.render) {
            window.render();
            console.log('🔍 DEBUG: Step 5 - Render Success');
        } else {
            console.error('❌ DEBUG: window.render is undefined!');
        }
    } catch (e) {
        console.error('❌ DEBUG: Initial render failed:', e);
        // Fallback: try to show home screen at least
        try {
            if (window.showHome) window.showHome();
        } catch (err) { console.error('Fallback showHome failed:', err); }
    }

    // Initialize event delegation (must be after render since it needs #main to exist)
    try {
        if (window.initializeEventHandlers) {
            window.initializeEventHandlers();
            console.log('🔍 DEBUG: Step 6 - Event Handlers Init');
        }
    } catch (e) { console.error('DEBUG Step 6 Error:', e); }

    // NOTE: initFirebase() is called from index.html after it's defined
    // (can't call it here because it's not defined yet when module loads)

    // Update save indicator every second
    try {
        if (window.updateSaveIndicator) {
            setInterval(window.updateSaveIndicator, 1000);
            console.log('🔍 DEBUG: Step 7 - Save Indicator Started');
        }
    } catch (e) { console.error('DEBUG Step 7 Error:', e); }

    // Start day/night cycle
    try {
        startDayNightCycle();
        console.log('🔍 DEBUG: Step 8 - Day/Night Cycle Started');
    } catch (e) { console.error('DEBUG Step 8 Error:', e); }

    // Initialize music
    try {
        if (window.initMusic) window.initMusic();
        console.log('🔍 DEBUG: Step 9 - Music Init');
    } catch (e) { console.error('DEBUG Step 9 Error:', e); }

    // Update lastUpdate timestamp
    S.lastUpdate = Date.now();

    // ===== START MODULAR GAME LOOP =====
    console.log('🎮 Starting modular game loop...');
    try {
        if (window.startGameLoop) {
            window.startGameLoop();
            console.log('✅ DEBUG: GAME LOOP STARTED SUCCESSFULLY');
        } else {
            console.error('❌ DEBUG: window.startGameLoop is undefined!');
        }
    } catch (e) {
        console.error('❌ DEBUG: Failed to start game loop:', e);
    }
}
