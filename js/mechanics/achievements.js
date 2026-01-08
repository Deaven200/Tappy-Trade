/**
 * Achievement System Module
 * Handles achievement tracking and unlocking
 */

import { S } from '../core/state.js';
import { ACH } from '../config/achievements.js';
import { notif, playS } from '../utils/feedback.js';
import { save } from '../core/storage.js';

/**
 * Check and unlock achievements based on current stats
 */
export function checkAchievements() {
    if (!S.ach) S.ach = {};

    let newUnlocks = 0;

    ACH.forEach(achievement => {
        // Skip if already unlocked
        if (S.ach[achievement.id]) return;

        let unlocked = false;

        // Check achievement condition based on type
        switch (achievement.type) {
            case 'harvest':
                unlocked = (S.stats?.harvested || 0) >= achievement.req;
                break;
            case 'money':
                unlocked = (S.stats?.earned || 0) >= achievement.req;
                break;
            case 'sell':
                unlocked = (S.stats?.sold || 0) >= achievement.req;
                break;
            case 'build':
                unlocked = (S.stats?.built || 0) >= achievement.req;
                break;
            case 'worker':
                unlocked = (S.workers?.length || 0) >= achievement.req;
                break;
            case 'plot':
                unlocked = (S.plots?.length || 0) >= achievement.req;
                break;
            default:
                break;
        }

        if (unlocked) {
            S.ach[achievement.id] = Date.now();
            notif(`🏆 Achievement Unlocked: ${achievement.n}!`);
            playS('ach');
            newUnlocks++;
        }
    });

    if (newUnlocks > 0) {
        save();
    }

    return newUnlocks;
}

/**
 * Get achievement progress (0-1)
 * @param {Object} achievement - Achievement config
 * @returns {number} Progress from 0 to 1
 */
export function getAchievementProgress(achievement) {
    if (S.ach && S.ach[achievement.id]) return 1; // Unlocked

    let current = 0;

    switch (achievement.type) {
        case 'harvest':
            current = S.stats?.harvested || 0;
            break;
        case 'money':
            current = S.stats?.earned || 0;
            break;
        case 'sell':
            current = S.stats?.sold || 0;
            break;
        case 'build':
            current = S.stats?.built || 0;
            break;
        case 'worker':
            current = S.workers?.length || 0;
            break;
        case 'plot':
            current = S.plots?.length || 0;
            break;
        default:
            break;
    }

    return Math.min(current / achievement.req, 1);
}

/**
 * Get total unlocked achievement count
 * @returns {number}
 */
export function getUnlockedCount() {
    if (!S.ach) return 0;
    return Object.keys(S.ach).length;
}
