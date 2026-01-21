/**
 * Worker Mechanics
 * Handles worker hiring, firing, and automation
 * Now supports specialized worker types with bonuses
 */

import { S } from '../core/state.js';
import { T } from '../config/buildings.js';
import { toast, playS } from '../utils/feedback.js';
import { save } from '../core/storage.js';
import { WORKER_TYPES, getWorkerBonus, getWorkerCost } from '../config/workerTypes.js';

// Track pending hire for type selection modal
let pendingHire = null;

/**
 * Open worker type selection modal
 * @param {number} plotIndex - Plot index
 * @param {number} subplotIndex - Subplot index
 */
export function openHireWorkerModal(plotIndex, subplotIndex) {
    if (S.workers.length >= 10) {
        toast('Max 10 workers!', 'err');
        playS('err');
        return;
    }

    pendingHire = { plot: plotIndex, sub: subplotIndex };

    // Get subplot type to suggest best worker
    const subplot = S.plots[plotIndex]?.subs[subplotIndex];
    const buildingType = subplot?.t || 'wild';

    // Build modal HTML
    let html = `<div class="modal-box">
        <div class="modal-head">
            <h3>👷 Select Worker Type</h3>
            <button class="modal-close" onclick="closeHireWorkerModal()">×</button>
        </div>
        <div class="modal-body">
            <p style="color:var(--muted);font-size:0.8rem;margin-bottom:12px">
                Specialized workers give +25% bonus for their specialty
            </p>
            <div style="display:flex;flex-direction:column;gap:8px">`;

    for (const [typeId, type] of Object.entries(WORKER_TYPES)) {
        const cost = getWorkerCost(S.workers.length, typeId);
        const canAfford = S.money >= cost;
        const bonus = getWorkerBonus(typeId, buildingType, null);
        const isRecommended = bonus > 1.0;

        html += `<button class="btn${canAfford ? '' : ' off'}" 
                         onclick="confirmHireWorker('${typeId}')"
                         ${canAfford ? '' : 'disabled'}
                         style="display:flex;justify-content:space-between;align-items:center;padding:12px;${isRecommended ? 'border:2px solid var(--green)' : ''}">
            <span>
                ${type.icon} ${type.name}
                <span style="font-size:0.75rem;opacity:0.7">${type.description}</span>
                ${isRecommended ? '<span style="color:var(--green);font-size:0.7rem;margin-left:4px">✓ Best fit</span>' : ''}
            </span>
            <span style="color:var(--gold)">$${cost}</span>
        </button>`;
    }

    html += `</div></div></div>`;

    // Create or update modal
    let modal = document.getElementById('hire-worker-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'hire-worker-modal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }
    modal.innerHTML = html;
    modal.classList.add('show');
}

/**
 * Close the hire worker modal
 */
export function closeHireWorkerModal() {
    const modal = document.getElementById('hire-worker-modal');
    if (modal) modal.classList.remove('show');
    pendingHire = null;
}

/**
 * Confirm hiring a worker of a specific type
 * @param {string} workerType - Worker type ID
 */
export function confirmHireWorker(workerType) {
    if (!pendingHire) return;

    const cost = getWorkerCost(S.workers.length, workerType);
    if (S.money < cost) {
        toast('Not enough money!', 'err');
        playS('err');
        return;
    }

    S.money -= cost;
    S.workers.push({
        plot: pendingHire.plot,
        sub: pendingHire.sub,
        type: workerType
    });

    const type = WORKER_TYPES[workerType];
    toast(`${type.icon} ${type.name} hired!`, 'ok');
    playS('ach');

    closeHireWorkerModal();
    save();
    window.render();
}

/**
 * Legacy hire worker function - opens modal for type selection
 * @param {number} plotIndex - Plot index
 * @param {number} subplotIndex - Subplot index
 */
export function hireWorker(plotIndex, subplotIndex) {
    openHireWorkerModal(plotIndex, subplotIndex);
}

/**
 * Fire a worker by index
 * @param {number} index - Worker index to remove
 */
export function fireWorker(index) {
    if (!confirm('Fire this worker?')) return;
    S.workers.splice(index, 1);
    toast('Worker fired', 'ok');
    save();
    window.render();
}

/**
 * Update workers - auto-harvest their assigned plots
 * Called from game loop every 5 seconds
 * Now applies worker type bonuses
 */
export function updateWorkers() {
    S.workers.forEach(w => {
        const subplot = S.plots[w.plot]?.subs[w.sub];
        if (!subplot) return;

        // Get worker type bonus
        const workerType = w.type || 'general';
        const config = T[subplot.t];
        const resourceId = config?.o || null;
        const bonus = getWorkerBonus(workerType, subplot.t, resourceId);

        // Workers auto-tap their assigned subplot with bonus
        window.tap(w.plot, w.sub, bonus);
    });
}

// Export worker types for UI
export { WORKER_TYPES };

// Expose functions globally for modals
window.openHireWorkerModal = openHireWorkerModal;
window.closeHireWorkerModal = closeHireWorkerModal;
window.confirmHireWorker = confirmHireWorker;
