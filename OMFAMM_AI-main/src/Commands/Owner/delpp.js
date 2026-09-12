/**
 * Command: .delpp
 * Description: Removes your own WhatsApp profile picture
 * Usage: .delpp
 */
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: 'delpp',
    alias: ['removepp', 'deletepp', 'rmpp'],
    desc: 'Remove your WhatsApp profile picture',
    category: 'Utility',
    usage: '.delpp',

    execute: async (sock, m, { reply }) => {
        const chatId = m.key.remoteJid;

        try {
            await sock.removeProfilePicture(sock.user.id);
            
            await sock.sendMessage(chatId, {
                react: { text: '🗑', key: m.key }
            });

            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} PROFILE PICTURE*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *SUCCESS*
│ ❏ Status : Profile picture removed
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );

        } catch (error) {
            console.error(`[${BOT_NAME} DELPP ERROR]`, error.message);

            let errorMsg = `✘ Failed to remove profile picture.`;

            if (error?.message?.includes('not authorized')) {
                errorMsg += `\n֎ You may need to be the bot owner or check permissions.`;
            } else if (error?.message?.includes('no profile picture')) {
                errorMsg += `\n֎ You don't have a profile picture set right now.`;
            }

            return reply(errorMsg);
        }
    }
};