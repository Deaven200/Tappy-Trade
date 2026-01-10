/**
 * Firebase Chat Module
 * Handles global chat with Firebase Firestore
 */

import { $ } from '../utils/dom.js';
import { toast } from '../utils/feedback.js';
import { sanitizeInput, sanitizeHTML } from '../utils/security.js';

// Chat state
let chatMessages = [];
let unsubChat = null;

// Discord webhook for sending game messages to Discord
const DISCORD_WEBHOOK = 'https://discordapp.com/api/webhooks/1459058604500848711/H2AeMm-thJildJtn-8yJe5GWTc68fn2xAecQiCUZ8RlsUO8iqQykIfZz-eRB7tr5DXf2';

/**
 * Send message to Discord via webhook
 */
async function sendToDiscord(username, message) {
    // Don't send if webhook not configured
    if (DISCORD_WEBHOOK === 'YOUR_CHAT_WEBHOOK_URL_HERE' || !DISCORD_WEBHOOK) {
        return;
    }

    try {
        await fetch(DISCORD_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: `🎮 ${username}`,
                content: message,
                avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
            })
        });
        console.log('✅ Message sent to Discord');
    } catch (error) {
        console.error('Failed to send to Discord:', error);
        // Don't show error to user - Discord is optional
    }
}

/**
 * Show chat modal and load messages
 */
export function showChat() {
    console.log('📬 showChat() called');
    const modal = $('chat-modal');
    if (modal) {
        modal.classList.add('show');
    }
    loadChat();

    // Close menu if open
    const menuModal = $('menu-modal');
    if (menuModal) menuModal.classList.remove('show');
}

/**
 * Close chat modal and unsubscribe from updates
 */
export function closeChat() {
    const modal = $('chat-modal');
    if (modal) {
        modal.classList.remove('show');
    }
    if (unsubChat) {
        unsubChat();
        unsubChat = null;
    }
}

/**
 * Load chat messages from Firebase
 */
function loadChat() {
    console.log('📬 loadChat() called');
    const messagesEl = $('chat-messages');

    // Access global db from index.html
    const db = window.db;

    console.log('📬 Firebase db:', db ? 'Connected ✅' : 'NOT CONNECTED ❌');

    if (!db) {
        if (messagesEl) {
            messagesEl.innerHTML = '<div class="empty">Chat offline - Firebase not connected</div>';
        }
        return;
    }

    // Unsubscribe from previous listener
    if (unsubChat) unsubChat();

    console.log('📬 Setting up Firebase listener...');

    // Subscribe to chat messages
    unsubChat = db.collection('chat')
        .orderBy('createdAt', 'desc')
        .limit(50)
        .onSnapshot(snap => {
            chatMessages = snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse();
            console.log(`📬 Loaded ${chatMessages.length} chat messages:`, chatMessages);
            window.chatMessages = chatMessages; // Expose for debugging
            renderChat();
        }, error => {
            console.error('📬 Firebase listener error:', error);
        });
}

/**
 * Send a chat message
 */
export async function sendChat() {
    const input = $('chat-input');
    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    // Access globals from index.html
    const db = window.db;
    const firebase = window.firebase;
    const auth = firebase?.auth?.();
    const currentUser = auth?.currentUser;
    const loggedInUser = window.loggedInUser;

    if (!db) {
        toast('Chat offline!', 'err');
        return;
    }

    // Allow both logged-in and guest users to chat
    let username, userId;

    if (loggedInUser) {
        // Logged in user
        username = loggedInUser.username;
        userId = loggedInUser.id;
    } else if (currentUser) {
        // Firebase authenticated user
        username = currentUser.displayName || 'Anonymous';
        userId = currentUser.uid;
    } else {
        // Guest user - create temporary ID
        if (!window._guestChatId) {
            window._guestChatId = 'guest_' + Math.random().toString(36).substr(2, 9);
        }
        username = 'Guest';
        userId = window._guestChatId;
    }

    // Sanitize and validate input
    const sanitizedText = sanitizeInput(text, 200); // Max 200 chars
    if (!sanitizedText) {
        toast('Message too long or invalid', 'err');
        return;
    }

    // Anti-Spam: Rate limiting (1 message per second)
    const now = Date.now();
    if (window._lastChatTime && now - window._lastChatTime < 1000) {
        toast('Slow down!', 'err');
        return;
    }

    // Anti-Spam: Duplicate message check
    if (window._lastChatText === sanitizedText) {
        toast('Do not spam!', 'err');
        return;
    }

    // Optimistic UI: Clear input immediately
    input.value = '';

    try {
        await db.collection('chat').add({
            text: sanitizedText,
            userName: username,
            userId: userId,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Update anti-spam trackers
        window._lastChatTime = now;
        window._lastChatText = sanitizedText;

        // Send to Discord webhook (async, don't wait)
        sendToDiscordWebhook(username, sanitizedText).catch(err => {
            console.log('Discord webhook failed (non-critical):', err);
        });

    } catch (e) {
        console.error('Chat send error:', e);
        toast('Failed to send', 'err');
        // Restore input on error
        input.value = text;
    }
}

/**
 * Render chat messages to the modal
 */
function renderChat() {
    const messagesEl = $('chat-messages');
    if (!messagesEl) return;

    const loggedInUser = window.loggedInUser;
    let h = '';

    if (chatMessages.length === 0) {
        h = '<div class="empty">No messages yet. Say hi!</div>';
    } else {
        for (const msg of chatMessages) {
            const isMe = loggedInUser && msg.userId === loggedInUser.id;
            const time = msg.createdAt?.toDate?.() || new Date();
            const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            // Support both userName (game) and username (Discord bot)
            const displayName = msg.userName || msg.username || 'Anonymous';

            h += `<div style="margin-bottom:8px;${isMe ? 'text-align:right' : ''}">
                <div style="display:inline-block;max-width:80%;padding:8px 12px;border-radius:12px;background:${isMe ? 'var(--blue)' : 'var(--card)'}">
                    <div style="font-size:0.7rem;color:${isMe ? 'rgba(255,255,255,0.7)' : 'var(--muted)'};margin-bottom:2px">${displayName} · ${timeStr}</div>
                    <div>${msg.text}</div>
                </div>
            </div>`;
        }
    }

    messagesEl.innerHTML = h;

    // Auto-scroll to bottom
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

/**
 * Send chat message to Discord webhook
 */
async function sendToDiscordWebhook(username, message) {
    const DISCORD_WEBHOOK_URL = 'https://discordapp.com/api/webhooks/1459058604500848711/H2AeMm-thJildJtn-8yJe5GWTc68fn2xAecQiCUZ8RlsUO8iqQykIfZz-eRB7tr5DXf2';

    try {
        await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: `🎮 ${username}`,
                avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
                content: message
            })
        });
        console.log('✅ Message sent to Discord');
    } catch (error) {
        console.error('Discord webhook failed:', error);
        // Silently fail - chat webhook is optional
        throw error;
    }
}

/**
 * Setup Enter key listener for chat input
 */
export function setupChatKeyboard() {
    document.addEventListener('keydown', e => {
        if (e.key === 'Enter' && document.activeElement?.id === 'chat-input') {
            sendChat();
        }
    });
}
