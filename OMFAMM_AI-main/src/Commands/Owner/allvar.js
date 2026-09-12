const { allVars, VARS } = require('../../Plugin/configManager');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: 'allvar',
    alias: ['listvars', 'vars'],
    desc: 'List all runtime variables',
    category: 'Owner',
    ownerOnly: true,
    usage: '.allvar',
    
    reactions: {
        start: '⚙',
        success: '✅'
    },
    
    execute: async (sock, m, { reply, prefix }) => {
        const runtime = allVars();
        
        if (!Object.keys(runtime).length) {
            const list = Object.keys(VARS).map(v => `│ ❏ ${v}`).join('\n');
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} CONFIG*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *NO RUNTIME VARIABLES*
│ ❏ Status : No variables set yet
│ ❏ Available :
${list}
│ ❏ Usage : ${prefix}setvar VARIABLE=VALUE
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );
        }

        const entries = Object.entries(runtime).map(([k, v]) => {
            const varName = Object.entries(VARS).find(([, key]) => key === k)?.[0] || k;
            return `│ ❏ ${varName} = ${v}`;
        }).join('\n');

        await reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} CONFIG*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *RUNTIME VARIABLES* [${Object.keys(runtime).length}]
${entries}
│ ❏ Reset : ${prefix}delvar VARIABLE
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
        );
    }
};