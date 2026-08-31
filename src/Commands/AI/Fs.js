const axios = require('axios');
const FormData = require('form-data');
const { downloadContentFromMessage } = require('@musteqeem/baileys');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI V2';
const CDN_URL = process.env.CDN_URL || 'https://cdn.musteqeem.link';
const sessionStore = new Map();

// 3 CDN UPLOAD FALLBACKS
async function uploadCDN(buffer) {
    const apis = [
        async () => {
            const form = new FormData();
            form.append('file', buffer, { filename: 'image.jpg', contentType: 'image/jpeg' });
            const res = await axios.post(`${CDN_URL}/upload`, form, { headers: form.getHeaders(), timeout: 30000 });
            return res.data?.url || res.data?.link || null;
        },
        async () => {
            const form = new FormData();
            form.append('file', buffer, { filename: 'image.jpg' });
            const res = await axios.post('https://uguu.se/upload.php', form, { headers: form.getHeaders(), timeout: 30000 });
            return res.data?.files?.[0]?.url || null;
        },
        async () => {
            const form = new FormData();
            form.append('files[]', buffer, { filename: 'image.jpg' });
            const res = await axios.post('https://qu.ax/upload.php', form, { headers: form.getHeaders(), timeout: 30000 });
            return res.data?.files?.[0]?.url || null;
        }
    ];
    for (let api of apis) {
        try { const url = await api(); if (url) return url; } catch(e) { continue; }
    }
    throw new Error('All CDN uploads failed');
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

// 2 FACE SWAP API FALLBACKS
async function faceswapAPI1(sourceUrl, faceUrl) {
    const res = await axios.get(`https://api.zenzxz.my.id/ai/faceswap?source=${encodeURIComponent(sourceUrl)}&face=${encodeURIComponent(faceUrl)}`, { timeout: 120000 });
    return res.data?.result?.image || res.data?.url || null;
}

async function faceswapAPI2(sourceUrl, faceUrl) {
    const res = await axios.post('https://api.musteqeem.ai/v1/faceswap', { source: sourceUrl, face: faceUrl }, { timeout: 120000 });
    return res.data?.image || res.data?.result || null;
}

module.exports = {
    name: 'fs',
    alias: ['faceswap', 'swapface'],
    category: 'AI',
    desc: `${BOT_NAME} Step Face Swap with 2 API fallbacks`,
    usage: '.fs 1 (reply to source) |.fs 2 (reply to face) |.fs push',
    owner: false,

    execute: async (sock, m, { args, reply, prefix }) => {
        const jid = m.key.remoteJid;
        const userId = m.key.participant || m.key.remoteJid;
        const step = args[0]?.toLowerCase();

        if (!step ||!['1','2','push'].includes(step)) {
            const session = sessionStore.get(userId);
            return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} FACE SWAP •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *HOW TO USE*\n│ ❏ Step 1: Reply to source image with \`${prefix}fs 1\`\n│ ❏ Step 2: Reply to face image with \`${prefix}fs 2\`\n│ ❏ Step 3: \`${prefix}fs push\` to swap\n│ \n│ ❏ *Current Session:*\n│ ❏ Source: ${session?.source? '✓ Ready' : '✘ Not set'}\n│ ❏ Face: ${session?.face? '✓ Ready' : '✘ Not set'}\n╰─────────────────────────╯`);
        }

        if (!m.quoted) {
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            return reply(`✘ ❏ Reply to an *image* or *sticker*`);
        }

        const quoted = m.quoted;
        const mtype = quoted.mtype || quoted.message?.imageMessage? 'imageMessage' : quoted.message?.stickerMessage? 'stickerMessage' : '';
        if (!mtype.includes('image') &&!mtype.includes('sticker')) {
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            return reply(`✘ ❏ Reply to an *image* or *sticker*`);
        }

        try {
            // STEP 1: SOURCE
            if (step === '1') {
                await sock.sendMessage(jid, { react: { text: "📸", key: m.key } });
                await reply(`❏ *Uploading source image...*`);

                const buffer = await downloadQuotedImage(quoted);
                if (!buffer || buffer.length === 0) return reply(`✘ ❏ Failed to download source image`);

                const url = await uploadCDN(buffer);
                if (!url) return reply(`✘ ❏ Failed to upload source image`);

                if (!sessionStore.has(userId)) sessionStore.set(userId, {});
                sessionStore.get(userId).source = url;

                await sock.sendMessage(jid, { react: { text: "✓", key: m.key } });
                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • SOURCE SET •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *STATUS*\n│ ❏ Source image saved\n│ ❏ Next: Reply to face with \`${prefix}fs 2\`\n╰─────────────────────────╯`);
            }

            // STEP 2: FACE
            if (step === '2') {
                await sock.sendMessage(jid, { react: { text: "👤", key: m.key } });
                await reply(`❏ *Uploading face image...*`);

                const buffer = await downloadQuotedImage(quoted);
                if (!buffer || buffer.length === 0) return reply(`✘ ❏ Failed to download face image`);

                const url = await uploadCDN(buffer);
                if (!url) return reply(`✘ ❏ Failed to upload face image`);

                if (!sessionStore.has(userId)) sessionStore.set(userId, {});
                sessionStore.get(userId).face = url;

                await sock.sendMessage(jid, { react: { text: "✓", key: m.key } });
                return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • FACE SET •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *STATUS*\n│ ❏ Face image saved\n│ ❏ Next: \`${prefix}fs push\` to swap\n╰─────────────────────────╯`);
            }

            // STEP 3: PUSH SWAP
            if (step === 'push') {
                const session = sessionStore.get(userId);
                if (!session ||!session.source ||!session.face) {
                    return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • MISSING IMAGES •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *SET BOTH FIRST*\n│ ❏ ${!session?.source? '✘ Source not set' : '✓ Source ready'}\n│ ❏ ${!session?.face? '✘ Face not set' : '✓ Face ready'}\n│ \n│ ❏ Use \`${prefix}fs 1\` and \`${prefix}fs 2\`\n╰─────────────────────────╯`);
                }

                await sock.sendMessage(jid, { react: { text: "🔄", key: m.key } });
                await reply(`❏ *Swapping faces with AI...*`);

                let resultUrl;
                try {
                    resultUrl = await faceswapAPI1(session.source, session.face);
                } catch {
                    resultUrl = await faceswapAPI2(session.source, session.face);
                }

                if (!resultUrl) {
                    await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
                    return reply(`✘ ❏ Face swap failed - No result from API`);
                }

                const imgRes = await axios.get(resultUrl, { responseType: 'arraybuffer', timeout: 60000 });
                const imgBuffer = Buffer.from(imgRes.data);

                await sock.sendMessage(jid, {
                    image: imgBuffer,
                    caption: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} FACE SWAP •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n\n❏ *Face Swap Complete*\n❏ Powered by ${BOT_NAME}`
                }, { quoted: m });

                await sock.sendMessage(jid, { react: { text: "💯", key: m.key } });
                sessionStore.delete(userId);
            }

        } catch (err) {
            console.log('[FACESWAP ERROR]', err.message);
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });

            if (err.response?.status === 429) return reply(`✘ ❏ Rate limit exceeded. Try again later.`);
            if (err.response?.status === 500) return reply(`✘ ❏ Server unavailable. Try again later.`);
            if (err.code === 'ECONNABORTED') return reply(`✘ ❏ Request timed out.`);
            reply(`✘ ❏ ${err.message || 'Face swap failed'}`);
        }
    }
};