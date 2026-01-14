/**
 * Sell Modal Module
 * Provides partial quantity selling functionality
 */

import { S } from '../../core/state.js';
import { R } from '../../config/data.js';
import { save } from '../../core/storage.js';
import { toast, notif } from '../../utils/feedback.js';
import { remItem } from '../../utils/inventory.js';
import { $ } from '../../utils/dom.js';

let currentSellItem = null;
let currentSellQty = 1;
let currentSellMax = 1;
let currentSellPrice = 0;

/**
 * Open sell modal for an item
 * @param {string} itemId - Item ID to sell
 * @param {number} maxQty - Maximum quantity available
 * @param {number} price - Price per unit
 */
export function openSellModal(itemId, maxQty, price) {
    currentSellItem = itemId;
    currentSellMax = maxQty;
    currentSellPrice = price;
    currentSellQty = maxQty; // Default to selling all

    const resource = R[itemId];
    if (!resource) return;

    const modalId = 'sell-modal';
    let modal = $(modalId);

    if (!modal) {
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal';
        document.body.appendChild(modal);
    }

    updateSellModal(modal, resource);
    modal.classList.add('show');
}

/**
 * Update sell modal content
 */
function updateSellModal(modal, resource) {
    const totalValue = currentSellQty * currentSellPrice;

    modal.innerHTML = `
        <div class="modal-box" style="max-width:320px">
            <div class="modal-head">
                <h3>${resource.i} Sell ${resource.n}</h3>
                <button class="modal-close" onclick="window.closeSellModal()">×</button>
            </div>
            <div class="modal-body" style="text-align:center">
                <p style="color:var(--muted);margin-bottom:16px">You have <b>${currentSellMax}</b> ${resource.n}</p>
                
                <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:16px">
                    <button class="btn" onclick="window.adjustSellQty(-10)" style="width:40px">-10</button>
                    <button class="btn" onclick="window.adjustSellQty(-1)" style="width:40px">-1</button>
                    <input type="number" id="sell-qty-input" value="${currentSellQty}" min="1" max="${currentSellMax}" 
                           onchange="window.setSellQty(this.value)"
                           style="width:60px;text-align:center;padding:8px;font-size:1.2rem;background:var(--bg2);color:var(--text);border:1px solid var(--muted);border-radius:6px">
                    <button class="btn" onclick="window.adjustSellQty(1)" style="width:40px">+1</button>
                    <button class="btn" onclick="window.adjustSellQty(10)" style="width:40px">+10</button>
                </div>
                
                <input type="range" id="sell-slider" min="1" max="${currentSellMax}" value="${currentSellQty}"
                       oninput="window.setSellQty(this.value)"
                       style="width:100%;margin-bottom:16px">
                
                <div style="display:flex;justify-content:space-between;margin-bottom:8px">
                    <button class="btn" onclick="window.setSellQty(1)" style="flex:1;margin-right:4px">Min</button>
                    <button class="btn" onclick="window.setSellQty(Math.floor(${currentSellMax}/2))" style="flex:1;margin-right:4px">Half</button>
                    <button class="btn" onclick="window.setSellQty(${currentSellMax})" style="flex:1">Max</button>
                </div>
                
                <div style="background:var(--bg2);padding:12px;border-radius:8px;margin-bottom:16px">
                    <div style="font-size:0.8rem;color:var(--muted)">Total Value</div>
                    <div style="font-size:1.5rem;font-weight:bold;color:var(--gold)">$${totalValue.toLocaleString()}</div>
                    <div style="font-size:0.7rem;color:var(--muted)">${currentSellQty} × $${currentSellPrice}</div>
                </div>
                
                <button class="btn green" onclick="window.confirmSell()" style="width:100%;padding:12px;font-size:1rem">
                    💰 Sell ${currentSellQty} for $${totalValue.toLocaleString()}
                </button>
            </div>
        </div>
    `;
}

/**
 * Adjust sell quantity by delta
 */
export function adjustSellQty(delta) {
    setSellQty(currentSellQty + delta);
}

/**
 * Set sell quantity directly
 */
export function setSellQty(qty) {
    currentSellQty = Math.max(1, Math.min(currentSellMax, parseInt(qty) || 1));

    const input = $('sell-qty-input');
    const slider = $('sell-slider');
    if (input) input.value = currentSellQty;
    if (slider) slider.value = currentSellQty;

    const modal = $('sell-modal');
    const resource = R[currentSellItem];
    if (modal && resource) {
        updateSellModal(modal, resource);
    }
}

/**
 * Confirm and execute the sale
 */
export function confirmSell() {
    if (!currentSellItem || currentSellQty <= 0) return;

    const resource = R[currentSellItem];
    if (!resource) return;

    const available = S.inv[currentSellItem] || 0;
    const sellQty = Math.min(currentSellQty, available);

    if (sellQty <= 0) {
        toast('Nothing to sell!', 'err');
        return;
    }

    const totalValue = sellQty * currentSellPrice;

    // Execute sale
    remItem(currentSellItem, sellQty);
    S.money += totalValue;
    S.stats.earned = (S.stats.earned || 0) + totalValue;
    S.stats.sold = (S.stats.sold || 0) + sellQty;

    save();

    toast(`Sold ${sellQty} ${resource.n} for $${totalValue.toLocaleString()}!`, 'ok');
    notif(`💰 +$${totalValue.toLocaleString()}`);

    closeSellModal();

    if (window.render) window.render();
}

/**
 * Close sell modal
 */
export function closeSellModal() {
    const modal = $('sell-modal');
    if (modal) {
        modal.classList.remove('show');
    }
    currentSellItem = null;
}

// Global exposure
window.openSellModal = openSellModal;
window.closeSellModal = closeSellModal;
window.adjustSellQty = adjustSellQty;
window.setSellQty = setSellQty;
window.confirmSell = confirmSell;
