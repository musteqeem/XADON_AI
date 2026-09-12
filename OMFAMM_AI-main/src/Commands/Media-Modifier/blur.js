const sharp = require('sharp');

module.exports = {
    name: 'blur',
    alias: ['xblur', 'softblur'],
    category: 'Media-Modifier',
    desc: 'Blur a replied image with a configurable strength',
    usage: '.blur [1-20] (reply to an image)',
    reactions: { start: '🌫️', success: '✨', error: '❌' },

    execute: async (sock, m, { args, reply }) => {
        if (!m.quoted?.download) return reply('🌫️ Reply to an image with .blur [strength].');

        const strength = Math.min(20, Math.max(1, Number.parseFloat(args[0]) || 6));

        try {
            const buffer = await m.quoted.download();
            const output = await sharp(buffer).blur(strength).jpeg({ quality: 90 }).toBuffer();
            return sock.sendMessage(m.chat, {
                image: output,
                caption: `🌫️ Blur strength: ${strength}`
            }, { quoted: m });
        } catch (error) {
            console.error('[BLUR ERROR]', error);
            return reply(`❌ Blur failed: ${error.message}`);
        }
    }
};
