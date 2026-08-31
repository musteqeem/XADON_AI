const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: 'docconvert',
    alias: ['doconv', 'fileconv', 'convert'],
    category: 'Documents',
    desc: 'Convert between file formats',
    usage: '.docconvert <to_format> (reply to file)\nFormats: png, jpg, webp, mp4, mp3, pdf, gif',

    execute: async (sock, m, { args, reply, prefix }) => {
        const format = args[0]?.toLowerCase();
        if (!format) {
            let help = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} CONVERTER •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *FILE CONVERTER*
│ ❏ Usage : ${prefix}docconvert <format>
│ ❏ Reply to : Image | Video | Audio
│ ❏ Formats : png, jpg, webp, mp4, mp3, pdf, gif
│ ❏ Example : ${prefix}docconvert png
│ ❏ Note : Powered by ffmpeg
╰─────────────────────────╯`;
            return reply(help);
        }

        const validFormats = ['png', 'jpg', 'jpeg', 'webp', 'mp4', 'mp3', 'gif', 'pdf'];
        if (!validFormats.includes(format)) {
            return reply(`✘ ֎ Invalid format. Use: ${validFormats.join(', ')}`);
        }

        const quoted = m.quoted || m;
        if (!quoted.mimetype) return reply('✘ ֎ Reply to a file to convert');

        try {
            await sock.sendMessage(m.chat, { react: { text: '🔄', key: m.key } });
            await reply('֎ Converting file...');

            const media = await quoted.download();
            const originalSize = (media.length / 1024).toFixed(1);
            const tempDir = path.join(__dirname, '../../temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

            const input = path.join(tempDir, `conv_in_${Date.now()}`);
            const output = path.join(tempDir, `conv_out_${Date.now()}.${format}`);

            fs.writeFileSync(input, media);

            const cmd = `ffmpeg -y -i "${input}" "${output}"`;

            await new Promise((resolve, reject) => {
                exec(cmd, (err) => { if (err) reject(err); else resolve(); });
            });

            const converted = fs.readFileSync(output);
            const newSize = (converted.length / 1024).toFixed(1);
            const mimeMap = {
                png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
                webp: 'image/webp', mp4: 'video/mp4', mp3: 'audio/mpeg',
                gif: 'image/gif', pdf: 'application/pdf'
            };

            const type = format === 'gif'? 'video' :
                         format === 'mp3'? 'audio' :
                         format === 'mp4'? 'video' : 'document';

            let caption = `✦ ───── ⋆⋅☆⋅⋆ ───── ✦
    ֎ • ${BOT_NAME} CONVERSION •
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *CONVERSION DONE*
│ ❏ From : ${quoted.mimetype}
│ ❏ To :.${format}
│ ❏ Original : ${originalSize} KB
│ ❏ New Size : ${newSize} KB
│ ❏ Bot : ${BOT_NAME}
╰─────────────────────────╯`;

            if (type === 'document') {
                await sock.sendMessage(m.chat, {
                    document: converted,
                    fileName: `converted.${format}`,
                    mimetype: mimeMap[format],
                    caption: caption
                }, { quoted: m });
            } else {
                await sock.sendMessage(m.chat, {
                    [type]: converted,
                    mimetype: mimeMap[format],
                    caption: caption
                }, { quoted: m });
            }

            fs.unlinkSync(input);
            fs.unlinkSync(output);
            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });

        } catch (e) {
            console.error('[CONVERT]', e);
            reply(`✘ ֎ Conversion failed\n❏ Error: ${e.message}`);
        }
    }
}