const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const cheerio = require('cheerio');
const config = require('../../../settings/config');
const { downloadContentFromMessage } = require('@musteqeem/baileys');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI V2';
const GATEWAY_URL = process.env.GATEWAY_URL || config.api?.gateway || 'https://api.crysnovax.link';
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN || config.api?.gatewayToken || '';
const DB_PATH = path.join(__dirname, '../../database/xadon.json');
const MEMORY_PATH = path.join(__dirname, '../../database/xadon_memory.json');

if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, '{}');
if (!fs.existsSync(MEMORY_PATH)) fs.writeFileSync(MEMORY_PATH, '{}');

const getDB = () => JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
const saveDB = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
const getMemory = () => JSON.parse(fs.readFileSync(MEMORY_PATH, 'utf8'));
const saveMemory = (data) => fs.writeFileSync(MEMORY_PATH, JSON.stringify(data, null, 2));

const IMAGE_TRAINING_PROMPT = `You are ${BOT_NAME}, a helpful and fun AI assistant.

STRICT IMAGE RULE - NEVER BREAK THIS:
If the user asks for images, pictures, photos, "show me", "send pictures of", "images of", or any visual request, you MUST start your reply with the exact marker on its own line at the very beginning:

[IMAGES: concise search query]

Then continue with your normal helpful response.`;

const pendingImageAnalysis = new Map();
const chatMemory = new Map();
const MAX_MEMORY = 30;

async function uploadImage(buffer) {
    try {
        const form = new FormData();
        form.append('reqtype', 'fileupload');
        form.append('fileToUpload', buffer, { filename: 'image.jpg', contentType: 'image/jpeg' });
        const res = await axios.post('https://catbox.moe/user/api.php', form, { headers: form.getHeaders(), timeout: 20000 });
        if (typeof res.data === 'string' && res.data.includes('https')) return res.data.trim();
    } catch {}
    throw new Error('Image upload failed');
}

async function describeImage(buffer, prompt = 'Describe this image in detail.') {
    const form = new FormData();
    form.append('file', buffer, { filename: 'image.jpg', contentType: 'image/jpeg' });
    form.append('prompt', prompt);
    const res = await axios.post(`${GATEWAY_URL}/vision?token=${encodeURIComponent(GATEWAY_TOKEN)}`, form, {
        headers: form.getHeaders(),
        timeout: 60000
    });
    return res.data?.description || '';
}

async function transcribeAudio(buffer) {
    const form = new FormData();
    form.append('file', buffer, { filename: 'audio.ogg', contentType: 'audio/ogg' });
    const res = await axios.post(`${GATEWAY_URL}/transcribe?token=${encodeURIComponent(GATEWAY_TOKEN)}`, form, {
        headers: form.getHeaders(),
        timeout: 60000
    });
    return res.data?.text || '';
}

async function chatWithAI(prompt, memory = []) {
    const memoryText = memory.length > 0? `\n\nConversation History:\n${memory.map(m => `User: ${m.user}\nAI: ${m.ai}`).join('\n')}\n` : '';
    const res = await axios.post(`${GATEWAY_URL}/chat?token=${encodeURIComponent(GATEWAY_TOKEN)}`, {
        prompt: memoryText + prompt,
        model: 'gpt-4.5'
    }, { headers: { 'Content-Type': 'application/json' }, timeout: 60000 });
    return res.data?.response || res.data?.text || '';
}

async function fetchImages(query, count = 3) {
    try {
        const searchUrl = `https://duckduckgo.com/i.js?q=${encodeURIComponent(query)}&o=json`;
        const { data } = await axios.get(searchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            timeout: 15000
        });
        const images = (data.results || []).slice(0, count);
        const buffers = [];
        for (const img of images) {
            try {
                const imgRes = await axios.get(img.image, { responseType: 'arraybuffer', timeout: 15000 });
                buffers.push({
                    buffer: Buffer.from(imgRes.data),
                    mimeType: imgRes.headers['content-type'] || 'image/jpeg',
                    caption: `❏ Image: ${query}\n❏ Source: DuckDuckGo`,
                    url: img.image
                });
            } catch { continue; }
        }
        return { images: buffers, query };
    } catch (e) {
        console.log('[IMAGE ERROR]', e.message);
        return { images: [], query };
    }
}

function isImageRequest(text) {
    const keywords = ['image', 'images', 'picture', 'pictures', 'photo', 'photos', 'show me', 'send me', 'wallpaper'];
    return keywords.some(k => text.toLowerCase().includes(k));
}

function extractImageQuery(text) {
    const match = text.match(/(?:show me|send me|give me|images? of|pictures? of)\s+(.+)/i);
    return match? match[1].trim().replace(/[?.,!]$/, '') : text.trim();
}

const getChatId = (m) => m.key.remoteJid;
const getUserId = (m) => m.key.participant || m.key.remoteJid;
const isPrivateChat = (jid) =>!jid.includes('@g.us') &&!jid.includes('@status.broadcast');

function addToMemory(userId, userMsg, aiMsg) {
    const memory = getMemory();
    if (!memory[userId]) memory[userId] = [];
    memory[userId].push({ user: userMsg, ai: aiMsg, time: Date.now() });
    if (memory[userId].length > MAX_MEMORY) memory[userId] = memory[userId].slice(-MAX_MEMORY);
    saveMemory(memory);
}

function getUserMemory(userId) {
    const memory = getMemory();
    return memory[userId] || [];
}

module.exports = {
    name: 'xadon',
    alias: ['xai', 'ai'],
    desc: `${BOT_NAME} – auto-reply, memory, image reading, voice transcription, web images`,
    usage: '.xadon on/off/img <query>/memory/forget',
    category: 'AI',
    owner: false,

    execute: async (sock, m, { args, reply }) => {
        const jid = getChatId(m);
        const userId = getUserId(m);
        const db = getDB();
        const sub = args[0]?.toLowerCase();
        const text = args.slice(1).join(' ').trim();

        // MEMORY COMMAND
        if (sub === 'memory') {
            const userMem = getUserMemory(userId);
            if (userMem.length === 0) return reply(`✘ ❏ No memory found for you yet.`);
            let memText = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} MEMORY •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *Last ${Math.min(userMem.length, 5)} messages:*\n`;
            userMem.slice(-5).forEach((m, i) => {
                memText += `│ ❏ ${i + 1}. You: ${m.user.slice(0, 50)}${m.user.length > 50? '...' : ''}\n`;
            });
            memText += `╰─────────────────────────╯\n❏ Total: ${userMem.length} messages stored`;
            return reply(memText);
        }

        // FORGET MEMORY
        if (sub === 'forget') {
            const memory = getMemory();
            delete memory[userId];
            saveMemory(memory);
            return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • MEMORY WIPED •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *Status:* All your chat memory deleted\n╰─────────────────────────╯`);
        }

        // Manual image search
        if (sub === 'img' || sub === 'image') {
            if (!text) return reply(`✘ ❏ Usage : *.xadon img <search term>*`);
            await sock.sendPresenceUpdate('composing', jid);
            try {
                const results = await fetchImages(text, 3);
                if (results.images.length > 0) {
                    for (let i = 0; i < results.images.length; i++) {
                        const img = results.images[i];
                        await sock.sendMessage(jid, {
                            image: img.buffer,
                            mimetype: img.mimeType,
                            caption: i === 0? `❏ *${text}*` : undefined
                        }, { quoted: m });
                    }
                } else reply(`✘ ❏ No images found.`);
            } catch { reply(`✘ ❏ Could not fetch images.`); }
            return;
        }

        // Global ON/OFF
        if (sub === 'on' && args[1]?.toLowerCase() === 'all') {
            if (!isPrivateChat(jid)) return reply(`✘ ❏ Global "on all" only in private chats.`);
            db.global_force_private = true;
            saveDB(db);
            return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} GLOBAL •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *DEFENSE CORE*\n│ ❏ Status : ACTIVE\n│ ❏ Mode : Auto-reply FORCED ON\n│ ❏ Target : All Private Chats\n╰─────────────────────────╯`);
        }
        if (sub === 'off' && args[1]?.toLowerCase() === 'all') {
            if (!isPrivateChat(jid)) return reply(`✘ ❏ Global "off all" only in private chats.`);
            delete db.global_force_private;
            saveDB(db);
            return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} GLOBAL •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *DEFENSE CORE*\n│ ❏ Status : INACTIVE\n│ ❏ Mode : Global force-off\n╰─────────────────────────╯`);
        }

        // Chat ON/OFF
        if (!sub) {
            const status = db[jid]? 'ACTIVE' : 'INACTIVE';
            const global = db.global_force_private && isPrivateChat(jid)? '\n│ ❏ Global : FORCED ON' : '';
            return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} STATUS •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *AI CORE*\n│ ❏ Status : ${status}${global}\n│ ❏ Commands : on | off | on all | off all | img <query> | memory | forget\n╰─────────────────────────╯`);
        }
        if (sub === 'on') {
            db[jid] = true;
            saveDB(db);
            return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} ENABLED •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *Status:* Auto-reply ACTIVE for this chat\n╰─────────────────────────╯`);
        }
        if (sub === 'off') {
            delete db[jid];
            saveDB(db);
            return reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} DISABLED •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *Status:* Auto-reply INACTIVE for this chat\n╰─────────────────────────╯`);
        }

        // Manual chat
        const prompt = args.join(' ').trim();
        if (!prompt) return;
        try {
            const userMem = getUserMemory(userId);
            const aiRes = await chatWithAI(prompt, userMem);
            addToMemory(userId, prompt, aiRes);
            reply(`✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n${aiRes}\n\n_❏ Powered by ${BOT_NAME}_`);
        } catch { reply(`*✘* _Failed — try again_`); }
    },

    onMessage: async (sock, m) => {
        if (!m.message) return;
        const jid = getChatId(m);
        const userId = getUserId(m);
        const db = getDB();
        let enabled = false;

        if (isPrivateChat(jid)) {
            enabled = db.global_force_private ||!!db[jid];
        } else {
            enabled =!!db[jid];
        }
        if (!enabled) return;

        let text = '';
        let lowerText = '';

        // Audio transcription
        if (m.message?.audioMessage) {
            try {
                await sock.sendPresenceUpdate('composing', jid);
                const stream = await downloadContentFromMessage(m.message.audioMessage, 'audio');
                let buffer = Buffer.alloc(0);
                for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                const transcript = await transcribeAudio(buffer);
                if (transcript) {
                    text = transcript;
                    lowerText = transcript.toLowerCase();
                }
            } catch (e) { console.log('[AUTO VTT ERROR]', e.message); }
        }

        // Get text
        if (!text) {
            text = (m.message?.conversation || m.message?.extendedTextMessage?.text || m.message?.imageMessage?.caption || m.message?.videoMessage?.caption || '').trim();
            lowerText = text.toLowerCase();
        }

        if (!text) return;
        if (lowerText.includes('֎') || lowerText.includes('.')) return;

        // Owner info trigger
        const ownerTriggers = ['who made you', 'who owns you', 'your creator', 'your owner', 'introduce yourself'];
        if (ownerTriggers.some(t => lowerText.includes(t))) {
            await sock.sendMessage(jid, { react: { text: '🔥', key: m.key } });
            const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${BOT_NAME}\nTEL;type=CELL;type=VOICE;waid=2347079056039:+2347079056039\nEND:VCARD`;
            const caption = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n\n❏ Heyy! 👋\n\nI'm *${BOT_NAME}* — your multi-core, spicy AI companion 😏\n\n❏ Creator : *XADON*\n❏ Number : +2347079056039\n❏ Location : Benin City 🔥\n❏ Established : 2025\n❏ GitHub : https://github.com/xadon\n❏ YouTube : https://youtube.com/@xadon\n❏ TikTok : https://www.tiktok.com/@xadon\n❏ Support : https://chat.whatsapp.com/Besbj8VIle1GwxKKZv1lax\n❏ Contact : https://wa.me/2347079056039\n❏ Channel : https://whatsapp.com/channel/0029Vb6pe77K0IBn48HLKb38`;
            await sock.sendMessage(jid, { image: { url: 'https://media.musteqeem.workers.dev/d1c4273f-dbd8-4a15-a874-40087fb66eff.jpg' }, caption }, { quoted: null });
            await sock.sendMessage(jid, { contacts: { displayName: BOT_NAME, contacts: [{ vcard }] } }, { quoted: m });
            return;
        }

        // Pending image analysis
        const pending = pendingImageAnalysis.get(jid);
        if (pending) {
            const confirm = ['yes', 'analyze', 'describe', 'ok', 'go', 'sure'];
            if (confirm.some(c => lowerText.includes(c))) {
                pendingImageAnalysis.delete(jid);
                await sock.sendPresenceUpdate('composing', jid);
                try {
                    const analysis = await describeImage(pending.buffer, pending.caption || 'Describe this image in detail.');
                    addToMemory(userId, '[sent image]', analysis);
                    await sock.sendMessage(jid, { text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} ANALYSIS •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n${analysis}\n\n_❏ Powered by ${BOT_NAME}_` }, { quoted: m });
                } catch {
                    await sock.sendMessage(jid, { text: `✘ ❏ Analysis failed — try again later.` }, { quoted: m });
                }
                return;
            } else {
                pendingImageAnalysis.delete(jid);
            }
        }

        // Image detection for analysis
        if (m.message?.imageMessage || m.message?.stickerMessage) {
            const caption = (m.message?.imageMessage?.caption || '').trim();
            if (caption && caption.toLowerCase().includes('.')) return;
            if (m.message?.viewOnce) return;
            try {
                const buffer = await (m.message?.imageMessage || m.message?.stickerMessage).download();
                if (!buffer?.length) return;
                pendingImageAnalysis.set(jid, { buffer, caption });
                await sock.sendMessage(jid, { text: `❏ Image detected.\n\nDo you want me to analyze this image? *yes / analyze / describe / ok*` }, { quoted: m });
            } catch (e) { console.log('[IMAGE DOWNLOAD ERROR]', e.message); }
            return;
        }

        // Main AI + Auto Image + MEMORY
        try {
            const needsImage = isImageRequest(text);
            let imageQuery = null;
            let imageResults = null;

            if (needsImage) {
                imageQuery = extractImageQuery(text);
                await sock.sendPresenceUpdate('composing', jid);
                imageResults = await fetchImages(imageQuery, 3);
            }

            const userMem = getUserMemory(userId);
            const fullPrompt = `${IMAGE_TRAINING_PROMPT}\n\nUser message: ${text}`;
            let aiResponse = await chatWithAI(fullPrompt, userMem);
            addToMemory(userId, text, aiResponse);

            const imgMarker = aiResponse.match(/\[IMAGES:\s*(.+?)\]/i);
            if (imgMarker &&!imageQuery) {
                imageQuery = imgMarker[1].trim();
                imageResults = await fetchImages(imageQuery, 3);
            }
            aiResponse = aiResponse.replace(/\[IMAGES:\s*.+?\]/i, '').trim();

            if (imageResults && imageResults.images.length > 0) {
                for (let i = 0; i < imageResults.images.length; i++) {
                    const img = imageResults.images[i];
                    await sock.sendMessage(jid, {
                        image: img.buffer,
                        mimetype: img.mimeType,
                        caption: i === 0? `❏ *${imageQuery}*\n\n${aiResponse.slice(0, 500)}${aiResponse.length > 500? '...' : ''}` : undefined
                    }, { quoted: m });
                }
                if (aiResponse.length > 500) {
                    await sock.sendMessage(jid, { text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n${aiResponse.slice(500)}\n\n_❏ Powered by ${BOT_NAME}_` }, { quoted: m });
                }
            } else if (needsImage) {
                await sock.sendMessage(jid, { text: `*✘*\n\nI couldn't find images for "${imageQuery || text}"\n\n${aiResponse}\n\n_❏ Powered by ${BOT_NAME}_` }, { quoted: m });
            } else {
                await sock.sendMessage(jid, { text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n${aiResponse}\n\n_❏ Powered by ${BOT_NAME}_` }, { quoted: m });
            }
        } catch (e) {
            console.log('[XADON AUTO ERROR]', e.message);
            try { await sock.sendMessage(jid, { text: `*✘* _Something went wrong — try again_` }, { quoted: m }); } catch {}
        }
    }
};