/**
 * Market Mechanics
 * Handles buying, selling, and market orders
 */

import { S } from '../core/state.js';
import { R } from '../config/data.js';
import { toast, playS } from '../utils/feedback.js';
import { save } from '../core/storage.js';

/**
 * Get current market price for an item
 * @param {string} itemId - Item resource ID
 * @returns {number} Current price
 */
export function getPrice(itemId) {
    const resource = R[itemId];
    if (!resource) return 0;
    // Could add dynamic pricing here
    return resource.p || 0;
}

/**
 * Sell items to the government market
 * @param {string} itemId - Item to sell
 * @param {number} quantity - Amount to sell
 */
export function sell(itemId, quantity) {
    if (!window.hasItem(itemId, quantity)) {
        toast('Not enough items!', 'err');
        playS('err');
        return;
    }

    const price = getPrice(itemId);
    const total = price * quantity;

    window.remItem(itemId, quantity);
    S.money += total;
    S.stats.sold += quantity;
    S.stats.earned += total;

    toast(`Sold for $${total}`, 'ok');
    playS('tap');
    save();
    window.render();
}

/**
 * Sell all items in inventory
 */
export function sellAll() {
    let totalMoney = 0;
    let totalItems = 0;

    for (const [itemId, qty] of Object.entries(S.inv)) {
        if (qty > 0) {
            const price = getPrice(itemId);
            totalMoney += price * qty;
            totalItems += qty;
            S.inv[itemId] = 0;
        }
    }

    S.money += totalMoney;
    S.stats.sold += totalItems;
    S.stats.earned += totalMoney;

    toast(`Sold ${totalItems} items for $${totalMoney.toLocaleString()}!`, 'ok');
    playS('ach');
    save();
    window.render();
}

/**
 * Buy items from government market
 * @param {string} itemId - Item to buy
 * @param {number} quantity - Amount to buy
 */
export function buyFromGov(itemId, quantity) {
    const price = getPrice(itemId);
    const cost = price * quantity;

    if (S.money < cost) {
        toast('Not enough money!', 'err');
        playS('err');
        return;
    }

    if (window.getInvTotal() + quantity > S.cap) {
        toast('Inventory full!', 'err');
        playS('err');
        return;
    }

    S.money -= cost;
    window.addItem(itemId, quantity);

    toast(`Bought ${quantity}x for $${cost}`, 'ok');
    playS('tap');
    save();
    window.render();
}

/**
 * Submit a limit order to player market
 * @param {string} itemId - Item to sell
 * @param {number} quantity - Amount
 * @param {number} price - Price per unit
 */
export function submitLimitOrder(itemId, quantity, price) {
    if (!window.hasItem(itemId, quantity)) {
        toast('Not enough items!', 'err');
        return;
    }

    // Remove items from inventory (held in escrow)
    window.remItem(itemId, quantity);

    // Create order (would sync to Firebase in real implementation)
    toast(`Order created: ${quantity}x @ $${price}`, 'ok');
    playS('tap');
    save();
    window.render();
}

/**
 * Cancel a player market order
 * @param {string} orderId - Order ID to cancel
 */
export function cancelOrder(orderId) {
    toast('Order cancelled', 'ok');
    save();
    window.render();
}
