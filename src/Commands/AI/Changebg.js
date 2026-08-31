const axios = require('axios');
const FormData = require('form-data');
const sharp = require('sharp');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const NEXRAY_API = 'https://api.nexray.web.id/ai/gptimage';

module.exports = {
    name: 'changebg',
    alias: ['bg', 'replacebg'],
    category: 'AI',
    desc: 'AI background changer powered by XADON',
    usage: '.changebg <background description> | reply to image',
    owner: false,

    execute: async (sock, m, { args, reply, prefix }) => {
        const jid = m.key.remoteJid;
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const background = args.join(' ').trim();

        // Check if replying to media
        if (!quoted) {
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            return reply(`✘ ֎ Reply to an image or sticker\n\n✪ Example : ${prefix}changebg beach sunset`);
        }

        if (!/image|webp/.test(quoted.imageMessage?.mimetype || '')) {
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            return reply(`✘ ֎ Reply must be an image or static sticker`);
        }

        if (!background) {
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            return reply(`✘ ֎ Provide a background description\n\n✪ Example : ${prefix}changebg cyberpunk city`);
        }

        await sock.sendPresenceUpdate('composing', jid);
        await sock.sendMessage(jid, { react: { text: "🎨", key: m.key } });

        try {
            let buffer = await quoted.imageMessage.download();
            if (!buffer || buffer.length === 0) {
                await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
                return reply(`✘ ֎ Failed to download media`);
            }

            // Resize if > 1024x1024 to avoid API limits
            if (buffer.length > 1024 * 1024) {
                try {
                    buffer = await sharp(buffer)
                        .resize({ width: 1024, height: 1024, fit: 'inside' })
                        .jpeg({ quality: 80 })
                        .toBuffer();
                } catch {}
            }

            await reply(`🎨 ֎ Processing image... may take 30-60s`);

            const form = new FormData();
            form.append('image', buffer, { filename: 'image.jpg' });
            form.append('background', background);

            const { data } = await axios.post(NEXRAY_API, form, {
                headers: form.getHeaders(),
                responseType: 'arraybuffer',
                timeout: 180000 // 3 minutes
            });

            if (!data || data.length === 0) {
                await sock.sendMessage(jid, { react: { text: "❔", key: m.key } });
                return reply(`✘ ֎ AI returned empty response`);
            }

            const resultBuffer = Buffer.from(data);

            // Check WhatsApp 5MB limit
            if (resultBuffer.length > 5 * 1024 * 1024) {
                await sock.sendMessage(jid, { react: { text: "❔", key: m.key } });
                return reply(`𓉤 ֎ Result exceeds WhatsApp 5MB limit. Try a simpler prompt.`);
            }

            const header = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} BACKGROUND CHANGER •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦`;

            const caption = `${header}
╭─֎ *Background:* ${background}
│
│ ֎ *Status:* Completed
╰─────────────────────────╯
⚡ Powered by CRYSNOVA AI`;

            await sock.sendMessage(jid, {
                image: resultBuffer,
                caption
            }, { quoted: m });

            await sock.sendMessage(jid, { react: { text: "✓", key: m.key } });

        } catch (error) {
            console.error('[CHANGEBG ERROR]', error.message);
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });

            if (error.response?.status === 400) {
                return reply(`✘ ֎ Invalid request. Try a different image or prompt.`);
            }
            if (error.response?.status === 403) {
                return reply(`𓉤 ֎ Rate limit exceeded. Try again later.`);
            }
            if (error.response?.status === 429) {
                return reply(`𓉤 ֎ Rate limit exceeded. Try again later.`);
            }
            if (error.response?.status === 500) {
                return reply(`𓉤 ֎ Nexray server unavailable. Try again later.`);
            }
            if (error.code === 'ECONNABORTED') {
                return reply(`𓉤 ֎ Processing timeout. Try a simpler prompt.`);
            }
            reply(`✘ ֎ Error : ${error.message || 'Unknown error'}`);
        }
    }
};