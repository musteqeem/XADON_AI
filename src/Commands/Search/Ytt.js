const axios = require('axios');
const BOT_NAME = process.env.BOT_NAME || process.env.BOTNAME || 'XADON AI';

module.exports = [{
    name: 'ytranscript',
    alias: ['yttext','yttranscript'],
    category: 'Tools',
    desc: 'Get transcript/subtitles from YouTube video',
    usage: '.ytranscript <youtube url>',
    reactions: { start: '📜', success: '💬' },

    execute: async (sock, m, { args, reply }) => {
        const url = args[0]?.trim();
        if (!url) return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ *${BOT_NAME} YOUTUBE TRANSCRIPT*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE GUIDE*
│ ❏ Command :.ytranscript <youtube url>
│ ❏ Example :.ytranscript https://youtu.be/xxxx
╰─────────────────────────╯`
        );

        try {
            await sock.sendMessage(m.chat, {
                react: { text: '📜', key: m.key }
            });

            const res = await axios.get(`https://apis.prexzyvilla.site/tools/youtube-transcript?url=${encodeURIComponent(url)}`);
            const transcript = res.data?.transcript || res.data?.data || res.data || '';

            if (!transcript || (Array.isArray(transcript) && transcript.length === 0)) {
                return reply(`✘ No transcript found for this video\n*Support:* <bot owner number>`);
            }

            let text;
            if (Array.isArray(transcript)) {
                text = transcript.map(t => t.text || t).join(' ');
            } else {
                text = typeof transcript === 'string'? transcript : JSON.stringify(transcript);
            }

            const header = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n ֎ *${BOT_NAME} YOUTUBE TRANSCRIPT*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n\n`;
            const footer = `\n\n_Powered by ${BOT_NAME}_`;

            // Send in chunks if too long
            if (text.length > 3500) {
                const fullText = header + text + footer;
                const chunks = fullText.match(/.{1,4000}/g);
                for (const chunk of chunks) {
                    await sock.sendMessage(m.chat, { text: chunk }, { quoted: m });
                    await new Promise(r => setTimeout(r, 300));
                }
            } else {
                await sock.sendMessage(m.chat, {
                    text: header + text + footer
                }, { quoted: m });
            }

            await sock.sendMessage(m.chat, {
                react: { text: '💬', key: m.key }
            });

        } catch (err) {
            console.error('[YTRANSCRIPT]', err.message);
            reply(`✘ Transcript fetch failed\n*Contact:* <bot owner number>`);
        }
    }
}];