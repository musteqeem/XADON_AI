const axios = require('axios');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const API_URL = 'https://smiling-hosiery-bear.cyclic.app/weeb/couplepp';

module.exports = {
    name: 'couplepp',
    alias: ['couple', 'cp', 'matchpp'],
    desc: 'Get matching couple profile pictures',
    category: 'Weeb',
    usage: '.couplepp',
    owner: false,

    execute: async (sock, m, { reply }) => {
        const jid = m.key.remoteJid;

        await sock.sendMessage(jid, { react: { text: '💞', key: m.key } });

        try {
            await reply(`💞 *Finding your match...* _she/he might not love you :) _`);

            const { data } = await axios.get(API_URL, { timeout: 15000 });
            const maleImg = data.male;
            const femaleImg = data.female;

            // Send Him first
            await sock.sendMessage(jid, {
                image: { url: maleImg },
                caption: `😄 *For Him*\n❏ Source : ${BOT_NAME} CouplePP`
            }, { quoted: m });

            await new Promise(r => setTimeout(r, 800));

            // Send Her
            await sock.sendMessage(jid, {
                image: { url: femaleImg },
                caption: `🤗 *For Her*\n❏ Source : ${BOT_NAME} CouplePP`
            });

            await sock.sendMessage(jid, { react: { text: '✓', key: m.key } });

        } catch (error) {
            console.error('[COUPLEPP ERROR]', error.message);
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            return reply(`✘ ֎ Failed to fetch couple PPs\n❏ Error : Maybe love is dead\n❏ Source : API may be down`);
        }
    }
};