const axios = require("axios");
const config = require("../../../settings/config");

const BOT_NAME = process.env.BOT_NAME || 'XADON AI V2';
const GATEWAY_URL = process.env.GATEWAY_URL || config.api?.gateway || 'https://api.crysnovax.link';
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN || config.api?.gatewayToken || '';

// ORIGINAL GATEWAY + 3 PUBLIC FALLBACKS
const AI_APIS = [
    {
        name: 'Xadon Gateway',
        ask: async (query) => {
            const res = await axios.post(
                `${GATEWAY_URL}/chat?token=${encodeURIComponent(GATEWAY_TOKEN)}`,
                { prompt: query, model: 'gpt-4.5' },
                { headers: { 'Content-Type': 'application/json' }, timeout: 60000 }
            );
            return res.data?.response || res.data?.text || res.data?.message || '';
        }
    },
    {
        name: 'Pollinations AI',
        ask: async (query) => {
            const prompt = `You are ${BOT_NAME}, a helpful and intelligent assistant. Be concise and natural. User: ${query}`;
            const res = await axios.post('https://text.pollinations.ai/', {
                messages: [{ role: 'user', content: prompt }],
                model: 'gpt-4o'
            }, { timeout: 45000 });
            return res.data || '';
        }
    },
    {
        name: 'DeepAI Chat',
        ask: async (query) => {
            const res = await axios.post('https://api.deepai.org/api/chat', {
                text: `You are ${BOT_NAME}. ${query}`
            }, {
                headers: { 'Api-Key': 'quickstart-QUdJIGlzIGNvbWluZw==' },
                timeout: 45000
            });
            return res.data?.output || '';
        }
    },
    {
        name: 'Cohere AI',
        ask: async (query) => {
            const res = await axios.post('https://api.cohere.ai/v1/chat', {
                message: query,
                model: 'command-r'
            }, {
                headers: { 'Authorization': 'Bearer free-trial-key' },
                timeout: 45000
            });
            return res.data?.text || '';
        }
    }
];

module.exports = {
    name: 'luna',
    alias: ['ai', 'ask', 'lunachat'],
    category: 'AI',
    desc: `${BOT_NAME} Luna AI Text with 4 API fallbacks`,
    usage: '.luna <question>',
    owner: false,

    execute: async (sock, m, { args, reply }) => {
        const jid = m.key.remoteJid;
        const query = args.join(' ').trim();

        if (!query) {
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            return reply(`✘ ❏ Usage : *.luna <question>*\n❏ Example : *.luna explain black holes*`);
        }

        await sock.sendMessage(jid, { react: { text: '🌙', key: m.key } });

        let replyText = '';
        let sourceUsed = '';

        // Try all 4 APIs - CRYSNOVA FIRST
        for (let i = 0; i < AI_APIS.length; i++) {
            try {
                console.log(`[LUNA] Trying ${AI_APIS[i].name}`);
                const text = await AI_APIS[i].ask(query);
                if (text && text.trim().length > 3) {
                    replyText = text;
                    sourceUsed = AI_APIS[i].name;
                    break;
                }
            } catch (e) {
                console.log(`[LUNA] ${AI_APIS[i].name} failed:`, e.message);
                continue;
            }
        }

        if (!replyText) {
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            return reply(`✘ ❏ Luna failed\n❏ All 4 APIs failed. Try again later`);
        }

        await sock.sendMessage(jid, {
            text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} LUNA AI •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *Question:* ${query}\n│\n│ ❏ *Answer:*\n│ ${replyText.split('\n').join('\n│ ')}\n╰─────────────────────────╯\n❏ Source: ${sourceUsed}\n❏ Powered by ${BOT_NAME}`
        }, { quoted: m });

        await sock.sendMessage(jid, { react: { text: "✓", key: m.key } });

    } catch (err) {
        console.error('[LUNA ERROR]', err.message);
        await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
        reply(`✘ ❏ Luna failed\n❏ Reason : ${err.message}`);
    }
}
};