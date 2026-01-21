/**
 * Data Export/Import System
 * Allows players to backup and restore their save data
 */

import { S, getDefaultState } from '../core/state.js';
import { save } from '../core/storage.js';
import { toast, notif } from '../utils/feedback.js';

/**
 * Export save data to a JSON file download
 */
export function exportSaveData() {
    try {
        const exportData = {
            version: window.SAVE_VERSION || 1,
            exportedAt: new Date().toISOString(),
            username: window.loggedInUser?.username || 'Guest',
            data: { ...S }
        };

        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `tappy-trade-save-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast('💾 Save exported!', 'ok');
        console.log('✅ Save data exported successfully');
        return true;
    } catch (error) {
        console.error('Export failed:', error);
        toast('Export failed!', 'err');
        return false;
    }
}

/**
 * Import save data from a JSON file
 * @param {File} file - The JSON file to import
 */
export async function importSaveData(file) {
    try {
        const text = await file.text();
        const importData = JSON.parse(text);

        // Validate import data
        if (!importData.data) {
            toast('Invalid save file!', 'err');
            return false;
        }

        // Confirm with user
        const confirmed = confirm(
            `Import save from ${importData.username || 'Unknown'}?\n` +
            `Exported: ${new Date(importData.exportedAt).toLocaleString()}\n\n` +
            `This will REPLACE your current progress!`
        );

        if (!confirmed) {
            toast('Import cancelled', 'nom');
            return false;
        }

        // Merge with default state to ensure all fields exist
        const defaultState = getDefaultState();
        const mergedData = { ...defaultState, ...importData.data };

        // Apply imported data
        Object.assign(S, mergedData);

        // Update last update time
        S.lastUpdate = Date.now();

        // Save to local storage
        save();

        toast('✅ Save imported! Refreshing...', 'ok');
        notif('Save data restored successfully!');

        // Reload page to apply changes
        setTimeout(() => window.location.reload(), 1500);

        return true;
    } catch (error) {
        console.error('Import failed:', error);
        toast('Import failed! Invalid file format', 'err');
        return false;
    }
}

/**
 * Generate QR code data URL for save transfer
 * Note: For large saves, this may need to be compressed or use a server
 */
export function generateTransferCode() {
    try {
        // Create minimal save data (key stats only for QR)
        const minimalData = {
            m: S.money,
            p: S.plots.length,
            w: S.workers.length,
            s: S.stats,
            gov: S.governmentTiers
        };

        const encoded = btoa(JSON.stringify(minimalData));

        // Return as URL that could be used with QR library
        const transferUrl = `${window.location.origin}${window.location.pathname}?import=${encoded}`;

        return transferUrl;
    } catch (error) {
        console.error('Transfer code generation failed:', error);
        return null;
    }
}

/**
 * Show data management modal
 */
export function showDataModal() {
    window.closeMenu?.();

    const existingModal = document.getElementById('data-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'data-modal';
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-box">
            <div class="modal-head">
                <h3>💾 Data Management</h3>
                <button class="modal-close" onclick="closeDataModal()">×</button>
            </div>
            <div class="modal-body">
                <p style="color:var(--muted);font-size:0.8rem;margin-bottom:16px">
                    Export your save to backup your progress, or import a previously exported save.
                </p>
                
                <div style="display:flex;flex-direction:column;gap:12px">
                    <button class="btn green" onclick="exportSaveData()" style="padding:14px">
                        📤 Export Save Data
                    </button>
                    
                    <label class="btn purple" style="padding:14px;cursor:pointer;text-align:center">
                        📥 Import Save Data
                        <input type="file" accept=".json" onchange="handleFileImport(event)" style="display:none">
                    </label>
                </div>
                
                <div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.1)">
                    <h4 style="font-size:0.9rem;margin-bottom:8px">📊 Current Save Info</h4>
                    <div style="font-size:0.8rem;color:var(--muted)">
                        <div>Money: $${S.money?.toLocaleString() || 0}</div>
                        <div>Plots: ${S.plots?.length || 1}</div>
                        <div>Workers: ${S.workers?.length || 0}</div>
                        <div>Items Harvested: ${S.stats?.harvested?.toLocaleString() || 0}</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

/**
 * Close data management modal
 */
export function closeDataModal() {
    const modal = document.getElementById('data-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

/**
 * Handle file input for import
 */
async function handleFileImport(event) {
    const file = event.target.files?.[0];
    if (file) {
        await importSaveData(file);
    }
    event.target.value = ''; // Reset input
}

// Global exports
window.exportSaveData = exportSaveData;
window.importSaveData = importSaveData;
window.showDataModal = showDataModal;
window.closeDataModal = closeDataModal;
window.handleFileImport = handleFileImport;
