const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: "delgpp",
    alias: ['removegpp', 'deletegpp', 'rmgpp', 'cleargpp'],
    desc: 'Remove the current group profile picture',
    category: "Group",
    usage: ".delgpp",
    examples: [".delgpp - remove group icon"],
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
            return reply(`✘ _Only group admins can remove group icon_`);
        }

        if (!isBotAdmin) {
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(`✘ _Bot must be admin to change group info_`);
        }

        try {
            await sock.removeProfilePicture(m.chat);
            await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} REMOVE ICON*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *SUCCESS*
│ ❏ Group profile picture removed
╰─────────────────────────╯`
            );

        } catch (err) {
            console.error(`[${BOT_NAME} DELGPP ERROR]`, err);
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });

            let errorMsg = `✘ _Failed to remove group profile picture_`;
            
            if (err?.message?.includes('not-authorized') || err?.message?.includes('Unauthorized')) {
                errorMsg = `✘ _Bot is not admin or lacks permission_`;
            } else if (err?.message?.includes('no profile picture') || err?.message?.includes('not found')) {
                errorMsg = `✘ _This group doesn't have a profile picture set_`;
            } else if (err?.message?.includes('no-id')) {
                errorMsg = `✘ _Baileys version issue. Update @whiskeysockets/baileys_`;
            }

            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} REMOVE ICON*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *ERROR*
│ ❏ ${errorMsg}
╰─────────────────────────╯`
            );
        }
    }
};