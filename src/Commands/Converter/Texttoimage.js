const { createCanvas } = require('canvas');
const sharp = require('sharp');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: 'ttp',
    alias: ['text2sticker', 'textsticker', 'textpng'],
    category: 'Media',
    desc: 'Text to transparent sticker or large image',
    usage: '.ttp <text> |.ttp <color> <text> |.ttp large <text>',

    execute: async (sock, m, { args, reply, prefix }) => {
        let text = '';
        let color = '#ffffff'; // default white
        let isLarge = false;

        const colors = {
            red: '#ff0000', blue: '#0000ff', green: '#00ff00',
            yellow: '#ffff00', purple: '#800080', orange: '#ffa500',
            pink: '#ff69b4', cyan: '#00ffff', white: '#ffffff',
            black: '#000000', gray: '#808080'
        };

        if (args.length > 0) {
            const first = args[0].toLowerCase();

            if (colors[first]) {
                color = colors[first];
                text = args.slice(1).join(' ');
            } else if (first === 'large') {
                isLarge = true;
                text = args.slice(1).join(' ');
            } else {
                text = args.join(' ');
            }
        }

        if (!text && m.quoted) {
            text = (m.quoted.text || m.quoted.caption || '').trim();
        }

        if (!text) {
            let help = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} TEXT TO STICKER •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *TTP MAKER*
│ ❏ ${prefix}ttp your text
│ ❏ ${prefix}ttp red Crysnova
│ ❏ ${prefix}ttp large Long text here
╰─────────────────────────╯
╭─֎ *COLORS*
│ ❏ red, blue, green, yellow, purple
│ ❏ orange, pink, cyan, white, black, gray
╰─────────────────────────╯`;
            return reply(help);
        }

        if (text.length > 150) text = text.substring(0, 147) + '...';

        try {
            await reply('֎ Creating text sticker/image...');
            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });

            const canvas = createCanvas(512, 512);
            const ctx = canvas.getContext('2d');

            ctx.clearRect(0, 0, 512, 512); // transparent bg

            let fontSize = 140;
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // auto reduce size if too long
            while (ctx.measureText(text).width > 460 && fontSize > 30) {
                fontSize -= 8;
                ctx.font = `bold ${fontSize}px Arial`;
            }

            // outline + shadow
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = Math.max(5, fontSize / 12);
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 15;
            ctx.shadowOffsetX = 5;
            ctx.shadowOffsetY = 5;

            ctx.strokeText(text, 256, 256);
            ctx.fillStyle = color;
            ctx.fillText(text, 256, 256);

            const pngBuffer = canvas.toBuffer('image/png');

            // convert to webp sticker
            const stickerBuffer = await sharp(pngBuffer)
               .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
               .webp({ quality: 90, lossless: false, effort: 6 })
               .toBuffer();

            if (isLarge) {
                await sock.sendMessage(m.chat, {
                    image: pngBuffer,
                    mimetype: 'image/png',
                    caption: `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} LARGE TEXT •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
❏ Text: ${text}`
                }, { quoted: m });
            } else {
                await sock.sendMessage(m.chat, {
                    sticker: stickerBuffer,
                    packname: BOT_NAME,
                    author: 'TTP'
                }, { quoted: m });
            }

            await sock.sendMessage(m.chat, { react: { text: '✓', key: m.key } });

        } catch (e) {
            console.error('[TTP ERROR]', e.message);
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            reply(`✘ ֎ Failed to create text sticker/image\n❏ Error: ${e.message}`);
        }
    }
};