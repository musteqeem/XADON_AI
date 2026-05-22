const { delVar } = require('../../Plugin/configManager');

module.exports = {
    name: 'delvar',
    alias: ['dv'],
    desc: 'Delete a runtime config variable with XDN defense core',
    category: 'Owner',
    ownerOnly: true,
    reactions: { start: '🗑️', success: '֎' },

    execute: async (sock, m, { args, reply }) => {
        if (!args[0]) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • DELVAR USAGE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Usage :.delvar KEY
│ ❏ Example :.delvar BOT_NAME
╰─────────────────────────╯

> ֎`
            );
        }

        const key = args[0].toUpperCase();
        const deleted = delVar(key);

        if (deleted) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • VAR DELETED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Key : ${key}
│ ❏ Status : REMOVED
╰─────────────────────────╯

> ֎`
            );
        }

        return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • VAR NOT FOUND •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Key : ${key}
│ ❏ Status : NOT EXISTS
╰─────────────────────────╯

> ֎`
        );
    }
};