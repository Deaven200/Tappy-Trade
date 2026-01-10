/**
 * UI Feedback Utilities
 * Toast notifications, floating text, and sound effects
 */

import { $ } from './dom.js';

/**
 * Show a toast notification
 * @param {string} m - Message to display
 * @param {string} t - Type: 'ok', 'err', or ''
 */
export function toast(m, t = '') {
    const e = $('toast');
    e.textContent = m;
    e.className = 'toast show ' + (t || '');
    setTimeout(() => e.classList.remove('show'), 2000);
}

/**
 * Show a notification banner
 * @param {string} m - Message to display
 */
export function notif(m) {
    const e = $('notif-container');
    e.textContent = m;
    e.classList.add('show');
    setTimeout(() => e.classList.remove('show'), 3000);
}

/**
 * Create floating text animation for visual feedback
 * @param {string} text - Text to display
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {string} type - CSS class for styling
 */
export function floatText(text, x, y, type = '') {
    const el = document.createElement('div');
    el.className = 'float-text ' + type;
    el.textContent = text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
}

/**
 * Create floating text at an element's position (wrapper for floatText)
 * @param {string} text - Text to display
 * @param {HTMLElement} element - Element to position near
 */
export function floatTextAt(text, element) {
    if (!element) {
        floatText(text, window.innerWidth / 2, window.innerHeight / 2);
        return;
    }
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    floatText(text, x, y);
}

/**
 * Play a sound effect
 * @param {string} t - Sound type: 'tap', 'harvest', 'sell', 'buy', 'build', 'ach', 'err'
 */
// Shared AudioContext
let audioCtx = null;

/**
 * Play a sound effect
 * @param {string} t - Sound type: 'tap', 'harvest', 'sell', 'buy', 'build', 'ach', 'err'
 */
export function playS(t) {
    if (!window.S || !window.S.sound) return;

    try {
        // Initialize context on first interaction/play
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContext();
        }

        // Resume if suspended (browser autopilot policy)
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const a = audioCtx;
        const o = a.createOscillator();
        const g = a.createGain();
        o.connect(g);
        g.connect(a.destination);
        g.gain.value = 0.1;

        if (t === 'tap' || t === 'harvest') {
            o.frequency.value = 440;
            o.start();
            g.gain.exponentialRampToValueAtTime(0.01, a.currentTime + 0.1);
            o.stop(a.currentTime + 0.1);
        } else if (t === 'sell' || t === 'buy') {
            o.frequency.value = 523;
            o.start();
            g.gain.exponentialRampToValueAtTime(0.01, a.currentTime + 0.2);
            o.stop(a.currentTime + 0.2);
        } else if (t === 'build' || t === 'upgrade') {
            o.frequency.value = 659;
            o.start();
            setTimeout(() => { if (o) o.frequency.value = 784; }, 100);
            g.gain.exponentialRampToValueAtTime(0.01, a.currentTime + 0.3);
            o.stop(a.currentTime + 0.3);
        } else if (t === 'ach') {
            o.frequency.value = 523;
            o.start();
            setTimeout(() => { if (o) o.frequency.value = 659; }, 100);
            setTimeout(() => { if (o) o.frequency.value = 784; }, 200);
            g.gain.exponentialRampToValueAtTime(0.01, a.currentTime + 0.4);
            o.stop(a.currentTime + 0.4);
        } else if (t === 'err') {
            o.frequency.value = 200;
            o.start();
            g.gain.exponentialRampToValueAtTime(0.01, a.currentTime + 0.1);
            o.stop(a.currentTime + 0.1);
        }
    } catch (e) {
        // Fallback or ignore audio errors
    }
}

/**
 * Trigger haptic feedback on mobile devices
 * @param {string} type - Vibration pattern type
 */
export function vibrate(type) {
    if (!navigator.vibrate) return;
    if (type === 'tap' || type === 'harvest') navigator.vibrate(10);
    else if (type === 'sell' || type === 'buy') navigator.vibrate(20);
    else if (type === 'build' || type === 'upgrade') navigator.vibrate([10, 30, 20]);
    else if (type === 'ach') navigator.vibrate([20, 50, 20, 50, 30]);
    else if (type === 'err') navigator.vibrate([50, 20, 50]);
}
