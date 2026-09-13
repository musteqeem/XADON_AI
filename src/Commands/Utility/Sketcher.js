const sharp = require('sharp');

module.exports = {
    name: 'sketcher',
    alias: ['sketch', 'pencil', 'draw'],
    desc: 'Convert image to pencil sketch',
    category: 'image',
    usage: '.sketcher (reply to image)',
    owner: false,
    reactions: {
        start: '📝',
        success: '✨'
    },

    execute: async (sock, m, { reply }) => {
        if (!m.quoted || !m.quoted.mtype?.includes('image')) {
            return reply('✘ _*Reply to an image*_');
        }

        try {
            await reply('_*✪ Creating pencil sketch...*_');

            const buffer = await m.quoted.download();
            if (!buffer || buffer.length < 1000) {
                return reply('✘ _*Failed to download image*_');
            }

            const metadata = await sharp(buffer).metadata();
            const width = Math.min(metadata.width, 1200);
            const height = Math.round(width * (metadata.height / metadata.width));

            const grayscale = await sharp(buffer)
                .resize(width, height, { fit: 'inside' })
                .grayscale()
                .toBuffer();

            const inverted = await sharp(grayscale)
                .negate()
                .toBuffer();

            const blurred = await sharp(inverted)
                .blur(5)
                .toBuffer();

            const sketch = await sharp(grayscale)
                .composite([{
                    input: blurred,
                    blend: 'color-dodge'
                }])
                .toBuffer();

            await sock.sendMessage(m.chat, {
                image: sketch,
                mimetype: 'image/png',
                caption:
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
     • PENCIL SKETCH •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *CONVERSION COMPLETE*
│ ❏ Effect : Pencil Sketch
│ ❏ Size : ${width}x${height}
╰─────────────────────────╯`
            }, { quoted: m });

        } catch (err) {
            console.error('[SKETCHER ERROR]', err);
            await reply('✘ Error: ' + err.message);
        }
    }
};