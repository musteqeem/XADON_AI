const { getVar, setVar } = require('../../Plugin/configManager');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: 'statusview',
    alias: ['statuslike', 'autoview', 'autolike'],
    desc: 'Toggle auto status view / like',
    category: 'Owner',
    ownerOnly: true,
    usage: '.statusview on/off OR.statuslike on/off',
    examples: ['.statusview on', '.statuslike off'],
    reactions: { start: '⚙️', success: '✓', error: '✘' },

    execute: async (sock, m, { args, reply, prefix }) => {
        const cmd = (m.body || '').toLowerCase().split(/\s+/)[0].replace(/^[^a-z0-9]+/, '');
        const arg = args[0]?.toLowerCase();

        const settings = [
            { cmd: 'statusview', key: 'AUTO_STATUS_VIEW', label: 'Status View' },
            { cmd: 'autoview', key: 'AUTO_STATUS_VIEW', label: 'Status View' },
            { cmd: 'statuslike', key: 'AUTO_STATUS_LIKE', label: 'Status Like' },
            { cmd: 'autolike', key: 'AUTO_STATUS_LIKE', label: 'Status Like' }
        ];

        const setting = settings.find(s => s.cmd === cmd);
        if (!setting) return;

        if (!arg ||!['on', 'off'].includes(arg)) {
            const current = getVar(setting.key, false);
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} ${setting.label.toUpperCase()}*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *STATUS*
│ ❏ Current : ${current? 'ON' : 'OFF'}
│
╭─֎ *USAGE*
│ ❏ ${prefix}${cmd} on
│ ❏ ${prefix}${cmd} off
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );
        }

        const value = arg === 'on';
        setVar(setting.key, value);
        await sock.sendMessage(m.chat, { react: { text: '✓', key: m.key } });

        return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} ${setting.label.toUpperCase()}*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *UPDATED*
│ ❏ Status : ${value? 'ON' : 'OFF'}
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
        );
    }
};