/**
 * Tutorial System Module
 * Handles tutorial modal display for new users
 */

import { S } from '../core/state.js';
import { $ } from '../utils/dom.js';

/**
 * Close the tutorial modal
 */
export function closeTutorial() {
    $('tutorial').style.display = 'none';
    S.sawTutorial = true;
}

/**
 * Show tutorial if user hasn't seen it
 */
export function showTutorialIfNeeded() {
    if (!S.sawTutorial) {
        $('tutorial').style.display = 'flex';
    }
}
