const axios = require('axios');
const config = require('../../../settings/config');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const GATEWAY_URL = config.api?.gateway || 'https://api.crysnovax.link';
const GATEWAY_TOKEN = config.api?.gatewayToken || '';

module.exports = {
    name: 'chateverywhere',
    alias: ['ce', 'freechat'],
    desc: 'Chat with free AI - no limits',
    category: 'AI',
    usage: '.ce <message>',
    owner: false,

    execute: async (sock, m, { args, reply }) => {
        const jid = m.key.remoteJid;
        const text = args.join(' ').trim();

        if (!text) {
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            return reply(`✘ ֎ Usage :.ce <message>\n❏ Example :.ce Explain black holes`);
        }

        await sock.sendMessage(jid, { react: { text: "💬", key: m.key } });

        try {
            const apiUrl = `${GATEWAY_URL}/ai/chateverywhere?token=${GATEWAY_TOKEN}&text=${encodeURIComponent(text)}`;
            const { data } = await axios.get(apiUrl, { timeout: 60000 });
            
            let response = data?.message || data?.reply || data?.response || data?.result || data?.text;
            
            if (typeof response === 'object' && response !== null) {
                response = response.content || response.output || JSON.stringify(response, null, 2);
            }
            
            if (!response || response === '[object Object]') {
                await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
                return reply(`✘ ֎ Received an empty response.`);
            }

            const header = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} CHAT EVERYWHERE •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦`;

            const caption = `${header}
╭─֎ *You:* ${text}
│
│ ֎ *AI:*
│ ${response}
╰─────────────────────────╯
⚡ Powered by AI Gateway`;

            await sock.sendMessage(jid, { text: caption }, { quoted: m });
            await sock.sendMessage(jid, { react: { text: "✓", key: m.key } });

        } catch (err) {
            console.error('[CE ERROR]', err.message);
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });

            if (err.response?.status === 429) {
                return reply(`𓉤 ֎ Rate limit hit. Try again in 1 minute.`);
            }
            if (err.code === 'ECONNABORTED') {
                return reply(`𓉤 ֎ Request timed out.`);
            }
            reply(`✘ ֎ Chat failed\n❏ Error : ${err.message}`);
        }
    }
};