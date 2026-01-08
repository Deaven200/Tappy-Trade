/**
 * Firebase Chat Module
 * Handles global chat with Firebase Firestore
 */

import { $ } from '../utils/dom.js';
import { toast } from '../utils/feedback.js';
import { sanitizeInput } from '../utils/security.js';

// Chat state
let chatMessages = [];
let unsubChat = null;

/**
 * Show chat modal and load messages
 */
export function showChat() {
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
    const messagesEl = $('chat-messages');

    // Access global db from index.html
    const db = window.db;

    if (!db) {
        if (messagesEl) {
            messagesEl.innerHTML = '<div class="empty">Chat offline - Firebase not connected</div>';
        }
        return;
    }

    // Unsubscribe from previous listener
    if (unsubChat) unsubChat();

    // Subscribe to chat messages
    unsubChat = db.collection('chat')
        .orderBy('createdAt', 'desc')
        .limit(50)
        .onSnapshot(snap => {
            chatMessages = snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse();
            renderChat();
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

    // Check BOTH Firebase auth AND loggedInUser
    if (!currentUser && !loggedInUser) {
        toast('Log in to chat!', 'err');
        return;
    }

    // Use loggedInUser if available, otherwise fall back to Firebase user
    const username = loggedInUser?.username || currentUser?.displayName || 'Anonymous';
    const userId = loggedInUser?.id || currentUser?.uid;

    // Sanitize and validate input
    const sanitizedText = sanitizeInput(text, 200); // Max 200 chars
    if (!sanitizedText) {
        toast('Message too long or invalid', 'err');
        return;
    }

    try {
        await db.collection('chat').add({
            text: sanitizedText,
            userName: username,
            userId: userId,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        input.value = '';
    } catch (e) {
        console.error('Chat send error:', e);
        toast('Failed to send', 'err');
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

            h += `<div style="margin-bottom:8px;${isMe ? 'text-align:right' : ''}">
                <div style="display:inline-block;max-width:80%;padding:8px 12px;border-radius:12px;background:${isMe ? 'var(--blue)' : 'var(--card)'}">
                    <div style="font-size:0.7rem;color:${isMe ? 'rgba(255,255,255,0.7)' : 'var(--muted)'};margin-bottom:2px">${msg.userName || 'Anonymous'} · ${timeStr}</div>
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
 * Setup Enter key listener for chat input
 */
export function setupChatKeyboard() {
    document.addEventListener('keydown', e => {
        if (e.key === 'Enter' && document.activeElement?.id === 'chat-input') {
            sendChat();
        }
    });
}
