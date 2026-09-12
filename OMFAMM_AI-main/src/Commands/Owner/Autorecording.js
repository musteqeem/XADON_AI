const { getVar, setVar } = require('../../Plugin/configManager');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: 'autorecording',
    alias: ['autorec', 'recording'],
    desc: 'Toggle auto recording status. Shows "recording..." while bot processes',
    category: 'Owner',
    usage: '.autorecording on |.autorecording off',
    ownerOnly: true,

    execute: async (sock, m, { args, reply, prefix }) => {
        const action = args[0]?.toLowerCase();

        if (action === 'on') {
            setVar('AUTO_RECORDING', true);
            return reply(`✓ Auto Recording ENABLED\n֎ Bot will show "recording..." while processing`);
        }

        if (action === 'off') {
            setVar('AUTO_RECORDING', false);
            return reply(`✘ Auto Recording DISABLED`);
        }

        const current = getVar('AUTO_RECORDING', true);
        return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} AUTO RECORDING*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *STATUS*
│ ❏ State : ${current? 'ON' : 'OFF'}
│
╭─֎ *COMMANDS*
│ ❏ ${prefix}autorecording on
│ ❏ ${prefix}autorecording off
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
        );
    }
};