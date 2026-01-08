/**
 * Tooltip Module
 * Shows resource tooltips on hover
 */

import { R } from '../config/resources.js';
import { getPrice } from '../mechanics/market.js';
import { $ } from '../utils/dom.js';

let tipTimer = null;

/**
 * Show tooltip for a resource
 * @param {Event} e - Mouse event
 * @param {string} id - Resource ID
 */
export function showTip(e, id) {
    clearTimeout(tipTimer);

    const r = R[id];
    if (!r) return;

    const tip = $('tip');
    if (!tip) return;

    tip.innerHTML = `<h4>${r.i} ${r.n}</h4><p>Price: $${getPrice(id)}</p>`;

    const rect = e.target.getBoundingClientRect();
    tip.style.left = Math.min(rect.left, window.innerWidth - 210) + 'px';
    tip.style.top = (rect.bottom + 5) + 'px';
    tip.classList.add('show');

    tipTimer = setTimeout(() => tip.classList.remove('show'), 2000);
}
