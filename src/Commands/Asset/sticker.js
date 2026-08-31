const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { Sticker } = require('wa-sticker-formatter');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: "sticker",
    alias: ['s', 'stick', 'stickercreate'],
    desc: 'Convert image or video to sticker',
    category: "Media",
    usage: ".sticker",
    examples: [".sticker - reply to image/video"],
    reactions: { start: '🏷️', success: '✨', error: '✘' },

    execute: async (sock, m, { reply, prefix }) => {
        await sock.sendMessage(m.chat, { react: { text: '🏷️', key: m.key } });

        const quoted = m.quoted || m;
        const mime = quoted.mimetype || '';

        if (!/image|video/.test(mime)) {
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} STICKER MAKER*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏ Reply to an image or video with ${prefix}sticker
╰─────────────────────────╯
_Note: Videos must be 1-5 seconds_`
            );
        }

        try {
            const media = await quoted.download();

            const tempDir = path.join(__dirname, '../../temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const input = path.join(tempDir, `stk_${Date.now()}`);
            const output = input + '.webp';

            fs.writeFileSync(input, media);

            // ================= VIDEO STICKER =================
            if (/video/.test(mime)) {
                const duration = (quoted.msg || quoted).seconds || 0;
                if (duration < 1 || duration > 5) {
                    fs.unlinkSync(input);
                    await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
                    return reply(`✘ _Video must be between 1s and 5s_`);
                }

                const compressVideo = async (fps, quality, durationSec) => {
                    const cmd = `ffmpeg -y -i "${input}" -t ${durationSec} -vf "fps=${fps},scale=512:512:force_original_aspect_ratio=increase,crop=512:512:(iw-ow)/2:(ih-oh)/2,format=yuva420p" -c:v libwebp -lossless 0 -q:v ${quality} -loop 0 -an -preset default -compression_level 6 "${output}"`;
                    
                    await new Promise((resolve, reject) => {
                        exec(cmd, (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    });

                    const sizeKB = fs.statSync(output).size / 1024;
                    return sizeKB;
                };

                let sizeKB = await compressVideo(12, 70, 5);

                if (sizeKB > 500) {
                    sizeKB = await compressVideo(8, 40, 5);
                }

                if (sizeKB > 500) {
                    fs.unlinkSync(input);
                    fs.unlinkSync(output);
                    await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
                    return reply(`✘ _Video too complex. Try a shorter/simpler clip_`);
                }
            }
            // ================= IMAGE STICKER =================
            else {
                const imageCmd = `ffmpeg -y -i "${input}" -vf "scale=512:512:force_original_aspect_ratio=increase,crop=512:512:(iw-ow)/2:(ih-oh)/2,format=yuva420p" -c:v libwebp -lossless 0 -q:v 80 -an "${output}"`;
                await new Promise((resolve, reject) => {
                    exec(imageCmd, (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            }

            let buffer = fs.readFileSync(output);

            const sticker = new Sticker(buffer, {
                pack: BOT_NAME,
                author: 'XADON',
                type: 'full',
                quality: 70
            });
            buffer = await sticker.toBuffer();

            await sock.sendMessage(m.chat, { sticker: buffer }, { quoted: m });

            fs.unlinkSync(input);
            if (fs.existsSync(output)) fs.unlinkSync(output);
            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });

        } catch (err) {
            console.error(`[${BOT_NAME} STICKER ERROR]`, err.message);
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} STICKER MAKER*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *ERROR*
│ ❏ Failed to create sticker
│ ❏ ${err.message}
╰─────────────────────────╯`
            );
        }
    }
};