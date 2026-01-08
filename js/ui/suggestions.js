/**
 * Suggestions System
 * Allows players to send suggestions via EmailJS
 */

import { $ } from '../utils/dom.js';
import { toast } from '../utils/feedback.js';

/**
 * Show suggestions modal
 */
export function showSuggestions() {
    const modal = $('suggestions-modal');
    if (modal) {
        modal.classList.add('show');
        // Clear previous text
        const textarea = $('suggestion-text');
        if (textarea) textarea.value = '';
    }

    // Close menu if open
    const menuModal = $('menu-modal');
    if (menuModal) menuModal.classList.remove('show');
}

/**
 * Close suggestions modal
 */
export function closeSuggestions() {
    const modal = $('suggestions-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

/**
 * Send suggestion via Discord webhook
 */
export async function sendSuggestion() {
    const textarea = $('suggestion-text');
    if (!textarea) return;

    const text = textarea.value.trim();

    if (!text) {
        toast('Please write a suggestion first!', 'err');
        return;
    }

    if (text.length < 10) {
        toast('Suggestion too short! Please add more details.', 'err');
        return;
    }

    // Show loading state
    const sendBtn = document.querySelector('[data-action="send-suggestion"]');
    const originalText = sendBtn?.textContent;
    if (sendBtn) sendBtn.textContent = '📤 Sending...';

    try {
        // Discord Webhook URL
        const DISCORD_WEBHOOK_URL = 'https://discordapp.com/api/webhooks/1458900023461810177/dhEYECFOdDHZW_2d2H-gja_O8JFvMiHexY8dbato2Xp2lLuziALS4V6ENnfvRdMpt56l';

        // Create Discord embed
        const embed = {
            title: '💡 New Suggestion from Tappy Trade!',
            description: text,
            color: 0x4ade80, // Green
            timestamp: new Date().toISOString(),
            footer: { text: 'Tappy Trade Suggestions' }
        };

        // Send to Discord
        const response = await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'Tappy Trade Bot',
                avatar_url: 'https://em-content.zobj.net/thumbs/120/google/350/light-bulb_1f4a1.png',
                embeds: [embed]
            })
        });

        if (response.ok) {
            toast('Suggestion sent! Thank you! 🎉', 'ok');
            closeSuggestions();
            textarea.value = '';
        } else {
            throw new Error('Webhook failed');
        }

    } catch (error) {
        console.error('Failed to send suggestion:', error);
        toast('Failed to send. Please try again!', 'err');
    } finally {
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.textContent = originalText;
        }
    }
}
