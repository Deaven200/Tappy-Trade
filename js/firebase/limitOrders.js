/**
 * Limit Orders Module
 * Handles automatic trading when price conditions are met
 */

import { S } from '../core/state.js';
import { R } from '../config/data.js';
import { toast } from '../utils/feedback.js';
import { save } from '../core/storage.js';

/**
 * Create a new limit order
 * @param {string} type - 'buy' or 'sell'
 * @param {string} resourceId - Resource ID
 * @param {number} qty - Quantity
 * @param {number} targetPrice - Target price
 */
export function createLimitOrder(type, resourceId, qty, targetPrice) {
    if (!S.limitOrders) S.limitOrders = [];
    
    const order = {
        type,
        res: resourceId,
        qty,
        price: targetPrice,
        created: Date.now()
    };
    
    S.limitOrders.push(order);
    toast(`Limit order created: ${type} ${qty} ${R[resourceId]?.i} @ $${targetPrice}`, 'ok');
    save();
}

/**
 * Cancel a limit order
 * @param {number} index - Order index
 */
export function cancelLimitOrder(index) {
    if (!S.limitOrders) return;
    S.limitOrders.splice(index, 1);
    toast('Limit order cancelled', 'ok');
    save();
}

/**
 * Process all limit orders - check if price conditions are met
 */
export function processLimitOrders() {
    if (!S.limitOrders || S.limitOrders.length === 0) return;
    
    const getPrice = (id) => { 
        if (!S.prices[id]) S.prices[id] = R[id]?.p || 1; 
        return S.prices[id];
    };
    
    const ordersToRemove = [];
    
    for (let i = 0; i < S.limitOrders.length; i++) {
        const order = S.limitOrders[i];
        const currentPrice = getPrice(order.res);
        
        if (order.type === 'buy' && currentPrice <= order.price) {
            // Buy condition met
            const cost = currentPrice * order.qty;
            if (S.money >= cost) {
                S.money -= cost;
                if (!S.inv[order.res]) S.inv[order.res] = 0;
                S.inv[order.res] += order.qty;
                toast(`Limit buy executed: ${order.qty} ${R[order.res]?.i} @ $${currentPrice.toFixed(2)}`, 'ok');
                ordersToRemove.push(i);
            }
        } else if (order.type === 'sell' && currentPrice >= order.price) {
            // Sell condition met
            const hasEnough = (S.inv[order.res] || 0) >= order.qty;
            if (hasEnough) {
                S.inv[order.res] -= order.qty;
                if (S.inv[order.res] <= 0) delete S.inv[order.res];
                S.money += currentPrice * order.qty;
                S.stats.sold += order.qty;
                S.stats.earned += currentPrice * order.qty;
                toast(`Limit sell executed: ${order.qty} ${R[order.res]?.i} @ $${currentPrice.toFixed(2)}`, 'ok');
                ordersToRemove.push(i);
            }
        }
    }
    
    // Remove executed orders (in reverse to preserve indices)
    for (let i = ordersToRemove.length - 1; i >= 0; i--) {
        S.limitOrders.splice(ordersToRemove[i], 1);
    }
    
    if (ordersToRemove.length > 0) {
        save();
        if (window.render) window.render();
    }
}
