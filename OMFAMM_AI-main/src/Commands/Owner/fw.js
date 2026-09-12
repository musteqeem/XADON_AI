const config = require('../../../settings/config');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: 'forward',
    alias: ['fwd', 'sendto'],
    desc: 'Forward replied message to another chat. Supports JID or invite link',
    category: 'Tools',
    usage: '.forward <jid> |.forward <invite_link> (reply to a message)',
    reactions: { start: '📨', success: '💬', error: '✘' },

    execute: async (sock, m, { reply, sender, args }) => {
        await sock.sendMessage(m.chat, { react: { text: '📨', key: m.key } });

        if (!m.quoted) {
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(`✘ Please reply to a message to forward`);
        }

        if (!args[0]) {
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(`✘ Please provide target JID or invite link`);
        }

        let targetJid = args[0];

        try {
            if (targetJid.includes('chat.whatsapp.com')) {
                const inviteCode = targetJid.split('chat.whatsapp.com/')[1].split('?')[0];
                const groupInfo = await sock.groupGetInviteInfo(inviteCode);
                targetJid = groupInfo.id;
            }
            else if (targetJid.includes('wa.me/')) {
                let phone = targetJid.split('wa.me/')[1].split('?')[0];
                targetJid = `${phone}@s.whatsapp.net`;
            }
            else if (!targetJid.includes('@')) {
                targetJid = `${targetJid}@s.whatsapp.net`;
            }

        } catch (e) {
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(`✘ Invalid link or invite expired`);
        }

        const q = m.quoted;

        const text =
            q.text ||
            q.caption ||
            q.body ||
            q.conversation ||
            '';

        let media = null;
        try {
            media = await sock.downloadMediaMessage(q);
        } catch {
            media = null;
        }

        const contextInfo = {
            forwardingScore: 1,
            isForwarded: true
        };

        try {
            // TEXT FORWARD
            if (text &&!media) {
                await sock.sendMessage(targetJid, { text, contextInfo });
                await sock.sendMessage(m.chat, { react: { text: '✓', key: m.key } });
                return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} FORWARD*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *SUCCESS*
│ ❏ Type : Text
│ ❏ To : ${targetJid}
╰─────────────────────────╯
_Powered by ${BOT_NAME}_`
                );
            }

            // IMAGE
            if (q.mtype === 'imageMessage') {
                await sock.sendMessage(targetJid, { image: media, caption: q.caption || '', contextInfo });
                await sock.sendMessage(m.chat, { react: { text: '✓', key: m.key } });
                return reply(`✓ Image forwarded to ${targetJid}`);
            }

            // VIDEO
            if (q.mtype === 'videoMessage') {
                await sock.sendMessage(targetJid, { video: media, caption: q.caption || '', contextInfo });
                await sock.sendMessage(m.chat, { react: { text: '✓', key: m.key } });
                return reply(`✓ Video forwarded to ${targetJid}`);
            }

            // AUDIO
            if (q.mtype === 'audioMessage') {
                await sock.sendMessage(targetJid, { audio: media, ptt: q.ptt || false, contextInfo });
                await sock.sendMessage(m.chat, { react: { text: '✓', key: m.key } });
                return reply(`✓ Audio forwarded to ${targetJid}`);
            }

            // STICKER
            if (q.mtype === 'stickerMessage') {
                await sock.sendMessage(targetJid, { sticker: media, contextInfo });
                await sock.sendMessage(m.chat, { react: { text: '✓', key: m.key } });
                return reply(`✓ Sticker forwarded to ${targetJid}`);
            }

            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(`✘ Unsupported message type`);

        } catch (err) {
            console.error(`[${BOT_NAME} FORWARD ERROR]`, err.message);
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(`✘ Failed to forward message`);
        }
    }
};