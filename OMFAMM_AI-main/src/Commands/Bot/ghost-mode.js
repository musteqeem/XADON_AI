const fs = require('fs');
const path = require('path');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const GHOST_FILE = path.join(__dirname, '../../../database/ghost-mode.json');

let ghostEnabled = false;
let ghostInterval = null; // prevent leak

function loadGhost() {
    try {
        if (fs.existsSync(GHOST_FILE)) {
            const data = JSON.parse(fs.readFileSync(GHOST_FILE, 'utf8'));
            ghostEnabled = data.global || false;
        }
    } catch (e) {
        console.error('[GHOST MODE] Load error:', e.message);
    }
}
loadGhost();

function saveGhost() {
    try {
        const dir = path.dirname(GHOST_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(GHOST_FILE, JSON.stringify({ global: ghostEnabled }, null, 2));
    } catch (e) {}
}

function startGhostLoop(sock) {
    if (ghostInterval) clearInterval(ghostInterval);
    ghostInterval = setInterval(async () => {
        if (!ghostEnabled) {
            clearInterval(ghostInterval);
            ghostInterval = null;
            return;
        }
        try {
            await sock.sendPresenceUpdate('unavailable');
        } catch {}
    }, 25000); // 25s is safer than 30s
}

module.exports = {
    name: 'ghost',
    alias: ['ghostmode', 'invisible', 'stealth', 'offline'],
    desc: 'Appear offline to everyone while staying fully active',
    category: 'Owner',
    usage: '.ghost on |.ghost off |.ghost status',
    owner: true,

    execute: async (sock, m, { args, reply }) => {
        const jid = m.key.remoteJid;
        const sub = args[0]?.toLowerCase();

        await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });

        if (!sub || sub === 'status') {
            const status = ghostEnabled? 'ON' : 'OFF';
            const icon = ghostEnabled? '❏◦' : '✘';
            return reply(
                `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} GHOST MODE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
❏ Status : ${icon} ${status}
❏ Effect : Appear offline to all users

╭─֎ *HOW TO USE*
│ ❏.ghost on : Go invisible
│ ❏.ghost off : Go online
│ ❏.ghost status : Check status
╰─────────────────────────╯`
            );
        }

        if (sub === 'on') {
            if (ghostEnabled) {
                await sock.sendMessage(jid, { react: { text: "✓", key: m.key } });
                return reply(`✓ ֎ Ghost Mode Already Active\n❏ Status : You appear offline`);
            }
            ghostEnabled = true;
            saveGhost();
            await sock.sendPresenceUpdate('unavailable');
            startGhostLoop(sock);
            await sock.sendMessage(jid, { react: { text: "✓", key: m.key } });
            return reply(
                `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} GHOST MODE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
✓ Status : ACTIVATED
❏ Visibility : Offline to everyone
❏ Activity : Bot still reads/replies
❏ To Disable :.ghost off
❏ Note : Stay hidden 😈`
            );
        }

        if (sub === 'off') {
            if (!ghostEnabled) {
                await sock.sendMessage(jid, { react: { text: "✓", key: m.key } });
                return reply(`✓ ֎ Ghost Mode Already Off\n❏ Status : Normal presence`);
            }
            ghostEnabled = false;
            saveGhost();
            if (ghostInterval) clearInterval(ghostInterval);
            ghostInterval = null;
            await sock.sendPresenceUpdate('available');
            await sock.sendMessage(jid, { react: { text: "✓", key: m.key } });
            return reply(
                `✓ ֎ Ghost Mode Deactivated\n❏ Status : Online presence restored\n❏ Visibility : Others can see you online`
            );
        }

        await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
        return reply(`✘ ֎ Invalid option\n❏ Usage :.ghost on |.ghost off |.ghost status`);
    }
};

// ── Add this to index.js inside sock.ev.on('messages.upsert') at the very top ──────
module.exports.forceGhostPresence = async (sock) => {
    if (ghostEnabled) {
        try { await sock.sendPresenceUpdate('unavailable'); } catch {}
    }
};