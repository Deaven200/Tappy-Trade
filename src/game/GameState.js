/**
 * Central Game State for Tappy Trade
 */

import { Inventory } from './Inventory.js';
import { Plot } from './Plot.js';
import { PLOT_COSTS } from './Resources.js';

const SAVE_KEY = 'tappy_trade_save';

class GameState {
    constructor() {
        this.money = 0;
        this.plots = [new Plot(0)]; // Start with 1 plot
        this.inventory = new Inventory(1000);
        this.currentPlotIndex = 0;
        this.selectedSubPlotIndex = 0;

        this.listeners = new Set();
    }

    /**
     * Subscribe to state changes
     */
    subscribe(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    /**
     * Notify all listeners of state change
     */
    notify() {
        for (const callback of this.listeners) {
            callback(this);
        }
    }

    /**
     * Get current plot
     */
    getCurrentPlot() {
        return this.plots[this.currentPlotIndex];
    }

    /**
     * Get selected sub-plot
     */
    getSelectedSubPlot() {
        return this.getCurrentPlot().getSubPlot(this.selectedSubPlotIndex);
    }

    /**
     * Select a sub-plot
     */
    selectSubPlot(index) {
        this.selectedSubPlotIndex = index;
        this.notify();
    }

    /**
     * Harvest the selected sub-plot
     * @returns {Object|null} Resources harvested
     */
    harvestSelected() {
        const subPlot = this.getSelectedSubPlot();
        const harvested = subPlot.harvest();

        if (!harvested) return null;

        // Add resources to inventory
        let totalAdded = 0;
        const addedResources = {};

        for (const [resourceId, amount] of Object.entries(harvested)) {
            const added = this.inventory.addItem(resourceId, amount);
            addedResources[resourceId] = added;
            totalAdded += added;
        }

        if (totalAdded > 0) {
            this.save();
            this.notify();
        }

        return addedResources;
    }

    /**
     * Sell item to government market
     */
    sellToGov(resourceId, amount, pricePerUnit) {
        const removed = this.inventory.removeItem(resourceId, amount);
        if (removed > 0) {
            this.money += removed * pricePerUnit;
            this.save();
            this.notify();
        }
        return removed;
    }

    /**
     * Buy from government market
     */
    buyFromGov(resourceId, amount, pricePerUnit) {
        const totalCost = amount * pricePerUnit;
        if (this.money < totalCost) return 0;
        if (!this.inventory.hasSpace(amount)) return 0;

        const added = this.inventory.addItem(resourceId, amount);
        if (added > 0) {
            this.money -= added * pricePerUnit;
            this.save();
            this.notify();
        }
        return added;
    }

    /**
     * Get cost for next plot
     */
    getNextPlotCost() {
        const nextIndex = this.plots.length;
        if (nextIndex >= PLOT_COSTS.length) return Infinity;
        return PLOT_COSTS[nextIndex];
    }

    /**
     * Can afford next plot?
     */
    canBuyNextPlot() {
        return this.money >= this.getNextPlotCost();
    }

    /**
     * Buy next plot
     */
    buyNextPlot() {
        const cost = this.getNextPlotCost();
        if (this.money < cost) return false;

        this.money -= cost;
        const newPlot = new Plot(this.plots.length);
        this.plots.push(newPlot);

        // Increase inventory capacity
        this.inventory.capacity += 1000;

        this.save();
        this.notify();
        return true;
    }

    /**
     * Update game state (call periodically)
     */
    update() {
        for (const plot of this.plots) {
            plot.update();
        }
    }

    /**
     * Save game to localStorage
     */
    save() {
        const data = {
            version: 1,
            money: this.money,
            plots: this.plots.map(p => p.toJSON()),
            inventory: this.inventory.toJSON(),
            currentPlotIndex: this.currentPlotIndex,
            selectedSubPlotIndex: this.selectedSubPlotIndex,
            savedAt: Date.now(),
        };

        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save game:', e);
        }
    }

    /**
     * Load game from localStorage
     */
    load() {
        try {
            const saved = localStorage.getItem(SAVE_KEY);
            if (!saved) return false;

            const data = JSON.parse(saved);

            this.money = data.money || 0;
            this.plots = data.plots.map(p => Plot.fromJSON(p));
            this.inventory = Inventory.fromJSON(data.inventory);
            this.currentPlotIndex = data.currentPlotIndex || 0;
            this.selectedSubPlotIndex = data.selectedSubPlotIndex || 0;

            this.notify();
            return true;
        } catch (e) {
            console.error('Failed to load game:', e);
            return false;
        }
    }

    /**
     * Reset game (new game)
     */
    reset() {
        this.money = 0;
        this.plots = [new Plot(0)];
        this.inventory = new Inventory(1000);
        this.currentPlotIndex = 0;
        this.selectedSubPlotIndex = 0;

        localStorage.removeItem(SAVE_KEY);
        this.notify();
    }
}

// Singleton instance
export const gameState = new GameState();
