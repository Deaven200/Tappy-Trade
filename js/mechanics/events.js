/**
 * Event System
 * Handles random events like Market Crash, Rain, etc.
 */

import { toast, notif } from '../utils/feedback.js';
import { playS } from '../utils/feedback.js';
import { S } from '../core/state.js';

export function triggerEvent(eventId) {
    console.log('🎲 Event triggered:', eventId);

    switch (eventId) {
        case 'rain':
            toast('It started raining! Crops grow faster.', 'ok');
            S.activeEvent = 'rain';
            S.eventEndsAt = Date.now() + 60000;
            break;
        case 'market_crash':
            notif('📉 Market Crash!', 'Prices have plummeted!');
            playS('err');
            // Logic to lower prices would go here
            break;
        case 'market_boom':
            notif('📈 Market Boom!', 'Prices are skyrocketing!');
            playS('ach');
            break;
        default:
            console.warn('Unknown event:', eventId);
    }
}

// Expose globally
window.triggerEvent = triggerEvent;
