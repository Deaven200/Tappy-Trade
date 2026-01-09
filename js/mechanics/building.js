/**
 * Building System Module
 * Handles building placement, upgrades, and modal UI
 */

import { S } from '../core/state.js';
import { save } from '../core/storage.js';
import { T, R, B } from '../config/data.js';
import { addItem, remItem, getInvTotal } from '../utils/inventory.js';
import { toast, notif, playS } from '../utils/feedback.js';
import { $ } from '../utils/dom.js';

// Current build target (plot and subplot indices)
let buildP = 0;
let buildS = 0;

/**
 * Check if player can afford a cost
 * @param {Object} cost - Cost object { m: money, resourceId: qty,... }
 * @returns {boolean}
 */
export function canAfford(cost) {
    if (!cost) return true;
    for (const k in cost) {
        if (k === 'm') {
            if (S.money < cost.m) return false;
        } else {
            if ((S.inv[k] || 0) < cost[k]) return false;
        }
    }
    return true;
}

/**
 * Deduct cost from player resources
 * @param {Object} cost - Cost object
 */
export function pay(cost) {
    if (!cost) return;
    for (const k in cost) {
        if (k === 'm') {
            S.money -= cost.m;
        } else {
            remItem(k, cost[k]);
        }
    }
}

/**
 * Calculate upgrade cost based on subplot type and current level
 * @param {string} subplotType - Building type ID
 * @param {number} currentLevel - Current building level
 * @returns {Object} Cost object
 */
export function getUpgradeCost(subplotType, currentLevel) {
    // Find the base cost from buildings
    const base = Object.values(B).flat().find(b => b.t === subplotType);
    const multiplier = currentLevel + 1;

    if (base) {
        // Has a building definition, use it
        const cost = {};
        for (const k in base.c) {
            cost[k] = Math.floor(base.c[k] * multiplier * 0.75);
        }
        return cost;
    } else {
        // No building definition (e.g., wild), use simple cost
        return { m: 100 * multiplier };
    }
}

/**
 * Open building modal for a subplot
 * @param {number} pi - Plot index
 * @param {number} si - Subplot index
 */
export function openBuild(pi, si) {
    buildP = pi;
    buildS = si;
    let h = '';
    const cur = S.plots[pi]?.subs[si];
    const curCfg = cur ? T[cur.t] : null;

    // If there's an existing subplot (including wild), show upgrade option first
    if (cur && cur.lv < 5) {
        const upgradeCost = getUpgradeCost(cur.t, cur.lv);
        const canUpgrade = canAfford(upgradeCost);
        const costStr = Object.entries(upgradeCost).map(([k, v]) => k === 'm' ? `<span class="m">$${v}</span>` : `<span class="r">${v}${R[k]?.i || k}</span>`).join(' ');
        const regenBonus = Math.round(((1 + (cur.lv) * 0.1) - 1) * 100);
        const storageBonus = cur.lv * 10;
        h += `<div class="cat"><div class="cat-title">⬆️ Upgrade ${curCfg?.n}</div>`;
        h += `<div class="bld ${canUpgrade ? '' : 'off'}" data-t="__upgrade" style="border:1px solid var(--purple)">`;
        h += `<div class="ic">${curCfg.i}</div>`;
        h += `<div class="info"><div class="nm" style="color:var(--purple)">${curCfg.n} Lv${cur.lv} → Lv${cur.lv + 1}</div>`;
        h += `<div class="prod">Regen: ${regenBonus}% → ${regenBonus + 10}% | Storage: +${storageBonus} → +${storageBonus + 10}</div>`;
        h += `<div class="cost">${costStr}</div></div></div></div>`;
    } else if (cur && cur.lv >= 5) {
        h += `<div class="cat"><div class="cat-title">⬆️ Upgrade</div>`;
        h += `<div class="bld off"><div class="ic">⭐</div><div class="info"><div class="nm">${curCfg.n} MAX LEVEL</div><div class="prod">This subplot is fully upgraded!</div></div></div></div>`;
    }

    // Build new options (only show if no building or it's a wild plot)
    if (!curCfg?.b) {
        const cats = [{ k: 'gathering', t: '🌿 Gathering' }, { k: 'farms', t: '🌾 Farms' }, { k: 'livestock', t: '🐄 Livestock' }, { k: 'manufacturing', t: '🏭 Manufacturing' }, { k: 'specialty', t: '🐝 Specialty' }, { k: 'utility', t: '📦 Utility' }];
        for (const cat of cats) {
            h += `<div class="cat"><div class="cat-title">${cat.t}</div>`;
            for (const b of B[cat.k]) {
                const cfg = T[b.t]; if (!cfg) continue;
                const can = canAfford(b.c);
                const cst = Object.entries(b.c).map(([k, v]) => k === 'm' ? `<span class="m">$${v}</span>` : `<span class="r">${v}${R[k]?.i || k}</span>`).join(' ');
                h += `<div class="bld ${can ? '' : 'off'}" data-t="${b.t}"><div class="ic">${cfg.i}</div><div class="info"><div class="nm">${cfg.n}</div><div class="prod">${cfg.o ? `→ ${R[cfg.o]?.i || ''} ${R[cfg.o]?.n || ''}` : (cfg.cap ? `+${cfg.cap} storage` : '')}</div><div class="cost">${cst}</div></div></div>`;
            }
            h += `</div>`;
        }
    }

    // Demolish option for buildings
    if (cur && curCfg?.b) {
        h += `<div class="cat"><div class="cat-title">⚠️ Demolish</div><div class="bld" data-t="__demolish" style="border:1px solid var(--red)"><div class="ic">🗑️</div><div class="info"><div class="nm" style="color:var(--red)">Remove Building</div><div class="prod">Returns 50% resources</div></div></div></div>`;
    }

    $('build-list').innerHTML = h;
    $('build-list').querySelectorAll('.bld:not(.off)').forEach(el => el.onclick = () => doBuild(el.dataset.t));
    $('build-modal').classList.add('show');
    playS('tap');
}

/**
 * Close building modal
 */
export function closeBuild() {
    $('build-modal').classList.remove('show');
}

/**
 * Execute building action (build, upgrade, or demolish)
 * @param {string} t - Building type or action (__upgrade, __demolish)
 */
export function doBuild(t) {
    if (t === '__upgrade') {
        const s = S.plots[buildP]?.subs[buildS];
        if (!s || s.lv >= 5) return;
        const cost = getUpgradeCost(s.t, s.lv);  // Fixed: pass both type and level
        if (!canAfford(cost)) {
            toast('Cannot afford upgrade!', 'err');
            return;
        }
        pay(cost);
        s.lv++;
        playS('ach');
        toast(`Upgraded to Lv${s.lv}!`, 'ok');
        notif(`⬆️ ${T[s.t]?.n} upgraded to Level ${s.lv}!`);
        closeBuild();
        save();

        // Force home screen to rebuild structure
        if (window.resetHomeInit) window.resetHomeInit();

        window.render();
        return;
    }

    if (t === '__demolish') {
        const s = S.plots[buildP]?.subs[buildS];
        if (!s) return;
        const orig = Object.values(B).flat().find(b => b.t === s.t);

        // Refund 50% of resources
        if (orig) {
            for (const k in orig.c) {
                if (k === 'm') {
                    S.money += Math.floor(orig.c.m * 0.5);
                } else {
                    addItem(k, Math.floor(orig.c[k] * 0.5));
                }
            }
        }

        // Deduct storage capacity if building provided it
        const buildingCfg = T[s.t];
        if (buildingCfg?.cap) {
            S.cap -= buildingCfg.cap;
        }

        // Reset subplot to wilderness
        s.t = 'wild';
        s.c = 10;
        s.lv = 1;

        toast('Building demolished', 'ok');
        closeBuild();
        save();

        // Force home screen to rebuild structure
        if (window.resetHomeInit) window.resetHomeInit();

        window.render();
        return;
    }

    const b = Object.values(B).flat().find(x => x.t === t);
    if (!b || !canAfford(b.c)) return;

    pay(b.c);
    S.plots[buildP].subs[buildS] = { t, c: 0, lv: 1 };
    S.stats.built++;

    if (T[t]?.cap) {
        S.cap += T[t].cap;
    }

    playS('sell');
    toast(`Built ${T[t]?.n}!`, 'ok');
    notif(`🏗️ New building: ${T[t]?.n}`);
    closeBuild();
    save();

    // Force home screen to rebuild structure
    if (window.resetHomeInit) window.resetHomeInit();

    window.render();
}
