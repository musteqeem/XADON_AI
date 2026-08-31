const axios = require('axios');
const FormData = require('form-data');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI V2';
const CDN_URL = 'https://cdn.crysnovax.link';
const NANO_API = 'https://api.zenzxz.my.id/ai/nanobanana';

// ORIGINAL + 3 FALLBACK IMAGE EDIT APIs
const EDIT_APIS = [
    {
        name: 'Zenzxz NanoBanana',
        edit: async (imageUrl, prompt) => {
            const res = await axios.get(NANO_API, {
                params: { url: imageUrl, prompt },
                timeout: 120000
            });
            const url = res.data?.result?.modified_image || res.data?.url;
            if (!url) throw new Error('No result');
            const img = await axios.get(url, { responseType: 'arraybuffer', timeout: 60000 });
            return Buffer.from(img.data);
        }
    },
    {
        name: 'Pollinations Edit',
        edit: async (buffer, prompt) => {
            const form = new FormData();
            form.append('image', buffer, { filename: 'image.jpg' });
            form.append('prompt', `Edit this image: ${prompt}`);
            const res = await axios.post('https://image.pollinations.ai/edit', form, {
                headers: form.getHeaders(),
                responseType: 'arraybuffer',
                timeout: 60000
            });
            return Buffer.from(res.data);
        }
    },
    {
        name: 'DeepAI',
        edit: async (buffer, prompt) => {
            const form = new FormData();
            form.append('image', buffer, { filename: 'image.jpg' });
            form.append('text', prompt);
            const res = await axios.post('https://api.deepai.org/api/super-resolution', form, {
                headers: {...form.getHeaders(), 'Api-Key': 'quickstart-QUdJIGlzIGNvbWluZw==' },
                responseType: 'arraybuffer',
                timeout: 60000
            });
            return Buffer.from(res.data);
        }
    },
    {
        name: 'ClipDrop',
        edit: async (buffer, prompt) => {
            const form = new FormData();
            form.append('image_file', buffer, { filename: 'image.jpg' });
            form.append('prompt', prompt);
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

async function downloadQuotedImage(quoted) {
    try {
        if (typeof quoted.download === 'function') return await quoted.download();
    } catch {}
    const stream = await downloadContentFromMessage(quoted.message.imageMessage || quoted.message.stickerMessage, 'image');
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
}

module.exports = {
    name: 'nano',
    alias: ['nanobanana', 'editimage', 'aiimage'],
    desc: `${BOT_NAME} AI image editor - modify images with text prompts`,
    category: 'AI',
    usage: '.nano <prompt> (reply to image)',
    reactions: { start: '🍌', success: '✓', error: '✘' },
    owner: false,

    execute: async (sock, m, { args, reply, prefix }) => {
        const jid = m.key.remoteJid;
        const prompt = args.join(' ').trim();

        if (!prompt) {
            return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} NANO AI •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *USAGE*\n│ ❏ Usage: ${prefix}nano <prompt> (reply to image)\n│ \n│ ❏ *Examples:*\n│ ❏ ${prefix}nano Make him smile\n│ ❏ ${prefix}nano Change background to space\n│ \n│ ❏ *Features:*\n│ ❏ AI-powered image editing\n╰─────────────────────────╯`);
        }

        if (!m.quoted) {
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            return reply(`✘ ❏ Reply to an *image*`);
        }

        const quoted = m.quoted;
        const mtype = quoted.mtype || quoted.message?.imageMessage? 'imageMessage' : quoted.message?.stickerMessage? 'stickerMessage' : '';
        if (!mtype.includes('image') &&!mtype.includes('sticker')) {
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            return reply(`✘ ❏ Reply to an *image* or *sticker*`);
        }

        await sock.sendMessage(jid, { react: { text: '🍌', key: m.key } });
        await reply(`❏ *Uploading image...*`);

        try {
            const buffer = await downloadQuotedImage(quoted);
            if (!buffer || buffer.length === 0) {
                await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
                return reply(`✘ ❏ Failed to download image`);
            }

            const uploadedUrl = await uploadToCDN(buffer);
            if (!uploadedUrl) {
                await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
                return reply(`✘ ❏ Failed to upload image`);
            }

            await reply(`❏ *Editing image:* ${prompt}...`);

            let editedBuffer = null;
            let sourceUsed = '';

            // Try all 4 APIs - NANO FIRST
            for (let i = 0; i < EDIT_APIS.length; i++) {
                try {
                    console.log(`[NANO] Trying ${EDIT_APIS[i].name}`);
                    if (i === 0) {
                        editedBuffer = await EDIT_APIS[i].edit(uploadedUrl, prompt);
                    } else {
                        editedBuffer = await EDIT_APIS[i].edit(buffer, prompt);
                    }
                    sourceUsed = EDIT_APIS[i].name;
                    if (editedBuffer && editedBuffer.length > 1024) break;
                } catch (e) {
                    console.log(`[NANO] ${EDIT_APIS[i].name} failed:`, e.message);
                    continue;
                }
            }

            if (!editedBuffer) {
                await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
                return reply(`✘ ❏ NanoBanana API returned an error\n❏ All 4 APIs failed`);
            }

            await sock.sendMessage(jid, {
                image: editedBuffer,
                caption: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} NANO AI •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n\n❏ *Edit:* ${prompt}\n❏ *Source:* ${sourceUsed}\n❏ Powered by ${BOT_NAME}`
            }, { quoted: m });

            await sock.sendMessage(jid, { react: { text: '✓', key: m.key } });

        } catch (err) {
            console.error('[NANO ERROR]', err.message);
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            if (err.code === 'ECONNABORTED') return reply(`✘ ❏ Request timed out. Try again.`);
            if (err.response?.status === 429) return reply(`✘ ❏ Rate limited. Try again later.`);
            reply(`✘ ❏ ${err.message || 'Edit failed'}`);
        }
    }
};