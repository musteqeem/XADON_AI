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
    desc: 'Toggle automatic updates - XDN defense core',
    category: 'Owner',
    owner: true,
    usage: '.autoupdate on/off/status',
    reactions: { start: '⚙️', success: '֎' },

    execute: async (sock, m, { args, reply }) => {
        const sub = args[0]?.toLowerCase();

        if (sub === 'on') {
            setAutoUpdateSetting(true);
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • AUTOUPDATE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : ENABLED
│ ❏ Action : UPDATE ON RESTART
╰─────────────────────────╯

> ֎`
            );
        }

        if (sub === 'off') {
            setAutoUpdateSetting(false);
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • AUTOUPDATE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : DISABLED
│ ❏ Action : MANUAL UPDATE ONLY
╰─────────────────────────╯

> ֎`
            );
        }

        if (sub === 'status') {
            const enabled = getAutoUpdateSetting();
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • AUTOUPDATE STATUS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : ${enabled? 'ENABLED' : 'DISABLED'}
╰─────────────────────────╯

> ֎`
            );
        }

        return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • AUTOUPDATE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Usage :.autoupdate on
│ ❏ Usage :.autoupdate off
│ ❏ Usage :.autoupdate status
╰─────────────────────────╯

> ֎`
        );
    },

    // Export getter for use in startup
    getAutoUpdateSetting
};