const { downloadContentFromMessage } = require('@musteqeem/baileys');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: 'setpp',
    alias: ['setbotpp', 'setppbot', 'setprofilepic'],
    category: 'Owner',
    desc: 'Change bot profile picture',
    usage: '.setpp (reply to image)',
    ownerOnly: true,
    reactions: { start: '📸', success: '✓', error: '✘' },

    execute: async (sock, m, { reply }) => {
        try {
            // ── Detect Image ─────────────────────────
            const quoted = m.quoted ? m.quoted : m;
            const mime = (quoted.msg || quoted).mimetype || '';

            if (!/image/.test(mime)) {
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} SETPP*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏ Reply to an image with ${prefix}setpp
│ ❏ To set as bot profile picture
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
                );
            }

            await sock.sendMessage(m.chat, { react: { text: '📸', key: m.key } });

            // ── Download Image ───────────────────────
            const stream = await downloadContentFromMessage(quoted.msg || quoted, 'image');

            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // ── Update Profile Picture ───────────────
            await sock.updateProfilePicture(sock.user.id, buffer);

            await sock.sendMessage(m.chat, { react: { text: '✓', key: m.key } });

            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} SETPP*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *SUCCESS*
│ ❏ Status : Profile picture updated
│ ❏ Bot : ${BOT_NAME}
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );

        } catch (err) {
            console.error(`[${BOT_NAME} SETPP ERROR]`, err.message);
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(`✘ Failed to update bot profile picture: ${err.message}`);
        }
    }
};