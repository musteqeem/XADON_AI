const fs = require('fs');
const path = require('path');

// Storage file
const STATUS_FILE = path.join(__dirname, '../../../database/always-online.json');

let alwaysOnlineEnabled = false;

try {
    if (fs.existsSync(STATUS_FILE)) {
        const data = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
        alwaysOnlineEnabled = data.enabled || false;
    }
} catch (e) {
    console.error('[XDN Always Online] Load error:', e.message);
}

function saveStatus() {
    try {
        fs.mkdirSync(path.dirname(STATUS_FILE), { recursive: true });
        fs.writeFileSync(STATUS_FILE, JSON.stringify({ enabled: alwaysOnlineEnabled }, null, 2));
    } catch (e) {
        console.error('[XDN Always Online] Save error:', e.message);
    }
}

// Periodic presence update
let presenceInterval = null;

function startPresenceLoop(sock) {
    if (presenceInterval) clearInterval(presenceInterval);

    presenceInterval = setInterval(async () => {
        try {
            await sock.sendPresenceUpdate('available');
            console.log('[XDN Always Online] Presence refreshed');
        } catch (e) {
            console.error('[XDN Presence Refresh Error]', e.message);
        }
    }, 60000);
}

function stopPresenceLoop() {
    if (presenceInterval) {
        clearInterval(presenceInterval);
        presenceInterval = null;
    }
}

// Start on bot load if enabled
if (alwaysOnlineEnabled) {
    setTimeout(() => {
        if (global.sock) {
            startPresenceLoop(global.sock);
        }
    }, 5000);
}

module.exports = {
    name: 'online',
    alias: ['alwaysonline', 'aonline', 'offline'],
    desc: 'Force bot to appear always online or turn it off',
    category: 'owner',
    usage: '.online |.offline |.online status',
    owner: true,
    reactions: {
        start: '♻️',
        success: '֎'
    },

    execute: async (sock, m, { args, reply }) => {
        const cmd = m.body.toLowerCase().split(/\s+/)[0].slice(1);

        if (cmd === 'online') {
            if (alwaysOnlineEnabled) {
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • ALWAYS ONLINE STATUS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : ACTIVE
│ ❏ Mode : 24/7 Online
│ ❏ Shield : ENABLED
╰─────────────────────────╯
Bot is already in always online mode.`
                );
            }

            alwaysOnlineEnabled = true;
            saveStatus();
            startPresenceLoop(sock);

            await reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • ALWAYS ONLINE ACTIVATED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : ONLINE
│ ❏ Mode : 24/7 Presence
│ ❏ Shield : ENABLED
│ ❏ Detection : VISIBLE
╰─────────────────────────╯
Bot will now appear online 24/7.

Type.offline to disable.`
            );

            await sock.sendMessage(m.chat, {
                react: { text: '֎', key: m.key }
            });

        } else if (cmd === 'offline') {
            if (!alwaysOnlineEnabled) {
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • ALWAYS ONLINE STATUS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : INACTIVE
│ ❏ Mode : Normal Presence
│ ❏ Shield : DISABLED
╰─────────────────────────╯
Always online mode is already off.`
                );
            }

            alwaysOnlineEnabled = false;
            saveStatus();
            stopPresenceLoop();

            await sock.sendPresenceUpdate('available');

            await reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • ALWAYS ONLINE DEACTIVATED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : OFFLINE
│ ❏ Mode : Normal Presence
│ ❏ Shield : DISABLED
╰─────────────────────────╯
Bot now shows normal presence.

Type.online to enable.`
            );

            await sock.sendMessage(m.chat, {
                react: { text: '֎', key: m.key }
            });

        } else {
            // Check status
            const status = alwaysOnlineEnabled? 'ACTIVE' : 'INACTIVE';
            const mode = alwaysOnlineEnabled? '24/7 Online' : 'Normal Presence';
            const shield = alwaysOnlineEnabled? 'ENABLED' : 'DISABLED';

            await reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • ALWAYS ONLINE STATUS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : ${status}
│ ❏ Mode : ${mode}
│ ❏ Shield : ${shield}
╰─────────────────────────╯
Usage:
֎.online → Enable 24/7 online
֎.offline → Disable always online`
            );
        }
    }
};