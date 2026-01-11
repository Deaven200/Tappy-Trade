/**
 * Offline Progress Simulation
 * Handles accurate simulation of game state for time passed while offline
 */

import { S } from '../core/state.js';
import { update } from './gameLoop.js';
import { CONFIG } from '../config/constants.js';

/**
 * Process offline progress by simulating game ticks
 * @param {number} offlineSeconds - Total seconds to simulate
 * @returns {object} - Gained resources summary
 */
export async function processOfflineProgress(offlineSeconds) {
    // 1. Cap max offline time (e.g., 8 hours default, or custom config)
    const MAX_OFFLINE_SECONDS = (CONFIG.MAX_OFFLINE_HOURS || 8) * 3600;
    const effectiveSeconds = Math.min(offlineSeconds, MAX_OFFLINE_SECONDS);

    // 2. Snapshot state before simulation
    const beforeStats = {
        harvested: S.stats?.harvested || 0,
        inv: { ...S.inv }
    };

    const beforeInvTotal = Object.values(beforeStats.inv).reduce((a, b) => a + b, 0);

    console.log(`🕐 Simulating ${effectiveSeconds.toFixed(1)}s offline time...`);

    // 3. Run Simulation in Chunks
    // We simulate in chunks to ensure regeneration and worker harvesting happens in correct order
    // e.g., Worker harvests -> Plot Empty -> Plot Regenerates -> Worker Harvests
    const TICK_SIZE = 60; // 1 minute chunks for speed/accuracy balance
    let remaining = effectiveSeconds;

    // Performance protection: Don't run too many iterations
    // If time is very long, we might scale tick size up, but 1 min is usually fine for < 24h
    // 8 hours = 480 ticks. Very fast.

    while (remaining > 0) {
        const dt = Math.min(remaining, TICK_SIZE);

        // Run update in simulation mode (true)
        update(dt, true);

        remaining -= dt;
    }

    // 4. Calculate Gains
    const gainedItems = {};
    const currentInvTotal = Object.values(S.inv).reduce((a, b) => a + b, 0);

    // Detailed item diff
    for (const [key, qty] of Object.entries(S.inv)) {
        const oldQty = beforeStats.inv[key] || 0;
        const diff = qty - oldQty;
        if (diff > 0) {
            gainedItems[key] = diff;
        }
    }

    const netGain = currentInvTotal - beforeInvTotal;

    console.log(`✅ Simulation Complete. Net Gain: ${netGain} items`);

    return {
        seconds: effectiveSeconds,
        gainedItems: gainedItems,
        netGain: netGain
    };
}
