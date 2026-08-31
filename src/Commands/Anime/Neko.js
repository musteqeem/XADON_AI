const axios = require('axios');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const API_URL = 'https://api.waifu.pics/sfw/neko';

module.exports = {
    name: 'neko',
    alias: ['nekogirl', 'catgirl'],
    desc: 'Get random neko (catgirl) images',
    category: 'Anime',
    usage: '.neko',
    owner: false,

    execute: async (sock, m, { reply }) => {
        const jid = m.key.remoteJid;

        await sock.sendMessage(jid, { react: { text: "😺", key: m.key } });

        try {
            for (let i = 0; i < 5; i++) {
                const { data } = await axios.get(API_URL, { timeout: 15000 });
                const imgUrl = data?.url;

                if (!imgUrl) continue;

                await sock.sendMessage(jid, {
                    image: { url: imgUrl },
                    caption: i === 0
                        ? `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} NEKO •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *IMAGE ${i + 1}/5*
│ ❏ Category : SFW Catgirl
│ ❏ Source : waifu.pics
╰─────────────────────────╯`
                        : `֎ *IMAGE ${i + 1}/5*`
                }, { quoted: i === 0? m : undefined });

                // delay to prevent rate limit
                if (i < 4) await new Promise(r => setTimeout(r, 600));
            }

            await sock.sendMessage(jid, { react: { text: "✓", key: m.key } });

        } catch (error) {
            console.error('[NEKO ERROR]', error.message);
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            return reply(`✘ ֎ Failed to fetch neko images\n❏ Error : ${error.message}`);
        }
    }
};