const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const sharp = require('sharp');
const BOT_NAME = process.env.BOT_NAME || 'XADON AI';

module.exports = {
    name: "toimg",
    alias: ['stickertoimg', 'sticker2img', 'sticker2video', 'tovid'],
    desc: 'Convert sticker to image or video',
    category: "Media",
    usage: ".toimg",
    examples: [".toimg - reply to a sticker"],
    reactions: { start: '🖼️', success: '✨', error: '✘' },

    execute: async (sock, m, { reply, prefix }) => {
        await sock.sendMessage(m.chat, { react: { text: '🖼️', key: m.key } });

        const quoted = m.quoted || m;
        const mime = quoted.mimetype || '';

        if (!/webp/.test(mime) && !quoted.isSticker) {
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(
`✦ ───── ⋆⋅☆⋅⋆ ───── ✦
 ֎ *${BOT_NAME} TOIMG*
✦ ───── ⋆⋅☆⋅⋆ ───── ✦
╭─֎ *USAGE*
│ ❏ Reply to a sticker with ${prefix}toimg
╰─────────────────────────╯`
            );
        }

        try {
            const media = await quoted.download();
            const metadata = await sharp(media).metadata();
            const isAnimated = metadata.pages > 1;

            const tempDir = path.join(__dirname, '../../temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

            if (isAnimated) {
                const input = path.join(tempDir, `stk_${Date.now()}.webp`);
                const frameDir = path.join(tempDir, `frames_${Date.now()}`);
                const output = path.join(tempDir, `toimg_${Date.now()}.mp4`);

                fs.writeFileSync(input, media);
                fs.mkdirSync(frameDir);

                const frames = [];
                for (let i = 0; i < metadata.pages; i++) {
                    const frameFile = path.join(frameDir, `frame_${String(i).padStart(4,'0')}.png`);
                    frames.push(
                        sharp(media, { page: i })
                        .resize(512, 512, { fit: 'cover', position: 'center' })
                        .png()
                        .toFile(frameFile)
                    );
                }
                await Promise.all(frames);

                const delay = metadata.delay || 100;
                const fps = delay > 0 ? Math.round(1000 / delay) : 15;

                const cmd = `ffmpeg -y -framerate ${fps} -i "${frameDir}/frame_%04d.png" -vf "format=yuv420p" -c:v libx264 -pix_fmt yuv420p -movflags +faststart -an "${output}"`;

                await new Promise((resolve, reject) => {
                    exec(cmd, (err) => {
                        fs.rmSync(frameDir, { recursive: true, force: true });
                        if (err) reject(err);
                        else resolve();
                    });
                });

                const buffer = fs.readFileSync(output);
                await sock.sendMessage(m.chat, {
                    video: buffer,
                    mimetype: 'video/mp4',
                    caption: `🖼️ _Sticker → Video_\n_Powered by ${BOT_NAME}_`
                }, { quoted: m });

                fs.unlinkSync(input);
                fs.unlinkSync(output);

            } else {
                const img = await sharp(media)
                .resize(512, 512, { fit: 'cover', position: 'center' })
                .png()
                .toBuffer();

                await sock.sendMessage(m.chat, {
                    image: img,
                    mimetype: 'image/png',
                    caption: `🖼️ _Sticker → Image_\n_Powered by ${BOT_NAME}_`
                }, { quoted: m });
            }

            await sock.sendMessage(m.chat, { react: { text: '✨', key: m.key } });

        } catch (err) {
            console.error(`[${BOT_NAME} TOIMG ERROR]`, err);
            await sock.sendMessage(m.chat, { react: { text: '✘', key: m.key } });
            return reply(`✘ _Failed: ${err.message}_`);
        }
    }
};