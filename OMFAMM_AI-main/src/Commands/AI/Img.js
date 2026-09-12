const axios = require('axios');
const FormData = require('form-data');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI V2';
const CDN_URL = 'https://cdn.crysnovax.link';
const NEXRAY_IMAGE_API = 'https://api.nexray.eu.cc/ai/gptimage';

// ORIGINAL + 3 FALLBACK EDIT APIs
const EDIT_APIS = [
    {
        name: 'Nexray GPTImage',
        edit: async (buffer, instruction) => {
            const form = new FormData();
            form.append('image', buffer, { filename: 'image.jpg', contentType: 'image/jpeg' });
            form.append('prompt', instruction);
            const res = await axios.post(NEXRAY_IMAGE_API, form, {
                headers: form.getHeaders(),
                responseType: 'arraybuffer',
                timeout: 60000
            });
            return Buffer.from(res.data);
        }
    },
    {
        name: 'Pollinations Edit',
        edit: async (buffer, instruction) => {
            const form = new FormData();
            form.append('image', buffer, { filename: 'image.jpg' });
            form.append('prompt', `Edit this image: ${instruction}`);
            const res = await axios.post('https://image.pollinations.ai/edit', form, {
                headers: form.getHeaders(),
                responseType: 'arraybuffer',
                timeout: 60000
            });
            return Buffer.from(res.data);
        }
    },
    {
        name: 'DeepAI SuperResolution',
        edit: async (buffer, instruction) => {
            const form = new FormData();
            form.append('image', buffer, { filename: 'image.jpg' });
            form.append('text', instruction);
            const res = await axios.post('https://api.deepai.org/api/super-resolution', form, {
                headers: {...form.getHeaders(), 'Api-Key': 'quickstart-QUdJIGlzIGNvbWluZw==' },
                responseType: 'arraybuffer',
                timeout: 60000
            });
            return Buffer.from(res.data);
        }
    },
    {
        name: 'ClipDrop Reimagine',
        edit: async (buffer, instruction) => {
            const form = new FormData();
            form.append('image_file', buffer, { filename: 'image.jpg' });
            form.append('prompt', instruction);
            const res = await axios.post('https://clipdrop-api.co/reimagine/v1/reimagine', form, {
                headers: {...form.getHeaders(), 'x-api-key': 'free-trial-key' },
                responseType: 'arraybuffer',
                timeout: 60000
            });
            return Buffer.from(res.data);
        }
    }
];

async function uploadToCDN(buffer) {
    try {
        const form = new FormData();
        form.append('file', buffer, { filename: 'image.jpg', contentType: 'image/jpeg' });
        const res = await axios.post(CDN_URL + '/upload', form, {
            headers: form.getHeaders(),
            timeout: 30000
        });
        return res.data?.url || res.data?.link || res.data?.file || null;
    } catch (e) {
        console.log('[CDN Upload]', e.message);
        return null;
    }
}

module.exports = {
    name: 'imagine',
    alias: ['img', 'editimg', 'aiimg', 'reimagine'],
    desc: `${BOT_NAME} Edit images with AI - 4 API fallbacks`,
    category: 'AI',
    usage: '.imagine <edit instruction> (reply to image/sticker)',
    reactions: { start: '🎨', success: '✓' },
    owner: false,

    execute: async (sock, m, { args, reply }) => {
        const jid = m.key.remoteJid;
        const instruction = args.join(' ').trim();
        const quoted = m.quoted;

        const isMedia = quoted && (
            quoted.mtype?.includes('image') ||
            quoted.mtype?.includes('sticker') ||
            quoted.message?.imageMessage ||
            quoted.message?.stickerMessage
        );

        if (!isMedia) {
            return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} IMAGINE AI •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *ERROR*\n│ ❏ Reply to an image or sticker\n│ \n│ ❏ *Usage:*.imagine <instruction>\n│ \n│ ❏ *Examples:*\n│ ❏.imagine Change background to beach\n│ ❏.imagine Make it anime style\n│ ❏.imagine Convert to Ghibli style\n╰─────────────────────────╯`);
        }

        if (!instruction) {
            return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} IMAGINE AI •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *ERROR*\n│ ❏ Provide edit instruction\n│ \n│ ❏ *Example:*\n│ ❏.imagine Make it pixel art\n╰─────────────────────────╯`);
        }

        await sock.sendMessage(jid, { react: { text: '🎨', key: m.key } }).catch(() => {});

        try {
            // Download image
            const buffer = await quoted.download();
            if (!buffer || buffer.length < 100) {
                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} IMAGINE AI •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *ERROR*\n│ ❏ Failed to download image\n│ ❏ Buffer too small or empty\n╰─────────────────────────╯`);
            }

            let editedBuffer = null;
            let sourceUsed = '';

            // Try all 4 APIs - ORIGINAL FIRST
            for (let i = 0; i < EDIT_APIS.length; i++) {
                try {
                    console.log(`[IMAGINE] Trying ${EDIT_APIS[i].name}`);
                    editedBuffer = await EDIT_APIS[i].edit(buffer, instruction);
                    sourceUsed = EDIT_APIS[i].name;
                    if (editedBuffer && editedBuffer.length > 1024) break;
                } catch (e) {
                    console.log(`[IMAGINE] ${EDIT_APIS[i].name} failed:`, e.message);
                    continue;
                }
            }

            if (!editedBuffer) {
                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} IMAGINE AI •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *ERROR*\n│ ❏ Failed to edit\n│ ❏ All 4 APIs failed\n│ \n│ ❏ 💡 Try a different instruction\n╰─────────────────────────╯`);
            }

            await sock.sendMessage(jid, {
                image: editedBuffer,
                caption: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} AI EDITED •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n\n❏ *Instruction:* ${instruction}\n❏ *Source:* ${sourceUsed}\n❏ Powered by ${BOT_NAME}`
            }, { quoted: m });

            await sock.sendMessage(jid, { react: { text: '✓', key: m.key } }).catch(() => {});

        } catch (err) {
            console.log('[IMAGINE ERROR]', err.message);
            await sock.sendMessage(jid, { react: { text: '✘', key: m.key } }).catch(() => {});
            reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} IMAGINE AI •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *ERROR*\n│ ❏ Failed to edit: ${err.message}\n╰─────────────────────────╯`);
        }
    }
};