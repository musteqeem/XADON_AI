const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const sharp = require('sharp');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: "togif",
    alias: ['sticker2gif', 'stktogif', 'sticker2mp4'],
    desc: 'Convert sticker to GIF with watermark',
    category: "Media",
    usage: ".togif",
    examples: [".togif - reply to a sticker"],
    reactions: { start: '🎞️', success: '✨', error: '✘' },

    execute: async (sock, m, { reply, prefix }) => {
        await sock.sendMessage(m.chat, { react: { text: '🎞️', key: m.key } });

        const quoted = m.quoted || m;
        const mime = quoted.mimetype || '';

        if (!/webp/.test(mime) && !quoted.isSticker) {
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} TOGIF*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏ Reply to a sticker with ${prefix}togif
╰─────────────────────────╯`
            );
        }

        try {
            const media = await quoted.download();
            const metadata = await sharp(media).metadata();
            const isAnimated = metadata.pages > 1;

            const tempDir = path.join(__dirname, '../../temp');
            if (!fs.existsSync(tempDir))
                fs.mkdirSync(tempDir, { recursive: true });

            if (isAnimated) {
                const input = path.join(tempDir, `stk_${Date.now()}.webp`);
                const frameDir = path.join(tempDir, `frames_${Date.now()}`);
                const output = path.join(tempDir, `gif_${Date.now()}.mp4`);

                fs.writeFileSync(input, media);
                fs.mkdirSync(frameDir);

                const frames = [];
                for (let i = 0; i < metadata.pages; i++) {
                    const frameFile = path.join(frameDir, `frame_${String(i).padStart(4,'0')}.png`);
                    frames.push(
                        sharp(media, { page: i })
                        .resize(512, 512, { fit: 'cover' })
                        .png()
                        .toFile(frameFile)
                    );
                }
                await Promise.all(frames);

                const delay = metadata.delay || 100;
                const fps = Math.round(1000 / delay) || 15;

                const cmd = `ffmpeg -y -framerate ${fps} -i "${frameDir}/frame_%04d.png" -vf "scale=512:-1:flags=lanczos,drawtext=text='${BOT_NAME}':x=(w-text_w)/2:y=(h-text_h)/2:fontsize=30:fontcolor=white@0.6:borderw=2:bordercolor=black@0.7" -loop 0 -c:v libx264 -pix_fmt yuv420p -movflags +faststart -an "${output}"`;

                await new Promise((resolve, reject) => {
                    exec(cmd, (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });

                const buffer = fs.readFileSync(output);

                await sock.sendMessage(m.chat, {
                    video: buffer,
                    gifPlayback: true,
                    caption: `🎞️ _Sticker → GIF_\n_Powered by ${BOT_NAME}_`
                }, { quoted: m });

                fs.rmSync(frameDir, { recursive: true, force: true });
                fs.unlinkSync(input);
                fs.unlinkSync(output);

            } else {
                // Static sticker → PNG
                const img = await sharp(media)
                .resize(512, 512, { fit: 'cover' })
                .png()
                .toBuffer();

                await sock.sendMessage(m.chat, {
                    image: img,
                    caption: `🖼️ _Sticker → Image_\n_Powered by ${BOT_NAME}_`
                }, { quoted: m });
            }

            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });

        } catch (err) {
            console.error(`[${BOT_NAME} TOGIF ERROR]`, err);
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} TOGIF*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *ERROR*
│ ❏ Failed to convert sticker
│ ❏ ${err.message}
╰─────────────────────────╯`
            );
        }
    }
};