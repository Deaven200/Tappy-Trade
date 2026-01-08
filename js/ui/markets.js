/**
 * Markets Rendering Module
 * Renders Government Market and Player Market UI
 */

import { S } from '../core/state.js';
import { R } from '../config/resources.js';
import { getPrice } from '../mechanics/market.js';
import { $ } from '../utils/dom.js';

// Module-level state for order form
let sellQty = {};
let postRes = 'wood';
let postQty = 10;
let postPrice = 5;
let postType = 'sell';

// Get global state from window (set by index.html)
const getOrders = () => window.orders || [];
const getUserId = () => window.userId || null;

/**
 * Render Government Market (buy/sell from government)
 * @param {HTMLElement} container - Container element
 */
export function renderMarket(container) {
    let h = `<div class="panel">
        <h3>🏛️ Government Market</h3>
        <p style="color:var(--muted);font-size:0.75rem;margin-bottom:12px">Sell your resources at base prices</p>`;

    // Sell Tab (no tabs needed - only one option)
    const items = Object.entries(S.inv).filter(([_, q]) => q > 0);
    if (items.length === 0) {
        h += `<div class="empty" style="padding:30px;text-align:center">
            <div style="font-size:2rem;margin-bottom:8px;opacity:0.5">📭</div>
            <p style="color:var(--muted)">Nothing to sell!<br>Harvest some resources first.</p>
        </div>`;
    } else {
        h += `<div class="list">`;
        for (const [id, qty] of items) {
            const r = R[id]; if (!r) continue;
            const price = getPrice(id);
            const selectedQty = sellQty[id] || qty;

            h += `<div class="item">
                <span class="ic">${r.i}</span>
                <div style="flex:1;min-width:0">
                    <div class="nm">${r.n}</div>
                    <div style="font-size:0.7rem;color:var(--muted)">
                        $${price} each
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:4px">
                    <input type="range" min="1" max="${qty}" value="${selectedQty}" 
                        oninput="sellQty['${id}']=+this.value;this.nextElementSibling.textContent=this.value"
                        style="width:50px;accent-color:var(--gold)">
                    <span style="font-size:0.75rem;min-width:24px">${selectedQty}</span>
                    <button class="btn green" onclick="sell('${id}',sellQty['${id}']||${qty})" style="font-size:0.7rem">
                        $${(selectedQty * price).toLocaleString()}
                    </button>
                </div>
            </div>`;
        }
        h += `</div>`;
        h += `<button class="btn" style="width:100%;margin-top:10px" onclick="for(let id in S.inv){if(S.inv[id]>0)sell(id,S.inv[id])}">Sell Everything</button>`;
    }

    h += `</div>`;
    container.innerHTML = h;
}

// Track last render state
let lastMarketState = null;
let isMarketInitialized = false;

/**
 * Reset market initialization flag (called on screen switch)
 */
export function resetMarketInit() {
    isMarketInitialized = false;
    lastMarketState = null;
}

/**
 * Render Player Market (peer-to-peer trading)
 * @param {HTMLElement} container - Container element
 */
export function renderPlayerMarket(container) {
    const connected = !!getUserId();
    const orders = getOrders();

    // Create state snapshot for comparison
    const currentState = JSON.stringify({ connected, orders, postType, postRes, postQty, postPrice, limitOrders: S.limitOrders });
    const stateChanged = currentState !== lastMarketState;

    // Only re-render if state changed or first render
    if (!isMarketInitialized || stateChanged) {

        let h = `<div class="panel"><h3>🏪 Player Market ${connected ? '<span style="color:var(--green)">●</span>' : '<span style="color:var(--red)">○</span>'}</h3>`;

        if (!connected) {
            h += `<div class="empty">Connecting to market...</div></div>`;
            container.innerHTML = h;
            return;
        }

        // Post order form
        h += `<div style="margin-bottom:16px;padding:12px;background:var(--bg2);border-radius:8px">
        <div style="display:flex;gap:8px;margin-bottom:8px">
            <button class="btn ${postType === 'sell' ? 'green' : ''}" id="type-sell" style="flex:1">Sell</button>
            <button class="btn ${postType === 'buy' ? 'purple' : ''}" id="type-buy" style="flex:1">Buy</button>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:8px">
            <select id="post-res" style="flex:2;padding:8px;border-radius:6px;background:var(--card);color:var(--text);border:none">
                ${Object.entries(R).map(([k, v]) => `<option value="${k}" ${k === postRes ? 'selected' : ''}>${v.i} ${v.n}</option>`).join('')}
            </select>
            <input type="number" id="post-qty" value="${postQty}" min="1" style="flex:1;padding:8px;border-radius:6px;background:var(--card);color:var(--text);border:none">
        </div>
        <div style="display:flex;gap:8px;align-items:center">
            <span>$</span>
            <input type="number" id="post-price" value="${postPrice}" min="1" style="flex:1;padding:8px;border-radius:6px;background:var(--card);color:var(--text);border:none">
            <span>each</span>
            <button class="btn green" id="post-order">Post</button>
        </div>
        <div style="margin-top:8px;font-size:0.75rem;color:var(--muted)">
            Total: $${postQty * postPrice} ${postType === 'sell' ? `(You have: ${S.inv[postRes] || 0})` : ''}
        </div>
    </div>`;

        // Orders
        const sellOrders = orders.filter(o => o.type === 'sell');
        const buyOrders = orders.filter(o => o.type === 'buy');

        h += `<h4 style="margin:12px 0 8px;font-size:0.9rem">📤 Selling (${sellOrders.length})</h4>`;
        if (sellOrders.length === 0) h += `<div class="empty" style="padding:10px">No sell orders</div>`;
        else {
            h += `<div class="list">`;
            for (const o of sellOrders.slice(0, 10)) {
                const r = R[o.resource];
                const mine = o.userId === getUserId();
                h += `<div class="item"><span class="ic">${r?.i || '?'}</span><span class="nm">${o.qty}× ${r?.n || o.resource}</span><span class="pr">$${o.price}/ea</span>`;
                if (mine) h += `<button class="btn red" data-cancel="${o.id}">Cancel</button>`;
                else h += `<button class="btn green" data-fill="${o.id}">Buy $${o.qty * o.price}</button>`;
                h += `</div>`;
            }
            h += `</div>`;
        }

        h += `<h4 style="margin:12px 0 8px;font-size:0.9rem">📥 Buying (${buyOrders.length})</h4>`;
        if (buyOrders.length === 0) h += `<div class="empty" style="padding:10px">No buy orders</div>`;
        else {
            h += `<div class="list">`;
            for (const o of buyOrders.slice(0, 10)) {
                const r = R[o.resource];
                const mine = o.userId === getUserId();
                h += `<div class="item"><span class="ic">${r?.i || '?'}</span><span class="nm">${o.qty}× ${r?.n || o.resource}</span><span class="pr">$${o.price}/ea</span>`;
                if (mine) h += `<button class="btn red" data-cancel="${o.id}">Cancel</button>`;
                else h += `<button class="btn purple" data-fill="${o.id}">Sell +$${o.qty * o.price}</button>`;
                h += `</div>`;
            }
            h += `</div>`;
        }

        h += `</div>`;

        // Limit Orders Section (Auto-trade with Gov market)
        h += `<div class="panel"><h3>📈 Limit Orders</h3>
        <p style="color:var(--muted);font-size:0.7rem;margin-bottom:8px">Auto-trade with Gov market when price hits target</p>`;

        // Create new order form
        h += `<div style="background:var(--bg2);padding:10px;border-radius:8px;margin-bottom:10px">
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
            <select id="order-resource" style="flex:1;min-width:80px;padding:6px;border-radius:4px;background:var(--bg);color:var(--text);border:1px solid rgba(255,255,255,0.1)">
                ${Object.entries(R).map(([id, r]) => `<option value="${id}">${r.i} ${r.n}</option>`).join('')}
            </select>
            <select id="order-type" style="width:70px;padding:6px;border-radius:4px;background:var(--bg);color:var(--text);border:1px solid rgba(255,255,255,0.1)">
                <option value="sell">Sell</option>
                <option value="buy">Buy</option>
            </select>
        </div>
        <div style="display:flex;gap:6px;margin-bottom:8px">
            <input type="number" id="order-qty" placeholder="Qty" value="10" min="1" style="width:60px;padding:6px;border-radius:4px;background:var(--bg);color:var(--text);border:1px solid rgba(255,255,255,0.1)">
            <span style="line-height:32px">@</span>
            <input type="number" id="order-price" placeholder="Price" value="10" min="1" style="width:60px;padding:6px;border-radius:4px;background:var(--bg);color:var(--text);border:1px solid rgba(255,255,255,0.1)">
            <button class="btn green" onclick="submitLimitOrder()" style="flex:1">Create</button>
        </div>
        <p style="color:var(--muted);font-size:0.65rem">
            <b>Sell Limit:</b> Auto-sell when price rises to target or higher<br>
            <b>Buy Limit:</b> Auto-buy when price drops to target or lower
        </p>
    </div>`;

        // Active orders
        if (S.limitOrders && S.limitOrders.length > 0) {
            h += `<div class="list">`;
            S.limitOrders.forEach((order, i) => {
                const r = R[order.resourceId];
                const currentPrice = getPrice(order.resourceId);
                const willExecute = order.type === 'sell' ? currentPrice >= order.targetPrice : currentPrice <= order.targetPrice;
                h += `<div class="item" style="${willExecute ? 'border:1px solid var(--green)' : ''}">
                <span class="ic">${r?.i || '?'}</span>
                <span class="nm" style="font-size:0.8rem">${order.type.toUpperCase()} ${order.qty}x @ $${order.targetPrice}</span>
                <span class="pr" style="font-size:0.7rem">Now: $${currentPrice}</span>
                <button class="btn red" onclick="cancelLimitOrder(${i})" style="font-size:0.7rem">✕</button>
            </div>`;
            });
            h += `</div>`;
        } else {
            h += `<div class="empty" style="font-size:0.8rem">No limit orders</div>`;
        }
        h += `</div>`;

        container.innerHTML = h;

        // Event listeners
        $('type-sell')?.addEventListener('click', () => { postType = 'sell'; window.render(); });
        $('type-buy')?.addEventListener('click', () => { postType = 'buy'; window.render(); });
        $('post-res')?.addEventListener('change', e => { postRes = e.target.value; postPrice = R[postRes]?.p || 5; window.render(); });
        $('post-qty')?.addEventListener('change', e => { postQty = Math.max(1, parseInt(e.target.value) || 1); window.render(); });
        $('post-price')?.addEventListener('change', e => { postPrice = Math.max(1, parseInt(e.target.value) || 1); window.render(); });
        $('post-order')?.addEventListener('click', () => window.postOrder(postType, postRes, postQty, postPrice));

        container.querySelectorAll('[data-fill]').forEach(btn => {
            btn.addEventListener('click', () => {
                const order = orders.find(o => o.id === btn.dataset.fill);
                if (order) window.fillOrder(order);
            });
        });
        container.querySelectorAll('[data-cancel]').forEach(btn => {
            btn.addEventListener('click', () => {
                const order = orders.find(o => o.id === btn.dataset.cancel);
                if (order) window.cancelOrder(order);
            });
        });

        lastMarketState = currentState;
        isMarketInitialized = true;
    }
}

// Export module state setters for window access
export function setSellQty(id, qty) { sellQty[id] = qty; }
