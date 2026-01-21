/**
 * Guild System
 * Allows players to form guilds for cooperative benefits
 */

import { S } from '../core/state.js';
import { toast, playS, notif } from '../utils/feedback.js';
import { save } from '../core/storage.js';

// Guild state
function initGuildState() {
    if (!S.guild) S.guild = null;
}

/**
 * Create a new guild
 * @param {string} name - Guild name
 * @param {string} tag - Short tag (2-4 chars)
 */
export async function createGuild(name, tag) {
    initGuildState();

    if (!window.loggedInUser) {
        toast('Login to create a guild!', 'err');
        return false;
    }

    if (S.guild) {
        toast('Already in a guild!', 'err');
        return false;
    }

    if (!name || name.length < 3 || name.length > 20) {
        toast('Guild name must be 3-20 characters', 'err');
        return false;
    }

    if (!tag || tag.length < 2 || tag.length > 4) {
        toast('Tag must be 2-4 characters', 'err');
        return false;
    }

    try {
        const guildId = `guild_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

        const guild = {
            id: guildId,
            name: name.trim(),
            tag: tag.toUpperCase().trim(),
            leaderId: window.loggedInUser.id,
            leaderName: window.loggedInUser.username,
            members: [{
                id: window.loggedInUser.id,
                username: window.loggedInUser.username,
                role: 'leader',
                joinedAt: Date.now()
            }],
            createdAt: Date.now(),
            level: 1,
            xp: 0,
            totalContributions: 0,
            bonuses: {
                governmentBonus: 0.05, // +5% government tier progress
                productionBonus: 0     // Unlocked at higher levels
            }
        };

        if (window.db) {
            await window.db.collection('guilds').doc(guildId).set(guild);
        }

        S.guild = guildId;
        save();

        toast(`🏰 Guild "${name}" created!`, 'ok');
        playS('ach');
        notif('You are now the leader of ' + name);

        return guild;
    } catch (error) {
        console.error('Create guild failed:', error);
        toast('Failed to create guild', 'err');
        return false;
    }
}

/**
 * Join a guild
 * @param {string} guildId - Guild ID to join
 */
export async function joinGuild(guildId) {
    initGuildState();

    if (!window.loggedInUser) {
        toast('Login to join guilds!', 'err');
        return false;
    }

    if (S.guild) {
        toast('Leave your current guild first!', 'err');
        return false;
    }

    try {
        if (!window.db) {
            toast('Offline - cannot join', 'err');
            return false;
        }

        const guildDoc = await window.db.collection('guilds').doc(guildId).get();
        if (!guildDoc.exists) {
            toast('Guild not found!', 'err');
            return false;
        }

        const guild = guildDoc.data();

        if (guild.members.length >= 50) {
            toast('Guild is full!', 'err');
            return false;
        }

        // Add member
        await window.db.collection('guilds').doc(guildId).update({
            members: window.firebase.firestore.FieldValue.arrayUnion({
                id: window.loggedInUser.id,
                username: window.loggedInUser.username,
                role: 'member',
                joinedAt: Date.now()
            })
        });

        S.guild = guildId;
        save();

        toast(`🏰 Joined [${guild.tag}] ${guild.name}!`, 'ok');
        playS('ach');

        return true;
    } catch (error) {
        console.error('Join guild failed:', error);
        toast('Failed to join guild', 'err');
        return false;
    }
}

/**
 * Leave current guild
 */
export async function leaveGuild() {
    initGuildState();

    if (!S.guild) {
        toast('Not in a guild!', 'err');
        return false;
    }

    if (!confirm('Leave your guild?')) return false;

    try {
        if (window.db && window.loggedInUser) {
            const guildDoc = await window.db.collection('guilds').doc(S.guild).get();
            if (guildDoc.exists) {
                const guild = guildDoc.data();

                // Check if leader
                if (guild.leaderId === window.loggedInUser.id) {
                    if (guild.members.length > 1) {
                        toast('Transfer leadership first!', 'err');
                        return false;
                    }
                    // Delete guild if last member
                    await window.db.collection('guilds').doc(S.guild).delete();
                } else {
                    // Remove member
                    const updatedMembers = guild.members.filter(m => m.id !== window.loggedInUser.id);
                    await window.db.collection('guilds').doc(S.guild).update({
                        members: updatedMembers
                    });
                }
            }
        }

        S.guild = null;
        save();

        toast('Left guild', 'ok');
        return true;
    } catch (error) {
        console.error('Leave guild failed:', error);
        toast('Failed to leave guild', 'err');
        return false;
    }
}

/**
 * Get current guild info
 */
export async function getGuildInfo() {
    initGuildState();

    if (!S.guild) return null;

    try {
        if (!window.db) return null;

        const guildDoc = await window.db.collection('guilds').doc(S.guild).get();
        return guildDoc.exists ? guildDoc.data() : null;
    } catch (error) {
        console.error('Get guild failed:', error);
        return null;
    }
}

/**
 * Search for guilds
 * @param {string} query - Search query
 */
export async function searchGuilds(query = '') {
    try {
        if (!window.db) return [];

        let q = window.db.collection('guilds').limit(20);

        // Note: Firestore doesn't support full-text search well
        // This is a simple implementation

        const snapshot = await q.get();
        let guilds = snapshot.docs.map(d => d.data());

        if (query) {
            const lowerQuery = query.toLowerCase();
            guilds = guilds.filter(g =>
                g.name.toLowerCase().includes(lowerQuery) ||
                g.tag.toLowerCase().includes(lowerQuery)
            );
        }

        return guilds;
    } catch (error) {
        console.error('Search guilds failed:', error);
        return [];
    }
}

/**
 * Get guild bonus for government tier progress
 */
export function getGuildGovernmentBonus() {
    initGuildState();
    return S.guild ? 0.05 : 0; // 5% bonus while in guild
}

/**
 * Show guild modal
 */
export async function showGuildModal() {
    window.closeMenu?.();
    initGuildState();

    const existingModal = document.getElementById('guild-modal');
    if (existingModal) existingModal.remove();

    const myGuild = S.guild ? await getGuildInfo() : null;
    const searchResults = !S.guild ? await searchGuilds() : [];

    let html = `
        <div class="modal-box" style="max-height:85vh;overflow-y:auto">
            <div class="modal-head">
                <h3>🏰 Guilds</h3>
                <button class="modal-close" onclick="closeGuildModal()">×</button>
            </div>
            <div class="modal-body">`;

    if (myGuild) {
        // Show my guild
        html += `
            <div style="background:linear-gradient(135deg, var(--purple), var(--card));padding:16px;border-radius:12px;margin-bottom:16px;text-align:center">
                <div style="font-size:0.9rem;color:var(--gold)">[${myGuild.tag}]</div>
                <div style="font-size:1.3rem;font-weight:700">${myGuild.name}</div>
                <div style="font-size:0.8rem;color:var(--muted);margin-top:4px">
                    ${myGuild.members.length} members • Level ${myGuild.level}
                </div>
            </div>
            
            <div style="background:var(--bg2);padding:12px;border-radius:8px;margin-bottom:16px">
                <h4 style="font-size:0.9rem;margin-bottom:8px">🎁 Guild Bonuses</h4>
                <div style="font-size:0.85rem;color:var(--green)">
                    +5% Government Tier Progress
                </div>
            </div>
            
            <h4 style="font-size:0.9rem;margin-bottom:8px">👥 Members</h4>
            <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:16px">
                ${myGuild.members.map(m => `
                    <div style="display:flex;justify-content:space-between;background:var(--card);padding:8px 10px;border-radius:6px">
                        <span>${m.role === 'leader' ? '👑' : '👤'} ${m.username}</span>
                        <span style="color:var(--muted);font-size:0.8rem">${m.role}</span>
                    </div>
                `).join('')}
            </div>
            
            <button class="btn red" onclick="leaveGuild();closeGuildModal();" style="width:100%">
                Leave Guild
            </button>`;
    } else {
        // Create or join guild
        html += `
            <div style="background:var(--bg2);padding:12px;border-radius:8px;margin-bottom:16px">
                <h4 style="font-size:0.9rem;margin-bottom:8px">➕ Create Guild</h4>
                <div style="display:flex;gap:8px;margin-bottom:8px">
                    <input type="text" id="guild-name" placeholder="Guild Name" maxlength="20"
                           style="flex:1;padding:8px;border-radius:6px;background:var(--card);color:var(--text);border:none">
                    <input type="text" id="guild-tag" placeholder="TAG" maxlength="4" style="width:60px;padding:8px;border-radius:6px;background:var(--card);color:var(--text);border:none;text-transform:uppercase">
                </div>
                <button class="btn green" onclick="createGuildFromModal()" style="width:100%">Create</button>
            </div>
            
            <h4 style="font-size:0.9rem;margin-bottom:8px">🔍 Browse Guilds</h4>`;

        if (searchResults.length === 0) {
            html += `<div class="empty" style="padding:20px;text-align:center;color:var(--muted)">
                No guilds found. Be the first to create one!
            </div>`;
        } else {
            html += `<div style="display:flex;flex-direction:column;gap:8px">`;
            for (const g of searchResults) {
                html += `<div style="background:var(--card);padding:10px;border-radius:8px;display:flex;justify-content:space-between;align-items:center">
                    <div>
                        <span style="color:var(--gold)">[${g.tag}]</span> ${g.name}
                        <div style="font-size:0.75rem;color:var(--muted)">${g.members.length}/50 members</div>
                    </div>
                    <button class="btn green" onclick="joinGuild('${g.id}');closeGuildModal();">Join</button>
                </div>`;
            }
            html += `</div>`;
        }
    }

    html += `</div></div>`;

    const modal = document.createElement('div');
    modal.id = 'guild-modal';
    modal.className = 'modal show';
    modal.innerHTML = html;

    document.body.appendChild(modal);
}

/**
 * Close guild modal
 */
export function closeGuildModal() {
    const modal = document.getElementById('guild-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

/**
 * Create guild from modal inputs
 */
async function createGuildFromModal() {
    const name = document.getElementById('guild-name')?.value;
    const tag = document.getElementById('guild-tag')?.value;

    const result = await createGuild(name, tag);
    if (result) {
        closeGuildModal();
        setTimeout(showGuildModal, 300);
    }
}

// Global exports
window.createGuild = createGuild;
window.joinGuild = joinGuild;
window.leaveGuild = leaveGuild;
window.getGuildInfo = getGuildInfo;
window.searchGuilds = searchGuilds;
window.getGuildGovernmentBonus = getGuildGovernmentBonus;
window.showGuildModal = showGuildModal;
window.closeGuildModal = closeGuildModal;
window.createGuildFromModal = createGuildFromModal;
