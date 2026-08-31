const axios = require('axios');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const API_URL = 'https://api.jikan.moe/v4/random/manga';

module.exports = {
    name: 'rmanga',
    alias: ['randommanga', 'mangarand', 'mangarandom'],
    desc: 'Get a random manga recommendation with details',
    category: 'Weeb',
    usage: '.rmanga',
    owner: false,

    execute: async (sock, m, { reply }) => {
        const jid = m.key.remoteJid;

        await sock.sendMessage(jid, { react: { text: "📚", key: m.key } });

        try {
            const { data } = await axios.get(API_URL, { timeout: 15000 });
            const manga = data?.data;

            if (!manga) {
                await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
                return reply(`✘ ֎ Error retrieving manga data\n❏ API : Jikan may be down`);
            }

            const title = manga.title || 'Unknown';
            const score = manga.score || 'N/A';
            const genres = manga.genres?.map(g => g.name).join(', ') || 'N/A';
            const authors = manga.authors?.map(a => a.name).join(', ') || 'N/A';
            const volumes = manga.volumes || 'N/A';
            const chapters = manga.chapters || 'N/A';
            const status = manga.status || 'Unknown';
            const synopsis = manga.synopsis || 'No synopsis available.';
            const truncated = synopsis.length > 500? synopsis.substring(0, 497) + '...' : synopsis;
            const imageUrl = manga.images?.jpg?.image_url || manga.images?.webp?.image_url || '';
            const moreInfo = manga.url || '';

            const header = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} RANDOM MANGA •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦`;

            const caption = `${header}
╭─֎ *${title}*
│ ❏ Score : ${score}
│ ❏ Genres : ${genres}
│ ❏ Authors : ${authors}
│ ❏ Volumes : ${volumes}
│ ❏ Chapters : ${chapters}
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
            console.error('[RMANGA ERROR]', error.message);
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });

            if (error.code === 'ECONNABORTED') {
                return reply(`✘ ֎ Request timed out\n❏ Try again later`);
            } else if (error.response?.status === 429) {
                return reply(`✘ ֎ Rate limited by Jikan API\n❏ Try again later`);
            } else {
                return reply(`✘ ֎ Error retrieving manga data\n❏ Error : ${error.message}`);
            }
        }
    }
};