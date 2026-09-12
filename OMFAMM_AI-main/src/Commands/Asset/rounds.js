const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { Sticker } = require('wa-sticker-formatter');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: "rounds",
    alias: ['rsticker', 'roundsticker', 'circlesticker'],
    desc: 'Create a round/circle sticker from an image or video',
    category: "Media",
    usage: ".rounds",
    examples: [".rounds - reply to image/video"],
    reactions: { start: '⭕', success: '✨', error: '✘' },

    execute: async (sock, m, { reply, prefix }) => {
        await sock.sendMessage(m.chat, { react: { text: '⭕', key: m.key } });

        const quoted = m.quoted || m;
        const mime = quoted.mimetype || '';

        if (!/image|video/.test(mime)) {
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} ROUND STICKER*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏ Reply to an image or video with ${prefix}rounds
╰─────────────────────────╯
_Note: Videos must be 1-8 seconds_`
            );
        }

        try {
            const media = await quoted.download();

            const tempDir = path.join(__dirname, '../../temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

            const input = path.join(tempDir, `round_${Date.now()}.mp4`);
            const output = path.join(tempDir, `round_out_${Date.now()}.webp`);

            fs.writeFileSync(input, media);

            let cmd;

            if (/video/.test(mime)) {
                const duration = (quoted.msg || quoted).seconds || 0;
                if (duration < 1 || duration > 8) {
                    fs.unlinkSync(input);
                    await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
                    return reply(`✘ _Video must be 1-8 seconds_`);
                }
                cmd = `ffmpeg -y -i "${input}" -t 8 -vf "scale=512:512:force_original_aspect_ratio=increase,crop=512:512,format=rgba,geq='r=r(X,Y):g=g(X,Y):b=b(X,Y):a=if(lt(sqrt((X-256)^2+(Y-256)^2),256),255,0)'" -c:v libwebp -lossless 0 -q:v 60 -loop 0 -an -preset default "${output}"`;
            } else {
                cmd = `ffmpeg -y -i "${input}" -vf "scale=512:512:force_original_aspect_ratio=increase,crop=512:512,format=rgba,geq='r=r(X,Y):g=g(X,Y):b=b(X,Y):a=if(lt(sqrt((X-256)^2+(Y-256)^2),256),255,0)'" -c:v libwebp -lossless 0 -q:v 80 -an "${output}"`;
            }

            await new Promise((resolve, reject) => {
                exec(cmd, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            let buffer = fs.readFileSync(output);

            const sticker = new Sticker(buffer, {
                pack: BOT_NAME,
                author: 'XADON',
                type: 'full',
                quality: 70
            });
            buffer = await sticker.toBuffer();

            if (buffer.length / 1024 > 500) {
                fs.unlinkSync(input);
                fs.unlinkSync(output);
                await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
                return reply(`✘ _Sticker too large. Try a simpler image_`);
            }

            await sock.sendMessage(m.chat, { sticker: buffer }, { quoted: m });

            fs.unlinkSync(input);
            fs.unlinkSync(output);
            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });

        } catch (err) {
            console.error(`[${BOT_NAME} ROUNDS ERROR]`, err.message);
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