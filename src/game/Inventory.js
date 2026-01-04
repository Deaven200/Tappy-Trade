/**
 * Inventory management for Tappy Trade
 */

import { RESOURCES } from './Resources.js';

export class Inventory {
    constructor(capacity = 1000) {
        this.items = {}; // { resourceId: quantity }
        this.capacity = capacity;
    }

    /**
     * Get total items in inventory
     */
    getTotalItems() {
        return Object.values(this.items).reduce((sum, qty) => sum + qty, 0);
    }

    /**
     * Get available space
     */
    getAvailableSpace() {
        return this.capacity - this.getTotalItems();
    }

    /**
     * Check if inventory has space for items
     */
    hasSpace(amount = 1) {
        return this.getAvailableSpace() >= amount;
    }

    /**
     * Add items to inventory
     * @returns {number} Amount actually added (may be less if full)
     */
    addItem(resourceId, amount) {
        const availableSpace = this.getAvailableSpace();
        const amountToAdd = Math.min(amount, availableSpace);

        if (amountToAdd <= 0) return 0;

        this.items[resourceId] = (this.items[resourceId] || 0) + amountToAdd;
        return amountToAdd;
    }

    /**
     * Remove items from inventory
     * @returns {number} Amount actually removed
     */
    removeItem(resourceId, amount) {
        const currentAmount = this.items[resourceId] || 0;
        const amountToRemove = Math.min(amount, currentAmount);

        if (amountToRemove <= 0) return 0;

        this.items[resourceId] = currentAmount - amountToRemove;

        // Clean up empty entries
        if (this.items[resourceId] <= 0) {
            delete this.items[resourceId];
        }

        return amountToRemove;
    }

    /**
     * Get quantity of a specific item
     */
    getQuantity(resourceId) {
        return this.items[resourceId] || 0;
    }

    /**
     * Check if inventory has at least the specified amount
     */
    hasItem(resourceId, amount = 1) {
        return this.getQuantity(resourceId) >= amount;
    }

    /**
     * Get all items as array for display
     */
    getAllItems() {
        const result = [];
        for (const [resourceId, quantity] of Object.entries(this.items)) {
            if (quantity > 0 && RESOURCES[resourceId]) {
                result.push({
                    ...RESOURCES[resourceId],
                    quantity,
                });
            }
        }
        return result;
    }

    /**
     * Serialize for saving
     */
    toJSON() {
        return {
            items: { ...this.items },
            capacity: this.capacity,
        };
    }

    /**
     * Load from saved data
     */
    static fromJSON(data) {
        const inv = new Inventory(data.capacity);
        inv.items = { ...data.items };
        return inv;
    }
}
