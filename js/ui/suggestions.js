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
 * Send suggestion via EmailJS
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
        // Using EmailJS - free tier allows 200 emails/month
        // You'll need to set up EmailJS account at https://www.emailjs.com/

        // For now, use mailto as fallback
        const subject = 'Tappy Trade - Player Suggestion';
        const body = `Suggestion from player:\n\n${text}\n\n---\nSent from Tappy Trade`;
        const mailtoLink = `mailto:tappy0trade@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        window.location.href = mailtoLink;

        toast('Opening email client...', 'ok');
        setTimeout(() => {
            closeSuggestions();
            textarea.value = '';
        }, 1000);

    } catch (error) {
        console.error('Failed to send suggestion:', error);
        toast('Failed to send. Please try again!', 'err');
    } finally {
        if (sendBtn) sendBtn.textContent = originalText;
    }
}
