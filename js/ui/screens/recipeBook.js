/**
 * Recipe Book Screen
 * Shows all crafting chains with current inventory quantities
 */

import { S } from '../../core/state.js';
import { SUBPLOT_TYPES } from '../../config/buildings.js';
import { RESOURCES } from '../../config/resources.js';

/** Recipe chain definitions */
const RECIPES = [
    { out: 'planks', needs: [{ id: 'wood', qty: 2 }], building: 'sawmill', icon: '🏭' },
    { out: 'flour', needs: [{ id: 'wheat', qty: 3 }], building: 'mill', icon: '🏭' },
    { out: 'bread', needs: [{ id: 'flour', qty: 2 }], building: 'bakery', icon: '🥖' },
    { out: 'cloth', needs: [{ id: 'wool', qty: 3 }], building: 'loom', icon: '🧵' },
];

/** Additional chain steps (for display only) */
const CHAINS = [
    {
        title: '🌾 Grain Chain',
        steps: ['wheat', 'flour', 'bread'],
        buildings: ['wheatFarm', 'mill', 'bakery'],
    },
    {
        title: '🌲 Wood Chain',
        steps: ['wood', 'planks'],
        buildings: ['forest', 'sawmill'],
    },
    {
        title: '🧶 Textile Chain',
        steps: ['wool', 'cloth'],
        buildings: ['sheepPen', 'loom'],
    },
];

/**
 * Render the recipe book screen
 * @param {HTMLElement} container
 */
export function renderRecipeBook(container) {
    const inv = S.inv || {};

    let html = `
        <div class="panel">
            <h3>📖 Recipe Book</h3>
            <p style="color:var(--muted);font-size:0.8rem;margin-bottom:16px">
                Build processing buildings and tap them to craft. Workers auto-craft too!
            </p>
        </div>`;

    // === Production Chains visual ===
    html += `<div class="panel">
        <h3>🔗 Production Chains</h3>`;

    for (const chain of CHAINS) {
        html += `<div style="margin-bottom:16px">
            <div style="font-weight:600;font-size:0.85rem;margin-bottom:8px;color:var(--gold)">${chain.title}</div>
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">`;

        chain.steps.forEach((resourceId, idx) => {
            const res = RESOURCES[resourceId];
            const qty = inv[resourceId] || 0;
            const bldg = chain.buildings[idx] ? SUBPLOT_TYPES[chain.buildings[idx]] : null;

            html += `<div style="text-align:center">
                ${bldg ? `<div style="font-size:0.6rem;color:var(--muted)">${bldg.i} ${bldg.n}</div>` : ''}
                <div style="
                    background:var(--bg2);
                    border-radius:8px;
                    padding:8px 12px;
                    border:1px solid ${qty > 0 ? 'var(--green)' : 'rgba(255,255,255,0.1)'}
                ">
                    <div style="font-size:1.4rem">${res?.i || '?'}</div>
                    <div style="font-size:0.75rem;font-weight:600">${res?.n || resourceId}</div>
                    <div style="font-size:0.7rem;color:${qty > 0 ? 'var(--green)' : 'var(--muted)'}">${qty} in stock</div>
                </div>
            </div>`;

            if (idx < chain.steps.length - 1) {
                html += `<div style="font-size:1.2rem;color:var(--muted)">→</div>`;
            }
        });

        html += `</div></div>`;
    }

    html += `</div>`;

    // === Individual Recipes ===
    html += `<div class="panel"><h3>⚙️ All Recipes</h3>`;

    for (const recipe of RECIPES) {
        const outRes = RESOURCES[recipe.out];
        const bldg = SUBPLOT_TYPES[recipe.building];

        const canCraft = recipe.needs.every(n => (inv[n.id] || 0) >= n.qty);
        const maxBatch = recipe.needs.length > 0
            ? Math.min(...recipe.needs.map(n => Math.floor((inv[n.id] || 0) / n.qty)))
            : 0;

        const inputsHtml = recipe.needs.map(n => {
            const r = RESOURCES[n.id];
            const have = inv[n.id] || 0;
            const ok = have >= n.qty;
            return `<span style="color:${ok ? 'var(--green)' : 'var(--red)'}">
                ${r?.i} ${have}/${n.qty} ${r?.n}
            </span>`;
        }).join(', ');

        html += `
            <div class="bld" style="border:1px solid ${canCraft ? 'var(--green)' : 'rgba(255,255,255,0.05)'}">
                <div class="ic">${outRes?.i || '?'}</div>
                <div class="info">
                    <div class="nm">${outRes?.n || recipe.out}</div>
                    <div class="prod">Crafted at: ${bldg?.i} ${bldg?.n || recipe.building}</div>
                    <div style="font-size:0.7rem;margin-top:2px">Needs: ${inputsHtml}</div>
                    ${maxBatch > 0 ? `<div style="font-size:0.7rem;color:var(--blue)">Can make: ${maxBatch}x</div>` : ''}
                </div>
                <div style="font-size:0.75rem;color:var(--gold)">
                    $${(RESOURCES[recipe.out]?.p || 0)} ea
                </div>
            </div>`;
    }

    html += `</div>`;
    container.innerHTML = html;
}
