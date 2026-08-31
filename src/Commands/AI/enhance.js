const axios = require('axios');
const FormData = require('form-data');
const sharp = require('sharp');
const { downloadContentFromMessage } = require('@musteqeem/baileys');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI V2';

// 2 UPLOAD FALLBACKS
async function uploadUguu(buffer) {
    const form = new FormData();
    form.append('files[]', buffer, { filename: Date.now() + '.jpg' });
    const res = await axios.post('https://uguu.se/upload.php', form, {
        headers: {...form.getHeaders(), 'Origin': 'https://uguu.se', 'Referer': 'https://uguu.se/', 'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36' },
        timeout: 30000
    });
    const url = res.data?.files?.[0]?.url;
    if (!url) throw new Error('Uguu upload failed');
    return url;
}

async function uploadQuax(buffer) {
    const form = new FormData();
    form.append('files[]', buffer, { filename: Date.now() + '.jpg' });
    const res = await axios.post('https://qu.ax/upload.php', form, {
        headers: {...form.getHeaders(), 'Origin': 'https://qu.ax', 'Referer': 'https://qu.ax/', 'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36' },
        timeout: 30000
    });
    const url = res.data?.files?.[0]?.url;
    if (!url) throw new Error('Quax upload failed');
    return url;
}

// AI HD UPSCALE FALLBACKS
async function upscaleFaa(url) {
    const res = await axios.get('https://api-faa.my.id/faa/superhd', {
        params: { url },
        responseType: 'arraybuffer',
        timeout: 60000,
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'image/*' }
    });
    return Buffer.from(res.data);
}

async function upscaleLetchat(url) {
    const res = await axios.get(`https://api.lettchat.com/upscale?url=${encodeURIComponent(url)}`, {
        responseType: 'arraybuffer',
        timeout: 60000
    });
    return Buffer.from(res.data);
}

function isAlreadyHD(buffer) {
    const minSize = 500 * 1024; // 500KB
    if (buffer.length < minSize) return false;
    return buffer.length > 400 * 400; // Rough check
}

module.exports = {
    name: 'hd',
    alias: ['enhance', 'upscale', 'superhd'],
    desc: 'Enhance image quality to Super HD with AI',
    category: 'Tools',
    usage: '.hd (reply to image)',
    owner: false,

    execute: async (sock, m, { reply }) => {
        const jid = m.key.remoteJid;

        if (!m.quoted) {
            return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} SUPER HD •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *USAGE*\n│ ❏ Usage: Reply to an image with *.hd*\n│ ❏ Example: Reply to photo →.hd\n│ \n│ ❏ *Features:*\n│ ❏ AI Upscale 2x-4x\n│ ❏ Auto detects HD images\n│ ❏ 2 Upload + 2 Upscale fallbacks\n╰─────────────────────────╯`);
        }

        const quoted = m.quoted;
        const mtype = quoted.mtype || quoted.message?.imageMessage? 'imageMessage' : quoted.message?.stickerMessage? 'stickerMessage' : '';
        const isImage = mtype.includes('image') || mtype.includes('sticker');
        if (!isImage) {
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            return reply(`✘ ❏ Reply to an *image* or *sticker*`);
        }

        await sock.sendMessage(jid, { react: { text: "🖼️", key: m.key } });
        await reply(`❏ *Enhancing to Super HD...*`);

        try {
            // Download image
            let buffer;
            try {
                buffer = await quoted.download();
            } catch {
                const stream = await downloadContentFromMessage(quoted.message.imageMessage || quoted.message.stickerMessage, 'image');
                const chunks = [];
                for await (const chunk of stream) chunks.push(chunk);
                buffer = Buffer.concat(chunks);
            }

            if (!buffer || buffer.length === 0) {
                await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
                return reply(`✘ ❏ Failed to download image`);
            }

            // Check if already HD
            if (isAlreadyHD(buffer)) {
                await sock.sendMessage(jid, { react: { text: "💎", key: m.key } });
                return reply(`❏ *( ͡❛ ₃ ͡❛)* Already HD\n❏ This image is already high quality`);
            }

            // Pre-process with sharp for better results
            const processedBuffer = await sharp(buffer)
               .resize({ width: 1024, withoutEnlargement: true })
               .jpeg({ quality: 95 })
               .toBuffer();

            // Upload with fallback
            let uploadedUrl;
            try {
                uploadedUrl = await uploadUguu(processedBuffer);
            } catch {
                uploadedUrl = await uploadQuax(processedBuffer);
            }

            // Upscale with fallback
            let hdBuffer;
            try {
                hdBuffer = await upscaleFaa(uploadedUrl);
            } catch {
                hdBuffer = await upscaleLetchat(uploadedUrl);
            }

            await sock.sendMessage(jid, {
                image: hdBuffer,
                caption: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} SUPER HD •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n\n❏ *Super HD Enhanced*\n❏ *( ͡❛ ₃ ͡❛)* Quality boosted\n❏ Powered by ${BOT_NAME}`
            }, { skipVerified: true });

            await sock.sendMessage(jid, { react: { text: "✓", key: m.key } });

        } catch (err) {
            console.log('[HD ERROR]', err.message);
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });

            if (err.message?.includes('file_size_too_large')) {
                reply(`✘ ❏ Image too large - try a smaller photo`);
            } else if (err.code === 'ECONNABORTED') {
                reply(`✘ ❏ Request timed out. Try again.`);
            } else {
                reply(`✘ ❏ Failed to enhance image. Try another photo.`);
            }
        }
    }
};