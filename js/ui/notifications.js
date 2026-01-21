/**
 * Smart Notification System
 * Provides contextual warnings and alerts during gameplay
 */

import { S } from '../core/state.js';
import { getInvTotal } from '../utils/inventory.js';
import { toast } from '../utils/feedback.js';

// Notification state to prevent spam
const notificationState = {
    lastInventoryWarning: 0,
    lastWorkerIdleWarning: {},
    lastEventWarning: 0
};

// Cooldowns (in ms)
const INVENTORY_WARNING_COOLDOWN = 60000; // 1 minute
const WORKER_IDLE_COOLDOWN = 120000; // 2 minutes
const EVENT_WARNING_COOLDOWN = 300000; // 5 minutes

/**
 * Check and show inventory warnings
 */
export function checkInventoryWarnings() {
    const now = Date.now();
    if (now - notificationState.lastInventoryWarning < INVENTORY_WARNING_COOLDOWN) return;

    const current = getInvTotal(S.inv);
    const capacity = S.cap;
    const percentage = (current / capacity) * 100;

    if (percentage >= 95) {
        toast('⚠️ Inventory FULL! Sell items to continue harvesting', 'err');
        notificationState.lastInventoryWarning = now;
    } else if (percentage >= 80) {
        toast(`📦 Inventory ${Math.round(percentage)}% full`, 'nom');
        notificationState.lastInventoryWarning = now;
    }
}

/**
 * Check for idle workers (subplots at max capacity)
 */
export function checkWorkerIdleWarnings() {
    const now = Date.now();

    S.workers.forEach((worker, index) => {
        const subplot = S.plots[worker.plot]?.subs[worker.sub];
        if (!subplot) return;

        const config = window.T?.[subplot.t];
        if (!config || !config.m) return;

        const level = subplot.lv || 1;
        const maxStorage = (config.m || 10) + (level - 1) * 10;

        // Check if subplot is full
        if (subplot.c >= maxStorage) {
            const lastWarning = notificationState.lastWorkerIdleWarning[index] || 0;
            if (now - lastWarning > WORKER_IDLE_COOLDOWN) {
                toast(`💤 Worker #${index + 1} is idle (Plot ${worker.plot + 1} full)`, 'nom');
                notificationState.lastWorkerIdleWarning[index] = now;
            }
        }
    });
}

/**
 * Check for upcoming events
 */
export function checkEventWarnings() {
    const now = Date.now();
    if (now - notificationState.lastEventWarning < EVENT_WARNING_COOLDOWN) return;

    // Check if an event is ending soon
    if (S.activeEvent && S.eventEndsAt) {
        const timeRemaining = S.eventEndsAt - now;
        if (timeRemaining > 0 && timeRemaining < 60000) { // 1 minute left
            toast(`⏰ ${S.activeEvent} event ending in ${Math.ceil(timeRemaining / 1000)}s!`, 'nom');
            notificationState.lastEventWarning = now;
        }
    }

    // Check if daily reward is available
    if (window.canClaimDaily && window.canClaimDaily()) {
        const lastClaim = S.lastDailyReward || 0;
        const timeSince = now - lastClaim;

        // Only notify once per session (check if more than 25 hours since last claim)
        if (timeSince > 25 * 60 * 60 * 1000) {
            toast('🎁 Daily reward available! Check the menu', 'ok');
            notificationState.lastEventWarning = now;
        }
    }
}

/**
 * Run all notification checks
 * Called from game loop
 */
export function runNotificationChecks() {
    checkInventoryWarnings();
    checkWorkerIdleWarnings();
    checkEventWarnings();
}

/**
 * Initialize notification system
 */
export function initNotifications() {
    // Run checks every 30 seconds
    setInterval(runNotificationChecks, 30000);

    // Initial check after 10 seconds
    setTimeout(runNotificationChecks, 10000);

    console.log('🔔 Notification system initialized');
}

// Auto-initialize
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNotifications);
    } else {
        setTimeout(initNotifications, 1000);
    }
}

// Export for global access
window.runNotificationChecks = runNotificationChecks;
window.initNotifications = initNotifications;
