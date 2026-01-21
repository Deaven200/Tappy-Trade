/**
 * Friend System
 * Allows players to add friends, view their profiles, and send gifts
 */

import { S } from '../core/state.js';
import { toast, playS, notif } from '../utils/feedback.js';
import { save } from '../core/storage.js';

// Friend list stored in state
function initFriendsState() {
    if (!S.friends) S.friends = [];
    if (!S.friendRequests) S.friendRequests = [];
    if (!S.blockedUsers) S.blockedUsers = [];
}

/**
 * Send a friend request
 * @param {string} username - Username to send request to
 */
export async function sendFriendRequest(username) {
    initFriendsState();

    if (!window.loggedInUser) {
        toast('Login to add friends!', 'err');
        return false;
    }

    if (!username || username.trim().length < 3) {
        toast('Invalid username!', 'err');
        return false;
    }

    const cleanUsername = username.trim().toLowerCase();

    // Check if already friends
    if (S.friends.some(f => f.username.toLowerCase() === cleanUsername)) {
        toast('Already friends!', 'nom');
        return false;
    }

    // Check if blocked
    if (S.blockedUsers.includes(cleanUsername)) {
        toast('This user is blocked', 'err');
        return false;
    }

    try {
        if (!window.db) {
            toast('Offline - cannot add friends', 'err');
            return false;
        }

        // Find user by username
        const userQuery = await window.db.collection('users')
            .where('username', '==', username.trim())
            .limit(1)
            .get();

        if (userQuery.empty) {
            toast('User not found!', 'err');
            return false;
        }

        const targetUser = userQuery.docs[0];
        const targetId = targetUser.id;

        // Send friend request to their document
        await window.db.collection('users').doc(targetId).collection('friendRequests').add({
            fromUserId: window.loggedInUser.id,
            fromUsername: window.loggedInUser.username,
            sentAt: Date.now()
        });

        toast(`Friend request sent to ${username}!`, 'ok');
        playS('ach');
        return true;
    } catch (error) {
        console.error('Friend request failed:', error);
        toast('Failed to send request', 'err');
        return false;
    }
}

/**
 * Accept a friend request
 * @param {Object} request - Friend request object
 */
export async function acceptFriendRequest(request) {
    initFriendsState();

    try {
        // Add to friends list
        S.friends.push({
            id: request.fromUserId,
            username: request.fromUsername,
            addedAt: Date.now()
        });

        // Remove from requests
        S.friendRequests = S.friendRequests.filter(r => r.fromUserId !== request.fromUserId);

        save();

        // Also add ourselves to their friends list
        if (window.db && window.loggedInUser) {
            await window.db.collection('users').doc(request.fromUserId).update({
                friends: window.firebase.firestore.FieldValue.arrayUnion({
                    id: window.loggedInUser.id,
                    username: window.loggedInUser.username,
                    addedAt: Date.now()
                })
            });
        }

        toast(`Now friends with ${request.fromUsername}!`, 'ok');
        playS('ach');

        if (window.render) window.render();
        return true;
    } catch (error) {
        console.error('Accept friend failed:', error);
        toast('Failed to accept request', 'err');
        return false;
    }
}

/**
 * Decline a friend request
 * @param {Object} request - Friend request object
 */
export function declineFriendRequest(request) {
    initFriendsState();
    S.friendRequests = S.friendRequests.filter(r => r.fromUserId !== request.fromUserId);
    save();
    toast('Request declined', 'nom');
}

/**
 * Remove a friend
 * @param {string} friendId - Friend's user ID
 */
export function removeFriend(friendId) {
    initFriendsState();

    const friend = S.friends.find(f => f.id === friendId);
    if (!friend) return;

    if (!confirm(`Remove ${friend.username} from friends?`)) return;

    S.friends = S.friends.filter(f => f.id !== friendId);
    save();

    toast('Friend removed', 'ok');
    if (window.render) window.render();
}

/**
 * Block a user
 * @param {string} username - Username to block
 */
export function blockUser(username) {
    initFriendsState();

    const cleanUsername = username.toLowerCase();
    if (S.blockedUsers.includes(cleanUsername)) return;

    S.blockedUsers.push(cleanUsername);
    S.friends = S.friends.filter(f => f.username.toLowerCase() !== cleanUsername);
    save();

    toast(`${username} blocked`, 'ok');
}

/**
 * Unblock a user
 * @param {string} username - Username to unblock
 */
export function unblockUser(username) {
    initFriendsState();
    S.blockedUsers = S.blockedUsers.filter(u => u !== username.toLowerCase());
    save();
    toast(`${username} unblocked`, 'ok');
}

/**
 * Send a gift to a friend
 * @param {string} friendId - Friend's user ID
 * @param {string} itemId - Resource ID to send
 * @param {number} quantity - Amount to send
 */
export async function sendGift(friendId, itemId, quantity) {
    initFriendsState();

    const friend = S.friends.find(f => f.id === friendId);
    if (!friend) {
        toast('Not on your friends list!', 'err');
        return false;
    }

    if (!S.inv[itemId] || S.inv[itemId] < quantity) {
        toast('Not enough items!', 'err');
        return false;
    }

    try {
        // Remove from our inventory
        S.inv[itemId] -= quantity;
        if (S.inv[itemId] <= 0) delete S.inv[itemId];

        // Send to friend's pending gifts
        if (window.db) {
            await window.db.collection('users').doc(friendId).collection('pendingGifts').add({
                fromUserId: window.loggedInUser?.id,
                fromUsername: window.loggedInUser?.username,
                itemId,
                quantity,
                sentAt: Date.now()
            });
        }

        save();

        const resource = window.R?.[itemId];
        toast(`Sent ${quantity}x ${resource?.i || ''} ${resource?.n || itemId} to ${friend.username}!`, 'ok');
        playS('sell');

        if (window.render) window.render();
        return true;
    } catch (error) {
        console.error('Send gift failed:', error);
        toast('Failed to send gift', 'err');
        return false;
    }
}

/**
 * Get friend count
 */
export function getFriendCount() {
    initFriendsState();
    return S.friends.length;
}

/**
 * Show friends list modal
 */
export function showFriendsModal() {
    window.closeMenu?.();
    initFriendsState();

    const existingModal = document.getElementById('friends-modal');
    if (existingModal) existingModal.remove();

    let html = `
        <div class="modal-box" style="max-height:85vh;overflow-y:auto">
            <div class="modal-head">
                <h3>👥 Friends (${S.friends.length})</h3>
                <button class="modal-close" onclick="closeFriendsModal()">×</button>
            </div>
            <div class="modal-body">
                <!-- Add Friend -->
                <div style="display:flex;gap:8px;margin-bottom:16px">
                    <input type="text" id="add-friend-input" placeholder="Enter username..." 
                           style="flex:1;padding:10px;border-radius:6px;background:var(--bg);color:var(--text);border:1px solid rgba(255,255,255,0.1)">
                    <button class="btn green" onclick="sendFriendRequestFromModal()">Add</button>
                </div>`;

    // Friend requests
    if (S.friendRequests.length > 0) {
        html += `<h4 style="font-size:0.9rem;margin-bottom:8px">📬 Pending Requests</h4>
            <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px">`;

        for (const req of S.friendRequests) {
            html += `<div style="display:flex;justify-content:space-between;align-items:center;background:var(--bg2);padding:10px;border-radius:6px">
                <span>${req.fromUsername}</span>
                <div style="display:flex;gap:4px">
                    <button class="btn green" onclick="acceptFriendRequest(${JSON.stringify(req).replace(/"/g, '&quot;')})">✓</button>
                    <button class="btn red" onclick="declineFriendRequest(${JSON.stringify(req).replace(/"/g, '&quot;')})">✕</button>
                </div>
            </div>`;
        }
        html += `</div>`;
    }

    // Friends list
    if (S.friends.length === 0) {
        html += `<div class="empty" style="padding:30px;text-align:center">
            <div style="font-size:2rem;opacity:0.5;margin-bottom:8px">👥</div>
            <div style="color:var(--muted)">No friends yet!</div>
            <div style="color:var(--muted);font-size:0.8rem;margin-top:4px">Add friends by username above.</div>
        </div>`;
    } else {
        html += `<div style="display:flex;flex-direction:column;gap:8px">`;

        for (const friend of S.friends) {
            html += `<div style="display:flex;justify-content:space-between;align-items:center;background:var(--card);padding:12px;border-radius:8px">
                <div>
                    <div style="font-weight:600">${friend.username}</div>
                    <div style="font-size:0.75rem;color:var(--muted)">Added ${new Date(friend.addedAt).toLocaleDateString()}</div>
                </div>
                <div style="display:flex;gap:4px">
                    <button class="btn" onclick="viewFriendProfile('${friend.id}')" title="View Profile">👤</button>
                    <button class="btn red" onclick="removeFriend('${friend.id}')" title="Remove">✕</button>
                </div>
            </div>`;
        }

        html += `</div>`;
    }

    html += `</div></div>`;

    const modal = document.createElement('div');
    modal.id = 'friends-modal';
    modal.className = 'modal show';
    modal.innerHTML = html;

    document.body.appendChild(modal);
}

/**
 * Close friends modal
 */
export function closeFriendsModal() {
    const modal = document.getElementById('friends-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

/**
 * Send friend request from modal input
 */
function sendFriendRequestFromModal() {
    const input = document.getElementById('add-friend-input');
    if (input && input.value) {
        sendFriendRequest(input.value);
        input.value = '';
    }
}

// Global exports
window.sendFriendRequest = sendFriendRequest;
window.acceptFriendRequest = acceptFriendRequest;
window.declineFriendRequest = declineFriendRequest;
window.removeFriend = removeFriend;
window.blockUser = blockUser;
window.unblockUser = unblockUser;
window.sendGift = sendGift;
window.getFriendCount = getFriendCount;
window.showFriendsModal = showFriendsModal;
window.closeFriendsModal = closeFriendsModal;
window.sendFriendRequestFromModal = sendFriendRequestFromModal;
