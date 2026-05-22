const { getVar, allVars } = require('../../Plugin/configManager');

module.exports = {
    name: 'getvar',
    alias: ['gv'],
    desc: 'Get a runtime config variable with XDN defense core',
    category: 'Owner',
    ownerOnly: true,
    reactions: { start: '🔍', success: '֎' },

    execute: async (sock, m, { args, reply }) => {
        if (!args[0]) {
            const all = allVars();
            const keys = Object.keys(all);

            if (!keys.length) {
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • RUNTIME VARS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : EMPTY
│ ❏ Count : 0
╰─────────────────────────╯

> ֎`
                );
            }

            const list = keys.map((k, i) => `│ ❏ ${i + 1}. ${k} = ${all}`).join('\n');

            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • RUNTIME VARS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Status : ACTIVE
│ ❏ Count : ${keys.length}
╰─────────────────────────╯
${list}

> ֎`
            );
        }

        const key = args[0].toUpperCase();
        const val = getVar(key);

        if (val!== null) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • VAR FOUND •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *DEFENSE CORE*
│ ❏ Key : ${key}
│ ❏ Value : ${val}
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
│ ❏ Status : NULL
╰─────────────────────────╯

> ֎`
        );
    }
};