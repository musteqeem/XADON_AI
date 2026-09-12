const axios = require('axios');
const config = require('../../../settings/config');
const BOT_NAME = config.botname || process.env.BOTNAME || process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: 'wallpaper',
    alias: ['wlp', 'wall'],
    desc: 'Search for beautiful wallpapers',
    category: 'Search',
    usage: '.wallpaper <query>',

    execute: async (sock, m, { args, reply }) => {
        const query = args.join(' ').trim();
        if (!query) return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ *${BOT_NAME} WALLPAPER*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE GUIDE*
│ ❏ Command :.wallpaper <query>
│ ❏ Example :.wallpaper anime
│ ❏ Example :.wallpaper nature 4k
╰─────────────────────────╯`
        );

        try {
            await sock.sendMessage(m.chat, { react: { text: '🖼️', key: m.key } });
            
            const res = await axios.get(`https://wallpaper.crysnovax.link/api/search?query=${encodeURIComponent(query)}`);
            const data = res.data;
            const results = data?.results;

            if (!Array.isArray(results) || results.length === 0) {
                return reply(`✘ No wallpapers found for "*${query}*"\n\n*Contact:* <bot owner number>`);
            }

            // Build interactive carousel cards (max 10 cards)
            const cards = results.slice(0, 10).map(wp => ({
                image: { url: wp.proxy },
                caption: `🖼️ *Wallpaper*\n🔍 Query: ${query}`,
                footer: `֎ ${BOT_NAME} Vault`,
                nativeFlow: [{
                    text: '📥 Download',
                    url: wp.proxy
                }, {
                    text: '📋 Copy URL',
                    copy: wp.proxy
                }]
            }));

            // Send as interactive carousel message
            await sock.sendMessage(m.chat, {
                text: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n    ֎ *${BOT_NAME} WALLPAPER*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n\n🔍 *Query:* ${query}\n📊 *Found:* ${results.length} results`,
                footer: `_Powered by ${BOT_NAME}_`,
                cards: cards
            }, { quoted: m });

            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });
            
        } catch (err) {
            console.error('[WALLPAPER]', err.message);
            
            // Fallback to simple image messages if carousel fails
            try {
                const res = await axios.get(`https://wallpaper.musteqeem.link/api/search?query=${encodeURIComponent(query)}`);
                const results = res.data?.results || [];
                for (const wp of results.slice(0, 5)) {
                    await sock.sendMessage(m.chat, {
                        image: { url: wp.proxy },
                        caption: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n    ֎ *${BOT_NAME} WALLPAPER*\n✦ ───── ⋆⋅☆⋅⋆ ───── ✦\n\n🖼️ *Query:* ${query}\n\n_Powered by ${BOT_NAME}_`
                    }, { quoted: m });
                    await new Promise(r => setTimeout(r, 300));
                }
            } catch (fallbackErr) {
                reply(`✘ Search failed entirely.\n*Support:* <bot owner number>`);
            }
        }
    }
};