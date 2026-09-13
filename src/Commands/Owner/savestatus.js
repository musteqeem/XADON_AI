const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: 'savestatus',
    alias: ['savestatus', 'ss', 'savestat'],
    desc: 'Download and save a WhatsApp status',
    category: 'Tools',
    usage: '.savestatus (reply to forwarded status)',
    reactions: { start: '📥', success: '👀', error: '✘' },

    execute: async (sock, m, { reply }) => {
        if (!m.quoted) {
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} SAVESTATUS*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *HOW TO USE*
│ ❏ 1. Forward the status to your chat with the bot
│ ❏ 2. Reply to it with ${prefix}savestatus
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
            );
        }

        const q = m.quoted;
        const type = q.mtype;
        const allowed = ['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage'];

        if (!allowed.includes(type)) {
            return reply(`✘ That message has no downloadable media`);
        }

        try {
            await sock.sendMessage(m.chat, { react: { text: '⏳', key: m.key } }).catch(() => {});

            const buffer = await q.download();
            if (!buffer || !buffer.length) {
                return reply(`✘ Could not download media. Try again`);
            }

            const caption = q.caption || q.text || `Saved status via ${BOT_NAME}`;

            // IMAGE
            if (type === 'imageMessage') {
                await sock.sendMessage(m.chat, { image: buffer, caption: caption || 'Saved status' }, { quoted: m });
            }
            // VIDEO
            else if (type === 'videoMessage') {
                await sock.sendMessage(m.chat, { video: buffer, caption: caption || 'Saved status', mimetype: 'video/mp4' }, { quoted: m });
            }
            // AUDIO
            else if (type === 'audioMessage') {
                await sock.sendMessage(m.chat, { audio: buffer, mimetype: 'audio/mpeg', ptt: q.ptt || false }, { quoted: m });
            }
            // STICKER
            else if (type === 'stickerMessage') {
                await sock.sendMessage(m.chat, { sticker: buffer }, { quoted: m });
            }
            // DOCUMENT
            else if (type === 'documentMessage') {
                await sock.sendMessage(m.chat, { 
                    document: buffer, 
                    mimetype: q.mimetype || 'application/octet-stream', 
                    fileName: q.fileName || 'status_file' 
                }, { quoted: m });
            }

            await sock.sendMessage(m.chat, { react: { text: '✓', key: m.key } }).catch(() => {});
            return reply(`✓ Status saved successfully`);

        } catch (e) {
            console.error(`[${BOT_NAME} SAVESTATUS ERROR]`, e.message);
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } }).catch(() => {});
            return reply(`✘ Failed to save: ${e.message}`);
        }
    }
};