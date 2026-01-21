/**
 * Mobile Gesture System
 * Handles swipe gestures for tab navigation on mobile devices
 */

import { switchScreen, getScreen } from './render.js';

// Screen order for swipe navigation
const SCREENS = ['home', 'inventory', 'workers', 'player', 'map'];
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
const MIN_SWIPE_DISTANCE = 50;
const MAX_VERTICAL_DRIFT = 100;

/**
 * Initialize gesture system
 */
export function initGestures() {
    const content = document.querySelector('.content') || document.getElementById('main');
    if (!content) {
        console.warn('Content area not found for gesture initialization');
        return;
    }

    content.addEventListener('touchstart', handleTouchStart, { passive: true });
    content.addEventListener('touchend', handleTouchEnd, { passive: true });

    console.log('👆 Swipe gestures initialized');
}

/**
 * Handle touch start
 */
function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}

/**
 * Handle touch end
 */
function handleTouchEnd(e) {
    touchEndX = e.changedTouches[0].clientX;
    touchEndY = e.changedTouches[0].clientY;
    handleSwipe();
}

/**
 * Process swipe gesture
 */
function handleSwipe() {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // Check if horizontal swipe (not vertical scroll)
    if (Math.abs(deltaX) < MIN_SWIPE_DISTANCE) return;
    if (Math.abs(deltaY) > MAX_VERTICAL_DRIFT) return;

    const currentScreen = getScreen();
    const currentIndex = SCREENS.indexOf(currentScreen);

    if (currentIndex === -1) return;

    if (deltaX < 0) {
        // Swipe left -> next screen
        const nextIndex = Math.min(currentIndex + 1, SCREENS.length - 1);
        if (nextIndex !== currentIndex) {
            switchScreen(SCREENS[nextIndex]);
            showSwipeIndicator('left');
        }
    } else {
        // Swipe right -> previous screen
        const prevIndex = Math.max(currentIndex - 1, 0);
        if (prevIndex !== currentIndex) {
            switchScreen(SCREENS[prevIndex]);
            showSwipeIndicator('right');
        }
    }
}

/**
 * Show visual feedback for swipe
 */
function showSwipeIndicator(direction) {
    const indicator = document.createElement('div');
    indicator.className = 'swipe-indicator';
    indicator.innerHTML = direction === 'left' ? '→' : '←';
    indicator.style.cssText = `
        position: fixed;
        top: 50%;
        ${direction === 'left' ? 'right' : 'left'}: 20px;
        transform: translateY(-50%);
        font-size: 2rem;
        color: var(--gold);
        opacity: 0.8;
        animation: swipe-fade 0.4s forwards;
        pointer-events: none;
        z-index: 9999;
    `;

    // Add animation styles if not present
    if (!document.getElementById('swipe-styles')) {
        const style = document.createElement('style');
        style.id = 'swipe-styles';
        style.textContent = `
            @keyframes swipe-fade {
                from { opacity: 0.8; transform: translateY(-50%); }
                to { opacity: 0; transform: translateY(-50%) translateX(${direction === 'left' ? '20px' : '-20px'}); }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(indicator);
    setTimeout(() => indicator.remove(), 400);
}

// Auto-initialize on DOM ready
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGestures);
    } else {
        initGestures();
    }
}

// Export for global access
window.initGestures = initGestures;
