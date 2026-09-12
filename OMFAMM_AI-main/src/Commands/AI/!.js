const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const config = require('../../../settings/config');

const CDN_URL = config.api?.cdn || '';
const GATEWAY_TOKEN = config.api?.gatewayToken || '';
const HISTORY_PATH = path.join(process.cwd(), 'database', 'gema-history.json');
const GEMINI_API = 'https://api.zenzxz.my.id/ai/gemini?';

// Create history file if not exists
if (!fs.existsSync(HISTORY_PATH)) {
    fs.writeFileSync(HISTORY_PATH, '{}');
}

const getHistory = () => JSON.parse(fs.readFileSync(HISTORY_PATH));
const saveHistory = (data) => fs.writeFileSync(HISTORY_PATH, JSON.stringify(data, null, 2));

// Upload image to CDN for gemini vision
async function uploadToCDN(buffer) {
    if (!CDN_URL ||!GATEWAY_TOKEN) return null;
    try {
        const form = new FormData();
        form.append('file', buffer, { filename: 'image.jpg', contentType: 'image/jpeg' });
        const res = await axios.post(`${CDN_URL}/upload?token=${GATEWAY_TOKEN}`, form, {
            headers: form.getHeaders(),
            timeout: 30000
        });
        return res.data?.url || res.data?.link || res.data?.file || null;
    } catch {
        return null;
    }
}

module.exports = {
    name: 'gema',
    alias: ['gemini', 'gem'],
    category: 'AI',
    desc: 'Chat with Gemini AI - supports image analysis and memory',
    usage: '.gema <message> |.gema reset',
    owner: false,

    execute: async (sock, m, { args, reply, prefix }) => {
        const jid = m.key.remoteJid;
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const input = args.join(' ').trim().toLowerCase();

        // Reset memory
        if (input === 'reset') {
            const history = getHistory();
            delete history[jid];
            saveHistory(history);
            return reply(`✦ ֎ Gema memory cleared for this chat`);
        }

        const prompt = args.join(' ').trim();
        if (!prompt) {
            return reply(`✘ ֎ Usage : ${prefix}gema <message>\n${prefix}gema reset\n\n❏ Features:\n▸ Chat with Gemini AI\n▸ Remembers conversation\n▸ Supports image analysis\n\n─────────────────\n✦ ${BOT_NAME} GEMA AI`);
        }

        await sock.sendPresenceUpdate('composing', jid);
        await sock.sendMessage(jid, { react: { text: "🔖", key: m.key } });

        try {
            let imageUrl = null;
            // Check if replying to image
            const messageType = quoted || m.message;
            const msgContent = messageType?.imageMessage;
            if (msgContent) {
                const buffer = await msgContent.download();
                if (buffer && buffer.length > 0) {
                    imageUrl = await uploadToCDN(buffer).catch(() => null);
                }
            }

            // Load chat history
            const historyData = getHistory();
            const chatHistory = historyData[jid] || [];

            const params = new URLSearchParams({
                prompt: prompt,
                mode: 'chat',
                aspect_ratio: '1:1'
            });

            if (imageUrl) params.append('image_url', imageUrl);
            if (chatHistory.length > 0) params.append('history', JSON.stringify(chatHistory));

            const { data } = await axios.get(`${GEMINI_API}${params.toString()}`, { timeout: 60000 });

            if (!data?.status) {
                await sock.sendMessage(jid, { react: { text: "❔", key: m.key } });
                return reply(`✘ ֎ Gema failed to respond`);
            }

            const responseText = data?.result?.text || data?.result || data?.message || '';
            if (!responseText) {
                await sock.sendMessage(jid, { react: { text: "❔", key: m.key } });
                return reply(`✘ ֎ Empty response from Gema`);
            }

            // Save new history if provided
            if (data?.result?.history) {
                historyData[jid] = data.result.history;
                if (historyData[jid].length > 20) {
                    historyData[jid] = historyData[jid].slice(-20); // keep last 20
                }
                saveHistory(historyData);
            }

            const header = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} GEMA AI •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦`;

            const caption = `${header}
╭─֎ *You:* ${prompt}
│
│ ֎ *Gema:*
│ ${responseText}
╰─────────────────────────╯`;

            await sock.sendMessage(jid, { text: caption, mentions: [m.key.participant || m.key.remoteJid] }, { quoted: m });
            await sock.sendMessage(jid, { react: { text: "✓", key: m.key } });

        } catch (error) {
            console.error('[GEMA ERROR]', error.message);
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });

            if (error.response?.status === 429) {
                return reply(`𓉤 ֎ Rate limit exceeded. Try again later.`);
            }
            if (error.response?.status === 500) {
                return reply(`𓉤 ֎ Gema server unavailable.`);
            }
            if (error.code === 'ECONNABORTED') {
                return reply(`𓉤 ֎ Request timed out.`);
            }
            reply(`✘ ֎ Error : ${error.message || 'Unknown error'}`);
        }
    }
};