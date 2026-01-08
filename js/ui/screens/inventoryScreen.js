/**
 * Inventory Screen Renderer
 * Handles inventory display with list/grid view and sorting
 */

import { S } from '../../core/state.js';
import { R, ITEM_CATS } from '../../config/data.js';
import { getInvTotal } from '../../utils/inventory.js';

// View and sort state (could be moved to state.js later)
let invView = 'list'; // 'list' or 'grid'
let invSort = 'name'; // 'name', 'qty', or 'value'
let lastInvState = null; // Track last render state to prevent unnecessary re-renders
let isInventoryInitialized = false;

/**
 * Get current inventory view mode
 */
export function getInventoryView() {
    return invView;
}

/**
 * Set inventory view mode
 */
export function setInventoryView(view) {
    invView = view;
    isInventoryInitialized = false; // Force re-render on view change
}

/**
 * Get current inventory sort mode
 */
export function getInventorySort() {
    return invSort;
}

/**
 * Set inventory sort mode
 */
export function setInventorySort(sort) {
    invSort = sort;
    isInventoryInitialized = false; // Force re-render on sort change
}

/**
 * Get price for an item (with market price calculation)
 */
function getPrice(itemId) {
    const resource = R[itemId];
    if (!resource) return 0;
    return resource.p || 0;
}

/**
 * Render the inventory screen
 * @param {HTMLElement} container - Container element to render into
 */
export function renderInventoryScreen(container) {
    // Check if inventory changed
    const currentInvState = JSON.stringify(S.inv);
    const invChanged = currentInvState !== lastInvState;

    // Only re-render if inventory changed or first render
    if (!isInventoryInitialized || invChanged) {
        const totalItems = getInvTotal(S.inv);
        let html = `<div class="panel"><h3>📦 Inventory (${totalItems}/${S.cap})</h3>`;

        // Controls: View toggle and Sort
        html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
            <div class="view-toggle">
                <button class="${invView === 'list' ? 'active' : ''}" data-action="set-view" data-view="list">📋</button>
                <button class="${invView === 'grid' ? 'active' : ''}" data-action="set-view" data-view="grid">📱</button>
            </div>
            <select data-action="set-sort" style="padding:4px 8px;border-radius:4px;background:var(--bg2);color:var(--text);border:none;font-size:0.75rem">
                <option value="name" ${invSort === 'name' ? 'selected' : ''}>By Name</option>
                <option value="qty" ${invSort === 'qty' ? 'selected' : ''}>By Quantity</option>
                <option value="value" ${invSort === 'value' ? 'selected' : ''}>By Value</option>
            </select>
        </div>`;

        let items = Object.entries(S.inv).filter(([_, qty]) => qty > 0);

        if (items.length === 0) {
            html += renderEmptyInventory();
        } else {
            html += renderInventoryItems(items);
        }

        html += `</div>`;
        container.innerHTML = html;

        lastInvState = currentInvState;
        isInventoryInitialized = true;
    }
}

/**
 * Render empty inventory message
 */
function renderEmptyInventory() {
    return `<div class="empty" style="padding:40px 20px;text-align:center">
        <div style="font-size:3rem;margin-bottom:12px;opacity:0.5">📦</div>
        <p style="color:var(--muted)">Your inventory is empty!<br>Tap resources on plots to harvest.</p>
    </div>`;
}

/**
 * Render inventory items with current view and sort settings
 */
function renderInventoryItems(items) {
    // Sort items
    items.sort((a, b) => {
        if (invSort === 'qty') return b[1] - a[1];
        if (invSort === 'value') return (b[1] * (R[b[0]]?.p || 0)) - (a[1] * (R[a[0]]?.p || 0));
        return (R[a[0]]?.n || '').localeCompare(R[b[0]]?.n || '');
    });

    // Calculate total value
    const totalValue = items.reduce((sum, [id, qty]) => sum + qty * (R[id]?.p || 0), 0);

    let html = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="font-size:0.75rem;color:var(--muted)">Total Value: <span style="color:var(--gold)">$${totalValue.toLocaleString()}</span></div>
        <button class="btn green" data-action="sell-all" style="padding:6px 12px">💰 Sell All</button>
    </div>`;

    if (invView === 'grid') {
        html += renderGridView(items);
    } else {
        html += renderListView(items);
    }

    return html;
}

/**
 * Render inventory in grid view
 */
function renderGridView(items) {
    let html = `<div class="inv-grid">`;
    for (const [id, qty] of items) {
        const resource = R[id];
        if (!resource) continue;
        const value = qty * resource.p;
        html += `<div class="inv-item" data-action="sell" data-item="${id}" data-qty="1">
            <span class="ic">${resource.i}</span>
            <span class="qty">×${qty}</span>
            <span class="val">$${value}</span>
        </div>`;
    }
    html += `</div>`;
    return html;
}

/**
 * Render inventory in list view (grouped by category)
 */
function renderListView(items) {
    let html = '';

    // Group by category
    for (const catKey in ITEM_CATS) {
        const category = ITEM_CATS[catKey];
        const catItems = items.filter(([id]) => category.items.includes(id));
        if (catItems.length === 0) continue;

        html += `<div class="category-header">${category.n}</div>`;
        html += `<div class="list">`;
        for (const [id, qty] of catItems) {
            const resource = R[id];
            if (!resource) continue;
            const price = getPrice(id);
            html += `<div class="item">
                <span class="ic">${resource.i}</span>
                <span class="nm">${resource.n}</span>
                <span class="pr">$${price}</span>
                <span class="qt">×${qty}</span>
                <button class="btn green" data-action="sell" data-item="${id}" data-qty="${qty}" style="font-size:0.7rem">Sell</button>
            </div>`;
        }
        html += `</div>`;
    }

    return html;
}
