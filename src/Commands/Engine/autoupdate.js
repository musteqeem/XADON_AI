const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(process.cwd(), 'database', 'autoupdate.json');

// Load setting
function getAutoUpdateSetting() {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')).enabled === true;
        }
    } catch {}
    return false; // default off
}

// Save setting
function setAutoUpdateSetting(enabled) {
    const dir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({ enabled:!!enabled }, null, 2));
}

module.exports = {
    name: 'autoupdate',
    alias: ['autoupd', 'autoupgrade'],
    desc: 'Toggle automatic updates on every bot restart',
    category: 'Owner',
    owner: true,
    usage: '.autoupdate on/off/status',
    reactions: { start: '⌘', success: '✨', error: '❔' },

    execute: async (sock, m, { args, reply }) => {
        const sub = args[0]?.toLowerCase();

        if (sub === 'on') {
            setAutoUpdateSetting(true);
            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
      • AUTO UPDATE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *SUCCESS*
│ ❏ Status : ACTIVE
│ ❏ Note : XADON AI will update on every restart
╰─────────────────────────╯`
            );
        }

        if (sub === 'off') {
            setAutoUpdateSetting(false);
            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
     • AUTO UPDATE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *SUCCESS*
│ ❏ Status : INACTIVE
│ ❏ Note : Auto update has been disabled
╰─────────────────────────╯`
            );
        }

        if (sub === 'status') {
            const enabled = getAutoUpdateSetting();
            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
     • AUTO UPDATE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : ${enabled? 'ACTIVE' : 'INACTIVE'}
│ ❏ Toggle : autoupdate on/off
│ ❏ Check : autoupdate status
╰─────────────────────────╯`
            );
        }

        await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
        return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
     • AUTO UPDATE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏ autoupdate on : Enable auto updates
│ ❏ autoupdate off : Disable auto updates
│ ❏ autoupdate status : Check current status
╰─────────────────────────╯`
        );
    },

    // Export getter for use in startup
    getAutoUpdateSetting
};