const axios = require('axios');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const API_URL = 'https://api.waifu.pics/sfw/bonk';

module.exports = {
    name: 'bonk',
    alias: [],
    desc: 'Bonk someone!',
    category: 'Anime',
    usage: '.bonk @user',
    owner: false,

    execute: async (sock, m, { reply, mentioned }) => {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;

        await sock.sendMessage(jid, { react: { text: '🔨', key: m.key } });

        // Get target: mentioned user or sender
        const target = mentioned?.[0] || sender;
        const targetTag = target === sender
           ? 'themself'
            : '@' + target.split('@')[0];

        try {
            const { data } = await axios.get(API_URL, { timeout: 15000 });
            const imgUrl = data.url;

            await sock.sendMessage(jid, {
                image: { url: imgUrl },
                caption: `🔨 *BONK!* ${targetTag} has been bonked!\n❏ Reason : Going to horny jail\n❏ Source : ${BOT_NAME}`,
                mentions: target === sender? [] : [target]
            }, { quoted: m });

            await sock.sendMessage(jid, { react: { text: '✓', key: m.key } });

        } catch (error) {
            console.error('[BONK ERROR]', error.message);
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            return reply(`✘ ֎ Bonk failed!\n❏ Error : ${error.message}`);
        }
    }
};