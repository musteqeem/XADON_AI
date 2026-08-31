const axios = require("axios");

const BOT_NAME = process.env.BOT_NAME || 'XADON AI V2';

// PRIMARY + 3 FALLBACK APIs
const AI_GATEWAYS = [
    { name: 'Musteqeem Apex', url: 'https://appex.musteqeem.link', token: process.env.AI_TOKEN || 'x' },
    { name: 'Musteqeem AI', url: 'https://api.musteqeem.link', token: process.env.GATEWAY_TOKEN || '' },
    { name: 'Gemini Free', url: 'https://generativelanguage.googleapis.com/v1beta', token: 'AIzaSyDummyKey' },
    { name: 'GPT Proxy', url: 'https://api.musteqeem.ai/v1', token: 'musteqeem-free' }
];

async function askAI(query, gateway) {
    if (gateway.url.includes('gemini')) {
        // Google Gemini API
        const res = await axios.post(`${gateway.url}/models/gemini-1.5-flash:generateContent?key=${gateway.token}`, {
            contents: [{ parts: [{ text: `You are ${BOT_NAME}, a helpful, intelligent, and professional assistant. Be concise, accurate, and natural. User: ${query}` }] }]
        }, { timeout: 45000 });
        return res.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    if (gateway.url.includes('v1')) {
        // OpenAI style
        const res = await axios.post(`${gateway.url}/chat/completions`, {
            model: "gpt-3.5-turbo",
            messages: [{ role: "system", content: `You are ${BOT_NAME}, a helpful assistant.` }, { role: "user", content: query }]
        }, { headers: { 'Authorization': `Bearer ${gateway.token}` }, timeout: 45000 });
        return res.data?.choices?.[0]?.message?.content || '';
    }

    // Musteqeem Gateway style
    const res = await axios.get(`${gateway.url}/ai/gemini?text=${encodeURIComponent(query)}&token=${gateway.token}`, { timeout: 45000 });
    return res.data?.result || res.data?.response || '';
}

async function askWithFallback(query) {
    let lastError = null;
    for (let i = 0; i < AI_GATEWAYS.length; i++) {
        try {
            const result = await askAI(query, AI_GATEWAYS[i]);
            if (result && result.trim().length > 5) {
                return { result, source: AI_GATEWAYS[i].name };
            }
        } catch (e) {
            lastError = e.message;
            console.log(`[GEMINI FALLBACK ${i + 1} FAILED]`, e.message);
            continue;
        }
    }
    throw new Error(lastError || 'All AI APIs failed');
}

module.exports = {
    name: "gemini",
    alias: ["gchat", "gemgpt", "gem"],
    category: "AI",
    desc: `${BOT_NAME} Gemini AI with 4 fallback APIs`,
    usage: ".gemini <question>",
    owner: false,

    execute: async (sock, m, { args, reply }) => {
        const jid = m.key.remoteJid;
        const query = args.join(" ").trim();

        if (!query) {
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            return reply(`✘ ❏ Usage : *.gemini <question>*\n❏ Example : *.gemini explain black holes*`);
        }

        await sock.sendMessage(jid, { react: { text: "🧠", key: m.key } });

        try {
            const { result, source } = await askWithFallback(query);

            // Clean up any roleplay/flirty remnants
            const cleanText = result
               .replace(/handsome|darling|sweetie|honey|babe|cushy/gi, '')
               .trim();

            await sock.sendMessage(jid, {
                text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} GEMINI •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *Question:* ${query}\n│\n│ ❏ *Answer:*\n│ ${cleanText.split('\n').join('\n│ ')}\n╰─────────────────────────╯\n❏ Source: ${source}\n❏ Powered by ${BOT_NAME}`
            }, { quoted: m });

            await sock.sendMessage(jid, { react: { text: "✓", key: m.key } });

        } catch (err) {
            console.error("[GEMINI ERROR]", err.message);
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            reply(`✘ ❏ AI failed\n❏ Reason : ${err.message}\n❏ Try again later`);
        }
    }
};