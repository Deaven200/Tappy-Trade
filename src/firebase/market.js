/**
 * Player Market - Firebase Integration
 * 
 * Handles real-time order book for player-to-player trading.
 */

import { getDb, isFirebaseConfigured } from './config.js';
import { getCurrentUserId } from './auth.js';

/**
 * Order structure:
 * {
 *   id: string,
 *   type: 'buy' | 'sell',
 *   resourceId: string,
 *   quantity: number,
 *   pricePerUnit: number,
 *   playerId: string,
 *   playerName: string,
 *   createdAt: timestamp,
 *   expiresAt: timestamp,
 *   status: 'active' | 'filled' | 'cancelled'
 * }
 */

const COLLECTION_ORDERS = 'market_orders';

/**
 * Post a new order to the market
 */
export async function postOrder(type, resourceId, quantity, pricePerUnit) {
    if (!isFirebaseConfigured()) {
        console.warn('Firebase not configured. Cannot post orders.');
        return null;
    }

    try {
        const db = getDb();
        const { collection, addDoc, serverTimestamp, Timestamp } = await import('firebase/firestore');

        const order = {
            type,
            resourceId,
            quantity,
            pricePerUnit,
            playerId: getCurrentUserId(),
            playerName: `Player-${getCurrentUserId().slice(-4)}`,
            createdAt: serverTimestamp(),
            expiresAt: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)), // 24 hours
            status: 'active',
        };

        const docRef = await addDoc(collection(db, COLLECTION_ORDERS), order);
        console.log('Order posted:', docRef.id);

        return { id: docRef.id, ...order };
    } catch (error) {
        console.error('Failed to post order:', error);
        return null;
    }
}

/**
 * Get active orders for a resource
 */
export async function getActiveOrders(resourceId = null) {
    if (!isFirebaseConfigured()) {
        return [];
    }

    try {
        const db = getDb();
        const { collection, query, where, orderBy, getDocs } = await import('firebase/firestore');

        let q;
        if (resourceId) {
            q = query(
                collection(db, COLLECTION_ORDERS),
                where('status', '==', 'active'),
                where('resourceId', '==', resourceId),
                orderBy('createdAt', 'desc')
            );
        } else {
            q = query(
                collection(db, COLLECTION_ORDERS),
                where('status', '==', 'active'),
                orderBy('createdAt', 'desc')
            );
        }

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Failed to get orders:', error);
        return [];
    }
}

/**
 * Subscribe to real-time order updates
 */
export async function subscribeToOrders(resourceId, callback) {
    if (!isFirebaseConfigured()) {
        callback([]);
        return () => { };
    }

    try {
        const db = getDb();
        const { collection, query, where, orderBy, onSnapshot } = await import('firebase/firestore');

        const q = query(
            collection(db, COLLECTION_ORDERS),
            where('status', '==', 'active'),
            where('resourceId', '==', resourceId),
            orderBy('pricePerUnit', 'asc')
        );

        return onSnapshot(q, (snapshot) => {
            const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(orders);
        });
    } catch (error) {
        console.error('Failed to subscribe to orders:', error);
        return () => { };
    }
}

/**
 * Fill an existing order (buy from seller or sell to buyer)
 */
export async function fillOrder(orderId, quantity) {
    if (!isFirebaseConfigured()) {
        return false;
    }

    try {
        const db = getDb();
        const { doc, runTransaction } = await import('firebase/firestore');

        await runTransaction(db, async (transaction) => {
            const orderRef = doc(db, COLLECTION_ORDERS, orderId);
            const orderDoc = await transaction.get(orderRef);

            if (!orderDoc.exists()) {
                throw new Error('Order not found');
            }

            const order = orderDoc.data();

            if (order.status !== 'active') {
                throw new Error('Order is no longer active');
            }

            if (order.quantity < quantity) {
                throw new Error('Not enough quantity available');
            }

            const newQuantity = order.quantity - quantity;

            if (newQuantity === 0) {
                transaction.update(orderRef, {
                    quantity: 0,
                    status: 'filled'
                });
            } else {
                transaction.update(orderRef, {
                    quantity: newQuantity
                });
            }
        });

        console.log('Order filled successfully');
        return true;
    } catch (error) {
        console.error('Failed to fill order:', error);
        return false;
    }
}

/**
 * Cancel an order (only owner can cancel)
 */
export async function cancelOrder(orderId) {
    if (!isFirebaseConfigured()) {
        return false;
    }

    try {
        const db = getDb();
        const { doc, updateDoc } = await import('firebase/firestore');

        await updateDoc(doc(db, COLLECTION_ORDERS, orderId), {
            status: 'cancelled'
        });

        console.log('Order cancelled:', orderId);
        return true;
    } catch (error) {
        console.error('Failed to cancel order:', error);
        return false;
    }
}
