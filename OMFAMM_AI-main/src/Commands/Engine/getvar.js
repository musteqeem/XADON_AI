const { getVar, allVars } = require('../../Plugin/configManager');

module.exports = {
    name: 'getvar',
    alias: ['gv'],
    desc: 'Get a runtime config variable',
    category: 'Owner',
    ownerOnly: true,
    reactions: { start: '🔍', success: '✨', error: '❔' },

    execute: async (sock, m, { args, reply }) => {
        await sock.sendMessage(m.chat, { react: { text: '🔍', key: m.key } });

        // LIST ALL
        if (!args[0]) {
            const all = allVars();
            const keys = Object.keys(all);

            if (!keys.length) {
                await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    • CONFIG VARIABLES •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *EMPTY*
│ ❏ No variables set
╰─────────────────────────╯`
                );
            }

            const rows = keys.map(k => [k, String(all[k])]);

            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });
            return sock.sendMessage(m.chat, {
                headerText: `## ◈ XADON AI Config`,
                contentText: '---',
                title: '◈ Runtime Variables',
                table: [['Key', 'Value'],...rows],
                footerText: '💡 Use.getvar <KEY> to get specific value'
            }, { quoted: m });
        }

        // GET SPECIFIC
        const key = args[0].toUpperCase();
        const val = getVar(key);

        if (val!== null) {
            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    • CONFIG VARIABLE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *FOUND*
│ ❏ Key : ${key}
│ ❏ Value : ${val}
╰─────────────────────────╯`
            );
        } else {
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
     • CONFIG VARIABLE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *NOT FOUND*
│ ❏ Key : ${key}
│ ❏ Status : VARIABLE DOES NOT EXIST
╰─────────────────────────╯`
            );
        }
    }
};