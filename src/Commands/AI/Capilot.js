const axios = require('axios');
const config = require('../../../settings/config');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const GATEWAY_URL = config.api?.gateway || '';
const GATEWAY_TOKEN = config.api?.gatewayToken || '';

module.exports = {
    name: 'copilot',
    alias: ['ghost', 'aihelp'],
    desc: 'Ask GitHub Copilot style AI for coding help',
    category: 'AI',
    usage: '.copilot <query>',
    owner: false,

    execute: async (sock, m, { args, reply }) => {
        const jid = m.key.remoteJid;
        const query = args.join(' ').trim();

        if (!query) {
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            return reply(`✘ ֎ Usage :.copilot <query>\n❏ Example :.copilot create a discord bot in js`);
        }

        await sock.sendMessage(jid, { react: { text: "🤖", key: m.key } });

        try {
            const apiUrl = `${GATEWAY_URL}/ai/copilot?token=${GATEWAY_TOKEN}&text=${encodeURIComponent(query)}`;
            const { data } = await axios.get(apiUrl, { timeout: 60000 });
            
            let answer = data?.result || data?.response || data?.message || data?.reply || data?.text || data;
            
            if (typeof answer === 'object' && answer !== null) {
                if (answer.content) answer = answer.content;
                else if (answer.output) answer = answer.output;
                else answer = JSON.stringify(answer, null, 2);
            }
            
            if (!answer || answer === '[object Object]') {
                await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
                return reply(`✘ ֎ Received an empty response.`);
            }

            const header = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} COPILOT AI •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦`;

            const caption = `${header}
╭─֎ *Query:* ${query}
│
│ ֎ *Answer:*
│ ${answer}
╰─────────────────────────╯
⚡ Powered by AI Gateway`;

            await sock.sendMessage(jid, { text: caption }, { quoted: m });
            await sock.sendMessage(jid, { react: { text: "✓", key: m.key } });

        } catch (err) {
            console.error('[COPILOT ERROR]', err.message);
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });

            if (err.response?.status === 429) {
                return reply(`𓉤 ֎ Rate limit hit. Try again later.`);
            }
            if (err.code === 'ECONNABORTED') {
                return reply(`𓉤 ֎ Request timed out.`);
            }
            reply(`✘ ֎ Copilot failed to respond\n❏ Error : ${err.message}`);
        }
    }
};