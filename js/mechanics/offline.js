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
    const R = window.R;

    // ===== STEP 1: Calculate plot regeneration =====
    // Each subplot regenerates resources over time
    S.plots.forEach(plot => {
        plot.subs.forEach(subplot => {
            const config = T[subplot.t];
            if (!config) return;

            const level = subplot.lv || 1;
            const regenBonus = 1 + (level - 1) * 0.1; // 10% per level
            const regenRate = (config.r || 0) * regenBonus;

            if (regenRate > 0) {
                const maxStorage = (config.m || 999) + (level - 1) * 10;
                const oldCount = subplot.c;

                // Resources regenerate up to max storage
                subplot.c = Math.min(subplot.c + regenRate * offlineSeconds, maxStorage);

                // Track implicit regeneration (for reporting)
                const regenGain = subplot.c - oldCount;
                if (regenGain > 0 && config.o) {
                    // Note: This is storage fill, not inventory yet
                }
            }
        });
    });

    // ===== STEP 2: Calculate worker harvests =====
    // Workers harvest every 5 seconds
    const workerHarvestIntervals = Math.floor(offlineSeconds / 5);

    if (S.workers.length > 0 && workerHarvestIntervals > 0) {
        S.workers.forEach(worker => {
            const subplot = S.plots[worker.plot]?.subs[worker.sub];
            if (!subplot) return;

            const config = T[subplot.t];
            if (!config) return;

            const level = subplot.lv || 1;
            const regenBonus = 1 + (level - 1) * 0.1;
            const regenRate = (config.r || 0) * regenBonus;
            const maxStorage = (config.m || 999) + (level - 1) * 10;

            // Calculate maximum possible harvests for this worker
            let totalHarvested = 0;

            if (config.pool) {
                // Wild subplot - random resources
                // Calculate how many can actually be harvested
                // Resources regen at regenRate/s, worker harvests 1 every 5s
                // Production rate = regenRate * 5 per harvest cycle
                // But capped by storage filling up between harvests

                const productionPerCycle = regenRate * 5; // Resources gained between harvests
                const maxHarvestsFromRegen = workerHarvestIntervals * Math.min(1, productionPerCycle);
                const startingResources = subplot.c;

                // Total harvestable = starting + production over time, capped by storage
                // With continuous harvesting, effectively: min(regenRate * time, invSpace)
                const theoreticalProduction = startingResources + regenRate * offlineSeconds;
                totalHarvested = Math.min(
                    Math.floor(theoreticalProduction),
                    workerHarvestIntervals,
                    S.cap - Object.values(S.inv).reduce((a, b) => a + b, 0)
                );

                if (totalHarvested > 0) {
                    // Distribute randomly among pool items
                    config.pool.forEach(itemId => {
                        const share = Math.floor(totalHarvested / config.pool.length);
                        if (share > 0) {
                            S.inv[itemId] = (S.inv[itemId] || 0) + share;
                            gainedItems[itemId] = (gainedItems[itemId] || 0) + share;
                            S.stats.harvested += share;
                        }
                    });
                    // Handle remainder
                    const remainder = totalHarvested % config.pool.length;
                    if (remainder > 0) {
                        const randomItem = config.pool[0];
                        S.inv[randomItem] = (S.inv[randomItem] || 0) + remainder;
                        gainedItems[randomItem] = (gainedItems[randomItem] || 0) + remainder;
                        S.stats.harvested += remainder;
                    }
                }

                // Update subplot storage (empty after harvesting)
                subplot.c = Math.min(regenRate * (offlineSeconds % 5), maxStorage);

            } else if (config.o && !config.req) {
                // Regular resource building (farm, apiary, etc.)
                // Production = regenRate * time, capped by storage and inventory
                const productionPerCycle = regenRate * 5;
                const theoreticalProduction = subplot.c + regenRate * offlineSeconds;

                totalHarvested = Math.min(
                    Math.floor(theoreticalProduction),
                    workerHarvestIntervals,
                    S.cap - Object.values(S.inv).reduce((a, b) => a + b, 0)
                );

                if (totalHarvested > 0) {
                    S.inv[config.o] = (S.inv[config.o] || 0) + totalHarvested;
                    gainedItems[config.o] = (gainedItems[config.o] || 0) + totalHarvested;
                    S.stats.harvested += totalHarvested;
                }

                // Subplot retains remainder
                subplot.c = Math.min((theoreticalProduction - totalHarvested) % maxStorage, maxStorage);

            } else if (config.req) {
                // Manufacturing building - requires input resources
                // Check if we have input resources to process
                const inputResource = config.req;
                const inputNeeded = config.use || 1;
                const availableInput = S.inv[inputResource] || 0;

                // How many can we craft?
                const maxCraftable = Math.min(
                    Math.floor(availableInput / inputNeeded),
                    workerHarvestIntervals,
                    S.cap - Object.values(S.inv).reduce((a, b) => a + b, 0)
                );

                if (maxCraftable > 0 && config.o) {
                    // Consume inputs
                    S.inv[inputResource] = (S.inv[inputResource] || 0) - (maxCraftable * inputNeeded);
                    if (S.inv[inputResource] <= 0) delete S.inv[inputResource];

                    // Produce outputs
                    S.inv[config.o] = (S.inv[config.o] || 0) + maxCraftable;
                    gainedItems[config.o] = (gainedItems[config.o] || 0) + maxCraftable;
                    S.stats.harvested += maxCraftable;
                }
            }

            // Handle bonus drops (livestock extras like beef, leather, etc.)
            if (config.x && totalHarvested > 0) {
                for (const [bonusItem, bonusRate] of Object.entries(config.x)) {
                    const bonusCount = Math.floor(totalHarvested * bonusRate);
                    if (bonusCount > 0) {
                        S.inv[bonusItem] = (S.inv[bonusItem] || 0) + bonusCount;
                        gainedItems[bonusItem] = (gainedItems[bonusItem] || 0) + bonusCount;
                    }
                }
            }
        });
    }

    // ===== STEP 3: Enforce inventory cap =====
    const currentTotal = Object.values(S.inv).reduce((a, b) => a + b, 0);
    if (currentTotal > S.cap) {
        // Proportionally reduce all items
        const ratio = S.cap / currentTotal;
        for (const key of Object.keys(S.inv)) {
            S.inv[key] = Math.floor(S.inv[key] * ratio);
            if (S.inv[key] <= 0) delete S.inv[key];
        }
    }

    // Calculate final net gain
    const afterInvTotal = Object.values(S.inv).reduce((a, b) => a + b, 0);
    const netGain = afterInvTotal - beforeInvTotal;

    console.log(`✅ Offline calculation complete! Net gain: ${netGain} items`);

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
