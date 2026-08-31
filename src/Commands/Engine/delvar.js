const { delVar } = require('../../Plugin/configManager');

module.exports = {
    name: 'delvar',
    alias: ['dv'],
    desc: 'Delete a runtime config variable',
    category: 'Owner',
    ownerOnly: true,
    reactions: { start: '🗑️', success: '✨', error: '❔' },

    execute: async (sock, m, { args, reply }) => {
        await sock.sendMessage(m.chat, { react: { text: '🗑️', key: m.key } });

        if (!args[0]) {
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   • DELETE VARIABLE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏.delvar <KEY>
│ ❏.dv <KEY>
╰─────────────────────────╯`
            );
        }

        const key = args[0].toUpperCase();
        const deleted = delVar(key);

        if (deleted) {
            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    • DELETE VARIABLE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *SUCCESS*
│ ❏ Key : ${key}
│ ❏ Status : DELETED
╰─────────────────────────╯`
            );
        } else {
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
   • DELETE VARIABLE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *NOT FOUND*
│ ❏ Key : ${key}
│ ❏ Status : VARIABLE DOES NOT EXIST
╰─────────────────────────╯`
            );
        }
    }
};