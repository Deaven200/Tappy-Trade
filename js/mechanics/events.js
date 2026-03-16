/**
 * Event System
 * Handles random events like Rain, Merchant Visits, Drought, etc.
 * Negative events are protected against for players very early in the game.
 */

import { toast, notif } from '../utils/feedback.js';
import { playS } from '../utils/feedback.js';
import { S } from '../core/state.js';
import { EVENTS } from '../config/constants.js';

/**
 * Returns true if the player is too new to receive a negative event.
 * Protection threshold: fewer than 3 plots OR less than $1,000 total earned.
 */
function isNewPlayer() {
    return (S.plots.length < 3) || ((S.stats?.earned || 0) < 1000);
}

export function triggerEvent(eventId) {
    // Find event definition from config
    const eventDef = EVENTS.find(e => e.id === eventId);

    // Guard: block negative events for new players
    if (eventDef && eventDef.mult !== undefined && eventDef.mult < 1 && isNewPlayer()) {
        console.log(`🛡️ Drought/negative event blocked for new player (${eventId})`);
        return;
    }

    console.log('🎲 Event triggered:', eventId);

    switch (eventId) {
        case 'rain':
            toast('🌧️ It started raining! Farms grow faster for 3 minutes.', 'ok');
            notif('🌧️ Rain Bonus! All farms produce 2x for 3 minutes.');
            playS('ach');
            S.activeEvent = 'rain';
            S.eventEndsAt = Date.now() + 180000; // 3 min
            break;

        case 'drought':
            if (isNewPlayer()) return; // Double-guard
            toast('🏜️ Drought! Farm output reduced for 2 minutes.', 'err');
            notif('🏜️ Drought! Farms produce 50% less for 2 minutes.');
            playS('err');
            S.activeEvent = 'drought';
            S.eventEndsAt = Date.now() + 120000; // 2 min
            break;

        case 'merchant':
            toast('💰 Merchant Visit! Sell prices +50% for 2 minutes!', 'ok');
            notif('💰 Merchant Visit! All sell prices are boosted for 2 minutes!');
            playS('ach');
            S.activeEvent = 'merchant';
            S.eventEndsAt = Date.now() + 120000;
            break;

        case 'workerBonus':
            toast('⚡ Worker Boost! Workers work 2x faster for 3 minutes!', 'ok');
            notif('⚡ Worker Bonus! Your workers are in overdrive!');
            playS('ach');
            S.activeEvent = 'workerBonus';
            S.eventEndsAt = Date.now() + 180000;
            break;

        case 'gold':
            const goldAmt = 500;
            S.money += goldAmt;
            toast(`🎉 Buried Treasure! Found $${goldAmt}!`, 'ok');
            notif(`🎉 Gold Rush! You found $${goldAmt} buried on your land!`);
            playS('ach');
            break;

        case 'bountiful':
            S.plots.forEach(plot => {
                plot.subs.forEach(sub => {
                    const cfg = window.T?.[sub.t];
                    if (cfg?.m) sub.c = cfg.m;
                });
            });
            toast('🌾 Bountiful Harvest! All resources ready!', 'ok');
            notif('🌾 Bountiful Harvest! All your subplots are full!');
            playS('ach');
            break;

        case 'lucky': {
            const items = ['wood', 'stone', 'wheat', 'berries'];
            const qty = 5 + Math.floor(Math.random() * 10);
            items.forEach(id => window.addItem?.(id, qty));
            toast(`🍀 Lucky Find! Got some free resources!`, 'ok');
            notif(`🍀 Lucky Find! Received ${qty} of several items.`);
            playS('ach');
            break;
        }

        case 'market_crash':
            notif('📉 Market Crash! Prices have plummeted!');
            playS('err');
            break;

        case 'market_boom':
            notif('📈 Market Boom! Prices are skyrocketing!');
            playS('ach');
            break;

        default:
            console.warn('Unknown event:', eventId);
    }

    if (window.render) window.render();
}

// Expose globally
window.triggerEvent = triggerEvent;
