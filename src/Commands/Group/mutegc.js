module.exports = {
    name: 'mutegc',
    alias: ['lockgroup', 'gclock', 'lock', 'fulllock'],
    desc: 'Lock gr֎up settings (only admins can edit group info, add/remove members, etc.)',
    category: 'Group',
    usage: '.mutegc',

    execute: async (sock, m, { reply, isGroupAdmin }) => {
        const chatId = m.key.remoteJid;

        if (!chatId.endsWith('@g.us')) {
            return reply('✘ GROUP ONLY');
        }

        if (!isGroupAdmin && !m.key.fromMe) {
            return reply('✘ Only group admins can lock the group');
        }

        try {
            const groupMetadata = await sock.groupMetadata(chatId);
            const botParticipant = groupMetadata.participants.find(p => p.id === sock.user.id);

            await sock.groupSettingUpdate(chatId, 'announcement');
            await sock.groupUpdateSubject(chatId, groupMetadata.subject);
            await sock.groupUpdateDescription(chatId, groupMetadata.desc || '');

            await reply(
                '*✓ Gr֎up locked successfully!*\n\n' +
                'Now only *admins* can:\n' +
                '• Send messages\n' +
                '• Edit group subject/description\n' +
                '• Add/remove members\n' +
                'Non-admins can only read'
            );

            await sock.sendMessage(chatId, {
                react: {
                    text: '😁',
                    key: m.key
                }
            });

        } catch (error) {
            console.error('[LOCKGC ERROR]', error);

            let errorMsg = '✘ Failed t֎ lock the group';

            if (error?.message?.includes('not-authorized') || error?.message?.includes('Unauthorized')) {
                errorMsg += '\n\nBot is not admin or lacks permission t֎ change group settings';
            } else if (error?.message?.includes('rate-overlimit')) {
                errorMsg += '\n\nToo many requests - try again in a few minutes';
            }

            await reply(errorMsg);
        }
    }
};