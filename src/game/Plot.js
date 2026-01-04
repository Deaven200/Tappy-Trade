/**
 * Plot and Sub-plot management for Tappy Trade
 */

import { SUB_PLOT_TYPES, getRandomYield } from './Resources.js';

export class SubPlot {
    constructor(type = 'forest', index = 0) {
        this.type = type;
        this.index = index;
        this.isWild = true;
        this.building = null;
        this.harvestedAt = null; // null = ready to harvest
        this.pendingYield = null; // Resources ready to harvest

        // Generate initial yield
        this.generateYield();
    }

    /**
     * Generate resources for this sub-plot
     */
    generateYield() {
        if (!this.isWild) return;
        this.pendingYield = getRandomYield(this.type);
    }

    /**
     * Get type configuration
     */
    getTypeConfig() {
        return SUB_PLOT_TYPES[this.type];
    }

    /**
     * Check if resources are ready to harvest
     */
    isReady() {
        if (!this.isWild) return false;
        if (!this.harvestedAt) return true;

        const config = this.getTypeConfig();
        const now = Date.now();
        return now >= this.harvestedAt + config.regrowthMs;
    }

    /**
     * Get time remaining until regrowth (in ms)
     */
    getRegrowthRemaining() {
        if (!this.harvestedAt) return 0;

        const config = this.getTypeConfig();
        const regrowthTime = this.harvestedAt + config.regrowthMs;
        const remaining = regrowthTime - Date.now();

        return Math.max(0, remaining);
    }

    /**
     * Format remaining time as human-readable string
     */
    getRegrowthString() {
        const remaining = this.getRegrowthRemaining();
        if (remaining <= 0) return 'Ready';

        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    }

    /**
     * Harvest resources from this sub-plot
     * @returns {Object} Resources harvested, or null if not ready
     */
    harvest() {
        if (!this.isReady()) return null;

        // Check if regrowth completed and we need new yield
        if (this.harvestedAt !== null) {
            this.generateYield();
        }

        const yield_ = { ...this.pendingYield };
        this.harvestedAt = Date.now();
        this.pendingYield = null;

        return yield_;
    }

    /**
     * Update regrowth state (call periodically)
     */
    update() {
        if (!this.isWild) return;

        // If regrowth complete and no pending yield, generate new one
        if (this.isReady() && !this.pendingYield) {
            this.generateYield();
        }
    }

    /**
     * Serialize for saving
     */
    toJSON() {
        return {
            type: this.type,
            index: this.index,
            isWild: this.isWild,
            building: this.building,
            harvestedAt: this.harvestedAt,
            pendingYield: this.pendingYield,
        };
    }

    /**
     * Load from saved data
     */
    static fromJSON(data) {
        const sp = new SubPlot(data.type, data.index);
        sp.isWild = data.isWild;
        sp.building = data.building;
        sp.harvestedAt = data.harvestedAt;
        sp.pendingYield = data.pendingYield;
        return sp;
    }
}

export class Plot {
    constructor(index = 0) {
        this.index = index;
        this.subPlots = [
            new SubPlot('forest', 0),
            new SubPlot('berryBush', 1),
            new SubPlot('herbPatch', 2),
        ];
    }

    /**
     * Get a sub-plot by index
     */
    getSubPlot(index) {
        return this.subPlots[index];
    }

    /**
     * Update all sub-plots
     */
    update() {
        for (const sp of this.subPlots) {
            sp.update();
        }
    }

    /**
     * Serialize for saving
     */
    toJSON() {
        return {
            index: this.index,
            subPlots: this.subPlots.map(sp => sp.toJSON()),
        };
    }

    /**
     * Load from saved data
     */
    static fromJSON(data) {
        const plot = new Plot(data.index);
        plot.subPlots = data.subPlots.map(spData => SubPlot.fromJSON(spData));
        return plot;
    }
}
