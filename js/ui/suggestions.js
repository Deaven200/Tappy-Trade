/**
 * Suggestions System - Discord Webhook Only
 */

import { $ } from '../utils/dom.js';
import { toast } from '../utils/feedback.js';

export function showSuggestions() {
    const modal = $('suggestions-modal');
    if (modal) modal.classList.add('show');

    const textarea = $('suggestion-text');
    if (textarea) textarea.value = '';

    const menuModal = $('menu-modal');
    if (menuModal) menuModal.classList.remove('show');
}

export function closeSuggestions() {
    const modal = $('suggestions-modal');
    if (modal) modal.classList.remove('show');
}

export async function sendSuggestion() {
    const textarea = $('suggestion-text');
    if (!textarea) return;

    const text = textarea.value.trim();

    if (!text) {
        toast('Please write a suggestion!', 'err');
        return;
    }

    if (text.length < 10) {
        toast('Please write more details!', 'err');
        return;
    }

    const sendBtn = document.querySelector('[data-action="send-suggestion"]');
    if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.textContent = '📤 Sending...';
    }

    try {
        const response = await fetch('https://discordapp.com/api/webhooks/1458900023461810177/dhEYECFOdDHZW_2d2H-gja_O8JFvMiHexY8dbato2Xp2lLuziALS4V6ENnfvRdMpt56l', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'Tappy Trade Bot',
                avatar_url: 'https://em-content.zobj.net/thumbs/120/google/350/light-bulb_1f4a1.png',
                embeds: [{
                    title: '💡 New Suggestion!',
                    description: text,
                    color: 0x4ade80,
                    timestamp: new Date().toISOString(),
                    footer: { text: 'Tappy Trade' }
                }]
            })
        });

        if (response.ok) {
            toast('Suggestion sent! Thank you! 🎉', 'ok');
            closeSuggestions();
            textarea.value = '';
        } else {
            throw new Error('Failed');
        }

    } catch (error) {
        console.error('Send failed:', error);
        toast('Failed to send. Try again!', 'err');
    } finally {
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.textContent = '📤 Send Suggestion';
        }
    }
}
