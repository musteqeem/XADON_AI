const axios = require("axios");
const config = require("../../../settings/config");

const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const GATEWAY_URL = process.env.GATEWAY_URL || config.api?.gateway || 'https://api.crysnovax.link';
const GATEWAY_TOKEN = process.env.GATEWAY_TOKEN || config.api?.gatewayToken || '';

// 3 FALLBACK APIs - Sharp working
const FALLBACK_APIS = [
    async (prompt) => {
        // Fallback 1: Musteqeem Gateway
        const res = await axios.post(`${GATEWAY_URL}/deepseek?token=${encodeURIComponent(GATEWAY_TOKEN)}`,
            { query: prompt },
            { headers: { 'Content-Type': 'application/json' }, timeout: 60000 }
        );
        if (res.data?.success && res.data?.message?.content) return res.data.message.content;
        throw new Error('Primary API failed');
    },
    async (prompt) => {
        // Fallback 2: Gemini Flash Free
        const res = await axios.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyDummyKey',
            { contents: [{ parts: [{ text: prompt }] }] },
            { timeout: 60000 }
        );
        return res.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    },
    async (prompt) => {
        // Fallback 3: OpenAI GPT-3.5 Free Proxy
        const res = await axios.post('https://api.musteqeem.ai/v1/chat/completions',
            { model: "gpt-3.5-turbo", messages: [{ role: "user", content: prompt }] },
            { headers: { 'Authorization': 'Bearer musteqeem-free' }, timeout: 60000 }
        );
        return res.data?.choices?.[0]?.message?.content || '';
    }
];

async function askAI(query) {
    let lastError = null;
    for (let i = 0; i < FALLBACK_APIS.length; i++) {
        try {
            const result = await FALLBACK_APIS[i](query);
            if (result && result.trim().length > 0) {
                return { result, source: i + 1 };
            }
        } catch (e) {
            lastError = e.message;
            console.log(`[DEEPSEEK FALLBACK ${i + 1} FAILED]`, e.message);
            continue;
        }
    }
    throw new Error(lastError || 'All AI APIs failed');
}

module.exports = {
    name: "deepseek",
    alias: ["ds", "ask", "ai2"],
    category: "AI",
    desc: `${BOT_NAME} Deepseek with 3 fallback APIs`,
    usage: ".deepseek <question>",
    owner: false,

    execute: async (sock, m, { args, reply }) => {
        const jid = m.key.remoteJid;
        const query = args.join(" ").trim();

        if (!query) {
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            return reply(`✘ ❏ Usage : *.deepseek <question>*\n❏ Example : *.deepseek explain quantum physics*`);
        }

        await sock.sendMessage(jid, { react: { text: "🤖", key: m.key } });

        try {
            const { result, source } = await askAI(query);

            if (!result) throw new Error('Empty response');

            const sources = ['Musteqeem Gateway', 'Gemini Flash', 'GPT-3.5 Proxy'];

            const header = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} DEEPSEEK •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *Question:* ${query}\n│\n│ ❏ *Answer:*\n│`;

            const text = result.length > 1000? result.slice(0, 1000) + '...' : result;
            const formatted = text.split('\n').map(line => `│ ${line}`).join('\n');

            await sock.sendMessage(jid, {
                text: `${header}\n${formatted}\n╰─────────────────────────╯\n❏ Source: ${sources[source - 1]}\n❏ Powered by ${BOT_NAME}`
            }, { quoted: m });

            await sock.sendMessage(jid, { react: { text: "✓", key: m.key } });

        } catch (err) {
            console.error("[DEEPSEEK ERROR]", err.message);
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            reply(`✘ ❏ AI service error\n❏ Reason : ${err.message}\n❏ Try again later`);
        }
    }
};