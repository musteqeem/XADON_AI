const { getVar, setVar } = require('../../Plugin/configManager');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: 'autoread',
    alias: ['setread'],
    desc: 'Toggle auto read messages',
    category: 'Owner',
    sudoOnly: true,
    usage: '.autoread on |.autoread off',

    reactions: { start: '👁', success: '💬' },

    execute: async (sock, m, { args, reply, prefix }) => {
        const current = getVar('AUTO_READ', true);

        if (!args[0]) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} AUTO READ*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *STATUS*
│ ❏ State : ${current!== false? 'ON' : 'OFF'}
│
╭─֎ *COMMANDS*
│ ❏ ${prefix}autoread on
│ ❏ ${prefix}autoread off
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );
        }

        if (args[0].toLowerCase() === 'on') {
            setVar('AUTO_READ', true);
            return reply(`✓ Auto Read: *ON*\n֎ Bot will mark all messages as read`);
        }

        if (args[0].toLowerCase() === 'off') {
            setVar('AUTO_READ', false);
            return reply(`✘ Auto Read: *OFF*`);
        }

        return reply(`✘ Usage: ${prefix}autoread on | ${prefix}autoread off`);
    }
};