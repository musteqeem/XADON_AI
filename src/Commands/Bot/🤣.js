// src/Commands/Owner/aibadge.js
const { setVar, getVar } = require('../../Plugin/configManager');

module.exports = {
    name: 'aibadge',
    alias: ['badge', 'metabadge'],
    desc: 'Toggle Meta AI sparkle badge on all outgoing messages',
    category: 'Owner',
    ownerOnly: true,
    usage: '.aibadge on/off',
    reactions: {
        start: '✨',
        success: '֎'
    },

    execute: async (sock, m, { args, reply }) => {
        const option = args[0]?.toLowerCase();

        if (option === 'on') {
            setVar('AI_BADGE', true);
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • AI BADGE ACTIVATED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : ENABLED
│ ❏ Mode : Meta Badge ON
│ ❏ Scope : All Outgoing Messages
╰─────────────────────────╯`
            );
        }

        if (option === 'off') {
            setVar('AI_BADGE', false);
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • AI BADGE DISABLED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : DISABLED
│ ❏ Mode : Meta Badge OFF
│ ❏ Scope : None
╰─────────────────────────╯`
            );
        }

        const current = getVar('AI_BADGE', true)!== false;
        return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • AI BADGE STATUS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : ${current? 'ACTIVE' : 'INACTIVE'}
│ ❏ Mode : ${current? 'Meta Badge ON' : 'Meta Badge OFF'}
│ ❏ Toggle :.aibadge on/off
╰─────────────────────────╯`
        );
    }
};