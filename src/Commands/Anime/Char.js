const axios = require('axios');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: "char",
    alias: ["char","aimg"],
    desc: "Search anime characters & images",
    category: "Anime",
    usage: ".char <name>",

    async execute(sock, m, { args, reply }) {
        const jid = m.key.remoteJid;
        
        try {
            if (!args.length) {
                await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
                return reply(`✘ ֎ Missing query\n❏ Usage :.char <character name>\n❏ Example :.char Naruto`);
            }

            const query = args.join(' ');
            await sock.sendMessage(jid, { react: { text: "🔍", key: m.key } });

            // ───── CHARACTER SEARCH JIKAN ─────
            const charRes = await axios.get(`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(query)}&limit=5`, { timeout: 15000 });

            if (!charRes.data?.data?.length) {
                await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
                return reply(`✘ ֎ Character not found\n❏ Query : ${query}`);
            }

            // pick random character
            const char = charRes.data[Math.floor(Math.random() * charRes.data.length)];

            const name = char.name || 'Unknown';
            const about = char.about? char.about.slice(0, 350).replace(/\[.*?\]/g, '') + '...' : 'No description available';
            const fav = char.favorites || 0;
            const img = char.images?.jpg?.image_url;

            // ───── IMAGE SEARCH DANBOORU ─────
            let randomImage = img;
            try {
                const imgRes = await axios.get(`https://danbooru.donmai.us/posts.json`, {
                    params: { tags: `${query} rating:safe`, limit: 5 },
                    timeout: 15000
                });

                if (imgRes.data?.length) {
                    const pick = imgRes.data[Math.floor(Math.random() * imgRes.data.length)];
                    randomImage = pick.file_url || pick.large_file_url || img;
                }
            } catch { /* ignore danbooru fail */ }

            const caption = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} CHARACTER •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *${name}*
│ ❏ Favorites : ${fav}
│ ❏ Search : ${query}
│ 
│ ${about}
╰─────────────────────────╯`;

            await sock.sendMessage(jid, {
                image: { url: randomImage },
                caption
            }, { quoted: m });

            await sock.sendMessage(jid, { react: { text: "✓", key: m.key } });

        } catch (err) {
            console.error('[CHAR ERROR]', err.message);
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            reply(`✘ ֎ Failed to fetch anime data\n❏ Error : ${err.message}`);
        }
    }
};