/**
 * Trade Contracts System
 * Allows players to create supply contracts with each other
 */

import { S } from '../core/state.js';
import { R } from '../config/resources.js';
import { toast, playS, notif } from '../utils/feedback.js';
import { save } from '../core/storage.js';

// Contract state initialization
function initContractState() {
    if (!S.contracts) S.contracts = [];
    if (!S.contractHistory) S.contractHistory = [];
}

/**
 * Create a new contract offer
 * @param {Object} contractData - Contract details
 */
export async function createContract(contractData) {
    initContractState();

    if (!window.loggedInUser) {
        toast('Login to create contracts!', 'err');
        return false;
    }

    const { itemId, quantity, pricePerUnit, durationDays } = contractData;

    // Validate
    if (!itemId || !quantity || !pricePerUnit || !durationDays) {
        toast('Fill all contract fields!', 'err');
        return false;
    }

    if (quantity < 1 || pricePerUnit < 1 || durationDays < 1) {
        toast('Invalid contract values!', 'err');
        return false;
    }

    try {
        const contract = {
            id: `contract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            creatorId: window.loggedInUser.id,
            creatorName: window.loggedInUser.username,
            itemId,
            itemName: R[itemId]?.n || itemId,
            itemIcon: R[itemId]?.i || '📦',
            quantityPerDay: quantity,
            pricePerUnit,
            totalPerDay: quantity * pricePerUnit,
            durationDays,
            startDate: null,
            endDate: null,
            supplierId: null,
            supplierName: null,
            status: 'open', // open, active, completed, cancelled
            deliveries: [],
            createdAt: Date.now()
        };

        // Save to Firebase
        if (window.db) {
            await window.db.collection('contracts').doc(contract.id).set(contract);
        }

        toast('📜 Contract created!', 'ok');
        playS('ach');
        return contract;
    } catch (error) {
        console.error('Create contract failed:', error);
        toast('Failed to create contract', 'err');
        return false;
    }
}

/**
 * Accept a contract as supplier
 * @param {string} contractId - Contract ID to accept
 */
export async function acceptContract(contractId) {
    if (!window.loggedInUser) {
        toast('Login to accept contracts!', 'err');
        return false;
    }

    try {
        if (!window.db) {
            toast('Offline - cannot accept', 'err');
            return false;
        }

        const contractDoc = await window.db.collection('contracts').doc(contractId).get();
        if (!contractDoc.exists) {
            toast('Contract not found!', 'err');
            return false;
        }

        const contract = contractDoc.data();

        if (contract.status !== 'open') {
            toast('Contract no longer available!', 'err');
            return false;
        }

        if (contract.creatorId === window.loggedInUser.id) {
            toast('Cannot accept your own contract!', 'err');
            return false;
        }

        // Update contract
        const now = Date.now();
        await window.db.collection('contracts').doc(contractId).update({
            supplierId: window.loggedInUser.id,
            supplierName: window.loggedInUser.username,
            status: 'active',
            startDate: now,
            endDate: now + (contract.durationDays * 24 * 60 * 60 * 1000)
        });

        toast(`📜 Contract accepted! Deliver ${contract.quantityPerDay}x ${contract.itemIcon} daily`, 'ok');
        playS('ach');
        notif('Contract started! Check your active contracts.');

        return true;
    } catch (error) {
        console.error('Accept contract failed:', error);
        toast('Failed to accept contract', 'err');
        return false;
    }
}

/**
 * Fulfill daily delivery for a contract
 * @param {string} contractId - Contract ID
 */
export async function deliverContract(contractId) {
    initContractState();

    try {
        if (!window.db) {
            toast('Offline - cannot deliver', 'err');
            return false;
        }

        const contractDoc = await window.db.collection('contracts').doc(contractId).get();
        if (!contractDoc.exists) {
            toast('Contract not found!', 'err');
            return false;
        }

        const contract = contractDoc.data();

        if (contract.supplierId !== window.loggedInUser?.id) {
            toast('You are not the supplier!', 'err');
            return false;
        }

        // Check if already delivered today
        const today = new Date().toISOString().split('T')[0];
        if (contract.deliveries?.includes(today)) {
            toast('Already delivered today!', 'nom');
            return false;
        }

        // Check inventory
        if (!S.inv[contract.itemId] || S.inv[contract.itemId] < contract.quantityPerDay) {
            toast(`Need ${contract.quantityPerDay}x ${contract.itemIcon}!`, 'err');
            return false;
        }

        // Deduct items
        S.inv[contract.itemId] -= contract.quantityPerDay;
        if (S.inv[contract.itemId] <= 0) delete S.inv[contract.itemId];

        // Add payment
        const payment = contract.totalPerDay;
        S.money += payment;
        S.stats.earned = (S.stats.earned || 0) + payment;

        // Update contract
        await window.db.collection('contracts').doc(contractId).update({
            deliveries: window.firebase.firestore.FieldValue.arrayUnion(today)
        });

        save();

        toast(`📦 Delivered! +$${payment}`, 'ok');
        playS('sell');

        if (window.render) window.render();
        return true;
    } catch (error) {
        console.error('Deliver contract failed:', error);
        toast('Delivery failed', 'err');
        return false;
    }
}

/**
 * Cancel a contract
 * @param {string} contractId - Contract ID to cancel
 */
export async function cancelContract(contractId) {
    try {
        if (!window.db) return false;

        const contractDoc = await window.db.collection('contracts').doc(contractId).get();
        if (!contractDoc.exists) return false;

        const contract = contractDoc.data();

        if (contract.creatorId !== window.loggedInUser?.id &&
            contract.supplierId !== window.loggedInUser?.id) {
            toast('Not your contract!', 'err');
            return false;
        }

        if (!confirm('Cancel this contract?')) return false;

        await window.db.collection('contracts').doc(contractId).update({
            status: 'cancelled',
            cancelledAt: Date.now(),
            cancelledBy: window.loggedInUser.id
        });

        toast('Contract cancelled', 'ok');
        return true;
    } catch (error) {
        console.error('Cancel contract failed:', error);
        return false;
    }
}

/**
 * Get open contracts for display
 */
export async function getOpenContracts() {
    try {
        if (!window.db) return [];

        const snapshot = await window.db.collection('contracts')
            .where('status', '==', 'open')
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();

        return snapshot.docs.map(doc => doc.data());
    } catch (error) {
        console.error('Get contracts failed:', error);
        return [];
    }
}

/**
 * Get my active contracts
 */
export async function getMyContracts() {
    try {
        if (!window.db || !window.loggedInUser) return [];

        const userId = window.loggedInUser.id;

        // Get contracts I created or am supplying
        const [created, supplying] = await Promise.all([
            window.db.collection('contracts')
                .where('creatorId', '==', userId)
                .where('status', '==', 'active')
                .get(),
            window.db.collection('contracts')
                .where('supplierId', '==', userId)
                .where('status', '==', 'active')
                .get()
        ]);

        return [...created.docs.map(d => d.data()), ...supplying.docs.map(d => d.data())];
    } catch (error) {
        console.error('Get my contracts failed:', error);
        return [];
    }
}

/**
 * Show contracts modal
 */
export async function showContractsModal() {
    window.closeMenu?.();

    const existingModal = document.getElementById('contracts-modal');
    if (existingModal) existingModal.remove();

    const openContracts = await getOpenContracts();
    const myContracts = await getMyContracts();

    let html = `
        <div class="modal-box" style="max-height:85vh;overflow-y:auto">
            <div class="modal-head">
                <h3>📜 Trade Contracts</h3>
                <button class="modal-close" onclick="closeContractsModal()">×</button>
            </div>
            <div class="modal-body">
                <!-- Create Contract -->
                <div style="background:var(--bg2);padding:12px;border-radius:8px;margin-bottom:16px">
                    <h4 style="font-size:0.9rem;margin-bottom:8px">➕ Create Contract</h4>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
                        <select id="contract-item" style="padding:8px;border-radius:6px;background:var(--card);color:var(--text);border:none">
                            ${Object.entries(R).map(([id, r]) => `<option value="${id}">${r.i} ${r.n}</option>`).join('')}
                        </select>
                        <input type="number" id="contract-qty" placeholder="Qty/day" min="1" value="10" 
                               style="padding:8px;border-radius:6px;background:var(--card);color:var(--text);border:none">
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
                        <input type="number" id="contract-price" placeholder="$/unit" min="1" value="5"
                               style="padding:8px;border-radius:6px;background:var(--card);color:var(--text);border:none">
                        <input type="number" id="contract-days" placeholder="Days" min="1" max="30" value="7"
                               style="padding:8px;border-radius:6px;background:var(--card);color:var(--text);border:none">
                        <button class="btn green" onclick="createContractFromModal()">Create</button>
                    </div>
                </div>`;

    // My Active Contracts
    if (myContracts.length > 0) {
        html += `<h4 style="font-size:0.9rem;margin-bottom:8px">📋 My Active Contracts</h4>
            <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">`;

        for (const c of myContracts) {
            const isSupplier = c.supplierId === window.loggedInUser?.id;
            const today = new Date().toISOString().split('T')[0];
            const deliveredToday = c.deliveries?.includes(today);

            html += `<div style="background:var(--card);padding:10px;border-radius:8px">
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <span>${c.itemIcon} ${c.quantityPerDay}x ${c.itemName}/day @ $${c.pricePerUnit}</span>
                    <span style="color:var(--gold)">$${c.totalPerDay}/day</span>
                </div>
                <div style="font-size:0.75rem;color:var(--muted);margin-top:4px">
                    ${isSupplier ? 'Supplying to' : 'Receiving from'}: ${isSupplier ? c.creatorName : c.supplierName}
                </div>
                ${isSupplier ? `<button class="btn ${deliveredToday ? '' : 'green'}" 
                    onclick="deliverContract('${c.id}')" ${deliveredToday ? 'disabled' : ''}
                    style="width:100%;margin-top:8px">
                    ${deliveredToday ? '✅ Delivered Today' : '📦 Deliver Now'}
                </button>` : ''}
            </div>`;
        }
        html += `</div>`;
    }

    // Open Contracts
    html += `<h4 style="font-size:0.9rem;margin-bottom:8px">🌐 Open Contracts</h4>`;

    if (openContracts.length === 0) {
        html += `<div class="empty" style="padding:20px;text-align:center;color:var(--muted)">
            No open contracts available
        </div>`;
    } else {
        html += `<div style="display:flex;flex-direction:column;gap:8px">`;
        for (const c of openContracts) {
            const isMine = c.creatorId === window.loggedInUser?.id;
            html += `<div style="background:var(--card);padding:10px;border-radius:8px">
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <span>${c.itemIcon} ${c.quantityPerDay}x ${c.itemName}/day</span>
                    <span style="color:var(--gold)">$${c.totalPerDay}/day</span>
                </div>
                <div style="font-size:0.75rem;color:var(--muted);margin-top:4px">
                    ${c.durationDays} days • Posted by ${c.creatorName}
                </div>
                ${!isMine ? `<button class="btn green" onclick="acceptContract('${c.id}')" style="width:100%;margin-top:8px">
                    Accept Contract
                </button>` : `<button class="btn red" onclick="cancelContract('${c.id}')" style="width:100%;margin-top:8px">
                    Cancel
                </button>`}
            </div>`;
        }
        html += `</div>`;
    }

    html += `</div></div>`;

    const modal = document.createElement('div');
    modal.id = 'contracts-modal';
    modal.className = 'modal show';
    modal.innerHTML = html;

    document.body.appendChild(modal);
}

/**
 * Close contracts modal
 */
export function closeContractsModal() {
    const modal = document.getElementById('contracts-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

/**
 * Create contract from modal inputs
 */
async function createContractFromModal() {
    const itemId = document.getElementById('contract-item')?.value;
    const quantity = parseInt(document.getElementById('contract-qty')?.value);
    const pricePerUnit = parseInt(document.getElementById('contract-price')?.value);
    const durationDays = parseInt(document.getElementById('contract-days')?.value);

    const result = await createContract({ itemId, quantity, pricePerUnit, durationDays });
    if (result) {
        closeContractsModal();
        setTimeout(showContractsModal, 300);
    }
}

// Global exports
window.createContract = createContract;
window.acceptContract = acceptContract;
window.deliverContract = deliverContract;
window.cancelContract = cancelContract;
window.getOpenContracts = getOpenContracts;
window.getMyContracts = getMyContracts;
window.showContractsModal = showContractsModal;
window.closeContractsModal = closeContractsModal;
window.createContractFromModal = createContractFromModal;
