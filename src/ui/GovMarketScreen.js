/**
 * Government Market Screen
 */

import { gameState } from '../game/GameState.js';
import { RESOURCES, GOV_MARKET_PRICES } from '../game/Resources.js';
import { showToast } from './Toast.js';

/**
 * Render the government market screen
 */
export function renderGovMarketScreen(container) {
    const items = Object.keys(RESOURCES).filter(id => GOV_MARKET_PRICES[id]);

    container.innerHTML = `
    <div class="market-screen fade-in">
      <h2>🏛️ Government Market</h2>
      
      <table class="market-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>You Have</th>
            <th>Sell @</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(id => renderMarketRow(id)).join('')}
        </tbody>
      </table>
      
      <button class="quick-sell-all" id="quick-sell-all">
        💰 Quick Sell All
      </button>
      
      <div style="margin-top: 16px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
        Prices update based on global supply & demand
      </div>
    </div>
  `;

    // Add sell button listeners
    container.querySelectorAll('.market-btn.sell').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const resourceId = e.target.dataset.resource;
            handleSellOne(resourceId);
        });
    });

    // Quick sell all button
    document.getElementById('quick-sell-all')?.addEventListener('click', handleSellAll);
}

/**
 * Render a single market row
 */
function renderMarketRow(resourceId) {
    const resource = RESOURCES[resourceId];
    const prices = GOV_MARKET_PRICES[resourceId];
    const quantity = gameState.inventory.getQuantity(resourceId);

    return `
    <tr>
      <td>
        <span style="margin-right: 8px">${resource.icon}</span>
        ${resource.name}
      </td>
      <td style="color: var(--accent-blue)">${quantity}</td>
      <td style="color: var(--accent-green)">$${prices.buy}</td>
      <td>
        <button class="market-btn sell" data-resource="${resourceId}" 
                ${quantity <= 0 ? 'disabled style="opacity: 0.5"' : ''}>
          Sell
        </button>
      </td>
    </tr>
  `;
}

/**
 * Handle selling one stack at government prices
 */
function handleSellOne(resourceId) {
    const resource = RESOURCES[resourceId];
    const quantity = gameState.inventory.getQuantity(resourceId);
    const price = GOV_MARKET_PRICES[resourceId]?.buy || 0;

    if (quantity <= 0) {
        showToast(`No ${resource.name} to sell!`, 'error');
        return;
    }

    // Sell all of this item
    const sold = gameState.sellToGov(resourceId, quantity, price);
    if (sold > 0) {
        const earnings = sold * price;
        showToast(`${resource.icon} Sold ${sold} ${resource.name} for $${earnings.toLocaleString()}!`, 'success');
    }
}

/**
 * Handle selling everything in inventory
 */
function handleSellAll() {
    const items = gameState.inventory.getAllItems();

    if (items.length === 0) {
        showToast('Nothing to sell!', 'error');
        return;
    }

    let totalEarnings = 0;

    for (const item of items) {
        const price = GOV_MARKET_PRICES[item.id]?.buy || 0;
        const sold = gameState.sellToGov(item.id, item.quantity, price);
        totalEarnings += sold * price;
    }

    if (totalEarnings > 0) {
        showToast(`💰 Sold everything for $${totalEarnings.toLocaleString()}!`, 'success');
    }
}
