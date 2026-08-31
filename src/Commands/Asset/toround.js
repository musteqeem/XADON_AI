const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { Sticker } = require('wa-sticker-formatter');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: "toround",
    alias: ['2round', 'makeround', 'tround', 'roundsticker'],
    desc: 'Convert video/sticker to a large round sticker. 10s limit',
    category: "Media",
    usage: ".toround",
    examples: [".toround - reply to video/sticker"],
    reactions: { start: '🔄', success: '✨', error: '✘' },

    execute: async (sock, m, { reply, prefix }) => {
        await sock.sendMessage(m.chat, { react: { text: '🔄', key: m.key } });

        const quoted = m.quoted || m;
        const mime = (quoted.msg || quoted).mimetype || '';

        if (!/video|webp/.test(mime)) {
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} ROUND STICKER*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏ Reply to a video or sticker with ${prefix}toround
╰─────────────────────────╯
_Note: Max 10 seconds for videos_`
            );
        }

        try {
            let buffer;
            
            if (/webp/.test(mime)) {
                // Download sticker
                const stream = await downloadContentFromMessage(quoted.msg || quoted, 'sticker');
                buffer = Buffer.from([]);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
            } else {
                // Download video
                buffer = await quoted.download();
            }

            const tempDir = path.join(__dirname, '../../temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

            const input = path.join(tempDir, `toround_${Date.now()}.mp4`);
            const output = path.join(tempDir, `toround_out_${Date.now()}.webp`);

            fs.writeFileSync(input, buffer);

            const isVideo = /video/.test(mime);
            const isAnimated = !isVideo && buffer.toString('hex', 0, 16).includes('414e494d');
            const shouldAnimate = isVideo || isAnimated;

            let cmd;

            if (shouldAnimate) {
                const duration = isVideo ? ((quoted.msg || quoted).seconds || 0) : 10;
                const maxDuration = Math.min(duration, 10);
                
                if (maxDuration < 1) {
                    fs.unlinkSync(input);
                    return reply(`✘ _Video must be at least 1 second_`);
                }

                cmd = `ffmpeg -y -i "${input}" -t ${maxDuration} -vf "scale=512:512:force_original_aspect_ratio=increase,crop=512:512,format=rgba,geq='r=r(X,Y):g=g(X,Y):b=b(X,Y):a=if(lt(sqrt((X-256)^2+(Y-256)^2),256),255,0)'" -c:v libwebp -lossless 0 -q:v 60 -loop 0 -an -preset default "${output}"`;
            } else {
                cmd = `ffmpeg -y -i "${input}" -vf "scale=512:512:force_original_aspect_ratio=increase,crop=512:512,format=rgba,geq='r=r(X,Y):g=g(X,Y):b=b(X,Y):a=if(lt(sqrt((X-256)^2+(Y-256)^2),256),255,0)'" -c:v libwebp -lossless 0 -q:v 80 -an "${output}"`;
            }

            await new Promise((resolve, reject) => {
                exec(cmd, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            let finalBuffer = fs.readFileSync(output);

            const sticker = new Sticker(finalBuffer, {
                pack: BOT_NAME,
                author: 'XADON',
                type: 'full',
                quality: 70
            });
            finalBuffer = await sticker.toBuffer();

            // Compress if too large
            if (finalBuffer.length / 1024 > 500) {
                const sticker2 = new Sticker(buffer, {
                    pack: BOT_NAME,
                    author: 'XADON',
                    type: 'full',
                    quality: 40
                });
                finalBuffer = await sticker2.toBuffer();
            }

            if (finalBuffer.length / 1024 > 500) {
                fs.unlinkSync(input);
                fs.unlinkSync(output);
                await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
                return reply(`✘ _Sticker too large. Try a shorter video_`);
            }

            await sock.sendMessage(m.chat, { sticker: finalBuffer }, { quoted: m });

            fs.unlinkSync(input);
            fs.unlinkSync(output);
            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });

        } catch (err) {
            console.error(`[${BOT_NAME} TOROUND ERROR]`, err.message);
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} ROUND STICKER*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *ERROR*
│ ❏ Failed to create round sticker
│ ❏ ${err.message}
╰─────────────────────────╯`
            );
        }
    }
};