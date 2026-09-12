const fs = require('fs');
const path = require('path');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const STATUS_FILE = path.join(__dirname, '../../../database/always-online.json');

let alwaysOnlineEnabled = false;
let presenceInterval = null;

try {
    if (fs.existsSync(STATUS_FILE)) {
        const data = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
        alwaysOnlineEnabled = data.enabled || false;
    }
} catch (e) {
    console.error('[Always Online] Load error:', e.message);
}

function saveStatus() {
    try {
        fs.mkdirSync(path.dirname(STATUS_FILE), { recursive: true });
        fs.writeFileSync(STATUS_FILE, JSON.stringify({ enabled: alwaysOnlineEnabled }, null, 2));
    } catch (e) {}
}

function startPresenceLoop(sock) {
    if (presenceInterval) clearInterval(presenceInterval);

    presenceInterval = setInterval(async () => {
        if (!alwaysOnlineEnabled) {
            clearInterval(presenceInterval);
            presenceInterval = null;
            return;
        }
        try {
            await sock.sendPresenceUpdate('available');
        } catch (e) {
            console.error('[Presence Refresh Error]', e.message);
        }
    }, 60000); // 60 seconds
}

function stopPresenceLoop() {
    if (presenceInterval) {
        clearInterval(presenceInterval);
        presenceInterval = null;
    }
}

// Auto start on bot load if enabled
setTimeout(() => {
    if (alwaysOnlineEnabled && global.sock) {
        startPresenceLoop(global.sock);
    }
}, 5000);

module.exports = {
    name: 'online',
    alias: ['alwaysonline', 'aonline'],
    desc: 'Force bot to appear always online',
    category: 'Owner',
    usage: '.online |.offline |.online status',
    owner: true,

    execute: async (sock, m, { args, reply }) => {
        const jid = m.key.remoteJid;
        const cmd = (m.message?.conversation || m.message?.extendedTextMessage?.text || '').toLowerCase().split(/\s+/)[0].slice(1);
        const sub = args[0]?.toLowerCase();

        await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } });

        // Handle.offline as alias command
        if (cmd === 'offline') {
            if (!alwaysOnlineEnabled) {
                await sock.sendMessage(jid, { react: { text: "✓", key: m.key } });
                return reply(`✓ ֎ Already Offline\n❏ Status : Normal presence mode`);
            }

            alwaysOnlineEnabled = false;
            saveStatus();
            stopPresenceLoop();
            await sock.sendPresenceUpdate('available');

            await sock.sendMessage(jid, { react: { text: "✓", key: m.key } });
            return reply(
                `✓ ֎ Always Online Disabled\n❏ Status : Normal presence restored\n❏ Note : Bot will show offline when idle`
            );
        }

        // Handle.online status check
        if (!sub || sub === 'status') {
            const status = alwaysOnlineEnabled? 'ON' : 'OFF';
            const icon = alwaysOnlineEnabled? '❏◦' : '✘';
            await sock.sendMessage(jid, { react: { text: "❏", key: m.key } });
            return reply(
                `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} ALWAYS ONLINE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
❏ Status : ${icon} ${status}
❏ Effect : Bot appears online 24/7

╭─֎ *HOW TO USE*
│ ❏.online : Enable always online
│ ❏.offline : Disable
│ ❏.online status : Check status
╰─────────────────────────╯`
            );
        }

        // Handle.online enable
        if (sub === 'on' ||!sub) {
            if (alwaysOnlineEnabled) {
                await sock.sendMessage(jid, { react: { text: "✓", key: m.key } });
                return reply(`✓ ֎ Already Enabled\n❏ Status : Bot appears online 24/7`);
            }

            alwaysOnlineEnabled = true;
            saveStatus();
            startPresenceLoop(sock);
            await sock.sendPresenceUpdate('available');

            await sock.sendMessage(jid, { react: { text: "✓", key: m.key } });
            return reply(
                `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} ALWAYS ONLINE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
✓ Status : ACTIVATED
❏ Visibility : Online 24/7
❏ Refresh : Every 60 seconds
❏ To Disable :.offline`
            );
        }

        await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
        return reply(`✘ ֎ Invalid option\n❏ Usage :.online |.offline |.online status`);
    }
};