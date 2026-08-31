const axios = require('axios');
const fs = require('fs/promises');
const path = require('path');

const BOT_NAME = process.env.BOT_NAME || 'XADON AI';
const API_URL = 'https://fantox-cosplay-api.onrender.com/';

module.exports = {
    name: 'cosplay',
    alias: ['cos'],
    desc: 'Get random cosplay images',
    category: 'Anime',
    usage: '.cosplay',
    owner: false,

    execute: async (sock, m, { reply }) => {
        const jid = m.key.remoteJid;
        const tmpDir = path.join(process.cwd(), 'temp');

        await sock.sendMessage(jid, { react: { text: '😏', key: m.key } });

        try {
            await fs.mkdir(tmpDir, { recursive: true });

            for (let i = 0; i < 5; i++) {
                const { data } = await axios.get(API_URL, { responseType: 'arraybuffer', timeout: 20000 });
                
                const tmpFile = path.join(tmpDir, `cosplay_${Date.now()}_${i}.jpg`);
                await fs.writeFile(tmpFile, data);

                await sock.sendMessage(jid, {
                    image: { url: tmpFile },
                    caption: i === 0 
                        ? `😏 *${BOT_NAME} - Cosplay*\n❏ Image : 1/5\n❏ Source : Fantox API`
                        : `❏ Image : ${i + 1}/5`
                }, { quoted: i === 0 ? m : undefined });

                // delete temp file after sending
                await fs.unlink(tmpFile).catch(() => {});
                
                if (i < 4) await new Promise(r => setTimeout(r, 500));
            }

            await sock.sendMessage(jid, { react: { text: '✓', key: m.key } });

        } catch (error) {
            console.error('[COSPLAY ERROR]', error.message);
            await sock.sendMessage(jid, { react: { text: "✘", key: m.key } });
            return reply(`✘ ֎ Failed to fetch cosplay\n❏ Error : ${error.message}\n❏ Source : Fantox API may be down`);
        }
    }
};