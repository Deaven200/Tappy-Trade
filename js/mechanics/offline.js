/**
 * Offline Progress Calculation (Optimized)
 * Uses instant mathematical calculation instead of simulation
 * No time cap - supports any offline duration
 */

import { S } from '../core/state.js';

/**
 * Calculate offline progress instantly using math
 * @param {number} offlineSeconds - Total seconds offline (NO CAP)
 * @returns {object} - Gained resources summary
 */
export async function processOfflineProgress(offlineSeconds) {
    console.log(`🕐 Calculating ${formatTime(offlineSeconds)} offline progress...`);

    // Snapshot state before calculation
    const beforeInv = { ...S.inv };
    const beforeInvTotal = Object.values(beforeInv).reduce((a, b) => a + b, 0);

    // Track all gains
    const gainedItems = {};

    // Get building configs
    const T = window.T;

    // Helper to get current inventory total
    const getInvTotal = () => Object.values(S.inv).reduce((a, b) => a + b, 0);

    // ===== STEP 1: Calculate plot regeneration (fill up subplots) =====
    S.plots.forEach(plot => {
        plot.subs.forEach(subplot => {
            const config = T[subplot.t];
            if (!config) return;

            const level = subplot.lv || 1;
            const regenBonus = 1 + (level - 1) * 0.1;
            const regenRate = (config.r || 0) * regenBonus;

            if (regenRate > 0) {
                const maxStorage = (config.m || 999) + (level - 1) * 10;
                subplot.c = Math.min(subplot.c + regenRate * offlineSeconds, maxStorage);
            }
        });
    });

    // ===== STEP 2: Calculate worker harvests =====
    const workerHarvestIntervals = Math.floor(offlineSeconds / 5);

    if (S.workers.length > 0 && workerHarvestIntervals > 0) {
        // Process each worker
        for (const worker of S.workers) {
            const subplot = S.plots[worker.plot]?.subs[worker.sub];
            if (!subplot) continue;

            const config = T[subplot.t];
            if (!config) continue;

            // Check remaining inventory space (recalculated for each worker!)
            const remainingSpace = S.cap - getInvTotal();
            if (remainingSpace <= 0) {
                console.log('📦 Inventory full, stopping worker calculations');
                break;
            }

            const level = subplot.lv || 1;
            const regenBonus = 1 + (level - 1) * 0.1;
            const regenRate = (config.r || 0) * regenBonus;
            const maxStorage = (config.m || 999) + (level - 1) * 10;

            let totalHarvested = 0;

            if (config.pool) {
                // Wild subplot - random resources from pool
                const theoreticalProduction = subplot.c + regenRate * offlineSeconds;
                totalHarvested = Math.min(
                    Math.floor(theoreticalProduction),
                    workerHarvestIntervals,
                    remainingSpace
                );

                if (totalHarvested > 0) {
                    // Distribute evenly among pool items
                    const perItem = Math.floor(totalHarvested / config.pool.length);
                    let distributed = 0;

                    config.pool.forEach(itemId => {
                        if (perItem > 0) {
                            S.inv[itemId] = (S.inv[itemId] || 0) + perItem;
                            gainedItems[itemId] = (gainedItems[itemId] || 0) + perItem;
                            distributed += perItem;
                        }
                    });

                    // Handle remainder - distribute to first items
                    const remainder = totalHarvested - distributed;
                    for (let i = 0; i < remainder && i < config.pool.length; i++) {
                        const itemId = config.pool[i];
                        S.inv[itemId] = (S.inv[itemId] || 0) + 1;
                        gainedItems[itemId] = (gainedItems[itemId] || 0) + 1;
                    }

                    S.stats.harvested = (S.stats.harvested || 0) + totalHarvested;
                }

                // Reset subplot storage
                subplot.c = Math.min(regenRate * (offlineSeconds % 5), maxStorage);

            } else if (config.o && !config.req) {
                // Regular resource building (forest, quarry, farm, apiary, etc.)
                const theoreticalProduction = subplot.c + regenRate * offlineSeconds;

                totalHarvested = Math.min(
                    Math.floor(theoreticalProduction),
                    workerHarvestIntervals,
                    remainingSpace
                );

                if (totalHarvested > 0) {
                    S.inv[config.o] = (S.inv[config.o] || 0) + totalHarvested;
                    gainedItems[config.o] = (gainedItems[config.o] || 0) + totalHarvested;
                    S.stats.harvested = (S.stats.harvested || 0) + totalHarvested;

                    console.log(`  👷 Worker on ${config.n}: +${totalHarvested} ${config.o}`);
                }

                // Update subplot storage
                subplot.c = Math.min(theoreticalProduction - totalHarvested, maxStorage);

            } else if (config.req) {
                // Manufacturing building - requires input resources
                const inputResource = config.req;
                const inputNeeded = config.use || 1;
                const availableInput = S.inv[inputResource] || 0;

                const maxCraftable = Math.min(
                    Math.floor(availableInput / inputNeeded),
                    workerHarvestIntervals,
                    remainingSpace
                );

                if (maxCraftable > 0 && config.o) {
                    // Consume inputs
                    S.inv[inputResource] = (S.inv[inputResource] || 0) - (maxCraftable * inputNeeded);
                    if (S.inv[inputResource] <= 0) delete S.inv[inputResource];

                    // Produce outputs
                    S.inv[config.o] = (S.inv[config.o] || 0) + maxCraftable;
                    gainedItems[config.o] = (gainedItems[config.o] || 0) + maxCraftable;
                    S.stats.harvested = (S.stats.harvested || 0) + maxCraftable;

                    console.log(`  🏭 Worker on ${config.n}: +${maxCraftable} ${config.o} (used ${maxCraftable * inputNeeded} ${inputResource})`);
                }

                totalHarvested = maxCraftable;
            }

            // Handle bonus drops (livestock extras like beef, leather, etc.)
            if (config.x && totalHarvested > 0) {
                for (const [bonusItem, bonusRate] of Object.entries(config.x)) {
                    const bonusCount = Math.floor(totalHarvested * bonusRate);
                    if (bonusCount > 0 && (getInvTotal() + bonusCount) <= S.cap) {
                        S.inv[bonusItem] = (S.inv[bonusItem] || 0) + bonusCount;
                        gainedItems[bonusItem] = (gainedItems[bonusItem] || 0) + bonusCount;
                    }
                }
            }
        }
    }

    // Calculate final net gain
    const afterInvTotal = getInvTotal();
    const netGain = afterInvTotal - beforeInvTotal;

    console.log(`✅ Offline calculation complete! Net gain: ${netGain} items`);
    console.log('📦 Gained items:', gainedItems);

    return {
        seconds: offlineSeconds,
        gainedItems: gainedItems,
        netGain: Math.max(0, netGain)
    };
}

/**
 * Format seconds into human-readable time
 */
function formatTime(seconds) {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    if (seconds < 86400) return `${(seconds / 3600).toFixed(1)}h`;
    return `${(seconds / 86400).toFixed(1)} days`;
}
