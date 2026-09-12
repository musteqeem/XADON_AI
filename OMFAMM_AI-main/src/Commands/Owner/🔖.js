const { setGhostMode, isGhostMode } = require('../../Plugin/statusHandler');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: 'ghosted',
    alias: ['statusghost', 'cleanser', 'sg'],
    desc: 'Ghost mode: react then erase all status presence',
    category: 'Owner',
    ownerOnly: true,
    usage: '.ghosted on |.ghosted off |.ghosted status',
    examples: ['.ghosted on', '.ghosted off', '.ghosted status'],
    reactions: { start: '⚙️', success: '✓', error: '✘' },

    execute: async (sock, m, { args, reply, prefix }) => {
        const sub = args[0]?.toLowerCase() || 'status';

        if (sub === 'on') {
            setGhostMode(true);
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} GHOST MODE*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *STATUS*
│ ❏ Mode : ON
│
╭─֎ *INFO*
│ ❏ React to every status
│ ❏ Erase presence after 2 seconds
│ ❏ Your view will not show
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );
        }

        if (sub === 'off') {
            setGhostMode(false);
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} GHOST MODE*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *STATUS*
│ ❏ Mode : OFF
│
╭─֎ *INFO*
│ ❏ Normal auto-like restored
│ ❏ Your presence will show
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );
        }

        const active = isGhostMode();
        return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} GHOST MODE*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *CURRENT STATUS*
│ ❏ Mode : ${active? 'ON' : 'OFF'}
│
╭─֎ *COMMANDS*
│ ❏ ${prefix}ghosted on → React + Erase
│ ❏ ${prefix}ghosted off → Normal mode
│ ❏ ${prefix}ghosted status → Check status
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
        );
    }
};