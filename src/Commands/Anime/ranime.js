const axios = require('axios');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const API_URL = 'https://api.jikan.moe/v4/random/anime';

module.exports = {
    name: 'ranime',
    alias: ['randomanime', 'animerand', 'animerandom'],
    desc: 'Get a random anime recommendation with details',
    category: 'Weeb',
    usage: '.ranime',
    owner: false,

    execute: async (sock, m, { reply }) => {
        const jid = m.key.remoteJid;

        await sock.sendMessage(jid, { react: { text: "📺", key: m.key } });

        try {
            const { data } = await axios.get(API_URL, { timeout: 15000 });
            const anime = data?.data;

            if (!anime) {
                await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
                return reply(`✘ ֎ Error retrieving anime data\n❏ API : Jikan may be down`);
            }

            const title = anime.title || 'Unknown';
            const score = anime.score || 'N/A';
            const episodes = anime.episodes || 'N/A';
            const genres = anime.genres?.map(g => g.name).join(', ') || 'N/A';
            const rating = anime.rating || 'N/A';
            const status = anime.status || 'Unknown';
            const synopsis = anime.synopsis || 'No synopsis available.';
            const truncated = synopsis.length > 500? synopsis.substring(0, 497) + '...' : synopsis;
            const imageUrl = anime.images?.jpg?.image_url || anime.images?.webp?.image_url || '';
            const moreInfo = anime.url || '';

            const header = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} RANDOM ANIME •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦`;

            const caption = `${header}
╭─֎ *${title}*
│ ❏ Score : ${score}
│ ❏ Episodes : ${episodes}
│ ❏ Genres : ${genres}
│ ❏ Rating : ${rating}
│ ❏ Status : ${status}
│
│ ֎ *Synopsis:*
│ ${truncated}
│
│ ❏ More Info : ${moreInfo}
╰─────────────────────────╯`;

            if (imageUrl) {
                await sock.sendMessage(jid, {
                    image: { url: imageUrl },
                    caption
                }, { quoted: m });
            } else {
                await sock.sendMessage(jid, { text: caption }, { quoted: m });
            }

            await sock.sendMessage(jid, { react: { text: "✓", key: m.key } });

        } catch (error) {
            console.error('[RANIME ERROR]', error.message);
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });

            if (error.code === 'ECONNABORTED') {
                return reply(`✘ ֎ Request timed out\n❏ Try again later`);
            } else if (error.response?.status === 429) {
                return reply(`✘ ֎ Rate limited by Jikan API\n❏ Try again later`);
            } else {
                return reply(`✘ ֎ Error retrieving anime data\n❏ Error : ${error.message}`);
            }
        }
    }
};