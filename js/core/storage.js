/**
 * Storage Management
 * Save/load game state to localStorage and cloud (Firebase)
 */

import { S } from './state.js';
import { CONFIG, SAVE_VERSION } from '../config/constants.js';

// Note: We access updateSaveIndicator and setLastSaveTime via window to avoid circular dependency

/**
 * Migrate save data to current version
 */
function migrateSave(loadedState) {
    const version = loadedState.saveVersion || 1;
    if (CONFIG.DEBUG_MODE) console.log('Migrating save from version', version, 'to', SAVE_VERSION);

    // Version 1 → 2: Fix inventory cap
    if (version < 2) {
        loadedState.cap = CONFIG.BASE_INVENTORY_CAP;
        loadedState.saveVersion = 2;
        if (CONFIG.DEBUG_MODE) console.log('✅ Migrated cap to', CONFIG.BASE_INVENTORY_CAP);
    }

    // Add missing fields
    if (!loadedState.farmName) loadedState.farmName = "Untitled Farm";
    if (loadedState.hasRenamedFarm === undefined) loadedState.hasRenamedFarm = false;

    return loadedState;
}

/**
 * Save game state to localStorage
 */
export function save() {
    S.lastUpdate = Date.now();
    localStorage.setItem('tt4', JSON.stringify(S));

    console.log('💾 Game saved at', new Date().toLocaleTimeString());

    // Use window to avoid circular dependency
    if (window.setLastSaveTime) window.setLastSaveTime(Date.now());
    // NOTE: Don't call updateSaveIndicator here - it creates circular calls!
    // The indicator updates every second via setInterval in index.html

    // Auto-save to cloud if logged in (throttled)
    if (window.loggedInUser && window.db && !window._cloudSaving) {
        window._cloudSaveQueued = true;
    }
}

/**
 * Load game state from localStorage
 */
export function load() {
    try {
        const saved = localStorage.getItem('tt4');
        if (!saved) return 0;

        const d = JSON.parse(saved);
        if (!d || typeof d !== 'object') return 0;

        // Migrate if needed
        const migrated = migrateSave(d);

        // Validate critical fields with type checking
        if (typeof migrated.money !== 'number' || isNaN(migrated.money)) migrated.money = 0;
        if (!Array.isArray(migrated.plots)) migrated.plots = S.plots;
        if (!Array.isArray(migrated.workers)) migrated.workers = [];
        if (typeof migrated.inv !== 'object' || Array.isArray(migrated.inv)) migrated.inv = {};
        if (typeof migrated.stats !== 'object') migrated.stats = { harvested: 0, sold: 0, earned: 0, built: 0 };
        if (typeof migrated.ach !== 'object') migrated.ach = {};
        if (typeof migrated.prices !== 'object') migrated.prices = {};
        if (typeof migrated.cap !== 'number' || migrated.cap < 100) migrated.cap = CONFIG.BASE_INVENTORY_CAP;

        // Sanitize inventory keys and values
        const cleanInv = {};
        for (const [key, val] of Object.entries(migrated.inv)) {
            if (typeof val === 'number' && !isNaN(val) && val > 0) {
                cleanInv[key] = Math.floor(val);
            }
        }
        migrated.inv = cleanInv;

        Object.assign(S, migrated);
        if (CONFIG.DEBUG_MODE) console.log('✅ Save loaded successfully');
        return 1;
    } catch (e) {
        console.error('Save load failed:', e);
        return 0;
    }
}

/**
 * Save to cloud (Firebase)
 */
export async function saveToCloud() {
    const loggedInUser = window.loggedInUser;
    const db = window.db;
    const firebase = window.firebase;

    if (!loggedInUser || !db) return;

    window._cloudSaving = true;
    try {
        await db.collection('saves').doc(loggedInUser.id).set({
            state: JSON.stringify(S),
            username: loggedInUser.username,
            money: S.money,
            lastSave: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (e) {
        console.error('Cloud save failed:', e);
    }
    window._cloudSaving = false;
    window._cloudSaveQueued = false;
}

/**
 * Load from cloud (Firebase)
 */
export async function loadFromCloud() {
    const loggedInUser = window.loggedInUser;
    const db = window.db;

    if (!loggedInUser || !db) return false;

    try {
        const doc = await db.collection('saves').doc(loggedInUser.id).get();
        if (doc.exists) {
            const data = doc.data();
            const cloudState = JSON.parse(data.state);

            // Migrate cloud state if needed
            const migrated = migrateSave(cloudState);

            // Calculate offline progress
            const cloudTime = migrated.lastUpdate || 0;
            const offlineMs = Date.now() - cloudTime;
            const offlineHours = Math.min(offlineMs / (1000 * 60 * 60), CONFIG.MAX_OFFLINE_HOURS);

            if (offlineHours > 0.016) { // More than ~1 minute
                const offlineSeconds = offlineHours * 3600;
                const harvestCycles = Math.floor(offlineSeconds / 5);

                // === DEBUG LOGGING START ===
                console.log('\n🕐 OFFLINE PROGRESS CALCULATION 🕐');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                const oldTime = new Date(cloudTime);
                const newTime = new Date();
                console.log(`⏰ Last Save: ${oldTime.toLocaleString()}`);
                console.log(`⏰ Current:   ${newTime.toLocaleString()}`);
                console.log(`⏱️  Offline:   ${(offlineMs / 60000).toFixed(1)} minutes (${offlineSeconds.toFixed(0)} seconds)`);
                console.log(`👷 Workers:   ${migrated.workers?.length || 0}`);
                console.log(`🔄 Harvest Cycles: ${harvestCycles} (capped at ${Math.min(harvestCycles, 8640)})`);

                // Before state
                const invBefore = {};
                for (const [k, v] of Object.entries(migrated.inv || {})) {
                    invBefore[k] = v;
                }
                const totalBefore = Object.values(invBefore).reduce((a, b) => a + b, 0);
                console.log(`\n📦 Inventory Before: ${totalBefore} items`);
                // === DEBUG LOGGING END ===

                // Apply offline worker harvests
                if (migrated.workers && migrated.workers.length > 0 && harvestCycles > 0) {
                    for (let i = 0; i < Math.min(harvestCycles, 8640); i++) { // Cap at 12 hours of cycles
                        for (const worker of migrated.workers) {
                            const plot = migrated.plots[worker.plot];
                            if (plot) {
                                const sub = plot.subs[worker.sub];
                                if (sub && sub.c > 0) {
                                    const cfg = window.T?.[sub.t];
                                    if (cfg) {
                                        migrated.inv[cfg.i] = (migrated.inv[cfg.i] || 0) + 1;
                                        sub.c--;
                                    }
                                }
                            }
                        }
                    }
                }

                // Apply offline resource regeneration
                for (const plot of migrated.plots || []) {
                    for (const sub of plot.subs || []) {
                        const cfg = window.T?.[sub.t];
                        if (cfg && cfg.r) {
                            const regenRate = cfg.r * offlineSeconds;
                            sub.c = Math.min(cfg.m || 999, sub.c + regenRate);
                        }
                    }
                }

                // === DEBUG LOGGING START ===
                const totalAfter = Object.values(migrated.inv || {}).reduce((a, b) => a + b, 0);
                const gained = totalAfter - totalBefore;
                console.log(`📦 Inventory After:  ${totalAfter} items (+${gained})`);
                console.log(`\n📊 Items Gained:`);
                for (const [k, v] of Object.entries(migrated.inv || {})) {
                    const before = invBefore[k] || 0;
                    const delta = v - before;
                    if (delta > 0) {
                        console.log(`  +${delta} ${k} (${before} → ${v})`);
                    }
                }
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
                // === DEBUG LOGGING END ===
            }

            // Load the cloud state into S
            Object.assign(S, migrated);
            S.lastUpdate = Date.now();

            // Save to local storage
            save();

            // Update UI
            if (window.render) window.render();

            console.log('✅ Cloud save loaded successfully');
            window.notif?.('Cloud save loaded!');

            return true;
        } else {
            console.log('No cloud save found for user');
            return false;
        }
    } catch (e) {
        console.error('Cloud load failed:', e);
    }
    return false;
}

// Cloud sync interval (every 30 seconds if changes pending)
// NOTE: This has been moved to index.html init() function to prevent blocking module load
// Top-level code in modules can cause issues with import resolution
/*
if (typeof window !== 'undefined') {
    setInterval(() => {
        if (window._cloudSaveQueued && window.loggedInUser && !window._cloudSaving) {
            saveToCloud();
        }
    }, 30000);
}
*/
