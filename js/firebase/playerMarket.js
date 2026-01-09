/**
 * Firebase Player Market Module
 * Handles player-to-player trading via Firebase
 */

import { S } from '../core/state.js';
import { R } from '../config/resources.js';
import { toast, notif, playS } from '../utils/feedback.js';
import { hasItem, addItem, remItem } from '../utils/inventory.js';
import { save } from '../core/storage.js';

/**
 * Post a new order to the market
 * @param {string} type - 'buy' or 'sell'
 * @param {string} resource - Resource ID
 * @param {number} qty - Quantity
 * @param {number} price - Price per unit
 */
export async function postOrder(type, resource, qty, price) {
    if (!window.db || !window.userId) {
        toast('Not connected!', 'err');
        return;
    }

    // Check inventory directly
    const hasEnough = (S.inv[resource] || 0) >= qty;

    if (type === 'sell' && !hasEnough) {
        toast('Not enough items!', 'err');
        return;
    }

    if (type === 'buy' && S.money < qty * price) {
        toast('Not enough money!', 'err');
        return;
    }

    // Reserve items/money
    if (type === 'sell') remItem(resource, qty);
    if (type === 'buy') S.money -= qty * price;

    try {
        await window.db.collection('orders').add({
            type,
            resource,
            qty,
            price,
            userId: window.userId,
            status: 'open',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        toast(`Order posted: ${type} ${qty} ${R[resource]?.i}`, 'ok');
        playS('sell');
        save();
        if (window.render) window.render();
    } catch (e) {
        console.error('Post order error:', e);
        // Refund on error
        if (type === 'sell') addItem(S.inv, resource, qty);
        if (type === 'buy') S.money += qty * price;
        toast('Failed to post order', 'err');
    }
}

/**
 * Fill (purchase) an existing order
 * @param {Object} order - Order object from Firebase
 */
export async function fillOrder(order) {
    if (!window.db || !window.userId) {
        toast('Not connected!', 'err');
        return;
    }

    if (order.userId === window.userId) {
        toast('Cannot fill own order!', 'err');
        return;
    }

    const cost = order.qty * order.price;
    const isBuy = order.type === 'buy';

    // Check if we can fulfill (check inventory directly)
    const hasEnough = (S.inv[order.resource] || 0) >= order.qty;

    if (isBuy && !hasEnough) {
        toast('Not enough items!', 'err');
        return;
    }

    if (!isBuy && S.money < cost) {
        toast('Not enough money!', 'err');
        return;
    }

    // Reserve items/money
    if (isBuy) remItem(order.resource, order.qty);
    if (!isBuy) S.money -= cost;

    try {
        // Update order status to filled
        await window.db.collection('orders').doc(order.id).update({
            status: 'filled',
            filledBy: window.userId,
            filledAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Complete the trade
        if (isBuy) {
            // They wanted to buy, we sold to them
            S.money += cost;
            S.stats.sold += order.qty;
            S.stats.earned += cost;
        } else {
            // They wanted to sell, we bought from them
            addItem(S.inv, order.resource, order.qty);
        }

        notif(`✅ Trade complete: ${order.qty} ${R[order.resource]?.i} for $${cost}`);
        playS('sell');
        save();
        if (window.render) window.render();
    } catch (e) {
        console.error('Fill order error:', e);
        // Refund on error
        if (isBuy) addItem(S.inv, order.resource, order.qty);
        if (!isBuy) S.money += cost;
        toast('Failed to complete trade', 'err');
    }
}

/**
 * Cancel your own order
 * @param {Object} order - Order object from Firebase
 */
export async function cancelOrder(order) {
    if (!window.db || !window.userId) {
        toast('Not connected!', 'err');
        return;
    }

    if (order.userId !== window.userId) {
        toast('Not your order!', 'err');
        return;
    }

    try {
        // Delete the order
        await window.db.collection('orders').doc(order.id).delete();

        // Refund reserved items/money
        if (order.type === 'sell') {
            addItem(S.inv, order.resource, order.qty);
        } else {
            S.money += order.qty * order.price;
        }

        toast('Order cancelled', 'ok');
        save();
        if (window.render) window.render();
    } catch (e) {
        console.error('Cancel order error:', e);
        toast('Failed to cancel order', 'err');
    }
}
