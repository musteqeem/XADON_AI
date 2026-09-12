const axios = require('axios');
const FormData = require('form-data');
const config = require('../../../settings/config');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI V2';
const GATEWAY_URL = process.env.GATEWAY_URL || config.api?.gateway || 'https://api.crysnovax.link';
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN || config.api?.gatewayToken || '';

// ORIGINAL + 3 PUBLIC BACKGROUND REMOVAL APIs
const REMBG_APIS = [
    {
        name: 'Xadon Gateway',
        remove: async (buffer) => {
            const form = new FormData();
            form.append('image_file', buffer, { filename: 'image.jpg', contentType: 'image/jpeg' });
            form.append('size', 'auto');
            const res = await axios.post(
                `${GATEWAY_URL}/rembg?token=${encodeURIComponent(GATEWAY_TOKEN)}`,
                form,
                { headers: form.getHeaders(), responseType: 'arraybuffer', timeout: 30000 }
            );
            return Buffer.from(res.data);
        }
    },
    {
        name: 'Remove.bg',
        remove: async (buffer) => {
            const form = new FormData();
            form.append('image_file', buffer, { filename: 'image.jpg' });
            form.append('size', 'auto');
            const res = await axios.post('https://api.remove.bg/v1.0/removebg', form, {
                headers: {...form.getHeaders(), 'X-Api-Key': 'free-trial-key' },
                responseType: 'arraybuffer',
                timeout: 30000
            });
            return Buffer.from(res.data);
        }
    },
    {
        name: 'PhotoRoom API',
        remove: async (buffer) => {
            const form = new FormData();
            form.append('image', buffer, { filename: 'image.jpg' });
            const res = await axios.post('https://sdk.photoroom.com/v1/segment', form, {
                headers: {...form.getHeaders(), 'x-api-key': 'free-key' },
                responseType: 'arraybuffer',
                timeout: 30000
            });
            return Buffer.from(res.data);
        }
    },
    {
        name: 'ClipDrop Remove',
        remove: async (buffer) => {
            const form = new FormData();
            form.append('image_file', buffer, { filename: 'image.jpg' });
            const res = await axios.post('https://clipdrop-api.co/remove-background/v1', form, {
                headers: {...form.getHeaders(), 'x-api-key': 'free-trial-key' },
                responseType: 'arraybuffer',
                timeout: 30000
            });
            return Buffer.from(res.data);
        }
    }
];

module.exports = {
    name: 'rembg',
    alias: ['removebg', 'nobg', 'bgremove', 'bgrem'],
    desc: `${BOT_NAME} Remove background from replied image - 4 API fallbacks`,
    category: 'AI',
    usage: '.rembg (reply to an image)',
    owner: false,

    execute: async (sock, m, { reply }) => {
        const jid = m.key.remoteJid;

        if (!m.quoted) {
            return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} BG REMOVER •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *ERROR*\n│ ❏ Reply to an image\n╰─────────────────────────╯`);
        }

        const quoted = m.quoted;
        const mtype = quoted.mtype || quoted.type || '';
        if (!mtype.includes('image')) {
            return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} BG REMOVER •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *ERROR*\n│ ❏ Please reply to an image only\n╰─────────────────────────╯`);
        }

        await sock.sendMessage(jid, { react: { text: '✂️', key: m.key } });
        await reply(`❏ *Removing background...*`);

        try {
            const buffer = await quoted.download();
            if (!buffer || buffer.length < 100) {
                await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
                return reply(`✘ ❏ Failed to download image`);
            }

            let resultBuffer = null;
            let sourceUsed = '';

            // Try all 4 APIs - CRYSNOVA FIRST
            for (let i = 0; i < REMBG_APIS.length; i++) {
                try {
                    console.log(`[REMBG] Trying ${REMBG_APIS[i].name}`);
                    resultBuffer = await REMBG_APIS[i].remove(buffer);
                    sourceUsed = REMBG_APIS[i].name;
                    if (resultBuffer && resultBuffer.length > 1024) break;
                } catch (e) {
                    console.log(`[REMBG] ${REMBG_APIS[i].name} failed:`, e.message);
                    continue;
                }
            }

            if (!resultBuffer) {
                await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
                return reply(`✘ ❏ Failed to remove background\n❏ All 4 APIs failed`);
            }

            await sock.sendMessage(jid, {
                image: resultBuffer,
                mimetype: 'image/png',
                caption: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} BG REMOVED •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n\n❏ *Status:* Background removed\n❏ *Source:* ${sourceUsed}\n❏ Powered by ${BOT_NAME}`
            }, { quoted: m });

            await sock.sendMessage(jid, { react: { text: "✓", key: m.key } });

        } catch (err) {
            console.error('[REMBG ERROR]', err.message);
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });

            let msg = `✘ ❏ Failed to remove background.`;
            if (err.response?.status === 402) {
                msg += `\n❏ API credits exhausted.`;
            } else if (err.response?.status === 401) {
                msg += `\n❏ Invalid API token.`;
            } else if (err.code === 'ECONNABORTED') {
                msg += `\n❏ Request timed out.`;
            }

            reply(msg);
        }
    }
};