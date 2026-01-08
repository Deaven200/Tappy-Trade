/**
 * Achievements UI Module
 * Handles achievement modal and confetti animations
 */

import { $ } from '../utils/dom.js';
import { playS } from '../utils/feedback.js';

/**
 * Show confetti animation for celebrations
 */
export function showConfetti() {
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);

    const colors = ['#ffd700', '#4ade80', '#60a5fa', '#a78bfa', '#fb923c', '#f87171'];
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        confetti.style.animationDuration = (2 + Math.random() * 2) + 's';
        container.appendChild(confetti);
    }

    setTimeout(() => container.remove(), 4000);
}

/**
 * Show achievements modal
 */
export function showAchievements() {
    const modal = $('achievements-modal');
    if (modal) {
        modal.classList.add('show');
        playS('tap');
    }
}

/**
 * Close achievements modal
 */
export function closeAchieve() {
    const modal = $('achievements-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}
