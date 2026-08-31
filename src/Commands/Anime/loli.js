const axios = require('axios');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const API_URL = 'https://api.zenzxz.my.id/image/loli';

module.exports = {
    name: 'loli',
    alias: ['loliimg', 'loliimage'],
    desc: 'Get random loli images',
    category: 'Weeb',
    usage: '.loli',
    owner: false,

    execute: async (sock, m, { reply }) => {
        const jid = m.key.remoteJid;

        await sock.sendMessage(jid, { react: { text: "🌸", key: m.key } });

        try {
            const { data, headers } = await axios.get(API_URL, {
                responseType: 'arraybuffer',
                timeout: 30000,
                headers: { 'Accept': 'image/*' }
            });

            const contentType = headers['content-type'] || '';

            // Direct image response
            if (contentType.includes('image/') || data.length > 1000) {
                await sock.sendMessage(jid, {
                    image: Buffer.from(data),
                    caption: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} LOLI •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *RANDOM CHARACTER*
│ ❏ Source : zenzxz API
│ ❏ Category : Weeb
╰─────────────────────────╯`
                }, { quoted: m });
                await sock.sendMessage(jid, { react: { text: "✓", key: m.key } });
                return;
            }

            // JSON response with url
            const jsonStr = Buffer.from(data).toString('utf8');
            if (jsonStr.includes('{') || jsonStr.includes('[')) {
                const json = JSON.parse(jsonStr);
                const imgUrl = json?.result?.url || json?.url || json?.image;
                
                if (imgUrl) {
                    const { data: imgData } = await axios.get(imgUrl, {
                        responseType: 'arraybuffer',
                        timeout: 30000
                    });
                    await sock.sendMessage(jid, {
                        image: Buffer.from(imgData),
                        caption: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} LOLI •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *RANDOM CHARACTER*
│ ❏ Source : zenzxz API
│ ❏ Category : Weeb
╰─────────────────────────╯`
                    }, { quoted: m });
                    await sock.sendMessage(jid, { react: { text: "✓", key: m.key } });
                    return;
                }
            }

            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            return reply(`✘ ֎ Failed to fetch loli image\n❏ API : zenzxz may be down`);

        } catch (error) {
            console.error('[LOLI ERROR]', error.message);
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            return reply(`✘ ֎ Failed to fetch loli image\n❏ Error : ${error.message}`);
        }
    }
};