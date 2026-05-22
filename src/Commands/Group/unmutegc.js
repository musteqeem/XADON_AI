/**
 * Command: .unlockgc
 * Description: Unlocks the gr֎up - everyone can send messages, edit subject/desc (if permitted), etc.
 * Usage: .unlockgc
 * Requirements:
 *   - Must be used in a gr֎up
 *   - Bot must be an admin with permission to change group settings
 *   - Optional: restrict to group admins or bot owner
 */

module.exports = {
    name: 'unmutegc',
    alias: ['unlockgroup', 'gcunlock', 'unfulllock'],
    desc: 'Unlock gr֎up settings (allow everyone to send messages again)',
    category: 'group',
    usage: '.unlockgc',

    execute: async (sock, m, { reply, isGroupAdmin }) => {
        const chatId = m.key.remoteJid;

        if (!chatId.endsWith('@g.us')) {
            return reply('✘ GROUP ONLY');
        }

        if (!isGroupAdmin && !m.key.fromMe) {
            return reply('✘ Only group admins can unlock the group');
        }

        try {
            const groupMetadata = await sock.groupMetadata(chatId);
            const botParticipant = groupMetadata.participants.find(p => p.id === sock.user.id);

            await sock.groupSettingUpdate(chatId, 'not_announcement');

            await sock.groupUpdateSubject(chatId, groupMetadata.subject);
            await sock.groupUpdateDescription(chatId, groupMetadata.desc || '');

            await reply(
                '*✓ Gr֎up unlocked successfully!*\n\n' +
                'Now *everyone* can:\n' +
                '• Send messages\n' +
                '• Edit subject/description (if they have permission)\n' +
                '• Add/remove members (if they are admin)\n\n' +
                'Group is back to normal mode'
            );

            await sock.sendMessage(chatId, {
                react: {
                    text: '✪',
                    key: m.key
                }
            });

        } catch (error) {
            console.error('[UNLOCKGC ERROR]', error);

            let errorMsg = '✘ Failed t֎ unlock the group';

            if (error?.message?.includes('not-authorized') || error?.message?.includes('Unauthorized')) {
                errorMsg += '\n\nBot is not admin or lacks permission t֎ change group settings';
            } else if (error?.message?.includes('rate-overlimit')) {
                errorMsg += '\n\nToo many requests - try again in a few minutes';
            }

            await reply(errorMsg);
        }
    }
};