const axios = require('axios');
const config = require('../../../settings/config');

const GATEWAY_URL = config.api?.gateway || '';
const GATEWAY_TOKEN = config.api?.gatewayToken || '';

module.exports = {
    name: 'lyrics',
    alias: ['lyric', 'songtext'],
    desc: 'Search for song lyrics',
    category: 'Search',
    usage: '.lyrics <song title>',
    reactions: { start: '🎵', success: '✨', error: '❔' },

    execute: async (sock, m, { args, reply }) => {
        await sock.sendMessage(m.chat, { react: { text: '🎵', key: m.key } });

        const title = args.join(' ').trim();
        if (!title) {
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
         • LYRICS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏.lyrics <song title>
│
│ ❏ *EXAMPLE*
│ •.lyrics die with a smile
╰─────────────────────────╯`
            );
        }

        try {
            const res = await axios.get(`${GATEWAY_URL}/search/lyrics?token=${GATEWAY_TOKEN}&title=${encodeURIComponent(title)}`);
            const data = res.data;

            // Extract lyrics from the response
            let lyricsText = '';
            let artist = '';
            let songTitle = '';

            if (data.data) {
                lyricsText = data.data.lyrics || '';
                artist = data.data.artist || '';
                songTitle = data.data.title || title;
            } else if (data.lyrics) {
                lyricsText = data.lyrics;
            } else if (typeof data === 'string') {
                lyricsText = data;
            }

            if (!lyricsText) {
                await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
                return reply(`❏ No lyrics found for "${title}"`);
            }

            // Trim if too long for WhatsApp (max ~4000 chars)
            if (lyricsText.length > 3500) {
                lyricsText = lyricsText.slice(0, 3500) + '...';
            }

            let text = `◈ *${artist || 'Unknown'}* - *${songTitle || title}*\n\n`;
            text += lyricsText;
            text += `\n\n_⚡ Powered by XADON AI ֎_`;

            await sock.sendMessage(m.chat, { text }, { quoted: m });
            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });

        } catch (err) {
            console.error('[LYRICS]', err.message);
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
            reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
        • LYRICS •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *ERROR*
│ ❏ Failed to fetch lyrics
│
│ ❏ *NOTE*
│ • Check song title or try again later
╰─────────────────────────╯`
            );
        }
    }
};