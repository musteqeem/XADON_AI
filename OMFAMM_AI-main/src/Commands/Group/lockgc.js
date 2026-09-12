/**
 * Command: .lockgc
 * Description: Locks group settings — only admins can edit group info, add/remove members, change subject/desc, etc.
 * Usage: .lockgc
 * Requires: BOT_NAME in .env
 */

module.exports = {
    name: 'lockgc',
    alias: ['lockgroup', 'gclock', 'lock', 'fulllock'],
    desc: 'Lock group settings (only admins can edit group info, add/remove members, etc.)',
    category: 'Group',
    usage: '.lockgc',
    groupOnly: true,
    adminOnly: true,
    reactions: { start: '🔒', success: '✅', error: '❌' },

    execute: async (sock, m, { reply, isGroupAdmin }) => {
        const chatId = m.key.remoteJid;
        const BOT_NAME = process.env.BOT_NAME || 'XADON AI'; // <-- From .env

        await sock.sendMessage(chatId, { react: { text: '🔒', key: m.key } });

        // Must be a group
        if (!chatId.endsWith('@g.us')) {
            return reply('_*❌ GROUP ONLY*_');
        }

        if (!isGroupAdmin && !m.key.fromMe) {
            return reply('_*❌ ADMIN ONLY*_');
        }

        try {
            const groupMetadata = await sock.groupMetadata(chatId);
            const botParticipant = groupMetadata.participants.find(p => p.id === sock.user.id);

            if (!botParticipant || !botParticipant.admin) {
                return reply(`_*❌ Make ${BOT_NAME} an admin first!*_`);
            }

            // Lock group info edits — only admins can change subject/description
            await sock.groupSettingUpdate(chatId, 'locked');

            await sock.sendMessage(chatId, { react: { text: '✅', key: m.key } });

            reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} DEFENSE*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *GROUP LOCKED*
│ ❏ Status  : LOCKED
│ ❏ Access  : Admins Only
│ ❏ Controls: Edit Info / Add / Remove
│ ❏ Command : .unlockgc to unlock
╰─────────────────────────╯

_*✅ Only admins can now manage group settings*_`
            );

        } catch (error) {
            console.error('[LOCKGC ERROR]', error);
            await sock.sendMessage(chatId, { react: { text: '❌', key: m.key } });

            let errorMsg = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} ERROR*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *FAILED TO LOCK*
│ ❏ Reason : ${error.message || 'Unknown Error'}`;

            if (error?.message?.includes('not-authorized') || error?.message?.includes('Unauthorized')) {
                errorMsg += `\n│ ❏ Note    : Bot is not admin or lacks permission`;
            } else if (error?.message?.includes('rate-overlimit')) {
                errorMsg += `\n│ ❏ Note    : Too many requests - try again later`;
            }

            errorMsg += `\n╰─────────────────────────╯\n\n_*❌ Failed to lock the group*_`;

            await reply(errorMsg);
        }
    }
};