const axios = require('axios');
const FormData = require('form-data');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const CDN_URL = 'https://cdn.crysnovax.link'; // change this to your CDN

const packSession = new Map();

async function uploadToCDN(buffer) {
    const form = new FormData();
    form.append('file', buffer, { filename: 'sticker.webp', contentType: 'image/webp' });
    const res = await axios.post(CDN_URL + '/upload', form, {
        headers: form.getHeaders(),
        timeout: 30000
    });
    return res.data?.url || res.data?.link || res.data?.file || null;
}

async function downloadQuoted(quoted) {
    try {
        if (typeof quoted.download === 'function') return await quoted.download();
    } catch {}
    const stream = await downloadContentFromMessage(quoted.msg || quoted, 'sticker');
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
}

module.exports = {
    name: "stickerpack",
    alias: ['sp', 'stickpack'],
    desc: 'Build and send real WhatsApp sticker packs',
    category: "Tools",
    usage: ".sp <add|push|reset>",
    examples: [
        ".sp add - reply to sticker",
        ".sp push My Pack - send pack",
        ".sp reset - clear session"
    ],
    reactions: { start: '📦', success: '🔖', error: '✘' },

    execute: async (sock, m, { args, reply, prefix }) => {
        await sock.sendMessage(m.chat, { react: { text: '📦', key: m.key } });

        const action = args[0]?.toLowerCase();
        const chatId = m.chat;

        if (!packSession.has(chatId)) packSession.set(chatId, []);
        const stickers = packSession.get(chatId);

        // Show menu if no action
        if (!action ||!['add', 'push', 'reset'].includes(action)) {
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} STICKER PACK*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏ ${prefix}sp add - reply to sticker
│ ❏ ${prefix}sp push <name> - send pack
│ ❏ ${prefix}sp reset - clear session
╰─────────────────────────╯
╭─֎ *CURRENT PACK*
│ ❏ 📦 Stickers: ${stickers.length}
╰─────────────────────────╯`
            );
        }

        if (action === 'reset') {
            packSession.set(chatId, []);
            await sock.sendMessage(m.chat, { react: { text: '🔖', key: m.key } });
            return reply(`✅ _Pack reset!_`);
        }

        if (action === 'add') {
            if (!m.quoted) {
                await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
                return reply(`✘ _Reply to a sticker_`);
            }
            const quoted = m.quoted;
            const mime = quoted.msg?.stickerMessage?.mimetype || quoted.mimetype || '';
            if (!mime.includes('webp')) {
                await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
                return reply(`✘ _Reply to a sticker only_`);
            }
            try {
                const buffer = await downloadQuoted(quoted);
                if (!buffer) return reply(`✘ _Failed to download_`);

                const url = await uploadToCDN(buffer);
                if (!url) return reply(`✘ _Failed to upload_`);

                stickers.push(url);
                packSession.set(chatId, stickers);
                await sock.sendMessage(m.chat, { react: { text: '🔖', key: m.key } });
                return reply(`✅ _Sticker added_ [${stickers.length}]`);
            } catch (err) {
                console.error(`[${BOT_NAME} SP ERROR]`, err.message);
                await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
                return reply(`✘ _Failed to add sticker_`);
            }
        }

        if (action === 'push') {
            if (stickers.length === 0) {
                await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
                return reply(`✘ _No stickers. Use ${prefix}sp add first_`);
            }
            const packName = args.slice(1).join(' ').trim() || `${BOT_NAME} Stickers`;
            try {
                await sock.sendMessage(chatId, {
                    cover: { url: stickers[0] },
                    stickers: stickers.map(url => ({ data: { url } })),
                    name: packName,
                    publisher: BOT_NAME,
                    description: `ⓘ Sticker pack by ${BOT_NAME}`
                }, { quoted: m });

                packSession.set(chatId, []);
                await sock.sendMessage(m.chat, { react: { text: '🔖', key: m.key } });
            } catch (err) {
                console.error(`[${BOT_NAME} SP ERROR]`, err.message);
                await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
                return reply(`✘ _${err.message}_`);
            }
        }
    }
};