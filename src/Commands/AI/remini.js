const axios = require('axios');
const FormData = require('form-data');
const sharp = require('sharp');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI V2';
const NEXRAY_REMINI = 'https://api.nexray.web.id/ai/gptimage';

// ORIGINAL + 3 PUBLIC UPSCALE APIs
const UPSCALE_APIS = [
    {
        name: 'Nexray Remini',
        upscale: async (buffer) => {
            const form = new FormData();
            form.append('image', buffer, { filename: 'image.jpg' });
            form.append('action', 'remini');
            const res = await axios.post(NEXRAY_REMINI, form, {
                headers: form.getHeaders(),
                responseType: 'arraybuffer',
                timeout: 180000
            });
            return Buffer.from(res.data);
        }
    },
    {
        name: 'DeepAI SuperResolution',
        upscale: async (buffer) => {
            const form = new FormData();
            form.append('image', buffer, { filename: 'image.jpg' });
            const res = await axios.post('https://api.deepai.org/api/torch-srgan', form, {
                headers: {...form.getHeaders(), 'Api-Key': 'quickstart-QUdJIGlzIGNvbWluZw==' },
                responseType: 'arraybuffer',
                timeout: 120000
            });
            return Buffer.from(res.data);
        }
    },
    {
        name: 'Upscaler AI',
        upscale: async (buffer) => {
            const form = new FormData();
            form.append('image', buffer, { filename: 'image.jpg' });
            const res = await axios.post('https://api.upscaler.io/v1/upscale', form, {
                headers: {...form.getHeaders(), 'Authorization': 'Bearer free-key' },
                responseType: 'arraybuffer',
                timeout: 120000
            });
            return Buffer.from(res.data);
        }
    },
    {
        name: 'Pollinations Enhance',
        upscale: async (buffer) => {
            const form = new FormData();
            form.append('image', buffer, { filename: 'image.jpg' });
            form.append('prompt', 'enhance, hd, 4k, detailed, sharp');
            const res = await axios.post('https://image.pollinations.ai/edit', form, {
                headers: form.getHeaders(),
                responseType: 'arraybuffer',
                timeout: 120000
            });
            return Buffer.from(res.data);
        }
    }
];

module.exports = {
    name: 'remini',
    alias: ['hd', 'enhance', 'upscale'],
    category: 'AI',
    desc: `${BOT_NAME} Enhance image quality with 4 API fallbacks`,
    usage: '.remini (reply to image)',
    owner: false,

    execute: async (sock, m, { reply, prefix }) => {
        const jid = m.key.remoteJid;
        const quoted = m.quoted;

        if (!quoted ||!/image|webp/.test(quoted.mimetype || '')) {
            return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} IMAGE ENHANCER •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *USAGE*\n│ ❏ Reply to an image\n│ ❏ ${prefix}remini\n│ \n│ ❏ *Feature:* AI HD Upscaling 4x\n╰─────────────────────────╯`);
        }

        await sock.sendPresenceUpdate('composing', jid);
        await sock.sendMessage(jid, { react: { text: '✨', key: m.key } });

        try {
            let buffer = await quoted.download();
            if (!buffer || buffer.length === 0) {
                await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
                return reply(`✘ ❏ Failed to download image`);
            }

            // Compress if too large for API
            if (buffer.length > 1024 * 1024) {
                try {
                    buffer = await sharp(buffer)
                       .resize({ width: 1024, height: 1024, fit: 'inside' })
                       .jpeg({ quality: 80 })
                       .toBuffer();
                    console.log('[Remini] Compressed to:', buffer.length);
                } catch (e) {
                    console.log('[Remini] Compression skipped:', e.message);
                }
            }

            await reply(`❏ *Enhancing image... (may take 30-60s)*`);

            let enhancedBuffer = null;
            let sourceUsed = '';

            // Try all 4 APIs - NEXRAY FIRST
            for (let i = 0; i < UPSCALE_APIS.length; i++) {
                try {
                    console.log(`[REMINI] Trying ${UPSCALE_APIS[i].name}`);
                    enhancedBuffer = await UPSCALE_APIS[i].upscale(buffer);
                    sourceUsed = UPSCALE_APIS[i].name;
                    if (enhancedBuffer && enhancedBuffer.length > 1024) break;
                } catch (e) {
                    console.log(`[REMINI] ${UPSCALE_APIS[i].name} failed:`, e.message);
                    continue;
                }
            }

            if (!enhancedBuffer) {
                await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
                return reply(`✘ ❏ Enhancement failed\n❏ All 4 APIs failed`);
            }

            // WhatsApp 5MB limit check
            if (enhancedBuffer.length > 5 * 1024 * 1024) {
                await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
                return reply(`✘ ❏ Result exceeds WhatsApp 5MB limit\n❏ Try with a smaller image`);
            }

            await sock.sendMessage(jid, {
                image: enhancedBuffer,
                caption: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} HD ENHANCED •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n\n❏ *Source:* ${sourceUsed}\n❏ *Status:* 4x Upscaled\n❏ Powered by ${BOT_NAME}`
            }, { quoted: m });

            await sock.sendMessage(jid, { react: { text: '💯', key: m.key } });

        } catch (err) {
            console.error('[REMINI ERROR]', err.message);
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });

            if (err.response?.status === 400) return reply(`✘ ❏ Nexray rejected the request`);
            if (err.response?.status === 403) return reply(`✘ ❏ Invalid image. Try a different one.`);
            if (err.response?.status === 429) return reply(`✘ ❏ Rate limit exceeded. Try again later.`);
            if (err.response?.status === 500) return reply(`✘ ❏ Nexray server unavailable. Try again later.`);
            if (err.code === 'ECONNABORTED') return reply(`✘ ❏ Processing timeout. Try again.`);

            reply(`✘ ❏ ${err.message || 'Unknown error'}`);
        }
    }
};