const axios = require('axios');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const API_URL = 'https://apis.prexzyvilla.site/anime/kill';

module.exports = {
    name: 'xkill',
    alias: ['xslay', 'xmurder'],
    desc: 'Send anime kill GIF to mentioned user',
    category: 'Anime',
    usage: '.kill @user',
    groupOnly: false,
    adminOnly: false,

    execute: async (sock, m, { args, reply }) => {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;

        await sock.sendMessage(jid, { react: { text: "🗡️", key: m.key } });

        // Get target from mention or quoted message
        let target = null;
        if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            target = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            target = m.message.extendedTextMessage.contextInfo.participant;
        }

        const senderTag = '@' + sender.split('@')[0];
        const targetTag = target? '@' + target.split('@')[0] : args[0] || 'someone';

        try {
            const { data, headers } = await axios.get(API_URL, {
                responseType: 'arraybuffer',
                timeout: 15000,
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
            });

            const buffer = Buffer.from(data);
            const contentType = headers['content-type'] || 'image/gif';
            const isVideo = contentType.includes('video') || contentType.includes('mp4');

            const header = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} KILL SYSTEM •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦`;

            const caption = target
               ? `${header}
╭─֎ *ACTION LOG*
│ ❏ Attacker : ${senderTag}
│ ❏ Target : ${targetTag}
│ ❏ Status : TERMINATED
│ ❏ Note : Rest in pieces...
╰─────────────────────────╯`
                : `${header}
╭─֎ *ACTION LOG*
│ ❏ Attacker : ${senderTag}
│ ❏ Target : ${targetTag}
│ ❏ Status : THREAT LEVEL HIGH
│ ❏ Note : Better watch out...
╰─────────────────────────╯`;

            // Send based on content type
            if (isVideo) {
                await sock.sendMessage(jid, {
                    video: buffer,
                    gifPlayback: true,
                    caption: caption,
                    mimetype: 'video/mp4',
                    mentions: target? [target, sender] : [sender]
                }, { quoted: m });
            } else {
                await sock.sendMessage(jid, {
                    image: buffer,
                    caption: caption,
                    mentions: target? [target, sender] : [sender]
                }, { quoted: m });
            }

            await sock.sendMessage(jid, { react: { text: "✓", key: m.key } });

        } catch (err) {
            console.error('[KILL ERROR]', err.message);
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });

            // Fallback text
            const fallback = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} KILL SYSTEM •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *ACTION LOG*
│ ❏ Attacker : ${senderTag}
│ ❏ Target : ${targetTag}
│ ❏ Status : API ERROR
│ ❏ Link : ${API_URL}
╰─────────────────────────╯`;

            await sock.sendMessage(jid, {
                text: fallback,
                mentions: target? [target, sender] : [sender]
            }, { quoted: m });
        }
    }
};