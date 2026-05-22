const { getByCategory, getAll } = require('../message.js');

module.exports = {
    name: 'cmds',
    alias: ['commands', 'allcmds', 'listcmds'],
    desc: 'List all installed commands with info',
    category: 'general',
    reactions: {
        start: '💬',
        success: '֎'
    },

    execute: async (sock, m, { prefix, reply }) => {
        try {
            const categories = getByCategory();
            const allCommands = getAll();

            if (!allCommands.size) return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • COMMAND DATABASE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
No commands found in system.`
            );

            let text = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • COMMAND DATABASE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *Total Commands: ${allCommands.size}*
│ ❏ Prefix : ${prefix}
│ ❏ Status : ONLINE
╰─────────────────────────╯

`;

            for (const [cat, cmds] of Object.entries(categories)) {
                text += `╭─֎ *${cat.toUpperCase()}* ─╮\n`;
                const seen = new Set();
                cmds.forEach(c => {
                    if (c?.name && !seen.has(c.name.toLowerCase())) {
                        seen.add(c.name.toLowerCase());
                        text += `│ ֎ ${prefix}${c.name}\n`;
                        text += `│   ❏ Desc : ${c.desc || 'No description'}\n`;
                        if (c.alias?.length) {
                            text += `│   ❏ Alias: ${c.alias.join(', ')}\n`;
                        }
                        text += `│   ❏ Usage: ${prefix}${c.name}\n`;
                    }
                });
                text += `╰─────────────────────────╯\n\n`;
            }

            text += `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
֎ Type ${prefix}help <command> for details
֎ XDN AI Defense System v2026`;

            await sock.sendMessage(m.chat, { text }, { quoted: m });
        } catch (err) {
            console.error('[XDN CMDS ERROR]', err);
            reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   ֎ • SYSTEM ERROR •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
Failed to load commands.
Check console for details.`
            );
        }
    }
};