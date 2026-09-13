const axios = require('axios');
const config = require('../../../settings/config');

const GATEWAY_URL = config.api?.gateway || 'https://api.crysnovax.link';
const GATEWAY_TOKEN = config.api?.gatewayToken || '';

module.exports = {
    name: 'animesearch',
    alias: ['anisearch', 'findanime'],
    desc: 'Search for anime with beautiful swipeable cards',
    category: 'Anime',
    usage: '.animesearch <title>',
    reactions: { start: '🔍', success: '✨', error: '❔' },

    execute: async (sock, m, { args, reply }) => {
        await sock.sendMessage(m.chat, { react: { text: '🔍', key: m.key } });

        const query = args.join(' ').trim();
        if (!query) {
            await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
     • ANIME SEARCH •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏.animesearch <title>
│
│ ❏ *EXAMPLE*
│ •.animesearch naruto
╰─────────────────────────╯`
            );
        }

        try {
            const res = await axios.get(`${GATEWAY_URL}/anime/animesearch?token=${GATEWAY_TOKEN}&query=${encodeURIComponent(query)}`);
            const data = res.data;
            const results = data?.data?.results;

            if (!Array.isArray(results) || results.length === 0) {
                await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
                return reply(`❏ No results found for "${query}"`);
            }

            // Build interactive carousel cards
            const cards = results.slice(0, 10).map(anime => ({
                image: { url: anime.image },
                caption: `🎬 *${anime.title}*\n📺 ${anime.type} | ${anime.status} | ${anime.episode}`,
                footer: `⚡ AI Gateway`,
                nativeFlow: [{
                    text: '🔖 Open Link',
                    url: anime.url
                }, {
                    text: '📋 Copy Title',
                    copy: anime.title
                }]
            }));

            await sock.sendMessage(m.chat, {
                text: `◈ *ANIME SEARCH: ${query}*`,
                footer: `Found ${results.length} results ֎`,
                cards: cards
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });
            
        } catch (err) {
            console.error('[ANIMESEARCH]', err.message);
            
            // Fallback to simple image messages
            try {
                const results = (await axios.get(`${GATEWAY_URL}/anime/animesearch?token=${GATEWAY_TOKEN}&query=${encodeURIComponent(query)}`)).data?.data?.results || [];
                for (const anime of results.slice(0, 5)) {
                    await sock.sendMessage(m.chat, {
                        image: { url: anime.image },
                        caption: `🎬 *${anime.title}*\n📺 ${anime.type} | ${anime.status}\n🔗 ${anime.url}\n\n_⚡ XADON AI Gateway_`
                    }, { quoted: m });
                    await new Promise(r => setTimeout(r, 300));
                }
                await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });
            } catch (fallbackErr) {
                await sock.sendMessage(m.chat, { react: { text: '❔', key: m.key } });
                reply('❏ Search failed. Please try again later.');
            }
        }
    }
};