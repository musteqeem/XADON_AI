const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = [{
    name: 'compress',
    alias: ['shrink', 'reduce', 'tiny', 'compressmedia'],
    category: 'Documents',
    desc: 'Compress an image or video to reduce size',
    usage: '.compress (reply to image/video) | .compress high/low',

    execute: async (sock, m, { args, reply, prefix }) => {
        const quoted = m.quoted || m;
        const mime = quoted.mimetype || '';

        if (!/image|video/.test(mime)) {
            let help = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} COMPRESSOR •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *MEDIA COMPRESSOR*
│ ❏ Usage : Reply to image or video with ${prefix}compress
│ ❏ Quality : ${prefix}compress high | ${prefix}compress low
│ ❏ Stats : Shows size before and after
│ ❏ More : ${prefix}compressinfo
╰─────────────────────────╯`;
            return reply(help);
        }

        const quality = args[0]?.toLowerCase() || 'medium';
        let crf = 30, qv = 15, abr = '64k'; // medium
        
        if (quality === 'high') { crf = 23; qv = 8; abr = '128k'; }
        if (quality === 'low') { crf = 35; qv = 25; abr = '32k'; }

        try {
            await sock.sendMessage(m.chat, { react: { text: '🗜️', key: m.key } });
            await reply('֎ Working... Compressing media');

            const media = await quoted.download();
            const originalSize = (media.length / 1024).toFixed(1);

            const tempDir = path.join(__dirname, '../../temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

            const ext = /video/.test(mime)? 'mp4' : 'jpg';
            const input = path.join(tempDir, `compress_${Date.now()}.${ext}`);
            const output = path.join(tempDir, `compressed_${Date.now()}.${ext}`);

            fs.writeFileSync(input, media);

            let cmd;
            if (/video/.test(mime)) {
                cmd = `ffmpeg -y -i "${input}" -c:v libx264 -crf ${crf} -preset fast -c:a aac -b:a ${abr} "${output}"`;
            } else {
                cmd = `ffmpeg -y -i "${input}" -q:v ${qv} "${output}"`;
            }

            await new Promise((resolve, reject) => {
                exec(cmd, (err) => { if (err) reject(err); else resolve(); });
            });

            const compressed = fs.readFileSync(output);
            const newSize = (compressed.length / 1024).toFixed(1);
            const saved = (originalSize - newSize).toFixed(1);
            const percent = ((saved / originalSize) * 100).toFixed(0);

            const caption = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} COMPRESSED •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *COMPRESSION DONE*
│ ❏ Type : ${/video/.test(mime)? 'Video' : 'Image'}
│ ❏ Quality : ${quality.toUpperCase()}
│ ❏ Original : ${originalSize} KB
│ ❏ Compressed : ${newSize} KB
│ ❏ Saved : ${saved} KB (${percent}%)
│ ❏ Bot : ${BOT_NAME}
╰─────────────────────────╯`;

            if (/video/.test(mime)) {
                await sock.sendMessage(m.chat, { video: compressed, caption }, { quoted: m });
            } else {
                await sock.sendMessage(m.chat, { image: compressed, caption }, { quoted: m });
            }

            fs.unlinkSync(input);
            fs.unlinkSync(output);
            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });

        } catch (e) {
            console.error('[COMPRESS]', e);
            reply(`✘ ֎ Compression Failed\n❏ Error: ${e.message}`);
        }
    }
},
// NEW SUBCOMMAND
{
    name: 'compressinfo',
    alias: ['cinfo'],
    category: 'Documents',
    desc: 'Show compression quality info',
    usage: '.compressinfo',
    execute: async (sock, m, { reply }) => {
        let info = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} COMPRESSION INFO •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *QUALITY MODES*
│ ❏ high : Best quality, less compression
│ ❏ medium : Balanced [Default]
│ ❏ low : Max compression, smaller size
│
│ ❏ Usage : .compress high
│ ❏ Usage : .compress low
╰─────────────────────────╯`;
        reply(info);
    }
}];