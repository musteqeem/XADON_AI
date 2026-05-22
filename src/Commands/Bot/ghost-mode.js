const fs = require('fs');
const path = require('path');

// Storage
const GHOST_FILE = path.join(__dirname, '../../../database/ghost-mode.json');

let ghostEnabled = false;
let ghostChats = new Set();
let presenceInterval = null;

try {
    if (fs.existsSync(GHOST_FILE)) {
        const data = JSON.parse(fs.readFileSync(GHOST_FILE, 'utf8'));
        ghostEnabled = data.global || false;
        if (data.chats) ghostChats = new Set(data.chats);
    }
} catch (e) {
    console.error('[XDN GHOST] Load error:', e.message);
}

function saveGhost() {
    try {
        fs.mkdirSync(path.dirname(GHOST_FILE), { recursive: true });
        fs.writeFileSync(GHOST_FILE, JSON.stringify({
            global: ghostEnabled,
            chats: Array.from(ghostChats)
        }, null, 2));
    } catch (e) {
        console.error('[XDN GHOST] Save error:', e.message);
    }
}

function startGhostLoop(sock) {
    if (presenceInterval) clearInterval(presenceInterval);

    presenceInterval = setInterval(async () => {
        if (!ghostEnabled) {
            clearInterval(presenceInterval);
            presenceInterval = null;
            return;
        }
        try {
            await sock.sendPresenceUpdate('unavailable');
        } catch (e) {
            console.error('[XDN GHOST] Presence error:', e.message);
        }
    }, 30000);
}

function stopGhostLoop() {
    if (presenceInterval) {
        clearInterval(presenceInterval);
        presenceInterval = null;
    }
}

// Auto-start if enabled
if (ghostEnabled) {
    setTimeout(() => {
        if (global.sock) startGhostLoop(global.sock);
    }, 5000);
}

module.exports = {
    name: 'ghost',
    alias: ['ghostmode', 'invisible', 'stealth'],
    desc: 'Appear offline to everyone while staying fully active',
    category: 'owner',
    usage: '.ghost on |.ghost off |.ghost status',
    owner: true,
    reactions: {
        start: '👻',
        success: '֎'
    },

    execute: async (sock, m, { args, reply }) => {
        const sub = args[0]?.toLowerCase();

        if (!sub || sub === 'status') {
            const status = ghostEnabled? 'ACTIVE' : 'INACTIVE';
            const mode = ghostEnabled? 'OFFLINE TO OTHERS' : 'NORMAL PRESENCE';

            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • GHOST MODE STATUS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *STEALTH SYSTEM*
│ ❏ Status : ${status}
│ ❏ Mode : ${mode}
│ ❏ Detection : HIDDEN
╰─────────────────────────╯

Usage:
֎.ghost on → Enable stealth mode
֎.ghost off → Disable stealth mode`
            );
        }

        if (sub === 'on') {
            if (ghostEnabled) return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • GHOST MODE STATUS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
Stealth system already ACTIVE.
You appear offline to all users.`
            );

            ghostEnabled = true;
            saveGhost();

            await sock.sendPresenceUpdate('unavailable');
            startGhostLoop(sock);

            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • GHOST MODE ACTIVATED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *STEALTH SYSTEM*
│ ❏ Status : ONLINE
│ ❏ Visibility : HIDDEN
│ ❏ Detection : OFFLINE
│ ❏ Protocol : UNDETECTABLE
╰─────────────────────────╯
You now appear OFFLINE to everyone.
Bot remains fully active and responsive.

Type.ghost off to disable.`
            );
        }

        if (sub === 'off') {
            if (!ghostEnabled) return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • GHOST MODE STATUS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
Stealth system already INACTIVE.
Normal presence restored.`
            );

            ghostEnabled = false;
            saveGhost();
            stopGhostLoop();

            await sock.sendPresenceUpdate('available');

            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • GHOST MODE DEACTIVATED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *STEALTH SYSTEM*
│ ❏ Status : OFFLINE
│ ❏ Visibility : VISIBLE
│ ❏ Detection : NORMAL
│ ❏ Protocol : STANDARD
╰─────────────────────────╯
Normal online status restored.
Users can now see your activity.`
            );
        }

        reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • GHOST MODE ERROR •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
Invalid argument.

Usage:
֎.ghost on
֎.ghost off
֎.ghost status`
        );
    }
};

// Force ghost presence in messages.upsert
module.exports.forceGhostPresence = async (sock) => {
    if (ghostEnabled) {
        try {
            await sock.sendPresenceUpdate('unavailable');
        } catch (e) {
            console.error('[XDN GHOST] Force presence error:', e.message);
        }
    }
};