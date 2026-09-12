const axios = require('axios');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const API_URL = 'https://api.waifu.pics/sfw/megumin';

module.exports = {
    name: 'megumin',
    alias: ['megumeme', 'explosion'],
    desc: 'Get random Megumin (Konosuba) images',
    category: 'Anime',
    usage: '.megumin',
    owner: false,

    execute: async (sock, m, { reply }) => {
        const jid = m.key.remoteJid;

        await sock.sendMessage(jid, { react: { text: '💥', key: m.key } });

        try {
            for (let i = 0; i < 5; i++) {
                const { data } = await axios.get(API_URL, { timeout: 15000 });
                const imgUrl = data.url;

                await sock.sendMessage(jid, {
                    image: { url: imgUrl },
                    caption: i === 0 
                        ? `💥 *${BOT_NAME} - EXPLOSION! Megumin*\n❏ Image : 1/5\n❏ Source : waifu.pics`
                        : `❏ Image : ${i + 1}/5`
                }, { quoted: i === 0 ? m : undefined });

                // delay to avoid rate limit
                if (i < 4) await new Promise(r => setTimeout(r, 500));
            }

            await sock.sendMessage(jid, { react: { text: '✓', key: m.key } });

        } catch (error) {
            console.error('[MEGUMIN ERROR]', error.message);
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            return reply(`✘ ֎ Failed to fetch Megumin images\n❏ Error : EXPLOSION failed\n❏ Source : waifu.pics may be down`);
        }
    }
};