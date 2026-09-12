const axios = require('axios');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const API_URL = 'https://api.jikan.moe/v4/random/characters';

module.exports = {
    name: 'rchar',
    alias: ['randomchar', 'animechar', 'char'],
    desc: 'Get a random anime character with details',
    category: 'Weeb',
    usage: '.rchar',
    owner: false,

    execute: async (sock, m, { reply }) => {
        const jid = m.key.remoteJid;

        await sock.sendMessage(jid, { react: { text: "👤", key: m.key } });

        try {
            const { data } = await axios.get(API_URL, { timeout: 15000 });
            const char = data?.data;

            if (!char) {
                await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
                return reply(`✘ ֎ Error retrieving character data\n❏ API : Jikan may be down`);
            }

            const name = char.name || 'Unknown';
            const nameKanji = char.name_kanji ? ` (${char.name_kanji})` : '';
            const about = char.about || 'No description available.';
            const fav = char.favorites || 'N/A';
            const imageUrl = char.images?.jpg?.image_url || char.images?.webp?.image_url || '';
            const moreInfo = char.url || '';
            
            // Get top 5 anime appearances
            const animeList = char.anime?.slice(0, 5)
                .map(a => `• ${a.anime.title} (${a.role})`)
                .join('\n') || 'None listed';

            const truncated = about.length > 400? about.substring(0, 397) + '...' : about;

            const header = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} RANDOM CHARACTER •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦`;

            const caption = `${header}
╭─֎ *${name}${nameKanji}*
│ ❏ Favorites : ${fav}
│
│ ֎ *Appears in:*
${animeList}
│
│ ֎ *About:*
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
            console.error('[RCHAR ERROR]', error.message);
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });

            if (error.code === 'ECONNABORTED') {
                return reply(`✘ ֎ Request timed out\n❏ Try again later`);
            } else if (error.response?.status === 429) {
                return reply(`✘ ֎ Rate limited by Jikan API\n❏ Try again later`);
            } else {
                return reply(`✘ ֎ Error retrieving character data\n❏ Error : ${error.message}`);
            }
        }
    }
};