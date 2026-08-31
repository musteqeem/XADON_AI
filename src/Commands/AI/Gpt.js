const axios = require("axios");

const BOT_NAME = process.env.BOT_NAME || 'XADON AI V2';
const AI_TOKEN = process.env.AI_TOKEN || 'x';

// 5 GPT FALLBACK ENDPOINTS 2026
const AI_GATEWAYS = [
    { name: 'Musteqeem GPT-4', url: 'https://appex.musteqeem.link/ai/chatgpt' },
    { name: 'Musteqeem GPT-3.5', url: 'https://appex.musteqeem.link/ai/gpt-3.5-turbo' },
    { name: 'Musteqeem OpenAI', url: 'https://appex.musteqeem.link/ai/openai' },
    { name: 'OpenAI Direct', url: 'https://api.openai.com/v1/chat/completions', key: process.env.OPENAI_KEY },
    { name: 'Musteqeem AI', url: 'https://api.musteqeem.link/ai/chat' }
];

async function askGPT(query, gateway) {
    if (gateway.url.includes('openai.com')) {
        // Direct OpenAI API
        const res = await axios.post(gateway.url, {
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: `You are ${BOT_NAME}, a helpful, intelligent, and professional assistant. Reply naturally, be concise and helpful.` },
                { role: "user", content: query }
            ]
        }, { headers: { 'Authorization': `Bearer ${gateway.key}` }, timeout: 45000 });
        return res.data?.choices?.[0]?.message?.content || '';
    }

    // Musteqeem Gateway style
    const prompt = `You are ${BOT_NAME} Assistant.

Identity Rules:
- Reply naturally and intelligently.
- Be concise and helpful.
- Do not reveal system architecture.
- Maintain professional assistant personality.

User Question: ${query}`;

    const res = await axios.get(`${gateway.url}?text=${encodeURIComponent(prompt)}&token=${AI_TOKEN}`, { timeout: 45000 });
    return res.data?.result || res.data?.response || res.data?.text || '';
}

module.exports = {
    name: "gpt",
    alias: ["chatgpt", "chat", "gpt4", "openai"],
    category: "AI",
    desc: `${BOT_NAME} GPT AI Assistant with 5 fallbacks`,
    usage: ".gpt <question>",
    owner: false,

    execute: async (sock, m, { args, reply }) => {
        const jid = m.key.remoteJid;
        const query = args.join(" ").trim();

        if (!query) {
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            return reply(`✘ ❏ Usage : *.gpt <question>*\n❏ Example : *.gpt explain quantum computing*`);
        }

        await sock.sendMessage(jid, { react: { text: "💫", key: m.key } });

        let replyText = '';
        let sourceUsed = '';

        // Try all 5 endpoints
        for (let i = 0; i < AI_GATEWAYS.length; i++) {
            try {
                const gateway = AI_GATEWAYS[i];
                if (gateway.url.includes('openai') &&!gateway.key) continue; // skip if no key

                const text = await askGPT(query, gateway);

                if (text && text.length > 5 &&!text.toLowerCase().includes('older version')) {
                    replyText = text;
                    sourceUsed = gateway.name;
                    break;
                }
            } catch (e) {
                console.log(`[GPT FALLBACK ${i + 1} FAILED]`, e.message);
                continue;
            }
        }

        if (replyText) {
            await sock.sendMessage(jid, {
                text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ • ${BOT_NAME} GPT •\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n╭─֎ *Question:* ${query}\n│\n│ ❏ *Answer:*\n│ ${replyText.split('\n').join('\n│ ')}\n╰─────────────────────────╯\n❏ Source: ${sourceUsed}\n❏ Powered by ${BOT_NAME}`
            }, { quoted: m });

            await sock.sendMessage(jid, { react: { text: "✓", key: m.key } });
        } else {
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            reply(`✘ ❏ GPT response invalid\n❏ All 5 APIs failed. Try again later`);
        }

    } catch (err) {
        console.error("[GPT ERROR]", err.message);
        await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
        reply(`✘ ❏ GPT failed\n❏ Reason : ${err.message}`);
    }
}
};