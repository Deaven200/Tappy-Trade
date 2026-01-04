/**
 * Inventory Screen
 */

import { gameState } from '../game/GameState.js';
import { GOV_MARKET_PRICES } from '../game/Resources.js';
import { showToast } from './Toast.js';

/**
 * Render the inventory screen
 */
export function renderInventoryScreen(container) {
    const items = gameState.inventory.getAllItems();
    const total = gameState.inventory.getTotalItems();
    const capacity = gameState.inventory.capacity;

    container.innerHTML = `
    <div class="inventory-screen fade-in">
      <h2>📦 Inventory <span style="color: var(--accent-blue)">${total}/${capacity}</span></h2>
      
      ${items.length > 0 ? renderInventoryList(items) : renderEmptyInventory()}
    </div>
  `;

    // Add sell button listeners
    container.querySelectorAll('.sell-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const resourceId = e.target.dataset.resource;
            const qty = parseInt(e.target.dataset.qty, 10);
            handleSell(resourceId, qty);
        });
    });
}

/**
 * Render the inventory item list
 */
function renderInventoryList(items) {
    let html = '<div class="inventory-list">';

    for (const item of items) {
        const price = GOV_MARKET_PRICES[item.id]?.buy || 0;
        const totalValue = (price * item.quantity).toLocaleString();

        html += `
      <div class="inventory-item">
        <div class="item-info">
          <span class="item-icon">${item.icon}</span>
          <span class="item-name">${item.name}</span>
        </div>
        <span class="item-qty">×${item.quantity}</span>
        <button class="sell-btn" data-resource="${item.id}" data-qty="${item.quantity}">
          Sell ($${totalValue})
        </button>
      </div>
    `;
    }

    html += '</div>';
    return html;
}

/**
 * Render empty inventory message
 */
function renderEmptyInventory() {
    return `
    <div class="empty-inventory">
      <p>📭 Your inventory is empty!</p>
      <p style="margin-top: 8px; font-size: 0.9rem;">
        Tap a sub-plot above to harvest resources.
      </p>
    </div>
  `;
}

/**
 * Handle sell button click
 */
function handleSell(resourceId, quantity) {
    const price = GOV_MARKET_PRICES[resourceId]?.buy || 0;
    const sold = gameState.sellToGov(resourceId, quantity, price);

    if (sold > 0) {
        const earnings = sold * price;
        showToast(`💰 Sold for $${earnings.toLocaleString()}!`, 'success');
    }
}
