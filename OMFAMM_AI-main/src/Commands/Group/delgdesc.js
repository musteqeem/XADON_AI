const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: "delgdesc",
    alias: ['deletedescription', 'cleardesc', 'clear_desc', 'deldesc'],
    desc: 'Delete group description',
    category: "Group",
    usage: ".delgdesc",
    examples: [".delgdesc - clear group description"],
    groupOnly: true,
    adminOnly: true,
    reactions: { start: '🗑️', success: '✅', error: '✘' },

    execute: async (sock, m, { reply, prefix, isGroup, isAdmin, isBotAdmin }) => {
        await sock.sendMessage(m.chat, { react: { text: '🗑️', key: m.key } });

        if (!isGroup) {
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(`✘ _This command only works in groups_`);
        }

        if (!isAdmin) {
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(`✘ _Only group admins can clear description_`);
        }

        if (!isBotAdmin) {
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(`✘ _Bot must be admin to edit group description_`);
        }

        try {
            await sock.groupUpdateDescription(m.chat, '');
            await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} CLEAR DESCRIPTION*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *SUCCESS*
│ ❏ Group description has been deleted
╰─────────────────────────╯`
            );
        } catch (err) {
            console.error(`[${BOT_NAME} DELGDESC ERROR]`, err);
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} CLEAR DESCRIPTION*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *ERROR*
│ ❏ ${err.message}
╰─────────────────────────╯`
            );
        }
    }
};