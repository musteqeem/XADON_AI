const BOT_NAME = process.env.BOT_NAME || 'XADON AI'; // <- From .env

module.exports = {
    name: 'unlockgc',
    alias: ['unlockgroup', 'gcunlock', 'unfulllock'],
    desc: 'Unlock group settings - allow everyone to send messages again',
    category: 'Group',
    usage: '.unlockgc',
    groupOnly: true,
    adminOnly: true,
    reactions: { start: '🔓', success: '✅', error: '❌' },

    execute: async (sock, m, { reply, isGroupAdmin }) => {
        const chatId = m.chat;

        await sock.sendMessage(chatId, { react: { text: '🔓', key: m.key } });

        if (!isGroupAdmin && !m.key.fromMe) {
            await sock.sendMessage(chatId, { react: { text: '❌', key: m.key } });
            return reply('_*❌ Only group admins can unlock the group*_');
        }

        try {
            const groupMetadata = await sock.groupMetadata(chatId);
            const botParticipant = groupMetadata.participants.find(p => p.id === sock.user.id);

            // Enforce bot is admin
            if (!botParticipant || !botParticipant.admin) {
                await sock.sendMessage(chatId, { react: { text: '❌', key: m.key } });
                return reply('_*❌ I need admin permission to unlock the group*_');
            }

            // 1. Unlock the group - Everyone can send messages
            await sock.groupSettingUpdate(chatId, 'not_announcement');

            // 2. Re-apply subject & description
            await sock.groupUpdateSubject(chatId, groupMetadata.subject);
            await sock.groupUpdateDescription(chatId, groupMetadata.desc || '');

            await sock.sendMessage(chatId, { react: { text: '✅', key: m.key } });

            await reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} GROUP UNLOCKED*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *STATUS*
│ ❏ Group : ${groupMetadata.subject}
│ ❏ Mode : Everyone Can Send Messages
│ ❏ By : @${m.sender.split('@')[0]}
╰─────────────────────────╯

_*✅ Group unlocked successfully*_

Now everyone can:
• Send messages
• Edit subject/description if permitted
• Add/remove members if admin

Group is back to normal mode.`
            );

        } catch (error) {
            console.error('[UNLOCKGC ERROR]', error);
            await sock.sendMessage(chatId, { react: { text: '❌', key: m.key } });

            let errorMsg = 
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} ERROR*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *FAILED TO UNLOCK*
`;

            if (error?.message?.includes('not-authorized') || error?.message?.includes('Unauthorized')) {
                errorMsg += `│ ❏ Reason : Bot is not admin or lacks permission\n`;
            } else if (error?.message?.includes('rate-overlimit')) {
                errorMsg += `│ ❏ Reason : Too many requests. Try again later\n`;
            } else {
                errorMsg += `│ ❏ Reason : ${error.message}\n`;
            }

            errorMsg += `╰─────────────────────────╯`;

            await reply(errorMsg);
        }
    }
};