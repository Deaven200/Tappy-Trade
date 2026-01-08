/**
 * Farm Naming Module
 * Handles renaming the player's farm
 */

import { S } from '../core/state.js';
import { save } from '../core/storage.js';
import { toast } from '../utils/feedback.js';

/**
 * Rename the farm
 */
export function renameFarm() {
    const currentName = S.farmName || "Untitled Farm";
    const name = prompt(`Enter farm name (max 20 chars):`, currentName);

    if (!name || name.trim() === '') return;

    if (name.length > 20) {
        toast('Name too long! Max 20 characters', 'err');
        return;
    }

    const trimmedName = name.trim();

    if (S.hasRenamedFarm && S.money < 1000) {
        toast('Renaming costs $1000!', 'err');
        return;
    }

    if (S.hasRenamedFarm) S.money -= 1000;
    S.farmName = trimmedName;
    S.hasRenamedFarm = true;
    save();
    toast(`Farm renamed to "${trimmedName}"!`, 'ok');

    // Close menu if open
    const menuModal = document.getElementById('menu-modal');
    if (menuModal) menuModal.classList.remove('show');
}
