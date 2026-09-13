const BOT_NAME = process.env.BOT_NAME || 'XADON AI'; // <- From.env
const fetch = require("node-fetch");

module.exports = {
    name: "meme",
    alias: ["memes", "cheems"],
    category: "fun",
    desc: "Get random Cheems meme with buttons",
    usage: ".meme",
    reactions: {
        start: '💬',
        success: '🤗',
        error: '❌'
    },

    execute: async (sock, m, { reply, prefix }) => {
        try {
            await sock.sendPresenceUpdate("composing", m.key.remoteJid);
            await sock.sendMessage(m.chat, { react: { text: '💬', key: m.key } });

            const response = await fetch(
                "https://shizoapi.onrender.com/api/memes/cheems?apikey=shizo"
            );

            if (!response.ok) throw new Error("API Request Failed");

            const contentType = response.headers.get("content-type");

            if (!contentType || !contentType.includes("image")) {
                throw new Error("Invalid media response");
            }

            const imageBuffer = await response.buffer();

            const buttons = [
                {
                    buttonId: `${prefix}meme`,
                    buttonText: { displayText: "🎭 Another Meme" },
                    type: 1
                },
                {
                    buttonId: `${prefix}joke`,
                    buttonText: { displayText: "😄 Joke" },
                    type: 1
                }
            ];

            const caption = 
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    *֎ • ${BOT_NAME} MEME*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *CHEEMS MEME LOADED*
│ ❏ Source : ShizoAPI
│ ❏ Tap buttons below for more
╰─────────────────────────╯

_*🤗 Powered by ${BOT_NAME}*_`.trim();

            await sock.sendMessage(
                m.key.remoteJid,
                {
                    image: imageBuffer,
                    caption,
                    buttons,
                    headerType: 1
                },
                { quoted: m }
            );

            await sock.sendPresenceUpdate("paused", m.key.remoteJid);
            await sock.sendMessage(m.chat, { react: { text: '🤗', key: m.key } });

        } catch (error) {
            console.error("[MEME ERROR]", error.message);
            await sock.sendPresenceUpdate("paused", m.key.remoteJid);
            await sock.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            reply('_*❌ Failed to fetch meme. API might be down*_');
        }
    }
};